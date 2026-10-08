---
title: Radio 单选框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

在一组备选项中进行单选。

## 何时使用

- 用于在多个备选项中**选中单个**。
- 与 `Radio.Group` 搭配使用时，选中项由 `value` / `defaultValue` 统一管理。
- 需要按钮外观时用 `optionType="button"` 或 `Radio.Button`。

:::

## 代码演示

::: v-pre

**badge**：Badge 包裹 `Radio.Button` —— 垂直形态下组内的边框合并规则也会跟着切换。

:::

<DemoPreview component="radio" demo="badge" />

::: v-pre

**basic**：最简单的用法：单独使用时受控 / 非受控均可。

:::

<DemoPreview component="radio" demo="basic" />

::: v-pre

**component-token**：> 等价替换：antd 用 `ConfigProvider theme.components.Radio` 覆盖 Component Token；
> 本仓零运行时 —— Component Token 即 CSS 变量，在容器上覆盖 `--apollo-radio-*` 即可。
覆盖 `radioSize` / `dotSize` / 按钮配色等 11 个 Component Token 后的效果。

:::

<DemoPreview component="radio" demo="component-token" />

::: v-pre

**disabled**：Radio 不可用：`disabled` 可作用于单个 Radio，也可整组生效。

:::

<DemoPreview component="radio" demo="disabled" />

::: v-pre

**radiobutton-solid**：实色填底的单选按钮样式（`buttonStyle="solid"`）。

:::

<DemoPreview component="radio" demo="radiobutton-solid" />

::: v-pre

**radiobutton**：按钮样式的单选组合（`Radio.Button`）。

:::

<DemoPreview component="radio" demo="radiobutton" />

::: v-pre

**radiogroup-block**：`block` 属性使 `Radio.Group` 撑满父容器宽度。

:::

<DemoPreview component="radio" demo="radiogroup-block" />

::: v-pre

**radiogroup-more**：垂直的 `Radio.Group`，配合更多输入项。

:::

<DemoPreview component="radio" demo="radiogroup-more" />

::: v-pre

**radiogroup-options**：`options` 支持字符串 / 数字 / 对象三种元素形态；配合 `optionType="button"` 与
`buttonStyle="solid"` 可切换为按钮形态。

:::

<DemoPreview component="radio" demo="radiogroup-options" />

::: v-pre

**radiogroup-with-name**：传入 `name` 让整组的原生 `input` 共用一个 name（原生 radio 分组语义）。
不传时组件会自己生成一个整组一致的 name。

:::

<DemoPreview component="radio" demo="radiogroup-with-name" />

::: v-pre

**radiogroup**：一组互斥的单选项。`options` 的 `label` 可以是任意节点，常用来放图标 + 文字。

:::

<DemoPreview component="radio" demo="radiogroup" />

::: v-pre

**size**：`size` 只对按钮形态（`optionType="button"`）生效：`large` / 默认 / `small`。

:::

<DemoPreview component="radio" demo="size" />

::: v-pre

**style-class**：通过 `classNames` / `styles` 自定义三槽（root / icon / label）；两者都支持对象与
函数两种形态，函数形态能拿到 `checked` 等合并后的 props。

:::

<DemoPreview component="radio" demo="style-class" />

::: v-pre

**wireframe**：> 等价替换：antd 用 `ConfigProvider theme.token.wireframe` 切换；本仓零运行时 ——
> 直接覆盖 wireframe 分支下受影响的 3 个 Component Token 变量。
线框风格下选中点是主色（非线框是白点），点尺寸也更大。

:::

<DemoPreview component="radio" demo="wireframe" />

::: v-pre

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

:::
