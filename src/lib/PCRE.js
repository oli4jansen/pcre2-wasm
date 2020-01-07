import libpcre2 from '../../dist/libpcre2.js'
import assert from 'assert'
import { TextDecoder } from 'util'

const utf16Decoder = new TextDecoder('utf-16')
let initialized = false
const cfunc = {}

const ptrSym = Symbol('ptr')
const nametableSym = Symbol('nametable')
const patternSym = Symbol('pattern')

export default class PCRE {
  static async init() {
    await libpcre2.loaded

    Object.assign(cfunc, {
      malloc(bytes) { return libpcre2._malloc(bytes) },
      free(ptr) { return libpcre2._free(ptr) },
      version: libpcre2.cwrap('version', 'number', ['number']),
      compile: libpcre2.cwrap('compile', 'number', ['array', 'number', 'string']),
      destroyCode: libpcre2.cwrap('destroyCode', null, ['number']),
      lastErrorMessage: libpcre2.cwrap('lastErrorMessage', 'number', ['number', 'number']),
      lastErrorOffset: libpcre2.cwrap('lastErrorOffset', 'number'),
      match: libpcre2.cwrap('match', 'number', ['number', 'array', 'number', 'number']),
      createMatchData: libpcre2.cwrap('createMatchData', 'number', ['number']),
      destroyMatchData: libpcre2.cwrap('destroyMatchData', null, ['number']),
      getOvectorCount: libpcre2.cwrap('getOvectorCount', 'number', ['number']),
      getOvectorPtr: libpcre2.cwrap('getOvectorPointer', 'number', ['number']),
      getCaptureCount: libpcre2.cwrap('getCaptureCount', 'number', ['number']),
      getMatchNameCount: libpcre2.cwrap('getMatchNameCount', 'number', ['number']),
      getMatchNameTableEntrySize: libpcre2.cwrap('getMatchNameTableEntrySize', 'number', ['number']),
      getMatchNameTable: libpcre2.cwrap('getMatchNameTable', 'number', ['number']),
    })

    initialized = true
  }

  static version() {
    assert(initialized)
    const len = cfunc.version(0)
    const ptr = allocateStringBuffer(len)
    cfunc.version(ptr)
    return copyAndFreeStringBuffer(ptr, len)
  }

  constructor(pattern, flags = '') {
    assert(initialized)
    const patternBuffer = Buffer.from(pattern, 'utf16le')
    const ptr = cfunc.compile(patternBuffer, patternBuffer.length / 2, flags)

    if (ptr === 0) {
      const { errorMessage, offset } = this.getLastError()
      const err = new Error(errorMessage)
      err.offset = offset
      throw err
    }

    this[ptrSym] = ptr
    this[patternSym] = pattern

    // extract the nametable 
    const nameCount = this.getMatchNameCount()
    const entrySize = this.getMatchNameTableEntrySize()
    const tableBuf = this.getMatchNameTable()
    this[nametableSym] = convertNameTable(tableBuf, nameCount, entrySize)
  }

  destroy() {
    if (this[ptrSym] === 0) return
    cfunc.destroyCode(this[ptrSym])
    this[ptrSym] = 0
  }

  getLastError() {
    const errMsgBufLen = 256
    const errMsgBuf = allocateStringBuffer(errMsgBufLen)
    const actualErrMsgLen = cfunc.lastErrorMessage(errMsgBuf, errMsgBufLen)
    const errorMessage = copyAndFreeStringBuffer(errMsgBuf, actualErrMsgLen)
    const offset = cfunc.lastErrorOffset()

    return { errorMessage, offset }
  }

  createMatchData() {
    return cfunc.createMatchData(this[ptrSym])
  }

  destroyMatchData(matchDataPtr) {
    cfunc.destroyMatchData(matchDataPtr)
  }

  exec(subject, options) {
    return this.match(subject, options)
  }

