---
category: 布局
title: Flex
subtitle: 弹性布局
---

Flex 直接对完整 Vue 内容进行排列和对齐，不为每个子项增加包裹元素。需要为内联子项分别提供间距宿主时可使用 Space。

## 代码演示

六组成对 Demo 展示方向、对齐、间距、换行、响应式项目摘要和布局块。演示中的原生控件具有独立名称，保留正常键盘操作。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 完整类名前缀；自定义前缀由调用方提供对应静态 CSS | `string` | 当前 ConfigProvider，兜底 `apollo-flex` |
| vertical | 主轴是否垂直；未传时读取当前 `flex.vertical` | `boolean` | `undefined` |
| orientation | 优先于 vertical 和 Provider 的方向 | `'horizontal' \| 'vertical'` | 最终兜底 horizontal |
| wrap | 多行排列；true 等于 wrap | `boolean \| 'wrap' \| 'nowrap' \| 'wrap-reverse'` | 单行 |
| justify | 主轴 CSS 对齐方式 | `FlexJustify` | 原生 flex-start 行为 |
| align | 交叉轴 CSS 对齐方式 | `FlexAlign` | 横向 flex-start；纵向 stretch |
| flex | CSS 简写，数字无单位 | `string \| number` | — |
| gap | 像素数字、CSS 长度或预设 | `'small' \| 'medium' \| 'middle' \| 'large' \| string \| number` | — |
| component | 原生标签，或将 attrs/default slot 转发到所属宿主的 Vue 组件 | `Component \| string` | `'div'` |

方向优先级为 `orientation` → 显式 `vertical` → 当前 ConfigProvider `flex.vertical` → horizontal。Provider 的 `flex.className`、`flex.style`、vertical、direction 和前缀均响应当前配置。显式原生 `dir` 优先于 Provider 方向。

### 插槽、事件与状态

仅提供 `#default`，支持零、文本、多个 VNode 与 Fragment 等完整 Vue 内容。没有业务 emits 或 v-model。根原生监听器接收原始 DOM 事件且只触发一次；调用方的输入、链接、按钮拥有其原生语义、焦点和键盘行为。

根 `class`、`style`、id、data/ARIA、tabindex 和监听器走 Vue attrs。style 接受字符串、对象和数组。优先级为当前主题别名 → Provider `flex.style` → 原生 `style` → `flex`/非预设 `gap` 派生值。外观更新保留宿主与业务 key 的子项；修改 `component` 按 Vue 正常替换其所属宿主。空根仍挂载，保留布局与原生语义。

### Ref

| 名称 | 类型 | 说明 |
|---|---|---|
| nativeElement | `HTMLElement \| null` | 当前唯一 HTML 宿主，含 Vue 根组件的真实元素；挂载前、卸载后或没有唯一 HTML 宿主时为 null |

自定义 Vue 组件负责自己的 attrs/slot 转发；Flex 暴露实际 HTML 宿主，不暴露组件实例。Fragment、纯文本和非 HTML 根不提供 `nativeElement`。

## Theme

Flex 没有组件 Token。small 消费当前 `paddingXS`，medium/middle 消费 `padding`，large 消费 `paddingLG`。存在 ThemeContext 时在 Flex 根作用域写入这三个别名变量，支持不全局注入的 ThemeProvider 及嵌套默认主题复位。原生 style 的自定义属性可局部覆盖别名。数字 gap 支持零与小数。
