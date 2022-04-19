require('regenerator-runtime/runtime');

window.requestAnimationFrame = func => {
  window.setTimeout(func, 16);
};
