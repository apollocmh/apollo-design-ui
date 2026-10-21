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

## 注意事项

- 输入法组合期间不做计数裁剪，`compositionend` 后才统一裁剪并触发一次 `change`。
- 清空按钮的 `change` 事件里 `target.value` 固定为空串。
- `Input.Group` 已废弃，请用 `Space.Compact`。
