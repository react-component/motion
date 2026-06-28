<div align="center">
  <h1>@rc-component/motion</h1>
  <p><sub><img alt="Ant Design" height="14" src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg" style="vertical-align: -0.125em;" /> Ant Design 生态的一部分。</sub></p>
  <p>🎞️ React 动效基础组件，封装 CSS 动画、过渡和生命周期状态。</p>
</div>

<p align="center"><a href="./README.md">English</a> | 简体中文</p>


<div align="center">

[![NPM version][npm-image]][npm-url] [![npm download][download-image]][download-url] [![build status][github-actions-image]][github-actions-url] [![Codecov][codecov-image]][codecov-url] [![bundle size][bundlephobia-image]][bundlephobia-url] [![dumi][dumi-image]][dumi-url]

</div>


## 特性

- 用于出现、进入和离开状态的声明性 `CSSMotion` 组件。
- `CSSMotionList` 用于键控列表转换。
- CSS 类生命周期挂钩和内联样式修补回调。
- 当过渡或动画事件未触发时，可以使用 `deadline` 兜底。
- TypeScript 定义和 React ref 支持。
- 被 Ant Design 使用需要可预测运动生命周期的组件。

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

运行本地 dumi 站点：

```bash
npm install
npm start
```

然后打开 `http://localhost:8000`。

## API

### CSSMotion

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| children们 | `(props, ref) => ReactElement` | - | 接收运动类、样式和引用的渲染函数。 |
| forceRender | `boolean` | `false` | 即使元素不可见也保持渲染。 |
| leavedClassName | `string` | - | 当元素保留时，在离开后应用className称。 |
| motionAppear | `boolean` | `true` | 启用出现运动。 |
| motionDeadline | `number` | - | 运动完成的回退超时（以毫秒为单位）。 |
| motionEnter | `boolean` | `true` | 启用进入运动。 |
| motionLeave | `boolean` | `true` | 启用离开动作。 |
| motionLeaveImmediately | `boolean` | - | 安装后立即触发离开。 |
| motionName | `string \| MotionName` | - | CSS className前缀或每阶段className。 |
| removeOnLeave | `boolean` | `true` | 离开后删除该元素。设置 `forceRender` 时忽略。 |
| 可见的 | `boolean` | `true` | 控制元素是否可见。 |
| onAppearActive | `MotionEventHandler` | - | 在出现活跃阶段期间触发。 |
| onAppearEnd | `MotionEndEventHandler` | - | 出现完成时触发。返回`false`继续等待。 |
| onAppearPrepare | `MotionPrepareEventHandler` | - | 在出现开始之前准备回调。 |
| onAppearStart | `MotionEventHandler` | - | 出现开始时触发。 |
| onEnterActive | `MotionEventHandler` | - | 在进入活动阶段期间触发。 |
| onEnterEnd | `MotionEndEventHandler` | - | 输入完成时触发。返回`false`继续等待。 |
| onEnterPrepare | `MotionPrepareEventHandler` | - | 在输入开始之前准备回调。 |
| onEnterStart | `MotionEventHandler` | - | 输入开始时触发。 |
| onLeaveActive | `MotionEventHandler` | - | 在离开活动阶段触发。 |
| onLeaveEnd | `MotionEndEventHandler` | - | 休假结束时触发。返回`false`继续等待。 |
| onLeavePrepare | `MotionPrepareEventHandler` | - | 在休假开始前准备回调。 |
| onLeaveStart | `MotionEventHandler` | - | 休假开始时触发。 |
| onVisibleChanged | `(visible: boolean) => void` | - | 最终可见状态改变后触发。 |

### CSSMotionList

`CSSMotionList` 接受上述动画属性，但 `children` 是列表渲染函数。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| children们 | `(props, ref) => ReactElement` | - | 每个关键项目的渲染函数。 |
| component | `string \| ComponentType \| false` | `div` | Wrapper component. Use `false` for no wrapper. |
| keys | `(React.Key \| { key: React.Key })[]` | - | Keys to animate. |
| onAllRemoved | `() => void` | - | 在移除每个留下的项目后触发。 |
| onVisibleChanged | `(visible, info: { key: React.Key }) => void` | - | 项目可见性更改后触发。 |

### Ref

| Ref method | 类型 | 说明 |
| --- | --- | --- |
| `enableMotion` | `() => boolean` | 当前是否启用运动。 |
| `inMotion` | `() => boolean` | 元素是否处于运动生命周期中。 |
| `nativeElement` | `HTMLElement` | 当前 DOM 元素。 |

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

包构建完成后，发布流程由 `@rc-component/np` 通过 `rc-np` 命令处理。

## 许可证

@rc-component/motion 基于 [MIT](./LICENSE) 许可证发布。

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
