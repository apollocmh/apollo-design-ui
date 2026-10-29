---
category: 其他
title: ConfigProvider
subtitle: 全局配置
---

为应用或特性子树提供当前主题、语言、尺寸、禁用、方向和组件默认配置。

## 代码演示

见 [`demo/`](./demo)：前缀、语言、组件配置、尺寸与禁用、主题、动态尺寸、方向和 `useConfig`，共 8 个示例。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| scopeTag | 可选的原生作用域宿主；省略时不增加包装节点。选择符合 HTML / SVG 内容模型的标签 | `ConfigProviderScopeTag` | — |
| prefixCls | 组件 DOM 类名前缀；自定义前缀需配套静态 CSS | `string` | `'apollo'` |
| iconPrefixCls | 图标前缀，独立于组件前缀 | `string` | `'apollo-icon'` |
| getPopupContainer | 浮层容器；函数随配置更新读取 | `(trigger?: HTMLElement) => HTMLElement \| ShadowRoot` | — |
| getTargetContainer | Affix / Anchor 等滚动感知组件的目标解析器 | `() => HTMLElement \| Window` | — |
| renderEmpty | 空状态内容工厂；返回 `null`、`undefined`、`false` 或空字符串可有意留空 | `RenderEmptyHandler`，返回 `VNodeChild` | 各消费者的默认空状态 |
| locale | 当前语言包；替换、深更新及撤回不会重挂业务内容 | `Locale` | 继承，分片缺失时回退英文 |
| componentSize | 控件默认尺寸；组件自己的 `size` 优先 | `'small' \| 'medium' \| 'middle' \| 'large'` | 继承 |
| componentDisabled | 默认禁用；子级或组件显式 `false` 可覆盖父级 `true` | `boolean` | `false` |
| direction | 布局方向 | `'ltr' \| 'rtl'` | 继承 |
| virtual | 支持虚拟滚动的消费者的默认开关 | `boolean` | `true` |
| variant | 输入、选择和表单控件的默认形态 | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | 继承 |
| popupMatchSelectWidth | Select / TreeSelect / Cascader 等的浮层宽度默认值；局部配置优先 | `boolean` | 消费者默认值 |
| theme | 主题令牌、组件令牌、算法及 CSS 变量前缀；算法可为数组 | `ConfigProviderThemeConfig` | 继承 |
| warning | 开发告警行为；`strict: false` 聚合弃用告警 | `{ strict?: boolean }` | `{}` |
| components | 按各组件契约声明的默认配置，以消费者名称为键；不会自动应用任意组件 prop | `Record<string, ComponentConfigLike>` | — |
| divider | Divider 的精确配置别名 | `DividerConfig` | — |
| empty | Empty 的精确配置别名 | `EmptyConfig` | — |
| spin | Spin 的精确配置别名 | `SpinConfig` | — |
| form | 已接入 Form 的默认配置，含校验消息、必填标记、冒号、标签及语义样式等 | `FormConfig` | — |

### 继承与内容

本层 `undefined` 回落到父级；撤回先前设置的值也会回落。`components` 按组件名合并，同名组件配置整体替换；`divider` / `empty` / `spin` / `form` 精确别名覆盖同名 map 项，组件自己的显式 prop 最优先。

`theme.token` 按键合并，`theme.components` 按组件名和令牌键合并；`inherit: false` 重置父级令牌和组件令牌，保留外层 CSS 变量前缀。表单校验消息按默认数据、父 FormProvider、本地语言和当前有效 form 配置合并；`components.form.validateMessages` 与 `form.validateMessages` 共用同一通道。

默认插槽接收完整 Vue 内容，支持条件内容和多根。没有业务 emits、v-model 或 expose。默认无宿主时 Provider 的 `class` / `style` / `id` / 原生监听器等 attrs 不落到子节点；显式设置 `scopeTag` 时 attrs 落到该原生宿主，原生 style 优先于主题变量。`scopeTag` 是结构选择，改变标签遵循 Vue 原生根替换语义；切换 theme / locale 等配置不会改变内容的逻辑树。

### 主题、SSR 与样式

默认保持 renderless，主题变量在客户端投射到实际原生根，包括动态根和 Portal 内容；不会移动或重建业务节点。原生根自己的 CSS 变量声明优先，卸载或撤回时释放自己的写入并恢复原值。

SSR 会在直接原生槽根上序列化当前 Alias 变量。无法从外部自动给不透传 attrs 的 opaque 组件或纯文本建立服务端 CSS 作用域；需要完整首帧样式时，显式提供符合内容模型的宿主，例如 `<ConfigProvider scope-tag="section" :theme="theme">`。表格可用 `<table><ConfigProvider scope-tag="tbody"><tr>…</tr></ConfigProvider></table>`；默认无宿主也可以安全地位于既有 tbody、ul、select 或 SVG 内。水合时使用相同配置和内容。

静态 CSS 通过变量响应主题，不在运行时生成选择器。发布 CSS 默认只有 `apollo` 前缀；本页前缀 Demo 单独引入了构建期生成的 `brand` CSS。`theme.cssVarPrefix` 改变变量名，需要消费者样式使用相同名字。组件令牌由相应消费者写入和使用，不等于全库所有任意键均有视觉效果。

### 废弃属性

| 旧名 | 新名 |
|---|---|
| autoInsertSpaceInButton | components.button.autoInsertSpace |
| dropdownMatchSelectWidth | popupMatchSelectWidth |

### 静态方法与 composable

| 名称 | 说明 |
|---|---|
| ConfigProvider.ConfigContext | `InjectionKey<ConfigContextValue>`，可用于 `inject`；常规读取使用 `useConfigContext()` |
| ConfigProvider.config / setGlobalConfig | 模块级设置器，传 `{ prefixCls?, iconPrefixCls?, theme? }`，返回 `void`；静态 Modal 等按其消费链读取，不能替代应用内响应式 props |
| ConfigProvider.useConfig / useConfig | 返回 `componentDisabled`、`componentSize` 两个 ComputedRef |
| useDirection / useThemeConfig | 当前方向 / 主题配置的 ComputedRef；无活跃主题源时后者为 `undefined` |
| useComponentConfig(name) | 当前组件配置的惰性视图，在 render / computed 中读取；setup 解构原始值会保存快照 |

`@apollo-design/locale` 的 `useLocale(name)` 统一返回 `[ComputedRef<分片>, ComputedRef<语言码>]`，脚本中读 `.value`，模板会解包。主题包 `useTheme().config` 是可深写的实例 Ref：赋值替换当前有效配置，深写不修改父级或 props；外部主题源变化时重新以外部配置为准。

当前开发版移除了没有消费者的 `csp`、`wave`、`popupOverflow` 和 `theme.prefixCls`，以及旧 `useLocaleReactive` 双通道；见[集中迁移记录](../../../../docs/migrations/config-provider-contracts.md)。

最近的显式 `ThemeProvider` 也属于当前主题来源，包括空配置 `{}` 的默认主题重置。嵌套 `ConfigProvider` 会在所属原生根投影该来源；没有显式来源时保留纯 CSS 变量继承。