  match(subject, start) {
    assert(this[ptrSym])

    if (start >= subject.length) {
      return null
    }

    const startOffset = start || 0

    const subjectBuffer = Buffer.from(subject, 'utf16le')

    const matchDataPtr = this.createMatchData()

    const result = cfunc.match(
      this[ptrSym],
      subjectBuffer,
      subjectBuffer.length / 2,
      startOffset,
      matchDataPtr
    )

    if (result < 0) {
      this.destroyMatchData(matchDataPtr)
      const { errorMessage, offset } = this.getLastError()
      if (errorMessage === "no error") {
        return null
      }
      else {
        const err = new Error(errorMessage)
        err.offset = offset
        throw err
      }
    }

    // extract the matches from the pcre2_match_data block
    const matchCount = this.getOvectorCount(matchDataPtr)
    if (matchCount === 0) {
      this.destroyMatchData(matchDataPtr)
      return null
    }

    const vectorPtr = this.getOvectorPtr(matchDataPtr)
    const matches = convertOVector(subject, vectorPtr, matchCount)

    // merge in nametable entries
    const results = { ...matches }
    for (let i in matches) {
      if (i in this[nametableSym]) {
        const name = this[nametableSym][i]
        results[name] = matches[i]
      }
    }

    this.destroyMatchData(matchDataPtr)

    results.length = matchCount
    return results
  }

  matchAll(subject) {
    let safety = 1000

    let results = []
    let iter
    let start = 0

    while ((iter = this.match(subject, start)) !== null) {
      results.push(iter)
      start = iter[0].end

      safety--
      assert(safety > 0, 'safety limit exceeded')
    }

    return results
  }

  getOvectorCount(matchDataPtr) {
    assert(matchDataPtr)
    return cfunc.getOvectorCount(matchDataPtr)
  }

  getOvectorPtr(matchDataPtr) {
    assert(matchDataPtr)
    return cfunc.getOvectorPtr(matchDataPtr)
  }

  getCaptureCount() {
    if (this[ptrSym] === 0) return
    return cfunc.getCaptureCount(this[ptrSym])
  }

  getMatchNameCount() {
    if (this[ptrSym] === 0) return
    return cfunc.getMatchNameCount(this[ptrSym])
  }

  getMatchNameTableEntrySize() {
    if (this[ptrSym] === 0) return
    return cfunc.getMatchNameTableEntrySize(this[ptrSym])
  }

  getMatchNameTable() {
    if (this[ptrSym] === 0) return
    return cfunc.getMatchNameTable(this[ptrSym])
  }
}

function allocateStringBuffer(len) {
  return cfunc.malloc(len * 2)
}

function copyStringBuffer(ptr, len) {
  len = libpcre2.HEAPU16[(ptr / 2) + (len - 1)] === 0 ? len - 1 : len
  const encodedString = libpcre2.HEAP8.subarray(ptr, ptr + (len * 2))
  return utf16Decoder.decode(encodedString)
}

function copyAndFreeStringBuffer(ptr, len) {
  const string = copyStringBuffer(ptr, len)
  cfunc.free(ptr)
  return string
}

function convertOVector(subject, vectorPtr, vectorCount) {
  const table = []

  for (let i = 0; i < vectorCount; i++) {
    let ptr = vectorPtr + i * 4 * 2
    const start = libpcre2.getValue(ptr, 'i32', false)
    const end = libpcre2.getValue(ptr + 4, 'i32', false)
    const match = subject.substring(start, end)
    table.push({ start, end, match })
  }

  return table
}

function convertNameTable(nameTablePtr, entries, entrySize) {
  const table = {}

  for (let i = 0; i < entries; i++) {
    let ptr = nameTablePtr + entrySize * i * 2

    const index = libpcre2.getValue(ptr, 'i16', false)
    const name = copyStringBuffer(ptr + 2, utf16lelen(ptr + 2))
    table[index] = name
  }

  return table
}

function utf16lelen(ptr) {
  let len = 0
  while (libpcre2.getValue(ptr, 'i16', false) !== 0) {
    len++
    ptr += 2
  }
  return len
}
