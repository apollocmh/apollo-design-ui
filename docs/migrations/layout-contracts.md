# Layout 原生 Vue 契约修正

适用版本：0.0.0 未发布开发阶段。依据现行组件规范及已接受 ADR0007 直接修正 Vue 状态、事件、插槽、原生可访问 DOM；不保留错误 React DOM/事件兼容层或弃用期。现有组件名、静态别名、props、semantic root/body 和 ref 保留。

## 状态、事件和媒体监听

Sider 新增 typed update:collapsed，现有 collapsed 可以直接使用 v-model:collapsed；collapse 保留 (boolean, clickTrigger|responsive)，breakpoint 保留 boolean。JavaScript onCollapse/onBreakpoint 监听器继续有效。旧实现把业务监听器留在 attrs 并绑到 aside，原生同名事件可能误调业务回调；现在监听器由 Vue emits 消费，其他原生事件仍落根。

    <LayoutSider v-model:collapsed="collapsed" collapsible
      @collapse="onCollapse" @breakpoint="onBreakpoint" />

受控拒绝请求不改状态，解除受控保留最后接受值；defaultCollapsed 只初始化。媒体监听从 mounted 开始，SSR 不触发浏览器订阅/事件；断点切换、移除、卸载正确清理，支持当前与兼容媒体监听 API。移除断点清 below，保留折叠状态，无合成折叠通知。

## 触发器和内容

旧 div/span 点击区域改为 type=button 的原生按钮，支持 Enter/Space，添加名称、aria-expanded/controls 和可见焦点。默认图标为装饰内容。zero-width body 保留节点但 inert/aria-hidden；若正文持有焦点且内置按钮存在，焦点移至该按钮。

collapsedWidth 使用 CSS 变量或表达式时也按实际测量宽度识别零宽，并在变量变化后恢复正文可访问性。零宽按钮的位置、外侧圆角与 light 边框按逻辑方向计算，覆盖 LTR/RTL 与 reverseArrow 四种组合；反向按钮清除另一侧 inset，保持有效几何。

trigger prop 继续作为内容数据；#trigger 存在即优先，含有意为空。条件插槽新增、替换、移除在当前 render 生效，0/数组/Fragment 不丢失。旧“prop 优先”文档随已接受 Vue slot 优先契约修正。trigger=null 且无 slot 时仍移除按钮。

trigger/slot 现在明确是内置按钮的内容。需要自有交互按钮时，使用 trigger=null 并将外部 Button 放在 Header 等位置，自行声明名称、状态和控制事件；11 个 Demo 中 custom-trigger 演示该模式，避免嵌套交互元素。

## 原生样式、Provider 与主题

旧 Layout/Sider 对原生 style 的对象展开会破坏字符串/数组；现在用 Vue mergeProps 合并并保留根落点。Layout 接受 components.layout.style，原生 style 最后覆盖；Sider semantic → 原生 style 后，既有 width/collapsedWidth 几何仍具有最终优先级。Header/Footer/Content 只声明自己的 prefixCls，清除从 Layout 共享实现泄漏的无效 hasSider 运行时 prop。

方向与前缀读取当前 Provider，条件内容/Fragment 与独立 Layout 登记正确；业务输入节点和草稿保持。

19 个原有 Layout Token 真实消费当前 theme.components.Layout，含 0、合法长度和动态清除。三个 deprecated 背景别名成为有效 fallback，现代字段优先。默认 Header 的原深蓝背景与 colorTextLightSolid 配对；深浅 Sider 正文也使用对应 Alias，修正真实浏览器 color-contrast 失败。

静态默认值在属性消费点派生，避免每个 Layout/Sider 根重置用户变量或冻结父主题已解析值。既有 --apollo-layout-* 变量继续优先于主题数据；内部 -source-* 只承载同一批既有字段，并在新主题作用域隔离旧数据。不要把这些内部变量当公共 Token。prepareLayoutComponentToken 与显式 genTokenDecls 生成能力保留，CSS 默认不再在每个根重复声明 19 个私有默认值。

同一主题和命名空间内的家族后代继承外层 Layout 的数据，不重复投影 Alias 或已有字段；因此外层原生 --apollo-font-size 等覆盖可到达 Header/Content/Sider。显式新主题作用域仍隔离远层主题，含空 ThemeProvider。仅有无 theme 的 ConfigProvider 时遵循共享 sourceActive 元数据，不把默认主题写到节点上覆盖 CSS-only 配置；空 ThemeProvider 下再套无配置 ConfigProvider 仍使用最近显式主题。

独立 Header/Footer/Content 使用 layout/style.css，独立 Sider 使用 layout-sider/style.css；两者也可与全量入口互换。不要仅为插槽中的真实 Menu/Breadcrumb 推导成 Layout 自身 CSS 依赖。

## 回归与验证边界

保留全部 32 原始 DOM 参考和 keepStyle；8 个用例仅精确登记原生 button、装饰图标 ARIA、展开/关联状态与零宽 body 隐藏差异，其他差异仍失败。所有 11 个原 Demo 名称与成对 Markdown 保留，改用真实当前组件/主题。

源码验证入口：

    pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/layout --maxWorkers=1
    LAYOUT_SOURCE=1 node tests/consumer/layout-types.mjs
    LAYOUT_SOURCE=1 node tests/browser/layout-contracts.mjs

发布 JS/声明/按需 CSS、正式 Apollo 视觉基线、Docs 与最终同提交全量门禁由主线程在统一冻结后执行。执行结果与尚未运行边界以本轮审计记录为准。

