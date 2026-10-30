---
category: 数据展示
title: Card
subtitle: 卡片
---

通用卡片容器。

## 何时使用

- 最基础的卡片容器，可承载文字、列表、图片、段落，常用于后台概览页面；
- 需要把一组相关信息聚合在一个容器里，并与周围内容区分开时。

## 代码演示

见 [`demo/`](./demo)（**12 个**，覆盖 antd 的主要用户场景）。

| demo | 内容 |
|---|---|
| `basic` | 典型卡片（含 `size="small"` 的对照） |
| `border-less` | `variant="borderless"` 的无边框卡片 |
| `simple` | 只包含内容区域（无 head） |
| `flexible-content` | `cover` + `Card.Meta` 的灵活内容 |
| `in-column` | 与栅格配合 |
| `loading` | `loading` ⇒ body 里是 Skeleton |
| `grid-card` | `Card.Grid` 的内容区隔 |
| `inner` | `type="inner"` 的内部卡片 |
| `tabs` | `tabList` 的页签卡片 |
| `meta` | 封面 + 头像 + 标题 + 描述 |

`style-class` 与 `component-token` 已包含在当前 12 个 Demo 中；前者展示语义样式，后者展示当前 Provider 组件 Token。历史差额保留在 README 的原日期记录中。

## API

### Card

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| title | 卡片标题；**支持插槽 `#title`**（插槽优先） | `VNodeChild` | — | × |
| extra | 右上角操作区；**支持插槽 `#extra`** | `VNodeChild` | — | × |
| cover | 封面；**支持插槽 `#cover`** | `VNodeChild` | — | × |
| actions | 操作区 VNode 数据列表；支持 actions 槽（每项包一层 `<li><span>`，宽度均分） | `VNodeChild[]` | — | × |
| loading | 加载中（内容替换成 `Skeleton`） | `boolean` | `false` | × |
| hoverable | 悬浮时显示阴影与手型光标 | `boolean` | `false` | × |
| size | 尺寸 | `'medium' \| 'small' \| 'middle' \| 'default'` | `medium` | ✅（`componentSize`） |
| type | 卡片类型（目前只有 `'inner'`） | `'inner'` | — | × |
| variant | 形态。`'borderless'` ⇒ 不加 `-bordered`、改用三级阴影 | `'outlined' \| 'borderless'` | `outlined` | ✅（`card.variant`） |
| tabList | 页签列表。⚠️ `tab` 已废弃，用 `label` | `CardTabListType[]` | — | × |
| activeTabKey | 当前页签，支持 v-model:active-tab-key；undefined 撤控后保留最后接收值 | `string` | — | × |
| defaultActiveTabKey | 非受控的初始页签 | `string` | — | × |
| tabBarExtraContent | 页签栏两侧的附加内容 | `VNodeChild \| { left, right }` | — | × |
| tabProps | 透传给内部 `Tabs` 的 props | `TabsProps` | — | × |
| classNames | 语义化类名（7 槽），支持函数形态 | `CardSemanticClassNames \| ((info) => …)` | — | ✅（`card.classNames`） |
| styles | 语义化样式（7 槽），支持函数形态 | `CardSemanticStyles \| ((info) => …)` | — | ✅（`card.styles`） |
| prefixCls | 类名前缀（**根前缀本身**，不是后缀） | `string` | 从 ConfigProvider 取，兜底 `apollo-card` | × |
| class / style | **根元素原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | — | × |
| id | 根元素 id | `string` | — | × |
| bordered | ⚠️ **已废弃**，用 `variant` | `boolean` | — | × |
| headStyle | ⚠️ **已废弃**，用 `styles.header` | `CSSProperties` | — | × |
| bodyStyle | ⚠️ **已废弃**，用 `styles.body` | `CSSProperties` | — | × |

> ⚠️ 语义化槽**覆盖** deprecated 的 `headStyle` / `bodyStyle`（合并顺序是
> `{...headStyle, ...mergedStyles.header}`）。

### 事件

`tabChange(key: string)` 与 `update:activeTabKey(key: string)` 是所属事件。使用 `@tab-change` 监听通知、`v-model:active-tab-key` 接收更新。JSX 的 `onTabChange` 是同一事件的 listener 拼法，组件不另行调用回调。

定义了 activeTabKey 时，更新是父级可接受或拒绝的提议；拒绝后撤控不会泄漏未接收值。defaultActiveTabKey 只设置初值。tabProps 的 activeKey/defaultActiveKey、items 与 tabBarExtraContent 不改变 Card 对应字段的归属，其余 Tabs 配置、VNode 标签及有返回值的服务函数保持透传。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 卡片内容；loading 时以真实 Skeleton 替换，不求值隐藏内容 |
| title / extra / cover | 对应内容，存在即优先于 prop，含显式空槽；动态添加/撤除即时生效 |
| actions | 操作项列表；支持条件项与 Fragment，使用唯一 VNode key 保留项身份 |

