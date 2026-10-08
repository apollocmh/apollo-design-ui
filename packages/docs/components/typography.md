---
title: Typography 排版
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

文本的基本格式。

## 何时使用

- 当需要展示标题、段落、列表内容时使用。
- 当需要展示带语义色（次要 / 成功 / 警告 / 危险）、禁用态、装饰（加粗 / 下划线 / 删除线 /
  行内代码 / 标记 / 键盘按键 / 斜体）的文本时使用。
- 当需要对长文本做**省略**（单行 / 多行 / 可展开）、**复制**、**行内编辑**时使用。

:::

## 代码演示

::: v-pre

**basic**：`Title` / `Paragraph` / `Text` / `Link` 四件套是最常见的排版组合。

:::

<DemoPreview component="typography" demo="basic" />

::: v-pre

**copyable**：`copyable.text` 决定**写进剪贴板**的内容，与显示内容可以不同；它也可以是返回
`Promise<string>` 的函数（异步取文本）。
`tooltips` 与 `icon` 都支持 `[未复制, 已复制]` 二元组。传 `false` 表示**显式不渲染**
（`undefined` 才是「用默认」—— 两者语义不同）。

:::

<DemoPreview component="typography" demo="copyable" />

::: v-pre

**editable**：`triggerType` 决定进入编辑态的方式：`['icon']`（默认，点铅笔图标）、`['text']`（点文字）。
编辑态的三条行为契约：
1. **Enter 保存、Esc 取消、失焦保存**；
2. **保存的值会 `trim()`**（`onChange` 收到的已是去掉首尾空格的值）；
3. **输入法组合中、或带修饰键（`Ctrl`/`Alt`/`Meta`/`Shift`）的 Enter 不触发保存** ——
   否则中文选词与 `Ctrl+Enter` 会误提交。
⚠️ 本阶段编辑态用**原生 `<textarea>`** 承载（antd 用的是 `Input.TextArea`，Input 组件尚未落地）。
DOM 与视觉都与 antd **不一致**，差异登记为 D-typography-2，见 `README.md` §7。

:::

<DemoPreview component="typography" demo="editable" />

::: v-pre

**ellipsis**：`rows` 控制行数：`1` 走 `text-overflow`，`>1` 走 `-webkit-line-clamp`。
一旦传了 `expandable` / `suffix` / `onEllipsis`，或同时开了 `copyable` / `editable`，
CSS 省略号就**做不到**（省略号后面还要放东西），组件会改用 **JS 二分裁剪**。
⚠️ JS 裁剪依赖**真实布局测量**（`ResizeObserver` + `scrollHeight`/`clientHeight`）。
jsdom 没有布局引擎，所以 L1/L2 通过打桩尺寸驱动状态机，真实排版结果由 L6 覆盖 ——
见 `README.md` §7。

:::

<DemoPreview component="typography" demo="ellipsis" />

::: v-pre

**semantic**：四个语义槽位：`root`（根元素）、`actions`（操作区 `span`）、`action`（每个操作按钮）、
`textarea`（**仅编辑态**的输入框）。
`classNames` 是**拼接**，`styles` 是**覆盖**（后者与 `style` prop 的优先级见
`README.md` 的 API 表）。函数式形态收到 `{ props }`，其中的 `prefixCls` / `direction`
是**解析后**的值。

:::

<DemoPreview component="typography" demo="semantic" />

::: v-pre

**text**：`type` 是语义色（`secondary` / `success` / `warning` / `danger`），`disabled` 是禁用态。
七个装饰开关（`code` / `mark` / `underline` / `delete` / `strong` / `keyboard` / `italic`）
的**嵌套顺序是契约**：由内到外依次是 `strong → u → del → code → mark → kbd → i`。

:::

<DemoPreview component="typography" demo="text" />

::: v-pre

**title**：`level` 取 `1`~`5`，分别渲染 `h1`~`h5`。默认值是 `1`。
⚠️ 非法 `level`（例如 `6`）会**退回 `h1` 并告警** —— 这是 antd 的既定行为，
而不是「渲染成 `h6`」。

:::

<DemoPreview component="typography" demo="title" />

::: v-pre

## API

### 组件

```ts
import { Typography } from '@apollo-design/ui';

const { Text, Title, Paragraph, Link } = Typography;   // 与 antd 同形
```

`Typography.Text` 与具名导出 `Text` 指向**同一个对象**。

⚠️ `Typography` 本体**不支持** `type` / `disabled` / `ellipsis` / `copyable` / `editable`
与七个装饰 —— 传了它们只会作为未知属性落到根元素上，**不产生类名**（antd 亦如此）。

### 公共 Props（5 个组件都有）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo` |
| class / style | **根元素原生 attrs**（不是 Props）；`style` 覆盖 `styles.root` | `string \| array \| object` / `CSSProperties` | — |
| classNames | 语义化类名（对象或函数） | `TypographySemanticValue<TypographySemanticClassNames>` | — |
| styles | 语义化样式（对象或函数） | `TypographySemanticValue<TypographySemanticStyles>` | — |
| direction | 文字方向 | `'ltr' \| 'rtl'` | 从 ConfigProvider 取 |
| component | 渲染的标签（`@internal`） | `string` | 各组件自己的默认值 |

