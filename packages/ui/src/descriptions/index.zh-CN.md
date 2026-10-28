---
category: 数据展示
title: Descriptions
subtitle: 描述列表
---

成组展示只读字段。原生 `dl` 中的每项由 `dt` 标签与 `dd` 内容组成；支持普通、边框和垂直布局。

## 代码演示

见 [`demo/`](./demo) 的 13 对演示。模板内容使用 `DescriptionsItem` 插槽，程序化数据使用 `items`。

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prefixCls | 当前实例 DOM 类名前缀；自定义前缀需自行提供对应静态 CSS | `string` | `apollo-descriptions` |
| id | 原生根 div 的 id | `string` | — |
| bordered | 边框布局 | `boolean` | `false` |
| size | 尺寸；`default` 已废弃，改用 `large`；`middle` 保留 | `'large' \| 'medium' \| 'small' \| 'default' \| 'middle'` | Provider componentSize，未配置为 `large` |
| column | 逻辑列数；映射按命中的最大断点取值，未命中使用默认映射 | `DescriptionsColumn` | `{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3, xxxl: 4 }` |
| layout | 标签与内容的排列方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| colon | 普通布局的标签冒号；边框布局始终隐藏冒号 | `boolean` | `true` |
| title | 文本标题；存在 `#title` 时由插槽替代，含刻意空槽 | `string` | — |
| items | 条目数组；包括 `[]` 时均优先于默认插槽，且不执行被覆盖的插槽 | `DescriptionsItemType[]` | — |
| labelStyle / contentStyle | 已废弃，改用 `styles.label` / `styles.content` | `CSSProperties` | — |
| classNames | 六个语义区域的类名 | `DescriptionsSemanticClassNames \| ((info: { props: DescriptionsProps }) => DescriptionsSemanticClassNames)` | — |
| styles | 六个语义区域的样式 | `DescriptionsSemanticStyles \| ((info: { props: DescriptionsProps }) => DescriptionsSemanticStyles)` | — |

`column` / 数字 `span` 向下取整；非有限数或小于 1 的列数回退到 3，跨度回退到 1。超出本行剩余列位的跨度被压缩，并发开发告警。SSR/首帧没有激活断点时 column 为 3、响应式 span 为 1，挂载后按当前视口更新。

### Slots

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| default | 由 `DescriptionsItem` / `Descriptions.Item` 构成的条目，支持 Fragment、v-for 和 v-if | 无 |
| title | 完整标题内容；空槽抑制文本后备，0 保留可见 | 无 |
| extra | 标题右侧内容；使用原生按钮或其他 Vue 组件 | 无 |

只把实际 Item 作为描述项，忽略默认槽中其他节点。`items` 与模板 Item 均为正式支持的输入方式。没有业务 emits 或 v-model；原生根事件通过 attrs 接收 DOM 事件一次。空标题/额外内容不生成空壳。

### DescriptionsItemType

| 字段 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| key | 业务身份；动态重排应提供稳定 key | `PropertyKey` | 索引 |
| label / children | 完整标签/内容数据，可含多节点、文本、0、VNode 和 Fragment | `VNodeChild` | — |
| span | 所占逻辑列；`filled` 填满本行剩余列位并结束本行 | `number \| 'filled' \| Partial<Record<Breakpoint, number>>` | `1` |
| prefixCls | 当前条目类名前缀；需提供对应 CSS | `string` | 父组件前缀 |
| className / style | 数据项所属 div 的类名/原生样式 | `string` / `StyleValue` | — |
| classNames / styles | 当前项的 `label` / `content` 区域 | `{ label?, content? }` | — |
| labelStyle / contentStyle | 已废弃的标签/内容样式别名 | `CSSProperties` | — |

每行最后一项填满剩余列位。例：4 项 / 3 列形成 `[1,1,1]` 和 `[3]`；A(1)、B(filled)、C(1) 形成 `[1,2]` 和 `[3]`，B 不另起一行。

### DescriptionsItem

具名导出 `DescriptionsItem` 与静态 `Descriptions.Item` 相同，放在 Descriptions 默认槽中。

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| label | 文本标签；`#label` 存在时优先，含空槽 | `string` |
| span / prefixCls | 与数据项相同 | 见上表 |
| classNames / styles | 当前项的标签/内容类名和样式 | `{ label?, content? }` |
| labelStyle / contentStyle | 保留的已废弃样式别名 | `CSSProperties` |
| className | 已废弃，模板使用原生 `class` | `string` |

`#label` 和默认插槽不带参数，完整接收 Vue 内容。原生 `class`、字符串/对象/数组 `style`、id、data、ARIA、tabindex 和事件落在该项所属 div；父根 attrs 不会进入子项。默认槽中的原生控件保留自身事件与键盘行为。Item 不提供业务 emits、v-model 或额外 expose。

### 样式、配置与生命周期

语义区域为 `root`、`header`、`title`、`extra`、`label`、`content`。根为 div，label/content 在所有布局中均为 dt/dd。类名按 Provider → 组件 → Item 拼接；区域样式为 Provider → 组件旧样式 → 组件 styles → Item 旧样式 → Item styles。根样式为 Provider styles.root → Provider style → 组件 styles.root → Vue 原生 style。

`ConfigProvider.components.descriptions` 接受 `DescriptionsConfig` 的 className/style/classNames/styles；全局 componentSize、direction、prefixCls 和 theme 保持响应。函数式语义参数为 `{ props }`，其中 column 与 size 为当前有效值。嵌套实例独立消费配置，外层区域样式不会改写内层标签。

数据和槽在当前渲染内归一化，不在 render 中写响应式状态。带稳定 key 的内容在换列、span、重排、layout/bordered 切换时保留 Vue 实例、原生节点、草稿与所属焦点；移除项会正常卸载，重新添加是新实例。SSR 不读取浏览器尺寸，水合后开始观察断点。

### Ref

仅公开 `nativeElement: HTMLDivElement | null`，指向实际根元素；卸载时清空。不暴露内部实例。

## Theme（Component Token）

10 个 Token 使用 `--apollo-descriptions-*` CSS 变量；`ConfigProvider.theme.components.Descriptions` 可动态覆盖，移除后恢复当前主题默认值。

| Token | 默认值 | 作用 |
| --- | --- | --- |
| labelBg | colorFillAlter | 边框标签背景 |
| labelColor | colorTextSecondary | 所有布局的标签文字，默认可读 |
| titleColor | colorText | 标题文字 |
| titleMarginBottom | fontSizeSM × lineHeightSM | 标题下间距，跟随当前字体 |
| itemPaddingBottom | padding；medium/middle 为 paddingSM，small 为 paddingXS | 项间距/边框区域纵向 padding |
| itemPaddingEnd | padding | 项尾间距/边框区域横向 padding |
| colonMarginRight / colonMarginLeft | marginXS / marginXXS ÷ 2 | 冒号的行内后/前间距 |
| contentColor | colorText | 内容文字 |
| extraColor | colorText | 额外内容文字 |

长度 Token 接受数字像素值或 CSS 长度字符串，颜色 Token 接受字符串。显式覆盖优先于尺寸默认值，普通与边框布局均消费同一组 Token。布局依赖现代 CSS Grid/Subgrid；保留的语义类名可用于样式迁移，旧 table/tr/th/td 树已按 Vue 内容身份契约替换，见 [迁移说明](../../../../docs/migrations/descriptions-contracts.md)。
