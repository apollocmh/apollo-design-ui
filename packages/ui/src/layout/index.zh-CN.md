---
category: 布局
title: Layout
subtitle: 布局
---

使用 Layout、LayoutHeader、LayoutFooter、LayoutContent 和 LayoutSider 组成页面。也保留 Layout.Header / Footer / Content / Sider 静态别名。

## 代码演示

<code src="./demo/basic.vue">基本结构</code>
<code src="./demo/top.vue">顶部导航</code>
<code src="./demo/side.vue">侧边导航</code>
<code src="./demo/top-side.vue">顶部与侧边</code>
<code src="./demo/top-side-2.vue">分组导航</code>
<code src="./demo/fixed.vue">固定顶部</code>
<code src="./demo/fixed-sider.vue">固定侧边</code>
<code src="./demo/custom-trigger.vue">外部触发器</code>
<code src="./demo/responsive.vue">响应式</code>
<code src="./demo/component-token.vue">当前组件 Token</code>
<code src="./demo/collapsible-overlay.vue">覆盖式侧边栏</code>

## Layout

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prefixCls | 完整 DOM 类名前缀 | string | Provider 前缀 + -layout |
| hasSider | 显式 boolean 优先；否则检测当前直接 Sider、数组/Fragment 和已注册 Sider | boolean | 自动检测 |

Header/Footer/Content 只有 prefixCls；显式前缀直接使用，不再附加后缀。Layout/Header/Footer/Content/Sider 分别使用 div/header/footer/main/aside。default 插槽接收完整 Vue 内容，含数组、Fragment 和数字 0；条件内容在 render 中读取。嵌套 Layout 独立登记 Sider。若组件包装隐藏了 SSR 可见的 Sider 结构，可显式指定 hasSider。

## LayoutSider

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| collapsible | 显示折叠触发器 | boolean | false |
| collapsed | 当前折叠状态，支持 v-model:collapsed | boolean | 非受控 |
| defaultCollapsed | 只用于非受控初始化 | boolean | false |
| width | 展开宽度；数字/数字字符串补 px，其他合法 CSS 长度保留 | number 或 string | 200 |
| collapsedWidth | 折叠宽度；零宽时使用侧边触发器 | number 或 string | 80 |
| reverseArrow | 反转图标和零宽触发器方向 | boolean | false |
| trigger | 内置按钮的内容数据；null 隐藏按钮（有 trigger 插槽时插槽优先） | VNodeChild | 默认图标 |
| zeroWidthTriggerStyle | 零宽按钮原生样式 | CSSProperties | — |
| breakpoint | 订阅响应式断点 | xs/sm/md/lg/xl/xxl/xxxl | — |
| theme | 侧边栏与触发器明暗外观 | light 或 dark | dark |
| prefixCls | 完整 DOM 前缀 | string | Provider 前缀 + -layout-sider |
| classNames | root/body 类名，对象或接收当前 { props } 的函数 | SiderSemanticClassNames | — |
| styles | root/body 样式，对象或接收当前 { props } 的函数 | SiderSemanticStyles | — |

受控时点击和断点变化只请求新状态，父级决定是否接受；拒绝请求保持当前 DOM/宽度。解除受控时保留最后已接受值。非受控 defaultCollapsed 后续修改不重置状态。正文不因折叠卸载，输入草稿与组件身份保留。

| Vue 事件 | 载荷 |
| --- | --- |
| update:collapsed | boolean |
| collapse | (collapsed: boolean, type: clickTrigger 或 responsive) |
| breakpoint | broken: boolean |

JavaScript 的 onCollapse/onBreakpoint 继续可用，监听器替换/移除即时生效。业务监听器不再透传为 aside 原生事件；其余原生事件仍作用于根。

媒体监听从 mounted 开始，SSR 不订阅也不发事件。启用断点后立即发送一次当前 breakpoint 状态，状态不同时请求 responsive 折叠；切换断点重新订阅。移除断点清除 below 状态、注销监听，保留当前折叠状态，不补发合成事件；卸载清理全部监听。最大视口阈值依次为 479.98 / 575.98 / 767.98 / 991.98 / 1199.98 / 1599.98 / 1839.98px。

## 插槽、键盘与 ref

