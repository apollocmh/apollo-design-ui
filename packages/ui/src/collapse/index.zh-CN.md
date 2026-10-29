---
category: 数据展示
title: Collapse
subtitle: 折叠面板
---

使用标题按钮展开内容，适合 FAQ、设置分组。支持数据驱动的 `items` 和声明式 `CollapsePanel`；两者使用同一个真实 Vue 组件。全部 9 个示例见 [demo](./demo)。

## API

### Collapse

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 面板数据；数组存在时优先于默认插槽，空数组也优先 | `CollapseItemType[]` | — |
| activeKey / defaultActiveKey | 受控值 / 一次性初始化值，key 统一为字符串 | `string \| number \| (string \| number)[]` | — |
| accordion | 同时只展开一个；仍使用 disclosure 语义 | `boolean` | `false` |
| bordered / ghost | 边框 / 透明模式 | `boolean` | `true` / `false` |
| size | 局部尺寸；未设置时继承 Provider componentSize | `'small' \| 'middle' \| 'large'` | `middle` |
| collapsible | 默认整行空白与标题按钮；header 仅标题按钮；icon 仅图标按钮；disabled 禁止切换 | `'header' \| 'icon' \| 'disabled'` | — |
| headingLevel | 标题层级；嵌套 Collapse 默认递增，最多 6 | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` |
| expandIconPlacement | 图标的逻辑位置；extra 为独立区域 | `'start' \| 'end'` | `start` |
| destroyOnHidden | 完成关闭后销毁正文；forceRender 优先 | `boolean` | `false` |
| prefixCls | 完整组件前缀，需预载相应静态 CSS | `string` | Provider 前缀 + `-collapse` |
| classNames / styles | root、header、title、body、icon 五个语义区域 | `CollapseSemanticClassNames / CollapseSemanticStyles` | — |

`destroyInactivePanel`、`expandIconPosition` 分别是 destroyOnHidden、expandIconPlacement 的旧别名，会开发告警，新字段优先。原生 class、style、ARIA、data、role 与原生监听器透传到根。native style 的同名变量优先于 Provider 和语义 root 样式。

| 插槽 | 内容 / scope |
|---|---|
| default | 声明式 CollapsePanel；有 items 数组时不读取 |
| expandIcon | `{ key, isActive, prefixCls, collapsible, direction }`；存在即优先，支持 Fragment、0 和空内容 |

顶层 expandIcon 渲染 prop 已按开发版槽位规范迁移为 `#expandIcon`。程序化默认工厂仍可配置在 `ConfigProvider components.collapse.expandIcon`；局部插槽优先。

| 事件 | 载荷 |
|---|---|
| update:activeKey | `string[]`；支持 `v-model:active-key` |
| change | `string[]`；每次允许的激活恰好一次 |

受控激活只提出请求，父级未接受时不改变展示。解除受控使用最后实际接受的值；defaultActiveKey 的后续变化不重置状态。ref 暴露 `nativeElement: HTMLDivElement | null`。

### CollapseItemType 与 CollapsePanel

| 字段 | items | Panel |
|---|---|---|
| key | string / number；默认数组下标 | Vue key；省略时按初次挂载顺序编号，动态面板应显式指定稳定 key |
| label / header | VNode 数据，label 优先 | header 为 string；其次 label 为 VNode 数据 |
| children / extra | VNode 数据，可为 0 / Fragment | 使用 default / #extra 插槽 |
| showArrow / forceRender | boolean，默认 true / false | 相同 |
| collapsible / destroyOnHidden | 覆盖所属 Collapse | 相同 |
| onItemClick / @item-click | 一次激活收到归一后的 string key | Vue 事件，支持 .once |
| className / style | 当前 item 根的类名 / 原生 StyleValue | 相同，并支持原生 class、attrs 和监听器 |
| classNames / styles | 五区域，局部覆盖全局；root 仅作用于 item | 相同 |
| headerClass / id | header 类名 / item 根 id | 相同 |
| prefixCls | — | 本 Panel 完整前缀；继承所属 Collapse Token，需预载该前缀 CSS |
| disabled | — | 旧禁用输入并告警；显式 collapsible 优先 |

Panel 的 `#header` 存在时覆盖 header 和 label，包括明确空内容；移除条件 slot 才回退。标题放在真实 heading/button 中，使用 span、文字等标题内容；独立按钮、输入框等交互内容应放入 `#extra`。extra 位于 heading 与按钮之外，无需阻止冒泡。默认插槽为正文；Panel 本身支持正常 Vue 生命周期。

## 键盘、内容与动画

Tab 聚焦标题按钮，Enter / Space 切换。禁用按钮不可激活；icon 配合 showArrow=false 时明确禁用并开发告警。空自定义图标仍保留可操作且有名称的按钮。标题为空时使用默认可访问名称；应用宜提供有意义的标题。

正文首次展开时挂载，默认在完成关闭后保留 DOM、表单状态和选区；关闭内容 hidden / inert。destroyOnHidden 仅销毁正文，稳定 region 与 aria-controls 关系保留。forceRender 始终渲染并保留正文，优先于 destroyOnHidden。关闭时若焦点位于该正文，则移回所属标题；外部焦点保持原位。动画响应当前主题 motion、系统减少动画及当前前缀。

如果外部关闭正文时其标题按钮已被禁用，焦点回到所属 Collapse 容器；容器只在持有此焦点时临时使用 tabindex=-1，离焦后恢复原生 attrs。

## 主题

当前 `theme.components.Collapse` 支持十个 CSS 字符串 Token：headerPadding、headerPaddingSM、headerPaddingLG、headerBg、contentPadding、contentPaddingSM、contentPaddingLG、contentBg、borderlessContentPadding、borderlessContentBg。对应 `--<组件前缀>-header-padding` 等变量；ghost 视觉为透明背景。

默认 padding 和派生 panel radius 读取当前 Alias；contentPadding 的默认横向 16px 为设计常数。borderlessContentBg 默认 transparent。显式空 ThemeProvider 恢复默认；CSS-only 场景保留继承变量。详情与迁移见 [Collapse 开发版迁移](../../../../docs/migrations/collapse-contracts.md)。