### 子组件专有 Props（`Text` / `Title` / `Paragraph` / `Link`）

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 语义色 | `'secondary' \| 'success' \| 'warning' \| 'danger'` | — |
| disabled | 禁用态。⚠️ 只加类名，**不**加 `aria-disabled`（与 antd 一致） | `boolean` | `false` |
| ellipsis | 省略能力。`Text` / `Link` 的类型更窄（见下） | `boolean \| EllipsisConfig` | — |
| copyable | 复制能力 | `boolean \| CopyConfig` | — |
| editable | 编辑能力 | `boolean \| EditConfig` | — |
| strong / underline / delete / code / mark / keyboard / italic | 七个装饰开关 | `boolean` | `false` |
| actions | 操作区位置（自 6.4.0） | `{ placement?: 'start' \| 'end' }` | `'end'` |
| title | 原生 `title`。也是省略号悬浮提示的**候选文案** | `string` | — |
| level | **仅 `Title`**：标题级别，映射到 `h1`~`h5` | `1 \| 2 \| 3 \| 4 \| 5` | `1` |
| rel / target | **仅 `Link`** | `string` | — |

⚠️ `Title` 的 `strong` 被 `Omit` 掉（标题本身就是加粗的）；`Text` 的 `ellipsis` 不支持
`expandable` / `rows` / `onExpand`（行内文本没有多行概念）；`Link` 的 `ellipsis` **仅布尔**。
这三条在类型面表达，且运行时传了会告警。

### `ellipsis` 配置

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| rows | 显示的行数 | `number` | `1` |
| expandable | 是否可展开。`'collapsible'` 时展开后仍可收起 | `boolean \| 'collapsible'` | `false` |
| suffix | 省略号之后的追加文本 | `string` | — |
| symbol | 展开/收起按钮的内容（函数式收到 `expanded`） | `VNodeChild \| ((expanded: boolean) => VNodeChild)` | — |
| defaultExpanded | 非受控的初始展开态 | `boolean` | `false` |
| expanded | 受控的展开态 | `boolean` | — |
| onExpand | 展开/收起时触发 | `(e, { expanded }) => void` | — |
| onEllipsis | 省略状态**变化**时触发（同一结果重测不重复上报） | `(ellipsis: boolean) => void` | — |
| tooltip | 省略时的悬浮提示。`true` 表示用 `editable.text ?? children` | `VNodeChild \| { title?: VNodeChild }` | — |

### `copyable` / `editable` 配置

| `copyable` | 说明 | 类型 | 默认值 |
|---|---|---|---|
| text | 复制的文本。函数形式支持异步（返回 `Promise<string>`） | `string \| (() => string \| Promise<string>)` | children |
| onCopy | 复制完成后的回调 | `(event?) => void` | — |
| icon | 图标。数组形式是 `[未复制, 已复制]` | `VNodeChild \| [VNodeChild, VNodeChild]` | — |
| tooltips | 悬浮提示。数组形式是 `[未复制, 已复制]`。`false` 表示不提示 | `VNodeChild \| [VNodeChild, VNodeChild]` | — |
| format | 剪贴板格式 | `'text/plain' \| 'text/html'` | — |
| tabIndex | 按钮的 tabIndex | `number` | — |

| `editable` | 说明 | 类型 | 默认值 |
|---|---|---|---|
| text | 编辑初值。不传时取 children（仅当它是字符串） | `string` | — |
| editing | 受控的编辑态 | `boolean` | — |
| icon | 编辑图标 | `VNodeChild` | 铅笔图标 |
| tooltip | 编辑图标的悬浮提示。`false` 表示不提示 | `VNodeChild \| false` | — |
| onStart / onChange / onCancel / onEnd | 进入编辑态 / 保存 / 取消 / Enter 保存后触发 | `() => void` / `(value: string) => void` / … | — |
| maxLength | 输入框最大长度 | `number` | — |
| autoSize | 输入框自动撑高 | `boolean \| AutoSizeType` | `true` |
| triggerType | 触发编辑的方式 | `('icon' \| 'text')[]` | `['icon']` |
| enterIcon | 确认图标。传 `null` 时不渲染 | `VNodeChild` | — |
| tabIndex | 编辑图标的 tabIndex | `number` | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 文本内容。⚠️ 它同时是 `copyable` / `editable` / `ellipsis` 的文案来源 |

### 语义化槽位

`classNames` / `styles` 各有四个槽位：`root`（根元素）/ `actions`（操作区 `span`）/
`action`（每个操作按钮）/ `textarea`（**仅编辑态**的输入框）。

`classNames` 是**拼接**，`styles` 是**覆盖**，且 `style` prop 排在 `styles.root` **之后**
（所以 `style` 覆盖 `styles.root`）。

### Ref

| 名称 | 类型 | 说明 |
|---|---|---|
| nativeElement | `HTMLElement \| null` | 根元素。首次渲染前是 `null`（antd 的类型没体现这一点） |

