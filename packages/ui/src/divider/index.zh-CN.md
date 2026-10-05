---
category: 布局
title: Divider
subtitle: 分割线
---

区隔内容的分割线。

## 何时使用

- 对不同章节的文本段落进行分割。
- 对行内文字/链接进行分割，例如表格的操作列。

## 代码演示

见 [`demo/`](./demo)（9 个，与 antd 的**用户可见** demo 一一对应）。

| demo | 内容 |
|---|---|
| `horizontal` | 水平分割线（含 `dashed`） |
| `with-text` | 带文字的分割线：`titlePlacement` + `styles.content.margin` |
| `size` | 间距大小 `small` / `medium` / `large` |
| `plain` | 标题使用正文样式 |
| `vertical` | 垂直分割线（`orientation` 与 `vertical` 两条路径） |
| `customize-style` | `style` 覆盖边框 |
| `component-token` | 组件 Token（⚠️ 含一处缺口说明，见「设计说明」） |
| `variant` | 线型 `solid` / `dashed` / `dotted` |
| `style-class` | 语义化 `classNames` / `styles` |

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-divider` |
| orientation | 分割方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 是否垂直。与 `orientation` 同时配置时以 `orientation` 优先 | `boolean` | `false` |
| titlePlacement | 标题位置 | `'start' \| 'end' \| 'center'` | `'center'` |
| plain | 标题是否使用正文样式 | `boolean` | `false` |
| variant | 线型 | `'dashed' \| 'dotted' \| 'solid'` | `'solid'` |
| dashed | 是否虚线。等价于 `variant="dashed"`，但**两者可叠加** | `boolean` | `false` |
| size | 间距大小，**仅对水平布局有效** | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| classNames | 语义化类名 | `DividerSemanticClassNames \| ((info: { props }) => DividerSemanticClassNames)` | — |
| styles | 语义化样式 | `DividerSemanticStyles \| ((info: { props }) => DividerSemanticStyles)` | — |
| ~~type~~ | ⚠️ 已废弃，请用 `orientation` | `'horizontal' \| 'vertical'` | — |
| ~~orientationMargin~~ | ⚠️ 已废弃，请用 `styles.content.margin`。标题与最近边框的距离；不带单位的字符串数字按 px 处理 | `string \| number` | — |

### 根节点原生属性

根节点是单个 `<div role="separator">`。Vue 原生 `class`、`style` 及其它 `$attrs` 会透传到该节点；`class` 支持字符串、数组、对象，调用方 `style` 优先于 `styles.root`。它们不是 Divider 专属 Props，因此不声明 `className` / `rootClassName` / `style`。

```vue
<Divider class="my-divider" :style="{ borderColor: 'red' }" />
```

### 插槽

| 名称 | 说明 |
|---|---|
| default | 分割线中间的标题。⚠️ 垂直模式下**不渲染**（并输出开发期告警，与 antd 一致） |

### 语义化槽位

`classNames` / `styles` 各有三个槽位：`root` / `rail` / `content`。

合并优先级（低 → 高）：

```
ConfigProvider.divider.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中调用处原生 **`:style` 会覆盖 `styles.root`**（保持合并优先级；该值走 Vue `$attrs`，不是 `DividerProps.style`）。

⚠️ `rail` 槽位在**没有默认插槽**时落在**根元素**上，有插槽时落在两个 rail 子元素上 ——
这是上游行为，不是笔误。

### 类型导出

`DividerProps`、`DividerRef`、`DividerConfig`、`DividerSize`、`DividerVariant`、
`Orientation`、`TitlePlacement`、`DividerSemanticType`、`DividerSemanticAllType`、
`DividerSemanticClassNames`、`DividerSemanticStyles`、`DividerSemanticValue`、
`DividerSlot`、`DividerComponentToken`。

### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null` |

### 工具导出

| 名称 | 说明 |
|---|---|
| `genDividerStyle(prefixCls)` | 生成该前缀下的 CSS 文本（自定义 `prefixCls` 时自行产出样式用） |
| `prepareDividerComponentToken(token)` | 组件 Token 的默认值计算（与 antd 的 `prepareComponentToken` 逐字相同） |

## 设计说明

### 方向的优先级

`orientation` > `vertical` > `type`，三者都不传时兜底 `horizontal`。

⚠️ `vertical` 的判据是 `typeof vertical === 'boolean'`，**不是真值判断** ——
所以「不传」与「显式传 `false`」是两条不同的分支：显式传 `false` 会压过 `type`。

另外 `orientation` 在 v6 里**身兼两职**：取 `horizontal` / `vertical` 时是方向；
取 `left` / `right` / `center` / `start` / `end` 时被当作**旧版的标题位置**并输出告警。

### 标题位置

`titlePlacement` 优先；未传时若 `orientation` 是合法的位置值就用它，否则 `center`。
`left` / `right` 再按文字方向折算成 `start` / `end`（RTL 时互换）。

### `orientationMargin` 与单位

`orientationMargin` 接受数字或字符串：

| 输入 | 效果 |
|---|---|
| `20` | `20px` |
| `'10'` | `10px`（纯数字字符串按数字处理） |
| `'2em'` | `2em`（原样） |
| `0` | `0`（数值 0 **不**补单位，与 React 一致） |

仅在 `titlePlacement` 为 `start` / `end` 时生效。

### 组件 Token

| Token | 默认值 | 说明 |
|---|---|---|
| `verticalMarginInline` | `token.marginXS` | 纵向分割线的横向外间距 |
| `textPaddingInline` | `'1em'` | 文本横向内间距 |
| `orientationMargin` | `0.05` | 文本与边缘距离，取值 0 ～ 1 |

⚠️ **缺口**：antd 可以通过 `theme.components.Divider` 覆盖这三个 Token；本仓库目前
**只能覆盖 `verticalMarginInline`**（它派生自 Alias token，落成 `var(--apollo-margin-xs)`）。
另外两个是**字面量** Token，在零运行时管线里被内联成常量、没有对应的 CSS 变量 ——
因为 `packages/theme` 的 `tokens.css` 只声明 Alias 层变量。这是全库的管线缺口，
详见 [`README.md`](./README.md) §5.3 与 §9。

等价的临时手段：用 `styles.content.padding` 覆盖 `textPaddingInline` 的效果、
用 `styles.content.margin` 覆盖 `orientationMargin` 的效果。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css';   // 主题变量，必须先引
import '@apollo-design/ui/divider/style.css'; // 按需
// 或
import '@apollo-design/ui/style.css';         // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genDividerStyle('my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。
