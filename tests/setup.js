const { act } = require('react-dom/test-utils');
require('regenerator-runtime/runtime');

window.requestAnimationFrame = func => {
  window.setTimeout(func, 16);
};

Object.assign(Enzyme.ReactWrapper.prototype, {
  triggerMotionEvent(target) {
    const motionEvent = new Event('transitionend');
    if (target) {
      Object.defineProperty(motionEvent, 'target', {
        get: () => target.getDOMNode(),
      });
    }

    act(() => {
      const element = this.find('CSSMotion').getDOMNode();
      element.dispatchEvent(motionEvent);
      this.update();
    });

    return this;
  },
});
