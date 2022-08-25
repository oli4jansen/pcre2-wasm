!(function () {
  // const resolve = require('path-resolve')

  Module.locateFile = function (file) {
    return file;
    // return resolve(__dirname, file)
  }

  Module.loaded = new Promise(resolve => {
    Module.onRuntimeInitialized = resolve
  })
})()

/* global Module */
