---
category: 反馈
title: Tour
subtitle: 导览
titleTemplate: '%s - @apollo-design/ui'
description: 引导用户按步骤了解页面功能的遮罩式导览。
---

# Tour 导览

用于分步引导用户了解页面功能。基于蒙层挖洞定位目标元素，支持键盘导航与自定义面板。

## 何时使用

- 当产品处于新功能上线或改版阶段，需要向用户分步介绍功能点时；
- 当希望用户按照指定顺序完成任务流程时；
- 当需要以「聚光灯」形式聚焦页面元素时。

## 引入

```ts
import { Tour } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 自定义蒙层

<code src="./demo/mask.vue"></code>

### 非模态

<code src="./demo/non-modal.vue"></code>

### 自定义操作区

<code src="./demo/actions-render.vue"></code>

### 自定义指示器

<code src="./demo/indicator.vue"></code>

### 位置

<code src="./demo/placement.vue"></code>

### 高亮边距

<code src="./demo/gap.vue"></code>

### 面板预览

<code src="./demo/render-panel.vue"></code>

### 自定义样式与类名

<code src="./demo/style-class.vue"></code>

## API

### TourProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| steps | 导览步骤配置 | TourStepProps[] | - |
| open | 是否打开（受控，`v-model:open`） | boolean | - |
| defaultOpen | 非受控初始打开态（不传 `open`/`defaultOpen` 且步骤合法时默认打开） | boolean | - |
| current | 当前步骤（受控，`v-model:current`） | number | 0 |
| defaultCurrent | 非受控初始步骤 | number | 0 |
| type | 面板形态 | 'default' \| 'primary' | 'default' |
| arrow | 是否显示箭头（被 `steps[].arrow` 覆盖） | boolean \| { pointAtCenter } | true |
| placement | 默认弹出位置（被 `steps[].placement` 覆盖；无 target 时兜底 `center`） | TourPlacement | 'bottom' |
| mask | 蒙层（被 `steps[].mask` 覆盖） | boolean \| { style?, color? } | true |
| gap | 高亮区相对目标的外扩 | { offset?: number \| [number, number]; radius?: number } | offset 6 / radius 2 |
| animated | 挖洞位动效 | boolean \| { placeholder } | true |
| keyboard | 键盘导航（Esc / ← / →） | boolean | true |
| closeIcon | 全局关闭图标（`#closeIcon` 插槽优先；被 `steps[].closeIcon` 覆盖） | VNodeChild | - |
| closable | 是否显示关闭按钮（被 `steps[].closable` 覆盖；对象上的 `aria-*` 透传到关闭按钮） | boolean \| { closeIcon?, ...aria } | - |
| scrollIntoViewOptions | 目标不在视口时的滚动选项 | boolean \| ScrollIntoViewOptions | { block: 'center', inline: 'center' } |
| zIndex | 浮层 z-index（不传走 `useZIndex` 层叠计算） | number | - |
| getPopupContainer | 挂载容器 | (node: HTMLElement) => HTMLElement \| ShadowRoot \| null | - |
| disabledInteraction | 蒙层是否拦截全部交互（含洞内） | boolean | false |
| builtinPlacements | 自定义 placement 配置表（默认由 `getPlacements` 生成） | Record&lt;string, AlignType&gt; | - |
| class | **根元素原生 attrs**（替代上游 `rootClassName`） | string / array / object | - |
| style / id / aria-* / 原生事件 | 唯一落到实际 popup 根；`style` 支持 Vue 对象、数组、字符串 | 原生 attrs | - |
| classNames / styles | 语义化槽位 ×12（对象或函数） | TourSemanticClassNames / TourSemanticStyles | - |

### TourStepProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| target | 高亮目标元素；getter 可返回尚未挂载的空 ref，`null` / `undefined` 表示居中显示 | HTMLElement \| (() => HTMLElement \| null \| undefined) \| null | - |
| title | 标题（`#title` 插槽优先） | string | - |
| description | 描述（`#description` 插槽优先） | string | - |
| cover | 封面（`#cover` 插槽优先，可传任意内容） | string | - |
| placement | 步骤级弹出位置 | TourPlacement | - |
| mask | 步骤级蒙层 | boolean \| { style?, color? } | - |
| arrow | 步骤级箭头 | boolean \| { pointAtCenter } | - |
| style | 步骤级面板样式（落到浮层根） | CSSProperties | - |
| className | 步骤级类名（拼在浮层根上） | string | - |
| scrollIntoViewOptions | 步骤级滚动选项 | boolean \| ScrollIntoViewOptions | - |
| closeIcon | 步骤级关闭图标 | VNodeChild | - |
| closable | 步骤级关闭配置 | boolean \| { closeIcon?, ...aria } | - |
| nextButtonProps | 下一步按钮（`children` 走 `#nextButton` 插槽优先；按钮类名用 Vue 原生 `class`） | { children?, onClick?, class?, style? } | - |
| prevButtonProps | 上一步按钮（`children` 走 `#prevButton` 插槽优先；按钮类名用 Vue 原生 `class`） | 同上 | - |
| type | 步骤级形态（覆盖 `TourProps.type`） | 'default' \| 'primary' | - |
| classNames / styles | 步骤级语义槽（不支持函数形态） | 同上 | - |

