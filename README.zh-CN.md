<div align="center">
  <h1>@rc-component/motion</h1>
  <p><sub>Ant Design 生态的一部分。</sub></p>
  <img alt="Ant Design" height="32" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" />
  <p>🎞️ React 动效基础组件，封装 CSS 动画、过渡和生命周期状态。</p>
</div>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>


<div align="center">

[![NPM version][npm-image]][npm-url] [![npm download][download-image]][download-url] [![build status][github-actions-image]][github-actions-url] [![Codecov][codecov-image]][codecov-url] [![bundle size][bundlephobia-image]][bundlephobia-url] [![dumi][dumi-image]][dumi-url]

</div>


## 特性

- Declarative `CSSMotion` component for appear, enter, and leave states.
- `CSSMotionList` for keyed list transitions.
- CSS class lifecycle hooks and inline style patching callbacks.
- Optional deadline fallback when transition or animation events do not fire.
- TypeScript definitions and React ref support.
- 被 Ant Design 使用 components that need predictable motion lifecycles.

## 安装

```bash
npm install @rc-component/motion
```

## 使用

```tsx | pure
import CSSMotion from '@rc-component/motion';

export default ({ visible }: { visible: boolean }) => (
  <CSSMotion visible={visible} motionName="fade">
    {({ className, style }, ref) => (
      <div ref={ref} className={className} style={style}>
        Content
      </div>
    )}
  </CSSMotion>
);
```

```tsx | pure
import { CSSMotionList } from '@rc-component/motion';

export default ({ keys }: { keys: string[] }) => (
  <CSSMotionList keys={keys} motionName="fade">
    {({ key, className, style }, ref) => (
      <div ref={ref} key={key} className={className} style={style}>
        {key}
      </div>
    )}
  </CSSMotionList>
);
```

## 示例

本地运行示例：

```bash
npm install
npm start
```

然后在浏览器中打开 dumi 开发服务地址。

## API

### CSSMotion

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| children | `(props, ref) => ReactElement` | - | Render function that receives motion class, style, and ref. |
| forceRender | `boolean` | `false` | Keep the element rendered even when invisible. |
| leavedClassName | `string` | - | Class name applied after leave when the element remains. |
| motionAppear | `boolean` | `true` | Enable appear motion. |
| motionDeadline | `number` | - | Fallback timeout in milliseconds for motion completion. |
| motionEnter | `boolean` | `true` | Enable enter motion. |
| motionLeave | `boolean` | `true` | Enable leave motion. |
| motionLeaveImmediately | `boolean` | - | Trigger leave immediately after mount. |
| motionName | `string \| MotionName` | - | CSS class name prefix or per-phase class names. |
| removeOnLeave | `boolean` | `true` | Remove the element after leave. Ignored when `forceRender` is set. |
| visible | `boolean` | `true` | Controls whether the element is visible. |
| onAppearActive | `MotionEventHandler` | - | Triggered during appear active phase. |
| onAppearEnd | `MotionEndEventHandler` | - | Triggered when appear finishes. Return `false` to keep waiting. |
| onAppearPrepare | `MotionPrepareEventHandler` | - | Prepare callback before appear starts. |
| onAppearStart | `MotionEventHandler` | - | Triggered when appear starts. |
| onEnterActive | `MotionEventHandler` | - | Triggered during enter active phase. |
| onEnterEnd | `MotionEndEventHandler` | - | Triggered when enter finishes. Return `false` to keep waiting. |
| onEnterPrepare | `MotionPrepareEventHandler` | - | Prepare callback before enter starts. |
| onEnterStart | `MotionEventHandler` | - | Triggered when enter starts. |
| onLeaveActive | `MotionEventHandler` | - | Triggered during leave active phase. |
| onLeaveEnd | `MotionEndEventHandler` | - | Triggered when leave finishes. Return `false` to keep waiting. |
| onLeavePrepare | `MotionPrepareEventHandler` | - | Prepare callback before leave starts. |
| onLeaveStart | `MotionEventHandler` | - | Triggered when leave starts. |
| onVisibleChanged | `(visible: boolean) => void` | - | Triggered after the final visible state changes. |

### CSSMotionList

`CSSMotionList` accepts the motion props above, except `children` is a list render function.

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| children | `(props, ref) => ReactElement` | - | Render function for each keyed item. |
| component | `string \| ComponentType \| false` | `div` | Wrapper component. Use `false` for no wrapper. |
| keys | `(React.Key \| { key: React.Key })[]` | - | Keys to animate. |
| onAllRemoved | `() => void` | - | Triggered after every leaving item is removed. |
| onVisibleChanged | `(visible, info: { key: React.Key }) => void` | - | Triggered after an item visibility changes. |

### Ref

| Ref method | 类型 | 说明 |
| --- | --- | --- |
| `enableMotion` | `() => boolean` | Whether motion is currently enabled. |
| `inMotion` | `() => boolean` | Whether the element is in a motion lifecycle. |
| `nativeElement` | `HTMLElement` | Current DOM element. |

## 本地开发

```bash
npm install
npm start
npm test
npm run tsc
npm run compile
npm run build
```

## 发布

```bash
npm run prepublishOnly
```

The release flow is handled by `@rc-component/np` through the `rc-np` command after the package build.

## 许可证

@rc-component/motion is released under the [MIT](./LICENSE.md) license.

[npm-image]: https://img.shields.io/npm/v/@rc-component/motion.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@rc-component/motion
[github-actions-image]: https://github.com/react-component/motion/actions/workflows/react-component-ci.yml/badge.svg
[github-actions-url]: https://github.com/react-component/motion/actions/workflows/react-component-ci.yml
[codecov-image]: https://img.shields.io/codecov/c/github/react-component/motion/master.svg?style=flat-square
[codecov-url]: https://app.codecov.io/gh/react-component/motion
[download-image]: https://img.shields.io/npm/dm/@rc-component/motion.svg?style=flat-square
[download-url]: https://npmjs.org/package/@rc-component/motion
[bundlephobia-url]: https://bundlephobia.com/package/@rc-component/motion
[bundlephobia-image]: https://img.shields.io/bundlephobia/minzip/@rc-component/motion?style=flat-square
[dumi-url]: https://github.com/umijs/dumi
[dumi-image]: https://img.shields.io/badge/docs%20by-dumi-blue?style=flat-square