### Card.Meta

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| avatar | 头像；**支持插槽 `#avatar`** | `VNodeChild` | — |
| title | 标题；**支持插槽 `#title`** | `VNodeChild` | — |
| description | 描述；**支持插槽 `#description`** | `VNodeChild` | — |
| classNames | 语义化类名（`root` / `section` / `avatar` / `title` / `description`） | `CardMetaSemanticClassNames \| ((info) => …)` | — |
| styles | 语义化样式（同上五个槽） | `CardMetaSemanticStyles \| ((info) => …)` | — |
| prefixCls | 类名前缀（**card 的前缀**：传 `x` ⇒ `x-meta`） | `string` | 兜底 `apollo-card` |
| class / style | 根元素原生 attrs | `string` / `CSSProperties` | — |

插槽：avatar、title、description，以及 description 后备内容的 default。优先顺序为 description 槽（存在即优先，含显式空）→ 显式 description 数据（含 0/null/false）→ default。avatar/title 槽也遵循存在即优先。

> ⚠️ `avatar` 在 `section` **外面**，`title` / `description` 在 **里面**；
> 根上**没有** `-rtl`（`Card.Meta` 不读 `direction`）。

### Card.Grid

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| hoverable | 悬浮高亮。⚠️ **默认 `true`**（与 `Card` 的默认 `false` 不同） | `boolean` | `true` |
| prefixCls | 类名前缀（**card 的前缀**：传 `x` ⇒ `x-grid`） | `string` | 兜底 `apollo-card` |
| class / style | 根元素原生 attrs | `string` / `CSSProperties` | — |

### 实例方法（ref）

三个组件都暴露 `{ nativeElement }`（`HTMLDivElement | null`）。

> ⚠️ 上游 `Card` 是 `forwardRef<HTMLDivElement>`（ref 就是 DOM 元素本身），
> `Card.Grid` / `Card.Meta` 是 `{ nativeElement }`。本仓**统一成对象**（差异见 `README.md` §2 第 1 条）。

### 语义化 DOM

| 槽 | `Card` 的落点 | `Card.Meta` 的落点 |
|---|---|---|
| `root` | 根 `<div class="{prefixCls}">` | 根 `<div class="{prefixCls}-meta">` |
| `header` / `section` | `<div class="{prefixCls}-head">` | `<div class="{prefixCls}-meta-section">` |
| `body` / `avatar` | `<div class="{prefixCls}-body">` | `<div class="{prefixCls}-meta-avatar">` |
| `extra` / `title` | `<div class="{prefixCls}-extra">` | `<div class="{prefixCls}-meta-title">` |
| `title` / `description` | `<div class="{prefixCls}-head-title">` | `<div class="{prefixCls}-meta-description">` |
| `actions` | `<ul class="{prefixCls}-actions">` | — |
| `cover` | `<div class="{prefixCls}-cover">` | — |

## Theme

### Component Token（13 个）

| token | 说明 | 默认值 |
|---|---|---|
| `headerBg` | 卡片头部背景色 | `transparent` |
| `headerFontSize` | 卡片头部文字大小 | `fontSizeLG` |
| `headerFontSizeSM` | 小号卡片头部文字大小 | `fontSize` |
| `headerHeight` | 卡片头部高度 | `fontSizeLG * lineHeightLG + padding * 2` |
| `headerHeightSM` | 小号卡片头部高度 | `fontSize * lineHeight + paddingXS * 2` |
| `actionsBg` | 操作区背景色 | `colorBgContainer` |
| `actionsLiMargin` | 操作区每一项的外间距 | `${paddingSM}px 0` |
| `tabsMarginBottom` | 内置标签页组件下间距 | `-padding - lineWidth` |
| `extraColor` | 额外区文字颜色 | `colorText` |
| `bodyPaddingSM` | 小号卡片内边距 | `12` |
| `headerPaddingSM` | 小号卡片头部内边距 | `12` |
| `bodyPadding` | 卡片内边距 | `paddingLG` |
| `headerPadding` | 卡片头部内边距 | `paddingLG` |

> ⚠️ 上游的 `bodyPadding` / `headerPadding` 写的是 `token.bodyPadding ?? token.paddingLG`，
> 但那个键**不在** antd 6 的 `AliasToken` 里（v4 遗留）⇒ 实际恒取 `paddingLG`。
> 本仓直接写 `paddingLG`（见 `README.md` §2 第 2 条）。

当前 13 个 Token 从 `ConfigProvider theme.components.Card` 与当前别名主题派生，支持替换和撤除；Grid/Meta 独立使用也读取当前主题。函数式 classNames/styles 读取当前生效的尺寸、形态和 Props。Card 不读取 Form 的输入形态；继承的 large 尺寸解析成 medium。

原生 class/style、属性和监听器落到实际根元素；直接 CSS 变量覆盖优先于主题和语义根样式。运行时也可用 CSS 变量：`--apollo-card-header-height` / `--apollo-card-body-padding` /
`--apollo-card-actions-bg` 等（13 个，变量名与 antd 的 `--ant-card-*` 同构）。
