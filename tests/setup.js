const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const { act } = require('react-dom/test-utils');

window.requestAnimationFrame = (func) => {
  window.setTimeout(func, 16);
};

Enzyme.configure({ adapter: new Adapter() });

Object.assign(Enzyme.ReactWrapper.prototype, {
  triggerMotionEvent() {
    const motionEvent = new Event('transitionend');

    act(() => {
      const element = this.find('CSSMotion').getDOMNode();
      element.dispatchEvent(motionEvent);
      this.update();
    });

    return this;
  },
});