## 设计说明

### 装饰的嵌套顺序是契约

七个装饰由内到外依次是：

```
strong → u → del → code → mark → kbd → i
```

顺序反了**屏幕上看不出差别**，但它决定了 `mark` 里的 `code` 到底有没有底色。
唯一的观察点是 L4 的逐节点比对（交换任意两行立刻报 `标签不同`）。

### `-link` 的判据是 `component === 'a'`

不是「有没有 `type`」。所以 `<Link type="danger">` 同时有 `-danger` 与 `-link`；
而 `<Text component="a">` 仍然是 `span`（`Text` 显式覆盖 `component`）⇒ **没有** `-link`。

### 省略号的两条路径

| 条件 | 走哪条 | 省略号长什么样 |
|---|---|---|
| `rows` 且**没有** `suffix` / `expandable` / `onEllipsis` / `copyable` / `editable` | CSS（`text-overflow` 或 `-webkit-line-clamp`） | 浏览器画的 |
| 上面任一存在 | **JS 二分裁剪**（隐藏容器逐字测量） | 组件插入的 `<span aria-hidden>` |

⚠️ 走 JS 路径时，根元素会挂 `aria-label`（**完整**文本），可见内容被一层
`aria-hidden` 包住 —— 屏幕阅读器读完整文本，而不是被截断的那段。
走 CSS 路径时**没有** `aria-label`（可访问名由浏览器按截断后的文本决定，上游行为）。

### `editable` 的三道按键门槛

少任何一条，中文用户或 `Ctrl+Enter` 用户都会误提交：

1. `confirmChange` 会 **`trim()`**，而 `onChange` 不会（上游的既定行为）。
2. **IME 组合中不提交**。
3. **带修饰键的 Enter 不提交**（`Ctrl+Enter` 是换行意图）。

另外「退出编辑态后焦点还给编辑图标」是**必须**的 —— 少了它，键盘用户退出编辑后
焦点会掉回 `body`。

### 组件 Token

| Token | 默认值 | 说明 |
|---|---|---|
| `titleMarginTop` | `'1.2em'` | 标题上间距 |
| `titleMarginBottom` | `'0.5em'` | 标题下间距 |

⚠️ **缺口**：antd 可以通过 `theme.components.Typography` 覆盖这两个 Token；本仓库目前
**两个都覆盖不了** —— 它们都是**字面量** Token，在零运行时管线里被内联成常量、没有对应的
CSS 变量，因为 `packages/theme` 的 `tokens.css` 只声明 Alias 层变量。
这是全库的管线缺口（divider / spin 同源），详见 [`README.md`](./README.md) §5.5 与 §7.3。

等价的临时手段：用 `styles.root` 覆盖 margin 的效果。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css';      // 主题变量，必须先引
import '@apollo-design/ui/style.css';          // 汇总样式（含 typography）
```

⚠️ **按组件引入目前只有 `@apollo-design/ui/empty/style.css` 在 `exports` 里注册过**。
`@apollo-design/ui/typography/style.css` 会抛 `ERR_PACKAGE_PATH_NOT_EXPORTED`
（实测）—— 构建产物 `dist/typography/style.css` 存在，但 `packages/ui/package.json`
的 `exports` 没登记这个子路径。`divider` / `spin` 同样如此，是全库一致的缺口；
本组件的文件域不含 `packages/ui/package.json`，留给该文件的 owner 补齐。

自定义 `prefixCls`（如 `my-app`）时**没有**公开的产出入口：包根导出的是
`genComponentStyleSheet('typography')`（按**组件名**取，内部用固定的
`apollo` / `ant` 两套前缀）。`genTypographyStyle(prefixCls)` 存在于
`packages/ui/src/typography/style/index.ts`，但**未**从包根再导出 —— 想用自定义前缀
需要直接引源码路径。这是一条已知的 API 面缺口，登记在
[`README.md`](./README.md) §7.3。

## 已知缺口

1. **悬浮提示**（`copyable.tooltips` / `ellipsis.tooltip` / `editable.tooltip` 的气泡）
   不可见 —— `Tooltip` 组件尚未落地。未展开时 DOM 与 antd 逐字一致，缺的是悬浮后那一半。
2. **`editable` 的 `autoSize` 不生效**、输入框上没有 `apollo-input*` 类名 ——
   用的是原生 `<textarea>`（`Input` 组件尚未落地）。
3. **`ellipsis.tooltip` 的类型**只声明了 `title`（`Tooltip` 落地后补全）。
4. **图标基础样式未接线** —— `@apollo-design/icons` 的 `getIconStyle` 导出了但没有消费者，
   导致复制 / 编辑 / 展开按钮里的图标与 antd 有**亚像素级**差异。
   这是 L6 视觉回归里 `copyable` 三组未达 `exact` 的根因，登记在
   [`README.md`](./README.md) §7.3（G7）。
5. 其余缺口（`h1~h6`/`p` 的 margin reset、表单控件字体 reset、dark/compact 未做视觉比对等）
   逐条登记在 [`README.md`](./README.md) §7.3。

:::
