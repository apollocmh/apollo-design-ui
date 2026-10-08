---
title: Button 按钮
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

按钮用于开始一个即时操作。

## 何时使用

- 需要触发一个动作（提交、确认、删除、跳转）。
- 一个操作区域内**只放一个**主按钮（`type="primary"`），其余用次级按钮。

:::

## 代码演示

::: v-pre

**basic**：`type` 是 v5 及更早版本的「糖」写法，v6 里会被解析成 `color` + `variant`：
| type | color | variant |
|---|---|---|
| `primary` | `primary` | `solid` |
| `default` | `default` | `outlined` |
| `dashed` | `default` | `dashed` |
| `text` | `default` | `text` |
| `link` | `link` | `link` |
最后一颗按钮演示「两个中文字符自动插空格」：`autoInsertSpace` 默认为 `true`。

:::

<DemoPreview component="button" demo="basic" />

::: v-pre

**block**：`block` 让按钮撑满父容器宽度（`-block` 类名 → `width: 100%`）。

:::

<DemoPreview component="button" demo="block" />

::: v-pre

**color-variant**：`color` + `variant` 是 v6 的新写法，**同时给出时优先级最高**（压过 `type` / `danger`）。
- `color`：16 个预设语义色（含 `default` / `primary` / `danger` + 13 个色板色）
- `variant`：`outlined` / `dashed` / `solid` / `filled` / `text` / `link`
⚠️ `filled` 在 `ButtonTypeMap` 里**没有**映射 ⇒ 只能由 `variant` 显式传入。

:::

<DemoPreview component="button" demo="color-variant" />

::: v-pre

**danger**：`danger` 会把解析出的 `color` 换成 `danger`。
⚠️ 类名上有**两处不一致**（上游真实行为）：
- `-dangerous` 用的是**原始 `danger` prop**
- `-color-dangerous` 里 danger 被改写成 `dangerous`（不是 `-color-danger`）

:::

<DemoPreview component="button" demo="danger" />

::: v-pre

**disabled**：⚠️ 两个分支的 disabled 表达**不对称**，这是上游真实行为（不是笔误）：
| 分支 | 表现 |
|---|---|
| `<button>`（无 `href`） | 原生 `disabled` 属性 |
| `<a>`（有 `href`） | 移除 `href` + `tabindex="-1"` + `aria-disabled` |

:::

<DemoPreview component="button" demo="disabled" />

::: v-pre

**ghost**：幽灵按钮把背景变透明，常用在有色背景上。
⚠️ `ghost` 对 `solid` 变体的处理是**退化成 `outlined`**（不是加个类了事）。
⚠️ 属性顺序有讲究：`ghost` 必须写在 `danger` **之后**才不会被 `danger` 的样式压过。

:::

<DemoPreview component="button" demo="ghost" />

::: v-pre

**href**：传了 `href` 就渲染 `<a>` 而不是 `<button>`。此时 `htmlType` 无效、没有原生 `disabled`，
禁用靠「移除 `href` + `tabindex="-1"` + `aria-disabled`」。

:::

<DemoPreview component="button" demo="href" />

::: v-pre

**icon**：`icon` 在 v6 里是**节点**，不是 v4 的字符串名（传字符串且长度 > 2 会输出告警）。
也可以传**组件** —— Vue 没有 React 的「元素」形态，对应物就是组件本身（差异 D42）。
- `icon` prop 与 `icon` 插槽都能传图标，**prop 优先**（`props.icon ?? slots.icon()`）。
- `iconPlacement="end"` 把图标放到文字后面（靠 `-icon-end` 类名用 CSS 翻转，
  **不是**调换 DOM 顺序）。
- 没有默认插槽且有图标时加 `-icon-only` 类名。
- `loading` 时图标换成加载图标（`loading.icon` > ConfigProvider 的 `loadingIcon` > 内置 `LoadingOutlined`）。
  容器上额外带 `-loading-icon` 类名 —— ⚠️ **只在前两支都没提供自定义图标时才带**；
  一旦有自定义加载图标（prop 或 ConfigProvider），该类名**不出现**。
- 插槽仍只接受 `() => VNodeChild`；组件要走 prop。

:::

<DemoPreview component="button" demo="icon" />

::: v-pre

**loading**：`loading` 有两种形态：
- 布尔：`true` 立刻进入加载态。
- 对象：`{ delay, icon }`。`delay > 0` 时**延迟到点才置为加载态**，用于防止连点；
  变回 `false` **只能靠 `loading` prop 自己变回**，不会自动复位。
加载中时点击被拦截（`preventDefault` 且不 emit `click`）。

:::

<DemoPreview component="button" demo="loading" />

::: v-pre

**semantic**：`classNames` / `styles` 各有三个槽位：`root` / `icon` / `content`。
合并优先级（低 → 高）：

:::

<DemoPreview component="button" demo="semantic" />

::: v-pre

**shape**：`shape` 取 `default` 与 `square` 时**不**产出 `-{shape}` 类名，其余（`circle` / `round`）产出。