Layout 家族的 default 插槽均接收内容。Sider 的 trigger 插槽存在即优先于 trigger 数据，包含有意为空的返回；移除插槽恢复数据或默认图标。trigger / #trigger 是内置原生 button 的内容，请使用文字、图标等非交互内容。自有交互控件请设 trigger=null 并放在 Header 等外部位置，避免嵌套按钮。

默认和零宽按钮均支持 Tab、Enter、Space，type=button，提供展开状态、名称和正文关联。零宽正文设置 inert/aria-hidden，保留内容实例；正文持有焦点时折叠至零宽，焦点移至内置按钮，不抢占外部焦点。自有外部按钮负责自己的名称、状态和焦点。

collapsedWidth 的 CSS 变量/表达式按实际宽度识别零宽，动态恢复非零宽时恢复正文交互。零宽按钮的圆角、边框和位置同时跟随当前方向与 reverseArrow。

五个组件的 ref 仅开放 nativeElement: HTMLElement 或 null。Menu 通过当前 Sider context 消费 collapsed；Menu 的显式 inlineCollapsed 优先。

## 原生 attrs、Provider 与主题

class/style、data-*、ARIA 和原生监听器落根，style 支持 Vue 对象、字符串和数组。Layout 样式顺序为当前主题数据 → components.layout.style → 原生 style。components.layout.className 用于 Layout/Sider；该 Provider style 只配置 Layout 本体。Header/Footer/Content 通过自身 attrs 配置。Sider 样式顺序为主题数据 → styles.root → 原生 style → width/collapsedWidth 几何；宽度通过对应 prop 设置，正文使用 styles.body。

19 个已有 Layout 字段均消费当前 theme.components.Layout，支持 ConfigProvider、ThemeProvider（无需注入全局 CSS）、四主题、嵌套与 SSR。数字长度转 px，有限非负数字含 0 有效，合法字符串长度保留；替换/移除配置恢复当前默认值。

| 字段 | 作用 |
| --- | --- |
| bodyBg | Layout 背景 |
| headerBg/headerColor/headerHeight/headerPadding | Header 背景、文字、外高/行高、内边距 |
| footerBg/footerPadding | Footer 背景与内边距 |
| siderBg | dark Sider 背景 |
| triggerBg/triggerColor/triggerHeight | dark 按钮背景、文字、按钮高/预留空间 |
| zeroTriggerWidth/zeroTriggerHeight | 零宽按钮几何 |
| lightSiderBg/lightTriggerBg/lightTriggerColor | light Sider 和按钮配色 |
| colorBgBody/colorBgHeader/colorBgTrigger | 保留的 deprecated 背景别名，现代字段优先 |

默认 Header 使用深蓝背景与 colorTextLightSolid 文字；深浅 Sider 正文分别使用 colorTextLightSolid/colorText。当前 Alias 派生默认尺寸；显式字段、原生属性与 stylesheet 中既有 --apollo-layout-* 变量继续有效，用户变量优先于主题数据。内部 -source-* 是既有字段的数据通道，不是新增 ComponentToken；不要依赖该内部名称。独立 Header/Footer/Content/Sider 也有完整静态默认值。

同一主题内的家族节点继承外层 Layout 的原生 Alias 覆盖。无 theme 的 ConfigProvider 保留 CSS-only 变量；显式空 ThemeProvider 可隔离远层主题，即使其下又有无配置 ConfigProvider。

## 样式入口

    import '@apollo-design/theme/tokens.css';
    import '@apollo-design/ui/layout/style.css';
    import '@apollo-design/ui/layout-sider/style.css';

Layout/Header/Footer/Content 使用第一个组件入口，Sider 使用独立 layout-sider 入口；或统一引入 ui/style.css。业务槽中的 Menu/Breadcrumb 等仍导入各自 CSS。自定义 prefixCls 只改 DOM 命名，配合预生成 genLayoutStyle/genSiderStyle，不在运行时生成任意前缀 CSS。

公开类型保留 LayoutProps/Ref、SiderProps/Ref、Breakpoint、CollapseType、语义类型，新增所属 LayoutSlots、SiderSlots、SiderEmits。根包中的 Sider 类型使用 LayoutSider 前缀别名。修正与迁移见 docs/migrations/layout-contracts.md。
