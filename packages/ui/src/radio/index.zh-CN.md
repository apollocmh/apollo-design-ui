---
category: 数据录入
title: Radio
subtitle: 单选框
---

在一组备选项中进行单选。

## 何时使用

- 用于在多个备选项中**选中单个**。
- 与 `Radio.Group` 搭配使用时，选中项由 `value` / `defaultValue` 统一管理。
- 需要按钮外观时用 `optionType="button"` 或 `Radio.Button`。

## 代码演示

见 [`demo/`](./demo)（14 个，与 antd 非 debug demo 一一对应）。

## API

### Radio

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 指定当前是否选中（受控） | `boolean` | — |
| defaultChecked | 初始是否选中 | `boolean` | `false` |
| value | 组内与 `Radio.Group` 的 `value` **相等比较**；组外只是原生 input 的 value | `string \| number \| boolean` | — |
| disabled | 失效状态（`props ?? group.disabled ?? DisabledContext`） | `boolean` | — |
| skipGroup | 脱离 Group 的管理 | `boolean` | `false` |
| title | 提示文案（落 **label**） | `string` | — |
| name / id / tabIndex / required / autoFocus | 原生属性（落到 `<input>`） | — | — |
| optionType | ⚠️ 只在 `Radio.Group` 内有效；直接传给 `Radio` 会发 usage 告警 | `'default' \| 'button'` | — |
| onChange | 变化时回调 | `(e: RadioChangeEvent) => void` | — |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur / onKeyDown / onKeyPress | 透传（onClick 有冒泡锁） | — | — |
| classNames / styles | 语义槽 `{ root, icon, label }`（对象或函数） | — | — |

### RadioChangeEvent

`{ target: { ...props, type: 'radio', checked }, stopPropagation, preventDefault, nativeEvent }`

### Radio.Group

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| options | 指定可选项（字符串/数字 ⇒ `{label, value}`） | `(string \| number \| RadioOptionItem)[]` | `[]` |
| value / defaultValue | 指定选中项（受控 / 非受控，**标量**） | `string \| number \| boolean` | — |
| onChange | 选中项**变化**时的回调（点已选中的项不触发） | `(e: RadioChangeEvent) => void` | — |
| disabled | 整组失效（option 的 `disabled` 优先） | `boolean` | — |
| name | 组内全部 input 的 name；不传则自动生成一个整组一致的值 | `string` | 自动 |
| optionType | 子项的形态：`default` 圆点 / `button` 按钮 | `'default' \| 'button'` | `'default'` |
| buttonStyle | 按钮形态的填充风格 | `'outline' \| 'solid'` | `'outline'` |
| size | 按钮形态的尺寸 | `'large' \| 'middle' \| 'small'` | — |
| vertical | 竖向排列（`orientation` 优先） | `boolean` | `false` |
| orientation | 排列方向（优先于 `vertical`） | `'horizontal' \| 'vertical'` | — |
| block | 撑满父容器宽度 | `boolean` | `false` |
| role | 根元素 role | `string` | `'radiogroup'` |
| id | 根元素 id | `string` | — | — |
| class / style | **根元素原生 attrs**（不是 Props） | — | — |
| onMouseEnter / onMouseLeave / onFocus / onBlur | 根元素事件 | — | — |

### Radio.Button

`Radio.Button` = `RadioButton`：只多提供 `optionType='button'` 上下文，**不产自己的 DOM**。
props 与 `Radio` 完全一致。

### 插槽

| 名称 | 说明 |
|---|---|
| default | Radio 文本（isRenderable 判据：`0` 渲染、`false`/`''` 不渲染） |
| Group default | 自定义子 Radio（与 options 二选一；options 非空时优先） |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| update:checked | `v-model:checked` 通道（与 `onChange` 同时发出） | `boolean` |
| update:value | Group 的 `v-model:value` 通道（与 `onChange` 同时发出） | `string \| number \| boolean` |

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLElement \| null` |
| input | `HTMLInputElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

Group 的 ref 是 `HTMLDivElement`。`Radio.Button` 的 ref 转发到内部 `Radio`。

## Theme（Component Token）

16 个，与 antd 的 `ComponentToken` 逐字段对齐（CSS 变量形态 `--apollo-radio-*`）。

| Token | 说明 | 默认值 |
|---|---|---|
| radioSize | 单选框尺寸 | `16`（unitless） |
| dotSize | 内点尺寸 | `6`（unitless） |
| dotColorDisabled | 禁用内点颜色 | `colorTextDisabled` |
| buttonSolidCheckedColor | solid 按钮选中文字色 | `colorTextLightSolid` |
| buttonSolidCheckedBg | solid 按钮选中背景 | `colorPrimary` |
| buttonSolidCheckedHoverBg | solid 按钮选中 hover 背景 | `colorPrimaryHover` |
| buttonSolidCheckedActiveBg | solid 按钮选中 active 背景 | `colorPrimaryActive` |
| buttonBg | 按钮背景 | `colorBgContainer` |
| buttonCheckedBg | 按钮选中背景 | `colorBgContainer` |
| buttonColor | 按钮文字色 | `colorText` |
| buttonCheckedBgDisabled | 按钮选中禁用背景 | `controlItemBgActiveDisabled` |
| buttonCheckedColorDisabled | 按钮选中禁用文字色 | `colorTextDisabled` |
| buttonPaddingInline | 按钮水平内边距 | `padding - lineWidth` |
| wrapperMarginInlineEnd | wrapper 的 inline-end 外边距 | `marginXS` |
| radioColor | 内点颜色（wireframe 分支） | `colorWhite` |
| radioBgColor | 选中背景（wireframe 分支） | `colorPrimary` |

> ⚠️ `radioSize` / `dotSize` 是 **unitless** 常量，不随主题缩放；其余 14 个走
> `var(--apollo-*)` 别名派生，随主题自适应。零运行时下用 CSS 变量覆盖即可自定义：

```css
.my-scope .apollo-radio-group,
.my-scope .apollo-radio-wrapper {
  --apollo-radio-radio-size: 20;
  --apollo-radio-button-bg: #f6ffed;
}
```

## FAQ

**为什么 `defaultChecked` 时外层的 `-wrapper-checked` 类不出现？**
这是上游行为（wrapper 的类名读的是 `checked` prop / Group 值，不含非受控内部态），
我们逐字对齐 —— 见 `README.md` §5 与 `COMPATIBILITY.md` §9.2.1。
