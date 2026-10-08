---
category: 数据录入
title: Input 输入框
---

# Input 输入框

基本的表单输入控件。本轮范围：`Input` / `TextArea` / `Input.Password` / `Input.Group`；
`Input.Search` 与 `Input.OTP` 顺延。

## 代码演示

<code src="./demo/basic.vue">基本</code>
<code src="./demo/size.vue">三种大小</code>
<code src="./demo/presuffix.vue">前缀/后缀</code>
<code src="./demo/allow-clear.vue">可清空</code>
<code src="./demo/show-count.vue">字数统计</code>
<code src="./demo/textarea.vue">文本域</code>
<code src="./demo/password.vue">密码框</code>
<code src="./demo/variant-status.vue">形态与状态</code>

## API · Input

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 受控值（`v-model:value`） | string | - |
| defaultValue | 初始值 | string | - |
| size | 尺寸 | `large` \| `middle` \| `small` | - |
| disabled / readOnly | 禁用 / 只读 | boolean | false |
| variant | 形态变体 | `outlined` \| `filled` \| `borderless` \| `underlined` | `outlined` |
| status | 校验状态 | `error` \| `warning` | - |
| prefix / suffix | 前置 / 后置内容 | VNodeChild | - |
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

`visibilityToggle`（`false` 或 `{ visible, onVisibleChange, tabIndex, action }`）、
`iconRender(visible)`；其余透传 Input。

## 注意事项

- 输入法组合期间不做计数裁剪，`compositionend` 后才统一裁剪并触发一次 `change`。
- 清空按钮的 `change` 事件里 `target.value` 固定为空串。
- `Input.Group` 已废弃，请用 `Space.Compact`。
