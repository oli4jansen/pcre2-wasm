!(function () {
  Module.loaded = new Promise((resolve) => {
    Module.onRuntimeInitialized = resolve;
  });
})();
