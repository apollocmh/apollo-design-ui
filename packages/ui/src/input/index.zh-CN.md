---
category: 数据录入
title: Input
subtitle: 输入框
---

# Input 输入框

基本的表单输入控件。包含 `Input` / `TextArea` / `Input.Password` / `Input.Group` /
`Input.Search` / `Input.OTP`。

## 代码演示

<code src="./demo/basic.vue">基本</code>
<code src="./demo/size.vue">三种大小</code>
<code src="./demo/presuffix.vue">前缀/后缀</code>
<code src="./demo/allow-clear.vue">可清空</code>
<code src="./demo/show-count.vue">字数统计</code>
<code src="./demo/textarea.vue">文本域</code>
<code src="./demo/password.vue">密码框</code>
<code src="./demo/variant-status.vue">形态与状态</code>
<code src="./demo/search.vue">搜索框</code>
<code src="./demo/otp.vue">验证码</code>

## API · Input

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 受控值（`v-model:value`） | string | - |
| defaultValue | 初始值 | string | - |
| size | 尺寸 | `large` \| `middle` \| `small` | - |
| disabled / readOnly | 禁用 / 只读 | boolean | false |
| variant | 形态变体 | `outlined` \| `filled` \| `borderless` \| `underlined` | `outlined` |
| status | 校验状态 | `error` \| `warning` | - |
| prefix / suffix | 前置 / 后置内容；**支持插槽 `#prefix` / `#suffix`**（插槽优先于 prop） | VNodeChild | - |
| allowClear | 清空按钮（可 `{ clearIcon, disabled }`） | boolean \| object | false |
| showCount | 字数统计（可 `{ formatter }`） | boolean \| object | false |
| count | 计数策略 / 超长裁剪 | object | - |
| maxLength | 原生最大长度 | number | - |
| htmlSize | 原生 `size` | number | - |
| classNames / styles | 语义化（root/prefix/suffix/clear/input/count） | object \| function | - |
| ~~bordered~~ | **Deprecated** 用 `variant` | boolean | true |
| ~~addonBefore / addonAfter~~ | **Deprecated** 用 `Space.Compact` | VNodeChild | - |

### 事件

`change`（`e.target.value` 是**裁剪后的值**）、`press-enter`、`clear`、`focus`、`blur`、
`composition-start` / `composition-end`。

### Ref

`focus(option)`（含 `cursor: 'start' \| 'end' \| 'all'`）、`blur()`、
`setSelectionRange()`、`select()`、`input`、`nativeElement`。

## API · TextArea

在 Input 基础上：无 prefix/addon，增加 `autoSize`（`true` 或 `{ minRows, maxRows }`）、
`rows`、`onResize`；语义槽为 `{root, textarea, clear, count}`。

## API · Input.Password

`action`（`'click' | 'hover'`，默认 `'click'` —— **antd 6.6.4 的顶层 API**）、
`visibilityToggle`（`false` 或 `{ visible, onVisibleChange, tabIndex, action }`；其中
`action` 是本仓扩展，与顶层 `action` 同时给出时**顶层优先**）、
`iconRender(visible)`。

`InputPasswordProps extends InputProps`（`Omit` 掉 `classNames` / `styles` 后按
Password 的语义槽重新声明）⇒ `allowClear` / `readOnly` / `maxLength` / `showCount` /
`status` / `prefix` 等 Input 的公开属性在类型层同样可用。

## API · Input.Search

在 Input 基础上增加：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| enterButton | 搜索按钮：`false` 图标 / `true` 主按钮 / 文本 / 自定义节点 | boolean \| string \| VNodeChild \| Component | false |
| searchIcon | 自定义搜索图标 | VNodeChild \| Component | `<SearchOutlined />` |
| loading | 按钮 loading；同时拦截 Enter 搜索 | boolean | false |
| onSearch | 搜索回调 `(value, event, { source })`；清空触发时 `source='clear'` | function | - |
| inputPrefixCls | 内层 Input 的前缀 | string | - |
| addonAfter | 按钮后追加的节点 | VNodeChild \| Component | - |

