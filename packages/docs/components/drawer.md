---
title: Drawer 抽屉
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

屏幕边缘滑出的浮层面板。

## 何时使用

- 需要从屏幕边缘滑出、承载较多内容或表单的场景。
- 需要在**当前节点内**渲染（`getContainer={false}`）而不是挂到 body。
- 需要可拖拽改尺寸（`resizable`）或多层嵌套（子抽屉推挤父级）。

:::

## 代码演示

::: v-pre

**basic-right**：基础抽屉，点击触发按钮抽屉从右滑出，点击遮罩区关闭。

:::

<DemoPreview component="drawer" demo="basic-right" />

::: v-pre

**closable-placement**：关闭按钮位置。

:::

<DemoPreview component="drawer" demo="closable-placement" />

::: v-pre

**component-token**：组件级 token。

:::

<DemoPreview component="drawer" demo="component-token" />

::: v-pre

**config-provider**：ConfigProvider 配置。

:::

<DemoPreview component="drawer" demo="config-provider" />

::: v-pre

**extra**：通过 `extra` slot 可以设置标题栏右侧的操作区。

:::

<DemoPreview component="drawer" demo="extra" />

::: v-pre

**form-in-drawer**：表单放进抽屉。

:::

<DemoPreview component="drawer" demo="form-in-drawer" />

::: v-pre

**loading**：抽屉内容加载中。

:::

<DemoPreview component="drawer" demo="loading" />

::: v-pre

**mask**：遮罩模糊。

:::

<DemoPreview component="drawer" demo="mask" />

::: v-pre

**multi-level-drawer**：嵌套抽屉：打开子抽屉时父级会被推挤（`DrawerContext` 的 push/pull 链）。

:::

<DemoPreview component="drawer" demo="multi-level-drawer" />

::: v-pre

**no-mask**：不显示遮罩。

:::

<DemoPreview component="drawer" demo="no-mask" />

::: v-pre

**placement**：自定义位置，点击触发按钮抽屉从相应的位置滑出，点击遮罩区关闭。

:::

<DemoPreview component="drawer" demo="placement" />

::: v-pre

**render-in-current**：`getContainer={false}` 时抽屉**不 portal**，渲染在当前节点里（需要自己定位父容器）。

:::

<DemoPreview component="drawer" demo="render-in-current" />

::: v-pre

**render-panel**：调试用面板。

:::

<DemoPreview component="drawer" demo="render-panel" />

::: v-pre

**resizable**：可拖拽调整尺寸的抽屉（`resizable`）。

:::

<DemoPreview component="drawer" demo="resizable" />

::: v-pre

**scroll-debug**：长内容滚动。

:::

<DemoPreview component="drawer" demo="scroll-debug" />

::: v-pre

**size**：抽屉尺寸，可选 `default`（378px）与 `large`（736px）。

:::

<DemoPreview component="drawer" demo="size" />

::: v-pre

**style-class**：语义化样式。

:::

<DemoPreview component="drawer" demo="style-class" />

::: v-pre

**user-profile**：用户信息面板。

:::

<DemoPreview component="drawer" demo="user-profile" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| open | 是否显示 | `boolean` | `false` |
| placement | 方位 | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` |
| size | 尺寸预设或数值/字符串 | `'default' \| 'large' \| number \| string` | `'default'`(378) |
| defaultSize | 默认尺寸（**垂直方位的默认值来源**） | `number` | `378` |
| title | 标题（文本；富标题走 `#title` slot，slot 优先） | `string` | — |
| footer | 页脚（⚠️ 已改为 `#footer` slot，空 slot 等价隐藏） | `slot` | — |
| extra | 标题栏右侧（⚠️ 已改为 `#extra` slot） | `slot` | — |
| closable | 关闭按钮。`false` ⇒ 不渲染；对象可给 `placement: 'start' \| 'end'` | `boolean \| null \| {...}` | `true` |
| closeIcon | 自定义关闭图标（⚠️ 已改为 `#closeIcon` slot） | `slot` | — |
| loading | 内容区骨架态 | `boolean` | `false` |
| mask | 遮罩。`false` ⇒ 无遮罩（根类加 `no-mask`） | `boolean \| { enabled?, blur?, closable? }` | `true` |
| maskClosable | 点遮罩关闭（⚠️ deprecated ⇒ `mask.closable`） | `boolean` | `true` |
| push | 推挤：`true` / `{ distance }`（**只有子抽屉会真的推**） | `boolean \| PushState` | `{ distance: 180 }` |
| resizable | 可拖拽改尺寸 | `boolean \| { onResize?, onResizeStart?, onResizeEnd? }` | — |
| getContainer | 容器；`false` ⇒ **内联渲染**（不 portal） | `false \| string \| () => HTMLElement` | `document.body` |
| destroyOnHidden | 关闭后卸载 | `boolean` | `false` |
| focusable | 焦点行为 | `{ focusTriggerAfterClose?, trap? }` | — |
| keyboard | ESC 可关 | `boolean` | `true` |
| autoFocus | 打开时自动聚焦面板 | `boolean` | `true` |
| afterOpenChange | 动效结束回调 | `(open: boolean) => void` | — |
| onClose | 关闭回调（遮罩点击 / ESC / 关闭按钮） | `(e: Event) => void` | — |
| classNames / styles | 12 个语义槽 | — | — |

**deprecated（9 条，dev 告警）**：`headerStyle` / `bodyStyle` / `footerStyle` →
`styles.*`；`contentWrapperStyle` → `styles.wrapper`；`maskStyle` → `styles.mask`；
`drawerStyle` → `styles.section`；`destroyOnClose` → `destroyOnHidden`；
`width` / `height` → `size`。

### 语义化槽位（12 个）

```
root / mask / wrapper / section / header / header-title? / title / extra / body / footer / close / dragger
（+ deprecated 的 content ⇒ section）
```

### Slots（C8-R2）

| Slot | 说明 | 参数 |
|---|---|---|
| title | 富标题（文本 `title` prop 等价，slot 优先） | — |
| footer | 页脚（空 slot 等价隐藏） | — |
| extra | 标题栏右侧额外内容 | — |
| closeIcon | 自定义关闭图标 | — |

## Theme（Component Token）

4 个（CSS 变量 `--apollo-drawer-*`）：`zIndexPopup`（= `zIndexPopupBase` = **1000，不加偏移**）/
`footerPaddingBlock`(8) / `footerPaddingInline`(16) / `draggerSize`(4)。

## 设计说明

### 尺寸轴随方位切换

`left`/`right` 用 **width**，`top`/`bottom` 用 **height**；`size` 预设 `'large'` = 736、
`'default'` = 378。⚠️ rc 的 378 兜底**只对水平方位生效**，垂直方位的默认值来自 `defaultSize`。

### 嵌套抽屉的推挤链

子抽屉打开时会调父级的 `push()`，父级据此按方位 `translate`（`push.distance` 默认 180）。
**顶层抽屉自己不会位移** —— `push` 只决定距离。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css';  // 主题变量，必须先引
import '@apollo-design/ui/drawer/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';           // 汇总
```

:::
