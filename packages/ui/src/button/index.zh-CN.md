---
category: 通用
title: Button
subtitle: 按钮
---

按钮用于开始一个即时操作。

## 何时使用

- 需要触发一个动作（提交、确认、删除、跳转）。
- 一个操作区域内**只放一个**主按钮（`type="primary"`），其余用次级按钮。

## 代码演示

见 [`demo/`](./demo)（12 个，覆盖 type / size / loading / disabled / danger / ghost /
block / icon / shape / color-variant / href / semantic）。

| demo | 内容 |
|---|---|
| `basic` | 五种 `type`；最后一颗演示两个中文字自动插空格 |
| `size` | `large` / 默认（`middle`）/ `small` |
| `loading` | 布尔形态与 `{ delay }` 形态 |
| `disabled` | 含 `<a>` 分支（有 `href`）的禁用表达 |
| `danger` | `danger` × 五种 `type` |
| `ghost` | 幽灵按钮（常用在有色背景上） |
| `block` | 撑满父容器宽度 |
| `icon` | `icon` prop / `icon` 插槽 / `iconPlacement` / 仅图标 |
| `shape` | `circle` / `round` / `square` |
| `color-variant` | v6 的 `color` + `variant` 新写法 |
| `href` | 渲染成 `<a>` 的链接按钮 |
| `semantic` | 语义化 `classNames` / `styles` |

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 旧版类型糖，会被解析成 `color` + `variant` | `'default' \| 'primary' \| 'dashed' \| 'link' \| 'text'` | `'default'` |
| color | 语义色或预设色（16 个） | `ButtonColorType` | — |
| variant | 视觉变体 | `'outlined' \| 'dashed' \| 'solid' \| 'filled' \| 'text' \| 'link'` | — |
| icon | 图标（v6 起是**节点**，不是字符串名） | `VNodeChild` | — |
| iconPlacement | 图标位置 | `'start' \| 'end'` | `'start'` |
| ~~iconPosition~~ | ⚠️ 已废弃，请用 `iconPlacement` | `'start' \| 'end'` | — |
| shape | 形状 | `'default' \| 'circle' \| 'round' \| 'square'` | `'default'` |
| size | 尺寸。`middle` **不**产类名 | `'small' \| 'middle' \| 'large'` | 取 ConfigProvider 的 `componentSize` |
| disabled | 禁用。判据是 `??` ⇒ 显式 `false` 能关闭父级的 `true` | `boolean` | — |
| loading | 加载态 | `boolean \| { delay?: number; icon?: VNodeChild }` | `false` |
| ghost | 幽灵按钮。会把 `solid` 变体退化成 `outlined` | `boolean` | `false` |
| danger | 危险按钮 | `boolean` | `false` |
| block | 撑满父容器宽度 | `boolean` | `false` |
| href | 有值 ⇒ 渲染 `<a>` | `string` | — |
| htmlType | `<button>` 的原生 `type` | `'submit' \| 'button' \| 'reset'` | `'button'` |
| autoInsertSpace | 两个中文字之间是否自动插空格 | `boolean` | `true` |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-btn` |
| className | 根元素类名 | `string` | — |
| rootClassName | 也落在根元素上（在 `className` 之后） | `string` | — |
| style | 根元素内联样式。**会覆盖 `styles.root`** | `CSSProperties` | — |
| classNames | 语义化类名（**只支持对象形态**） | `ButtonSemanticClassNames` | — |
| styles | 语义化样式（**只支持对象形态**） | `ButtonSemanticStyles` | — |

### 事件

| 名称 | 说明 | 参数 |
|---|---|---|
| click | 点击。**loading / disabled 时不触发**（且 `preventDefault`） | `(event: MouseEvent)` |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 按钮内容 |
| icon | 图标。`icon` prop 优先于插槽 |

### 语义化槽位

`classNames` / `styles` 各有三个槽位：`root` / `icon` / `content`。

合并优先级（低 → 高）：

```
ConfigProvider.button.classNames/styles
  → 组件的 classNames / styles
  → className / rootClassName / style（落在根元素）
