---
category: 数据展示
title: Empty
subtitle: 空状态
---

空状态时的占位提示。

## 何时使用

- 数据为空时展示，替代一片空白。
- 也可以作为「还没有内容」的引导位，通过默认插槽放一个「新建」按钮。

## 代码演示

见 [`demo/`](./demo)（6 个，与 antd 一一对应）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo` |
| class / style | **根元素原生 attrs**（不是 Props）；`style` 覆盖 `styles.root` | `string \| array \| object` / `CSSProperties` | — |
| style | 根元素内联样式。**会覆盖 `styles.root`** | `CSSProperties` | — |
| image | 自定义插画。字符串时渲染成 `<img draggable="false">` | `VNodeChild \| Component` | `PRESENTED_IMAGE_DEFAULT` |
| imageStyle | ⚠️ 已废弃，请用 `styles.image`。与 `styles.image` 合并，后者覆盖前者 | `CSSProperties` | — |
| description | 描述文案。`false` 表示不渲染描述块；**支持插槽 `#description`** | `VNodeChild` | locale 的 `Empty.description`（`en_US` 是 `No data`） |
| classNames | 语义化类名 | `EmptySemanticClassNames \| ((info: { props }) => EmptySemanticClassNames)` | — |
| styles | 语义化样式 | `EmptySemanticStyles \| ((info: { props }) => EmptySemanticStyles)` | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 页脚内容。有内容时渲染 `<prefix>-footer` |

### 静态属性 / 具名导出

| 名称 | 说明 |
|---|---|
| `Empty.PRESENTED_IMAGE_DEFAULT` | 默认插画（184×152） |
| `Empty.PRESENTED_IMAGE_SIMPLE` | 简洁插画（64×41）。传入后根元素会多出 `<prefix>-normal` 类名 |

两者同时提供具名导出：`import { PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui'`。

> ⚠️ `-normal` 的判据是**引用相等**（`image === PRESENTED_IMAGE_SIMPLE`），
> 不是「宽高是不是 64×41」。传一个长得一样的自建组件不会触发。

### 语义化槽位

`classNames` / `styles` 各有四个槽位：`root` / `image` / `description` / `footer`。

合并优先级（低 → 高）：

```
ConfigProvider.empty.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中 **`style` 会覆盖 `styles.root`**（antd 的合并顺序如此，我们逐条对齐）。

### 类型导出

`EmptyProps`、`EmptyRef`、`EmptyConfig`、`EmptySemanticType`、`EmptySemanticAllType`、
`EmptySemanticClassNames`、`EmptySemanticStyles`、`EmptySemanticValue`、`EmptyImage`。

### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null` |

## 设计说明

### `description` 的两条判据

| 判据 | 作用 |
|---|---|
| `description !== undefined` | 决定**取值**：传了就用传入值（包括 `0` 与 `''`），没传才回退到 locale |
| `isRenderable(description)` | 决定**是否渲染**：`false` / `''` / `null` 不渲染描述块 |

所以 `:description="''"` 会取到 `''`（不走 locale），但不渲染任何东西。

### 插画与主题

插画里的颜色输出的是 `var(--apollo-*)`，所以深色/紧凑主题下会自动跟随，
不需要为插画做任何额外处理。

### 样式引入

```ts
import '@apollo-design/theme/dist/tokens.css'; // 主题变量，必须先引
import '@apollo-design/ui/empty/style.css';    // 按需
// 或
import '@apollo-design/ui/style.css';          // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genComponentCss('empty', 'my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。
