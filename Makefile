# ----------------------------------------------------------------------
# Compile dependencies and our bridge C code to WebAssembly,
# using emscripten.
# ----------------------------------------------------------------------

EMSCRIPTEN_DOCKER_RUN=docker run --rm -v $(CURDIR)/deps/build:/src -v $(CURDIR)/src/lib:/src/lib -u emscripten trzeci/emscripten:sdk-tag-1.39.4-64bit
CC=$(EMSCRIPTEN_DOCKER_RUN) emcc

export

# ----------------------------------------------------------------------

.PHONY: all deps

all: dist/libpcre2.js

dist:
	mkdir -p dist

deps:
	$(MAKE) -C deps

# ----------------------------------------------------------------------

dist/libpcre2.js: src/lib/libpcre2.c | deps dist
	$(CC) /src/lib/libpcre2.c \
		-s WASM=1 \
		-O3 \
		-g2 \
		--pre-js /src/lib/pre.js \
		--post-js /src/lib/PCRE.js \
		-s EXPORTED_FUNCTIONS='["_malloc", "_free"]' \
		-s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "getValue"]' \
		-s BINARYEN=1 \
		-s FILESYSTEM=0 \
		-s ASSERTIONS=2 \
		-s MODULARIZE=1 \
		-s EXPORT_NAME='libpcre2' \
		-s EXPORT_ES6=1 \
		-s ENVIRONMENT=web \
		-s SINGLE_FILE=1 \
		-I/src/local/include \
		-L/src/local/lib \
		-lpcre2-16 \
		-o libpcre2.js
	sed -i '' 's/throw new WebAssembly.RuntimeError(what)/\/\/ throw new WebAssembly.RuntimeError(what)/' deps/build/libpcre2.js
	cp deps/build/libpcre2.js dist/

# ----------------------------------------------------------------------