### 事件（Emits）

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:open | `v-model:open` | (open: boolean) |
| update:current | `v-model:current` | (current: number) |
| change | 步骤变化（与 `update:current` 同时发出） | (current: number) |
| close | 关闭（Esc / 关闭按钮 / Finish），携带关闭时的 current | (current: number) |
| finish | 最后一步点「完成」 | - |
| popupAlign | 实际 popup 完成对齐后的通知 | (element: HTMLElement, align: TriggerAlign) |

### Slots

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| title / description / cover | 步骤内容（优先于同名 string prop） | { step, current, total } |
| closeIcon | 关闭图标（优先于 prop） | - |
| nextButton / prevButton | 按钮文案（优先于 `*.children`） | { step, current, total } |
| indicators | 自定义指示器（对应 `indicatorsRender`） | { current, total } |
| actions | 自定义操作区（对应 `actionsRender`；`originNode` 是可直接渲染的稳定默认操作组件） | { current, total, originNode } |

### TourPurePanel

`Tour._InternalPanelDoNotUseOrYouWillBeFired` 的对应物，静态面板（debug / 文档用）。仅接收标题、描述、封面、关闭配置、按钮配置和语义样式等渲染字段，另有 `prefixCls`、`current`（0）与 `total`（6）；支持同一套具名槽，不接收 `target`、`mask` 等定位参数。

### 主题变量

| Token | 说明 | 默认值 |
| --- | --- | --- |
| zIndexPopup | 浮层 z-index | zIndexPopupBase + 70（默认 1070） |
| closeBtnSize | 关闭按钮尺寸 | fontSize × lineHeight = 22px |
| primaryPrevBtnBg | primary 形态「上一步」背景 | rgba(255,255,255,0.15) |
| primaryNextBtnHoverBg | primary 形态「下一步」hover 背景 | rgb(240,240,240) |

箭头族（arrowOffsetHorizontal / arrowOffsetVertical / arrowShadowWidth / arrowPath / arrowPolygon）与 tooltip / dropdown 同源，不重复声明。

## 状态、焦点与更新

`open` 与 `current` 各只有一个控制来源。受控操作只提出更新；父级拒绝时保持当前显示和焦点，撤控从最后接受值继续。步骤数组暂时为空或当前下标越界时隐藏，恢复合法步骤后保留接受的下标。真正重新打开时，仅非受控 `current` 静默归零，不发送 `change`。

方向键在导览面板内生效，并尊重输入控件、IME 与原生事件取消；Esc 只由最上层导览处理。打开时聚焦实际面板，不锁住允许交互的目标洞；接受关闭后恢复所属焦点，用户已移到外部时不抢回。`mask=false` 不锁滚动、不截获页面交互。

目标、祖先尺寸变化与捕获阶段滚动继续通过既有 s53 合帧链更新几何；关闭、切换目标与卸载会注销观察与监听并取消待执行帧。仅打开或更换目标/滚动选项时请求 `scrollIntoView`，不在被动滚动中反复拉回目标。父尺寸不变的纯位置重排仍不额外引入 DOM 观察或轮询。

具名槽在渲染期读取；存在但为空的槽不退回数据文本。`actions` 中使用 `<component :is="originNode" />`，组件身份在步骤和主题更新中保持稳定。每步 `nextButtonProps.onClick` / `prevButtonProps.onClick` 是数据动作，接收真实 `MouseEvent`，可 `preventDefault()` 取消默认步骤流转。

Provider、语言和现有 Token 在普通面板与 PurePanel 中读取当前值；优先级为 Provider → 顶层语义配置 → 当前步骤 → 原生根 attrs。显式 `styles.root` 的遮罩投影保留，原生 `class/style` 只作用 popup。顶层使用当前 Tour Token 层级，嵌套沿现有父层偏移，显式 `zIndex=0` 有效。

### 迁移

`onPopupAlign` 改为 Vue `popupAlign` 事件；模板用 `@popup-align`，`h()` 的 `onPopupAlign` 仍是监听器。`actions.originNode` 改为稳定组件，删除 `() => originNode` / VNode 类型断言，直接交给 `:is`。原生 attrs 从不可见 placeholder 迁到实际 popup；通过 `styles.mask` 单独控制遮罩。Tour 没有公开实例控制 API。
