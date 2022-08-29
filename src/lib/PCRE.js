const utf16Decoder = new TextDecoder("utf-16");
let initialized = false;
const cfunc = {};

const ptrSym = Symbol("ptr");

class PCRE {
  static init() {
    if (initialized) {
      return Promise.resolve();
    }
    return libpcre2.loaded.then(() => {
      Object.assign(cfunc, {
        malloc(bytes) {
          return libpcre2._malloc(bytes);
        },
        free(ptr) {
          return libpcre2._free(ptr);
        },
        version: libpcre2.cwrap("version", "number", ["number"]),
        compile: libpcre2.cwrap("compile", "number", [
          "array",
          "number",
          "string",
        ]),
        destroyCode: libpcre2.cwrap("destroyCode", null, ["number"]),
        lastErrorMessage: libpcre2.cwrap("lastErrorMessage", "number", [
          "number",
          "number",
        ]),
        lastErrorOffset: libpcre2.cwrap("lastErrorOffset", "number"),
      });

      initialized = true;
    });
  }

  constructor(pattern, flags = "") {
    assert(initialized);
    const patternBuffer = Buffer.from(pattern, "utf16le");
    const ptr = cfunc.compile(patternBuffer, patternBuffer.length / 2, flags);

    if (ptr === 0) {
      const { errorMessage, offset } = this.getLastError();
      const err = new Error(errorMessage);
      err.offset = offset;
      throw err;
    }
  }

  destroy() {
    if (this[ptrSym] === 0) return;
    cfunc.destroyCode(this[ptrSym]);
    this[ptrSym] = 0;
  }

  getLastError() {
    const errMsgBufLen = 256;
    const errMsgBuf = allocateStringBuffer(errMsgBufLen);
    const actualErrMsgLen = cfunc.lastErrorMessage(errMsgBuf, errMsgBufLen);
    const errorMessage = copyAndFreeStringBuffer(errMsgBuf, actualErrMsgLen);
    const offset = cfunc.lastErrorOffset();

    return { errorMessage, offset };
  }
}

function allocateStringBuffer(len) {
  return cfunc.malloc(len * 2);
}

function copyStringBuffer(ptr, len) {
  len = libpcre2.HEAPU16[ptr / 2 + (len - 1)] === 0 ? len - 1 : len;
  const encodedString = libpcre2.HEAP8.subarray(ptr, ptr + len * 2);
  return utf16Decoder.decode(encodedString);
}

function copyAndFreeStringBuffer(ptr, len) {
  const string = copyStringBuffer(ptr, len);
  cfunc.free(ptr);
  return string;
}

var Module = typeof Module !== "undefined" ? Module : {};

Module["PCRE"] = PCRE;
