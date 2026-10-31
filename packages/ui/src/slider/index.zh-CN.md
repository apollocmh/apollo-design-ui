---
category: 数据录入
title: Slider
subtitle: 滑动输入条
titleTemplate: '%s - @apollo-design/ui'
description: 滑动型输入器，展示当前值和可选范围。
---

# Slider 滑动输入条

滑动型输入器，展示当前值和可选范围。

## 何时使用

- 需要在有限范围内选择一个或多个数值时；
- 需要让用户直观感知「当前值在区间里的位置」时；
- 需要实时反馈（拖拽即改值）时。

## 引入

```ts
import { Slider } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 带标记

<code src="./demo/mark.vue"></code>

### 垂直

<code src="./demo/vertical.vue"></code>

### 反向

<code src="./demo/reverse.vue"></code>

### 禁用单个把手

<code src="./demo/disabled-handle.vue"></code>

### 可编辑节点

<code src="./demo/editable.vue"></code>

### 可拖拽轨道

<code src="./demo/draggable-track.vue"></code>

### 事件

<code src="./demo/event.vue"></code>

### 提示格式化

<code src="./demo/tip-formatter.vue"></code>

### 常显提示

<code src="./demo/show-tooltip.vue"></code>

### 自定义把手图标

<code src="./demo/icon-slider.vue"></code>

### 多把手

<code src="./demo/multiple.vue"></code>

### 与数字输入框联动

<code src="./demo/input-number.vue"></code>

## API

### Slider

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value（`v-model:value`） | 当前值：单把手是 `number`、`range` 时是 `number[]`；`null` 清空把手 | `number \| number[] \| null` | —— |
| defaultValue | 非受控初始值，支持 null 清空 | `number \| number[] \| null` | —— |
| min | 最小值 | `number` | `0` |
| max | 最大值 | `number` | `100` |
| step | 步长；`null` 表示只按 `marks` 取值 | `number \| null` | `1` |
| range | 双（多）把手；对象形态可开 `editable` / `draggableTrack` / `minCount` / `maxCount` | `boolean \| SliderRangeConfig` | `false` |
| count | 固定间隔数，实际把手数为 count + 1；存在时补齐/截断值。range.minCount/maxCount 是编辑上下限，职责不同 | `number` | —— |
| marks | 刻度标记，值可以是 `string` / 数字 / `{ label, style }` | `SliderMarks` | —— |
| dots | 是否显示刻度点（与 `step` 联用） | `boolean` | `false` |
| included | 是否显示已选轨道 | `boolean` | `true` |
| startPoint | 已选轨道的起点值 | `number` | `min` |
| track | `false` 时不渲染已选轨道 | `boolean` | `true` |
| disabled | 整体禁用，或**逐把手**禁用（数组） | `boolean \| boolean[]` | `false` |
| keyboard | 是否响应键盘 | `boolean` | `true` |
| autoFocus | 挂载后聚焦第一个未禁用的实际把手（含自定义槽节点） | `boolean` | `false` |
| reverse | 反向（横向自右向左；纵向时自上向下） | `boolean` | `false` |
| vertical | ⚠️ 已废弃，请用 `orientation` | `boolean` | `false` |
| orientation | 朝向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| allowCross | 允许把手交叉 | `boolean` | `true` |
| pushable | 推挤间距：`true` = 一个 `step`；数字 = 该间距 | `boolean \| number` | `false` |
| formatter | tooltip 文案；`null` 表示永不显示 | `((value?: number) => VNodeChild) \| null` | 数字转字符串 |
| tooltip | tooltip 配置（`open` / `placement` / `getPopupContainer` …） | `SliderTooltipProps` | —— |
| tabIndex | 把手的 tabIndex（可传数组逐把手） | `number \| number[]` | `0` |
| ariaLabelForHandle | 把手的可访问名（可传数组） | `string \| string[]` | —— |
| ariaLabelledByForHandle | 把手的 `aria-labelledby`（可传数组） | `string \| string[]` | —— |
| ariaRequired | `aria-required` | `boolean` | —— |
| ariaValueTextFormatterForHandle | 把手的值文案（可传数组） | `(value: number) => string \| 数组` | —— |
| classNames | 语义化类名：`root` / `tracks` / `track` / `rail` / `handle` | `SliderSemanticClassNames` | —— |
| styles | 语义化样式：同上 5 槽 | `SliderSemanticStyles` | —— |
| dotStyle / activeDotStyle | 刻度点样式（可传函数按值求值） | `SliderDotStyle` | —— |
| handleStyle / trackStyle / railStyle | ⚠️ 已废弃，请用 `styles.handle` / `styles.track` / `styles.rail` | —— | —— |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| `update:value` | 值变化（`v-model:value`） | `(value: number \| number[])` |
| `change` | 值变化（与 `update:value` 同时发出） | `(value: number \| number[])` |
| `beforeChange` | 本次有效交互的首个提议值；在 change 前发一次 | `(value: number \| number[])` |
| `changeComplete` | 交互结束的最后提议快照；受控拒绝时仍是提议值 | `(value: number \| number[])` |
| `focus` / `blur` | 把手获得 / 失去焦点 | `(event: FocusEvent, index: number)` |
| `keydown` / `keyup` | 把手原生键盘通知；keydown 在内部操作前发出，支持 preventDefault() | `(event: KeyboardEvent, index: number)` |

### 插槽

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `handle` | 自定义实际把手；将 nodeProps 绑定到原生元素以保留 ARIA、事件及真实 ref | `{ index, prefixCls, value, dragging, draggingDelete, nodeProps, className, style }` |
| `activeHandle` | 自定义活动装饰锚点（无 role/键盘）；range 未锁定 open 且正悬停/聚焦/拖拽时，由默认 Tooltip 包装 | 同上 |

### 方法（ref）

| 方法 | 说明 |
| --- | --- |
| `focus()` | 聚焦第一个未禁用的实际把手（含自定义槽节点） |
| `blur()` | 若焦点在组件内则失焦 |

### 键盘

| 按键 | 行为 |
| --- | --- |
| ← / → | −1 / +1（反向或 RTL 时翻号） |
| ↑ / ↓ | +1 / −1（纵向 `reverse` 时翻号） |
| Home / End | 到 `min` / `max` |
| PageUp / PageDown | ±2 个「候选步」（候选集合 = `step` 网格 ∪ `marks`） |
| Backspace / Delete | 删除该节点（仅 `range.editable`，且受 `minCount` 限制） |

> ⚠️ **给把手的可访问名是使用方的责任**：`role="slider"` 需要一个可访问名，组件不会替你猜
> （`0..100` 的量在业务里可能叫音量 / 进度 / 评分）。不传 `ariaLabelForHandle` 时
> axe 会报 `aria-input-field-name` —— 与 antd 一致（见 `COMPATIBILITY.md` 的 U13）。


受控更新是提议，父级拒绝后 DOM/ARIA 保持当前接受值；撤控保留最后接受值，不保留未接受的拖拽草稿。输入会话的 beforeChange/changeComplete 保留提议快照，不读取可能已经回退的 DOM 值。没有变化、仅 keyup、输入法、preventDefault、touchcancel、配置失效和卸载不会产生伪完成通知。

class/style、data-*、title 及普通原生监听落根 div；style 支持 Vue 字符串、对象和数组。aria-* 与原生 tabindex 落实际把手，tabIndex/逐把手 ARIA props 优先，role/值域/当前值由组件保证。h() 原生键盘监听使用 onKeydown/onKeyup。

handle / activeHandle 使用公开 SliderHandleInfo（包括完整 HTMLAttributes 和真实 ref 的 nodeProps），活动 scope 的 index 是当前实际索引。默认槽与 Tooltip 包装在渲染时读取，自定义结构应保留唯一实际可操作把手并绑定 nodeProps。focus()/blur() 在挂载前后安全，模式/Tooltip 配置变化保留存活把手节点。

### Tooltip 与当前配置

tooltip.formatter 优先于顶层 formatter，null 关闭提示；二者均保留数值格式化职责。单把手和锁定 open=true 的范围逐个显示 Tooltip，默认范围使用唯一活动装饰锚点。位置/前缀/箭头/颜色/当前语义样式及显式容器按 Tooltip 自身契约消费，默认容器由 Tooltip 读取当前 Provider。

提示开关由 Slider 的真实焦点、hover、拖拽和 tooltip.open 拥有；不再声明无效的 tooltip.defaultOpen/trigger/onOpenChange/onUpdate:open，以及从未消费的内部 value/draggingDelete。draggingDelete 保留在真实 handle scope。

ConfigProvider.components.slider 的 className/style/classNames/styles 与当前方向、禁用响应替换及撤回。主题 token/算法与 theme.components.Slider 的 18 个 Token 投影到实际根变量，数字长度转为 px；原生根 style 的同名变量最后覆盖。自定义 prefixCls 需要对应静态 CSS，不会运行时生成选择器。

## 设计 Token

| Token | 默认值（light） | 说明 |
| --- | --- | --- |
| `controlSize` | `10` | 把手与轨道的基准尺寸（`controlHeightLG / 4`） |
| `railSize` | `4` | 底轨高度 |
| `handleSize` | `10` | 把手直径 |
| `handleSizeHover` | `12` | hover 时把手直径 |
| `dotSize` | `8` | 刻度点直径 |
| `handleLineWidth` | `2` | 把手描边宽度 |
| `handleLineWidthHover` | `2.5` | hover 时描边宽度 |
| `railBg` / `railHoverBg` | `rgba(0,0,0,0.04)` / `rgba(0,0,0,0.06)` | 底轨底色 / hover |
| `trackBg` / `trackHoverBg` | `#91caff` / `#69b1ff` | 已选轨道底色 / hover |
| `handleColor` / `handleActiveColor` | `#91caff` / `#1677ff` | 把手边框 / 激活 |
| `handleActiveOutlineColor` | `rgba(22,119,255,0.2)` | 把手激活外发光 |
| `handleColorDisabled` | `#bfbfbf` | 禁用把手 |
| `dotBorderColor` / `dotActiveBorderColor` | `#f0f0f0` / `#91caff` | 刻度点边框 / 选中 |
| `trackBgDisabled` | `rgba(0,0,0,0.04)` | 禁用时的已选轨道 |

主题切换请用当前 `ConfigProvider.theme`；静态 CSS 消费实际根投影的变量，不引入 CSS-in-JS 运行时。
