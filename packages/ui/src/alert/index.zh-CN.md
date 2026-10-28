---
category: 反馈
title: Alert
subtitle: 警告提示
---

在页面中展示需要关注的信息；支持完整 Vue 内容插槽和原生关闭按钮。全部15个实际示例见 [`demo/`](./demo)。

## Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| type | 提示类型 | `'success' \| 'info' \| 'warning' \| 'error'` | banner 时 warning，否则 info |
| variant | 显式值优先于当前 `components.alert.variant` | `'outlined' \| 'filled'` | outlined |
| title | 标题文本；富内容走 #title | `string` | — |
| message | 废弃标题别名，title 未传时使用 | `string` | — |
| description | 描述文本；富内容走 #description | `string` | — |
| showIcon | 是否显示图标；显式 false 抑制 banner 默认图标 | `boolean` | banner 时 true，否则 false |
| banner | 顶部通告形态 | `boolean` | false |
| closable | boolean 或关闭配置；对象恒可关，当前 Provider 可给默认值 | `boolean \| AlertClosable` | false |
| closeIcon | 遗留标量图标，推荐 #closeIcon 或 closable.closeIcon | `string \| number \| boolean \| null` | — |
| closeText | 废弃关闭文案，推荐 #closeIcon | `string` | — |
| afterClose | 遗留完成回调，推荐 @after-close | `() => void` | — |
| prefixCls | DOM 类名前缀；自定义前缀需预载对应静态 CSS | `string` | apollo-alert |
| id / role | 实际根 div 的属性 | `string` | role=alert |
| classNames / styles | root/icon/section/title/description/actions/close；对象或读取当前合并 props 的函数 | `AlertSemanticValue<…>` | — |

`class`、`style`、tabindex、ARIA/data、普通原生监听器和 once 等修饰符落在实际根 div；`nativeElement` 指向该节点。`title` 已是内容 prop，不另作同名原生提示属性。原生根事件使用 DOM Event；onClick/onMouseenter/onMouseleave 为对应监听器写法。

语义函数的 `props` 包括当前解析后的 type、variant、prefixCls、role、图标显示和关闭开关；role 默认 alert，显式值优先。

Provider 四类图标的 null/undefined 沿用默认图标回退，默认图标按装饰内容处理；自定义图标语义由内容负责。

## Slots

| 插槽 | 说明 |
| --- | --- |
| #title | 完整标题内容，存在则覆盖 title/message，包括有意为空。 |
| #description | 完整描述；空内容不回退，且不保留 with-description 布局。 |
| #icon | 完整类型图标内容；空槽抑制默认图标，showIcon=false 仍优先。 |
| #action | 完整操作内容，支持多个原生操作节点。 |
| #closeIcon | 关闭按钮内的文本/图标；存在则覆盖所有图标配置，空槽不回退。 |

五个槽均在当前 render 读取，支持条件添加/移除、Fragment 与0。没有 default→title 的隐式通道。关闭内容优先级为 #closeIcon、closable.closeIcon、closeText、遗留 closeIcon、Provider对象图标、Provider closeIcon、默认图标；配置值按是否提供判定，0/false/null/空串不被默认图标覆盖。

## Events 与关闭状态

| 事件 | 载荷与时机 |
| --- | --- |
| close | 实际关闭按钮 click 的 MouseEvent，包含原生 Enter/Space 激活；每实例接受一次关闭请求。 |
| after-close | 内部关闭完成并移除后通知一次；禁动效和减少动画也完成。 |

onClose/onAfterClose 是事件监听器的程序化写法。`closable.onClose/afterClose` 保留业务配置能力，不能抑制 Vue 事件；同一函数同时作为配置与监听器时不重复调用。配置 afterClose 优先于遗留 plain afterClose。关闭按钮默认可访问名称为 Close，可用 closable 的 aria-label/aria-labelledby 定义业务名称；其 aria/data 落在关闭按钮，根 ARIA 仍属根。

关闭是内部一次性状态，没有 open/visible/v-model 或取消钩子。父级通过 v-if/key 控制挂载和重新显示；更改 closable 不重新打开已关闭实例。父级在 @close 中直接卸载时，不会冒充内部关闭完成事件。保留遗留 closeText 真值触发可关闭的既有优先级；显式 closable boolean 决定通常关闭开关。

## Ref

`AlertRef.nativeElement: HTMLDivElement | null`，关闭完成或卸载后为 null。

## ErrorBoundary

`Alert.ErrorBoundary` 与 `AlertErrorBoundary` 为同一有类型的组件。完整默认 slot 是健康内容，不额外包装 DOM；无 v-model、reset 方法或公开 expose。通过父级 key 重挂可恢复。

| 参数 | 说明 | 类型 |
| --- | --- | --- |
| title / message | 错误标题数据，缺省使用 String(error)；message 为旧别名 | `VNodeChild` |
| description | 错误描述数据，缺省以 pre 展示 Vue 错误阶段信息 | `VNodeChild` |
| id | 错误回退 Alert 的 id | `string` |

Vue onErrorCaptured 捕获实际后代的 setup/渲染/生命周期及所属事件错误并阻断上抛，包括抛出0/false/null/undefined。边界自身或脱离 Vue 调用链的错误不属于此边界。class/style/ARIA/native attrs 的原生落点是错误回退 Alert，健康 Fragment 不分配这些 attrs 到任意业务子节点。

默认错误详情为名为 Error details 的可聚焦 region；窄视口下支持原生键盘横向滚动。提供自定义 description 数据时，其交互与语义由该内容负责。

## Theme

| Token | 作用 | 默认来源 |
| --- | --- | --- |
| borderRadius | 圆角 | borderRadiusLG |
| withDescriptionIconSize | 带描述图标尺寸 | fontSizeHeading3 |
| defaultPadding | 普通内边距 | paddingContentVerticalSM + 横向12px |
| withDescriptionPadding | 描述内边距 | paddingMD / paddingContentHorizontalLG |

最近 `theme.components.Alert` 的四字段与当前 Alias 实时消费，移除覆盖恢复当前主题。原生根 `--apollo-alert-*` 变量优先，默认/暗色/紧凑/组合保持作用域；关闭遵循 theme.token.motion 和 prefers-reduced-motion。

显式空 ThemeProvider 仍是最近的主题来源，恢复默认 Alias 和四个 Token；其下未配置主题的 ConfigProvider 延续该来源。没有主题来源的 ConfigProvider 不写组件主题变量，页面 CSS 的暗色/紧凑作用域继续生效。

迁移与验证范围见 `docs/migrations/alert-contracts.md`、`docs/audit/2026-10-29-alert-contract-audit.md`。