```

其中 **`style` 会覆盖 `styles.root`**（antd 的合并顺序如此，我们逐条对齐）。

⚠️ **不支持函数式变体**（`classNames` / `styles` 只接受对象）—— 依据
`empty-semantic-fn` 开放决策的建议 B，与已完成的 divider / empty / space / spin 一致。

### 类型导出

`ButtonProps`、`ButtonRef`、`ButtonConfig`、`ButtonType`、`ButtonShape`、`ButtonSize`、
`ButtonColorType`、`ButtonVariantType`、`ButtonHTMLType`、`ButtonIconPlacement`、
`ButtonLoading`、`ButtonSemanticType`、`ButtonSemanticClassNames`、`ButtonSemanticStyles`、
`ButtonSlot`。

### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根元素（`<button>` 或 `<a>`）。首次渲染前为 `null` |

### 工具导出

| 名称 | 说明 |
|---|---|
| `genButtonStyle(prefixCls)` | 生成该前缀下的 CSS 文本（自定义 `prefixCls` 时自行产出样式用） |
| `prepareComponentToken(token)` | 组件 Token 的默认值计算（与 antd 的 `prepareComponentToken` 逐键一致，缺 `solidTextColor`）。⚠️ 目前只有深导入 `button/style/token`，未从 `button/index.ts` 再导出 |

## 设计说明

### `type` 与 `color` + `variant`

`type` 是 v5 的旧写法，v6 里被解析成 `color` + `variant`：

| type | color | variant |
|---|---|---|
| `primary` | `primary` | `solid` |
| `default` | `default` | `outlined` |
| `dashed` | `default` | `dashed` |
| `text` | `default` | `text` |
| `link` | `link` | `link` |

⚠️ `color` 与 `variant` **同时给出**时优先级最高，压过 `type` / `danger`。
只给其中一个不生效（会落到兜底 `default` / `outlined`）。
⚠️ `filled` 在 `ButtonTypeMap` 里没有映射 ⇒ 只能由 `variant` 显式传入。

### 类名上的两处不一致（上游真实行为）

- `-dangerous` 用**原始 `danger` prop**
- `-color-{x}` 里 `danger` 被改写成 `dangerous`

所以 `color="danger"` 而不传 `danger` ⇒ 只有 `-color-dangerous`，没有 `-dangerous`。

### `loading` 的两种形态

| 形态 | 行为 |
|---|---|
| `true` | 立刻进入加载态 |
| `{ delay: 1000 }` | **1000ms 后**才进入（防连点），且**不会自动复位** |
| `{ delay: 0 }` / `{}` | 立刻进入（`delay <= 0` 即视为立即） |

变回非加载**只能靠 `loading` prop 自己变回**。

### 两个中文字

`autoInsertSpace` 默认 `true`：内容**恰好**是两个汉字时，会在两字间留出间隙
（并加上 `-two-chinese-chars` 类名）。判据是 `textContent` 匹配 `/^[\u4E00-\u9FA5]{2}$/`。

⚠️ `text` / `link` 变体不插；有图标时不插；`loading` 时不插。
⚠️ 实现形态与 antd 不同（antd 把 `确定` 拼成 `确 定`，我们用 `::first-letter` 的
`letter-spacing`）—— 视觉等价，DOM 文本不同。登记为差异 D7。

### `<a>` 与 `<button>` 的禁用**不对称**

| 分支 | 表现 |
|---|---|
| `<button>` | 原生 `disabled` |
| `<a>`（有 `href`） | 移除 `href` + `tabindex="-1"` + `aria-disabled="true"` + `-disabled` 类名 |

`<a>` 没有原生 `disabled`，只能靠组合表达。

### 无障碍

- icon-only 按钮**必须**自己传 `aria-label` —— 组件不会凭空猜一个。
- `loading` 不产出 `aria-busy` / `aria-live`（上游同样没有），登记为缺口。

### 组件 Token

61 个，与 antd 6.6.4 逐键一致（缺 `solidTextColor`，见 README §7.1）。
⚠️ 目前**不能**在运行时覆盖（`tokens.css` 只声明 Alias 层变量）—— 全库缺口，
临时手段是 `styles.root.*`。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css';    // 主题变量，必须先引
import '@apollo-design/ui/button/style.css'; // 按需
// 或
import '@apollo-design/ui/style.css';        // 汇总
```

自定义 `prefixCls`（如 `my-app`）时用 `genButtonStyle('my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。
