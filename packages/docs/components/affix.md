---
title: Affix 固钉
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# Affix 固钉

将页面元素钉在可视范围。

## 何时使用

- 当内容过长，需要把某个元素（如工具条、操作栏）**固定在页面可视范围**内时；
- 常用于导航、按钮组的固定。

:::

## 代码演示

::: v-pre

**basic**：最简单的用法：滚动到 `offsetTop` 之后，按钮固钉在顶部。
固钉时组件会渲染一个**等高占位层**（`aria-hidden`），避免页面布局跳动；
且**只有此时**内层才有 `apollo-affix` 类名（`position: fixed`）。

:::

<DemoPreview component="affix" demo="basic" />

::: v-pre

**offset-bottom**：`offsetBottom` 与 `offsetTop` **互斥**：两者都传时只有 `offsetTop` 生效
（antd 的 `internalOffsetTop` 互锁推导，见 `docs/analysis/affix.md` §3）。

:::

<DemoPreview component="affix" demo="offset-bottom" />

::: v-pre

**on-change**：`@change` 只在状态**翻转**时触发（连续固钉不会重复发）。
Vue 侧是 `emit('change', affixed)`，模板上写 `@change` —— antd 的 `onChange` prop 不移植成 prop（规则 C19）。

:::

<DemoPreview component="affix" demo="on-change" />

::: v-pre

**target**：`target` 是一个**返回元素或 `window` 的函数**（不是元素本身）。
换绑 `target` 时，旧 target 上的监听也会被解绑。
⚠️ 固定在容器底部时，偏移量是「容器可视区底边到**视口**底边的距离」参与计算
（`getFixedBottom` 用 `window.innerHeight`，不是容器高度）。

:::

<DemoPreview component="affix" demo="target" />

::: v-pre

**update-position**：`ref` 只暴露 `updatePosition`（与 antd 的 `useImperativeHandle` 一致）：
内容尺寸或布局在程序里变化后，手动触发一次重新测量。
尺寸变化通常由内部的 `ResizeObserver` 自动捕捉，无需手动调用。

:::

<DemoPreview component="affix" demo="update-position" />

::: v-pre

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `offsetTop` | 距离窗口顶部达到指定偏移后固钉 | `number` | — |
| `offsetBottom` | 距离窗口底部达到指定偏移后固钉。**与 `offsetTop` 互斥**：都传时只有 `offsetTop` 生效 | `number` | — |
| `target` | 滚动监听与定位的参照目标，**返回元素或 `window` 的函数**。默认 `window` | `() => HTMLElement \| Window \| null` | — |
| `prefixCls` | 类名前缀 | `string` | `apollo-affix` |

### 根节点原生属性

根节点是外层占位测量层。Vue 原生 `class`、`style` 及其它 `$attrs` 会透传到该节点；`class` 支持字符串、数组和对象形态，`style` 与 ConfigProvider 中的 `components.affix.style` 合并，调用处同名样式优先。它们不是 Affix 专属 Props，因此不声明 `className`、`rootClassName` 或 `style` Props。

```vue
<Affix class="toolbar-affix" :style="{ zIndex: 20 }">
  <Toolbar />
</Affix>
```

### 事件

| 事件 | 说明 | 回调参数 |
|---|---|---|
| `change` | 固钉状态变化。**只在翻转时触发**（连续固钉不会重复发） | `(affixed: boolean)` |

### 插槽

| 名称 | 说明 |
|---|---|
| `default` | 被固钉的内容 |

### ref

```ts
const affixRef = ref<{ updatePosition: () => void } | null>(null);
```

## 设计说明

### 双层结构

外层始终在文档流里（**占位测量层**，`restProps` 落在这里）；内层在固钉时 `position: fixed`，
并在外层里插入一个**等高占位**（`aria-hidden="true"`）防止布局跳动。

⚠️ **内层的 `apollo-affix` 类名只在固钉时出现**（antd 的 `mergedCls = clsx({ [rootCls]: affixStyle })`）。

### `offsetTop` / `offsetBottom` 互斥

antd 的 `internalOffsetTop = 两者都未传 ? 0 : offsetTop`，但 `getFixedTop` 的判据要求
`offsetTop !== undefined` ⇒ **两者都传时只有 `offsetTop` 生效**。

### 定位判据（`utils.ts`，已导出供单测）

```ts
getFixedTop(placeholderRect, targetRect, offsetTop)
// offsetTop !== undefined && round(targetRect.top) > round(placeholderRect.top) - offsetTop
//   ⇒ offsetTop + targetRect.top

getFixedBottom(placeholderRect, targetRect, offsetBottom)
// offsetBottom !== undefined && round(targetRect.bottom) < round(placeholderRect.bottom) + offsetBottom
//   ⇒ offsetBottom + (window.innerHeight - targetRect.bottom)
```

⚠️ `Math.round` **只参与比较**（消除亚像素抖动），结果用原始值。
⚠️ `getFixedBottom` 用 `window.innerHeight`（不是 target 高度）—— 固在「容器可视区底部」
需要容器底边到视口底边的距离补偿。

位置未变时的快速路径需按 Vue 的 inline style 值比较：测量数值写入样式后会变成 `"64px"` 这样的像素字符串；与当前判据位置相等时跳过完整重测。几何函数不在生产路径输出探针日志。

### 无障碍

⚠️ **固钉状态变化对读屏器不可见**：antd 没有输出 `aria-live` / `role="status"` / `aria-busy`，
我们逐字对齐，不擅自补。整个组件只有占位层一处 ARIA（`aria-hidden="true"`）。

### 组件 Token

| token | 默认值 | 说明 |
|---|---|---|
| `zIndexPopup` | `zIndexBase + 10` | 固钉层的 z-index |

⚠️ 已知缺口：没有「Component Token → CSS 变量」管线，用户暂无法覆盖 `zIndexPopup`。

### 样式引入

```ts
import '@apollo-design/ui/affix/style.css';
```

## 已知缺口

- **jsdom / 静态渲染测不了**：真实滚动、`ResizeObserver` 触发、固钉态的视觉比对
  —— 详见 `README.md` §7.1（判据已用纯函数单测钉住，缺口是**组件级集成**那条链路）。
- 按需样式子路径 `./affix/style.css` 依赖 `packages/ui/package.json` 的 `exports` 声明（全库级基建议题）。

:::
