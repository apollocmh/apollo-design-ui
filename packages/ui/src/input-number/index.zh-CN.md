---
category: Components
group: 数据录入
title: InputNumber 数字输入框
---

# InputNumber 数字输入框

通过鼠标或键盘，输入范围内的数值。

## 代码演示

<code src="./demo/basic.vue">基本</code>
<code src="./demo/size.vue">三种大小</code>
<code src="./demo/disabled.vue">不可用</code>
<code src="./demo/digit.vue">高精度小数</code>
<code src="./demo/formatter.vue">格式化展示</code>
<code src="./demo/keyboard.vue">键盘行为</code>
<code src="./demo/variant.vue">形态变体</code>
<code src="./demo/spinner.vue">拨轮</code>
<code src="./demo/out-of-range.vue">超出边界</code>
<code src="./demo/presuffix.vue">前缀/后缀</code>
<code src="./demo/status.vue">自定义状态</code>
<code src="./demo/style-class.vue">自定义语义结构的样式和类</code>

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前值（`v-model:value`） | number \| string | - |
| defaultValue | 初始值 | number \| string | - |
| min | 最小值 | number \| string | - |
| max | 最大值 | number \| string | - |
| step | 每次改变步数，可以为小数 | number \| string | `1` |
| precision | 数值精度，配置 `formatter` 时会以 `formatter` 为准 | number | - |
| formatter | 指定输入框展示值的格式 | function(value, info: { userTyping, input }): string | - |
| parser | 指定从 `formatter` 里转换回数字的方式 | function(string): string | - |
| disabled | 禁用 | boolean | `false` |
| readOnly | 只读 | boolean | `false` |
| keyboard | 是否启用键盘快捷行为 | boolean | `true` |
| controls | 是否显示增减按钮，也可设置自定义箭头图标 | boolean \| { upIcon, downIcon } | `true` |
| mode | 展示输入框或拨轮 | `'input'` \| `'spinner'` | `'input'` |
| stringMode | 字符值模式，开启后支持高精度小数 | boolean | `false` |
| changeOnBlur | 失焦时是否触发 `change`（把超界值回正） | boolean | `true` |
| changeOnWheel | 聚焦时允许滚轮步进 | boolean | `false` |
| decimalSeparator | 小数点 | string | - |
| placeholder | 占位符 | string | - |
| prefix | 前缀 | VNodeChild | - |
| suffix | 后缀 | VNodeChild | - |
| size | 输入框大小 | `large` \| `medium` \| `small` | - |
| status | 设置校验状态 | `'error'` \| `'warning'` | - |
| variant | 形态变体 | `outlined` \| `borderless` \| `filled` \| `underlined` | `outlined` |
| autoFocus | 自动聚焦 | boolean | `false` |
| classNames | 语义化 class（root/prefix/suffix/input/actions，支持函数） | - | - |
| styles | 语义化 style（同上，支持函数） | - | - |
| ~~bordered~~ | **Deprecated** 使用 `variant` 替代 | boolean | `true` |
| ~~addonBefore~~ | **Deprecated** 使用 `Space.Compact` 替代 | VNodeChild | - |
| ~~addonAfter~~ | **Deprecated** 使用 `Space.Compact` 替代 | VNodeChild | - |

### 事件

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 变化回调（`v-model:value` 同步发出） | function(value: number \| string \| null) |
| press-enter | 按下回车的回调 | function(e: KeyboardEvent) |
| step | 点击上下箭头、键盘、滚轮的回调 | function(value: number, info: { offset, type: 'up' \| 'down', emitter: 'handler' \| 'keyboard' \| 'wheel' }) |

### Ref

| 名称 | 说明 |
| --- | --- |
| focus(option) | 获取焦点；`option.cursor` 为 `'start'` \| `'end'` \| `'all'` |
| blur() | 移除焦点 |
| nativeElement | 根 DOM 元素 |

## 注意事项

- 受控模式下 `value` 可以超出 `min` / `max`（以错误样式展示，不回弹）；用户交互产生的值会被钳制回范围内。
- 键入过程中不做 precision 格式化与范围钳制，失焦或回车时统一回正（上游双状态机语义）。
- `parser` 未提供时，中文句号 `。` 会被自动替换为小数点。
