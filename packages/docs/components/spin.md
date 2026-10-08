---
title: Spin 加载中
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

## 何时使用 {#when-to-use}

页面局部处于等待异步数据或正在渲染过程时，合适的加载动效会有效缓解用户的焦虑。

## 代码演示 {#examples}

<!-- prettier-ignore -->
<code src="./demo/basic.tsx">基本用法</code>
<code src="./demo/size.tsx">各种大小</code>
<code src="./demo/nested.tsx">卡片加载中</code>
<code src="./demo/tip.tsx">自定义描述文案</code>
<code src="./demo/delayAndDebounce.tsx">延迟</code>
<code src="./demo/custom-indicator.tsx">自定义指示符</code>
<code src="./demo/percent.tsx" version="5.18.0">进度</code>
<code src="./demo/style-class.tsx" version="6.0.0">自定义语义结构的样式和类</code>
<code src="./demo/fullscreen.tsx">全屏</code>
<code src="./demo/list-debug.tsx" debug>List 嵌套调试</code>

## API

通用属性参考：[通用属性](/docs/react/common-props)

| 参数 | 说明 | 类型 | 默认值 | 版本 | [全局配置](/components/config-provider#component-config) |
| --- | --- | --- | --- | --- | --- |
| classNames | 用于自定义组件内部各语义化结构的 class，支持对象或函数 | Record<[SemanticDOM](#semantic-dom), string> \| (info: { props }) => Record<[SemanticDOM](#semantic-dom), string> | - |  | 6.0.0 |
| delay | 延迟显示加载效果的时间（防止闪烁） | number (毫秒) | - |  | × |
| description | 可以自定义描述文案 | VNodeChild | - | 6.3.0 | × |
| fullscreen | 显示带有 `Spin` 组件的背景 | boolean | false | 5.11.0 | × |
| indicator | 加载指示符 | VNode | - |  | 5.20.0 |
| percent | 展示进度，当设置 `percent="auto"` 时会预估一个永远不会停止的进度 | number \| 'auto' | - | 5.18.0 | × |
| size | 组件大小，可选值为 `small` `medium` `large` `middle` `default` | string | `medium` |  | × |
| spinning | 是否为加载中状态 | boolean | true |  | × |
| styles | 用于自定义组件内部各语义化结构的行内 style，支持对象或函数 | Record<[SemanticDOM](#semantic-dom), CSSProperties> \| (info: { props }) => Record<[SemanticDOM](#semantic-dom), CSSProperties) | - |  | 6.0.0 |
| ~~tip~~ | 当作为包裹元素时，可以自定义描述文案。已废弃，请使用 `description` | VNodeChild | - |  | × |
| ~~wrapperClassName~~ | 包装器的类属性。已废弃，请使用 `classNames.root` | string | - |  | × |

### 静态方法 {#static-method}

- `Spin.setDefaultIndicator(indicator: VNode)`

  你可以自定义全局默认 Spin 的元素。

## Semantic DOM

| 槽位 | 说明 |
|---|---|
| `root` | 根元素 |
| `section` | 「加载层」div：非嵌套时落在根上，嵌套 / fullscreen 时落在内层 div |
| `indicator` | 指示器容器（默认是 `dot-holder` span） |
| `description` | 描述文案 div |
| `container` | 嵌套时被遮罩的内容容器 |
| ~~`tip`~~ | 已废弃，请使用 `description` |
| ~~`mask`~~ | 已废弃，请使用 `root`（仅 `fullscreen` 时生效） |

## 主题变量（Design Token）{#design-token}

<ComponentTokenTable component="Spin"></ComponentTokenTable>

:::

## 代码演示

::: v-pre

**basic**：最简单的用法：`spinning` 默认为 `true`，不传就是在转。

:::

<DemoPreview component="spin" demo="basic" />

::: v-pre

**custom-indicator**：`indicator` 接收一个 **VNode**（antd 侧是 `React.ReactElement`），用来替换默认的四点转圈。
它的优先级是 `indicator` > ConfigProvider 的 `spin.indicator` > `Spin.setDefaultIndicator()`。
⚠️ 类型是 `VNode` 而不是「组件」：要传 `h(...)` 的**调用结果**，传函数式组件是类型错误。
上游 demo 用的 `<LoadingOutlined />` 来自图标库，这里用等价的内联 SVG 代替。

:::

<DemoPreview component="spin" demo="custom-indicator" />

::: v-pre

**delay-and-debounce**：`delay` 指定**延迟多少毫秒才进入加载态**，用来避免「请求秒回时闪一下加载图标」。
⚠️ 两条容易误解的语义：
- **开要等，关不等**：`spinning` 变 `true` 时走 `delay`，变 `false` 时**立即**生效
  （`should close immediately`）；
- `delay` 是**重新计时**而不是「至少显示这么久」：每次 `spinning` / `delay`
  变化都会取消上一次的定时器。

:::

<DemoPreview component="spin" demo="delay-and-debounce" />

::: v-pre

**description**：`description` 是加载文案。**只在有 children（嵌套模式）或 `fullscreen` 之外也渲染** ——
它跟着指示器一起出现，因此受 `spinning` 控制。
⚠️ `tip` 是 `description` 的旧名，已废弃（会输出开发期告警）。两者同时传时以
`description` 为准（`description ?? tip`）。

:::

<DemoPreview component="spin" demo="description" />

::: v-pre

**fullscreen**：`fullscreen` 会加一层半透明遮罩并把转圈居中，非常适合做整页加载器。
⚠️ 两条容易忽略的语义：
- `fullscreen` 会让 `isNested` 恒为真 —— 即使**没有** children，`-section` 也会
  下移到内层 div（根元素只留下遮罩）；
- 因此 `styles.section` 落在内层 div 上，**不**进根元素；而 `styles.mask`
  只在 `fullscreen` 时并入根元素。

:::

<DemoPreview component="spin" demo="fullscreen" />

::: v-pre

**nested**：**有 children 就进入嵌套模式**（`isNested = hasChildren || fullscreen`）：
- 根元素不再带 `-section`，改由内层 `-section` 承担指示器与文案（绝对居中浮在内容之上）；
- children 被包进 `-container`，转起来时它变半透明且不可交互（`pointer-events: none`）；
- 已废弃的 `wrapperClassName` 会落在根元素上（替代 `-section` 的位置）。

:::

<DemoPreview component="spin" demo="nested" />

::: v-pre

**percent**：`percent` 传数字时渲染一条定长进度环；传 `'auto'` 时组件自己按 **200ms 一档渐近推进**
（越接近 100% 步进越小，永远到不了 100%），用于「不知道还要多久」的场景。
⚠️ 两条容易踩的语义：
- `percent` 只在 `spinning` 为真时渲染；进度环会被 `<svg role="progressbar">` 包住，
  并且**首帧不渲染**（与 React 的 `useLayoutEffect` 对齐），`percent === 0` 时始终不渲染；
- 超出 `[0, 100]` 的值会被 `Math.max(Math.min(percent, 100), 0)` 夹住后再写进
  `aria-valuenow`，而**几何**上用的是夹之前的值（上游行为，逐字保留）。

:::

<DemoPreview component="spin" demo="percent" />

::: v-pre

**size**：`size` 取 `small` / `large` 时会在根元素上追加 `-sm` / `-lg`，
加载图标的大小由 Component Token 的 `dotSizeSM` / `dotSize` / `dotSizeLG` 决定。
`medium` / `middle` 是默认尺寸（不追加类名），`default` 是 `medium` 的旧写法且已废弃。

:::

<DemoPreview component="spin" demo="size" />

::: v-pre

**style-class**：`classNames` / `styles` 各有 6 个槽位：`root` / `section` / `indicator` / `description` /
`container`，外加两个已废弃的 `tip` / `mask`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。
⚠️ 三条槽位落点的分叉（照抄上游，不是笔误）：
- **非嵌套**（无 children 且非 `fullscreen`）时根元素自己就是 section，
  所以 `classNames.section` / `styles.section` 落在**根元素**上；
- **嵌套**时 `-section` 下移到内层 div，根元素改吃已废弃的 `wrapperClassName`；
- `styles.mask` 只在 `fullscreen` 时并入根元素，`styles.tip` 与 `styles.description`
  一起并入文案块（`description` 后写、覆盖 `tip`）。
函数式拿到的 `info.props` 是**合并后**的 props —— `description` 已折成 `description ?? tip`
的结果、`percent` 是 `auto` 解析后的数值，所以可以用它做条件分支。

:::

<DemoPreview component="spin" demo="style-class" />
