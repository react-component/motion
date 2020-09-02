const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

window.requestAnimationFrame = func => {
  window.setTimeout(func, 16);
};

Enzyme.configure({ adapter: new Adapter() });

Object.assign(Enzyme.ReactWrapper.prototype, {
  triggerMotionEvent() {
    this.find('CSSMotion')
      .instance()
      .onMotionEnd();
    this.update();
    return this;
  },
});