语义槽：`{ root, input, prefix, suffix, clear, count, button }`（`button` 支持对象或
`{ root }` 形态）。

## API · Input.OTP

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| length | 格子数量 | number | 6 |
| value / defaultValue | 受控值 / 初始值（`v-model:value`） | string | - |
| onChange | 全部填满且值变化时触发 | `(value: string) => void` | - |
| onInput | 每次格子变化时触发（数组） | `(value: string[]) => void` | - |
| formatter | 对值做格式化（如转大写） | `(value: string) => string` | - |
| separator | 格间分隔符（可传函数 `(index) => VNode`） | VNodeChild \| function | - |
| mask | 掩码（`true` 用 •，或单字符） | boolean \| string | false |
| type / inputMode / autoComplete | 透传给每格原生 input | string | - |
| autoFocus | 聚焦第一格 | boolean | false |
| classNames / styles | 语义槽 `{ root, input, separator }` | object \| function | - |

Ref：`focus()`、`blur()`、`nativeElement`。

## 主题、尺寸与样式

默认字号、非负内边距及聚焦阴影消费当前主题。`theme.components.Input` 支持既有的 19 个字段：`lineWidthFocus`、`paddingBlock/SM/LG`、`paddingInline/SM/LG`、`addonBg`、`activeBorderColor`、`hoverBorderColor`、`activeShadow`、`errorActiveShadow`、`warningActiveShadow`、`hoverBg`、`activeBg`、`inputFontSize/SM/LG`、`inputAffixPadding`。长度字段可用数字（px）或 CSS 长度字符串，`0` 有效；移除配置后恢复当前主题默认值。`inputAffixPadding` 控制前后缀间距。公开 `prepareInputComponentToken` 继续返回指定数值快照的准备结果。

尺寸优先级为组件显式 `size` → 最近的 `Space.Compact` / `Input.Group` → `ConfigProvider.componentSize`。Group 的尺寸向子组件提供默认值，子组件显式尺寸优先。Input 保留自然行盒，不压缩显式字体、行高或 padding：默认主题 small/middle/large 为 24/32/40px，compact 为 22/28/35px；small 的自然下限可高于主题目标 `controlHeightSM`。不同类型控件没有外框高度恒等承诺。Search 默认按钮随输入自然伸展，不注入自有最小高度；调用方的 `height` / `min-height` 按其 CSS 生效。TextArea 继续按 rows、已有最小高度及 autoSize 约束排版；autoSize 在主题、尺寸、控件及祖先 class/style、宽度变化和排版过渡结束后，根据实际量测签名重测。无关样式变化不重复量测，禁用和卸载会清理观察与事件。

组件主题数据先于显式语义样式和原生 `style` 合并。`components.input/textArea/inputPassword` 的 `style` 作用于组件逻辑根；`styles.input` / `styles.textarea` 作用于实际控制节点。Search、OTP 的原生根样式作用于容器，格子或输入节点请使用 `styles.input`。既有 stylesheet 的 `--apollo-input-*` 覆盖继续有效；theme 中显式组件字段以逻辑根内联变量提供。

显式空的 `ThemeProvider :theme="{}"`（或 `createThemeContext({})`）仍是默认主题来源，可在外部 CSS 主题作用域内重置默认值。没有有效主题来源时，Input 保留 CSS-only 变量继承；无 theme 的 ConfigProvider 继续读取最近有效来源，不凭空覆盖 CSS 作用域。

## 注意事项

- 输入法组合期间不做计数裁剪，`compositionend` 后才统一裁剪并触发一次 `change`。
- 清空按钮的 `change` 事件里 `target.value` 固定为空串。
- `Input.Group` 已废弃，请用 `Space.Compact`。
