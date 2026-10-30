---
category: Data Entry
title: Radio
subtitle: 单选框
---

从多个选项中选择一个标量值。使用 `RadioGroup` / `Radio.Group` 管理一组选项；按钮外观使用 `RadioButton` / `Radio.Button` 或 Group 的 `optionType="button"`。

## API

### Radio / RadioButton

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked / defaultChecked | 受控选中值 / 非受控初值；支持 `v-model:checked` | `boolean` | — / `false` |
| value | Group 内的标量身份；组外为原生 input 的 value | `string \| number \| boolean` | — |
| disabled | 本项优先，再取 Group 与 ConfigProvider 的禁用配置；显式 false 生效 | `boolean` | — |
| title | 原生 label 的提示 | `string` | — |
| id / name / tabIndex / required / autoFocus | 落到 input；组内 name 由 Group 提供，autoFocus 在挂载时聚焦 | 原生属性 | — |
| prefixCls | DOM 前缀；自定义前缀需配套静态 CSS | `string` | `apollo-radio` |
| classNames / styles | root（label）、icon、label 三个语义区域，支持对象或 `({ props }) => 对象`；props.checked 是当前接受值 | 语义对象或函数 | — |

`Radio` 的 input 类型固定为 radio。无实际职责的 `skipGroup`、`type` 和单项 `optionType` 不再声明；Group 的 `optionType` 保留。

### RadioGroup

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value / defaultValue | 受控值 / 非受控初值；支持 `v-model:value` | `RadioValue`（string / number / boolean） | — |
| options | 数据选项；非空时优先于 default 槽 | `(string \| number \| RadioOptionItem)[]` | `[]` |
| disabled | 整组禁用；对象选项的显式 disabled 优先 | `boolean` | — |
| name | 所有子 input 的原生 name；省略时每个 Group 生成独立名称 | `string` | 自动生成 |
| optionType | 圆点 / 按钮外观；显式 RadioButton 保持按钮外观 | `'default' \| 'button'` | `'default'` |
| buttonStyle | 按钮填充方式 | `'outline' \| 'solid'` | `'outline'` |
| size | 共享 SizeType；medium / middle 同属默认档 | `'small' \| 'medium' \| 'middle' \| 'large'` | 当前 Provider 尺寸 |
| orientation / vertical | 水平 / 垂直排列；orientation 优先于 vertical | `'horizontal' \| 'vertical'` / boolean | 水平 |
| block | 撑满容器宽度 | `boolean` | `false` |
| id / role / prefixCls | 根 id、角色与前缀 | `string` | — / `radiogroup` / `apollo-radio` |

`RadioOptionItem` 的 value 使用 RadioValue；label 支持完整 Vue 内容。选项保留 style、className、disabled、title、id、required 数据字段；`onChange(event, checked)` 是原生 Radio 通知。数字 1、字符串 '1' 和布尔 false 保持各自身份。

### Emits

| 组件 | 事件 | 载荷 |
|---|---|---|
| Radio / Button | update:checked | `(checked: boolean)` |
| Radio / Button | change | `(event: Event, checked: boolean)`；第二参是本次提议的快照 |
| Radio / Button | click / mouseenter / mouseleave | 原生 MouseEvent；hover 落 label，click 只通知一次 |
| Radio / Button | focus / blur | input 原生 FocusEvent |
| Radio / Button | keydown / keypress | input 原生 KeyboardEvent |
| Group | update:value | `(value: RadioValue)` |
| Group | change | `(value: RadioValue, event: Event)`；只有值发生变化才提议 |
| Group | mouseenter / mouseleave | 根原生 MouseEvent |
| Group | focus / blur | 根或后代产生的原生 FocusEvent |

所有通知由 Vue emits 拥有。`RadioChangeEvent` 是 Event 的类型别名，不含合成 target/nativeEvent。Radio 可直接使用 `@change.stop`；Group 的 change 首参是业务值，需要停止原生传播时使用第二参 event。h() 原生监听按 `onKeydown`、`onMouseenter` 拼写，模板使用 `@keydown`、`@mouseenter`。

受控更新是提议；父级拒绝时，DOM 恢复当前接受值（同名 Group 同时恢复被浏览器取消的兄弟项），随后撤控仍保留最后接受值。input、wrapper 和语义 props.checked 使用同一状态。

### Slots、attrs 与 ref

Radio / Button 的 default 槽支持文本、0、数组、Fragment 和 Vue 节点，空值、布尔值及注释占位不产生空文案层。Group 的 default 槽放自定义 Radio / Button；非空 options 优先。

Radio / Button 的 class、style 落外层 label，其余原生 attrs 落 input；title 落 label。style 支持 Vue 字符串、对象和数组。Group 的原生 attrs、class、style 和监听落 div，声明的业务 props 不落 DOM。原生 capture 监听与所属通知同时保留。

| 引用 | 暴露 |
|---|---|
| Radio / Button | `focus(options?)`、`blur()`、`input: HTMLInputElement \| null`、`nativeElement: HTMLElement \| null`（icon span） |
| Group | `nativeElement: HTMLDivElement \| null` |

引用由真实 Vue 模板 ref 提供；元素在挂载前和卸载后为空。Button 直接转发实际 Radio 引用和通知。

原生 Tab / Space / 方向键负责导航与选择，禁用项跳过；keydown 的 preventDefault() 保留原生取消能力。当前已聚焦的选项在 keyed options 重排后保留焦点，移除项不会把焦点抢回。独立选项集合使用不同 Group，自动生成的 name 互不影响。

## Provider 与 Token

`ConfigProvider.components.radio` 的 className/style/classNames/styles 读取当前配置；本地语义样式和原生根 style 按顺序覆盖。方向、禁用、尺寸及配置替换/撤回均响应变化。

`theme.token`、当前算法与 `theme.components.Radio` 在实际 Group 和 Radio/Button 根投影为静态 CSS 消费的变量。现有 16 个 Token 均生效；radioSize / dotSize 为无单位数字，另两个数值间距转换为 px。wireframe 使用当前主题派生 dotSize、radioColor、radioBgColor；撤回后恢复默认值。

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


默认 CSS 保留变量 fallback。手工使用原生根 style 覆盖 `--apollo-radio-*` 时优先级最高；自定义 prefixCls 只改变 DOM 和相应组件变量名，不在运行时生成 CSS 选择器。