:::

<DemoPreview component="button" demo="shape" />

::: v-pre

**size**：`size` 的默认值是 `middle`，此时**不**输出 `-lg` / `-sm` 类名。

:::

<DemoPreview component="button" demo="size" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 旧版类型糖，会被解析成 `color` + `variant` | `'default' \| 'primary' \| 'dashed' \| 'link' \| 'text'` | `'default'` |
| color | 语义色或预设色（16 个） | `ButtonColorType` | — |
| variant | 视觉变体 | `'outlined' \| 'dashed' \| 'solid' \| 'filled' \| 'text' \| 'link'` | — |
| icon | 图标（v6 起是**节点**，不是字符串名）。也可传**组件**（见下方说明） | `ButtonIcon` = `VNodeChild \| Component` | — |
| iconPlacement | 图标位置 | `'start' \| 'end'` | `'start'` |
| ~~iconPosition~~ | ⚠️ 已废弃，请用 `iconPlacement` | `'start' \| 'end'` | — |
| shape | 形状 | `'default' \| 'circle' \| 'round' \| 'square'` | `'default'` |
| size | 尺寸。`middle` **不**产类名 | `'small' \| 'middle' \| 'large'` | 取 ConfigProvider 的 `componentSize` |
| disabled | 禁用。判据是 `??` ⇒ 显式 `false` 能关闭父级的 `true` | `boolean` | — |
| loading | 加载态 | `boolean \| { delay?: number; icon?: ButtonIcon }` | `false` |
| ghost | 幽灵按钮。会把 `solid` 变体退化成 `outlined` | `boolean` | `false` |
| danger | 危险按钮 | `boolean` | `false` |
| block | 撑满父容器宽度 | `boolean` | `false` |
| href | 有值 ⇒ 渲染 `<a>` | `string` | — |
| htmlType | `<button>` 的原生 `type` | `'submit' \| 'button' \| 'reset'` | `'button'` |
| autoInsertSpace | 两个中文字之间是否自动插空格 | `boolean` | `true` |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-btn` |
| classNames | 语义化类名（**只支持对象形态**） | `ButtonSemanticClassNames` | — |
| styles | 语义化样式（**只支持对象形态**） | `ButtonSemanticStyles` | — |

### 根节点原生属性

根节点会根据 `href` 渲染为 `<button>` 或 `<a>`。Vue 原生 `class`、`style` 和其它 `$attrs` 会透传到这个根节点；`class` 支持字符串、数组、对象，`style` 调用值优先于 `styles.root`。它们不是 Button 专属 Props，因此不声明 `className` / `rootClassName` / `style`。

```vue
<Button class="save-button" :style="{ color: 'rebeccapurple' }">保存</Button>
```

### 事件

| 名称 | 说明 | 参数 |
|---|---|---|
| click | 点击。**loading / disabled 时不触发**（且 `preventDefault`） | `(event: MouseEvent)` |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 按钮内容 |
| icon | 图标。`icon` prop 优先于插槽 |

> **关于 `icon` 传组件**（平台差异，与 `Empty` 的 `image` 同一裁决）
>
> antd 的 `icon` 是 `React.ReactNode`，官方示例写 `icon={<SearchOutlined />}` ——
> 在 React 里那是**已求值的元素**。Vue 没有「元素」这一形态，对应物是**组件本身**，
> 所以这里额外接受 `Component`：
>
> ```vue
> <!-- ✅ 与 antd 示例等价的写法 -->
> <Button type="primary" :icon="SearchOutlined">Search</Button>
> <!-- ✅ VNode 形态同样支持（两者渲染结果一致） -->
> <Button type="primary" :icon="h(SearchOutlined)">Search</Button>
> ```
>
> ⚠️ 插槽仍只接受 `() => VNodeChild`，组件请走 prop：
> `<template #icon><SearchOutlined /></template>`。

### 语义化槽位

`classNames` / `styles` 各有三个槽位：`root` / `icon` / `content`。

合并优先级（低 → 高）：

```
ConfigProvider.button.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中调用处原生 **`:style` 会覆盖 `styles.root`**（保持合并优先级；该值走 Vue `$attrs`，不是 `ButtonProps.style`）。

⚠️ **不支持函数式变体**（`classNames` / `styles` 只接受对象）—— 依据
`empty-semantic-fn` 开放决策的建议 B，与已完成的 divider / empty / space / spin 一致。

### 类型导出

`ButtonProps`、`ButtonRef`、`ButtonConfig`、`ButtonType`、`ButtonShape`、`ButtonSize`、
`ButtonColorType`、`ButtonVariantType`、`ButtonHTMLType`、`ButtonIcon`、
`ButtonIconPlacement`、`ButtonLoading`、`ButtonSemanticType`、`ButtonSemanticClassNames`、
`ButtonSemanticStyles`、`ButtonSlot`。

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

57 个（antd 6.6.4 返回 58 个，唯一缺 `solidTextColor`，见 README §7.1）。
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

:::
