# ConfigProvider 契约与消费链整改 · 2026-10-29

本轮以当前源码逐项盘点 ConfigProvider 全单元，并按已授权范围修复其真实消费者。最初基准为 ea36bd643a94c2fe64c429b99cc26ce328132ccc；当前工作树尚未作为本单元提交。文件 SHA、最终检查命令和原始输出由 source-freeze / 本地交接包记录。最终同一提交的全库、产物与发布消费者检查由整合负责人执行，本报告不替代这些门禁。

## 范围与清单

实施前盘点覆盖原 24 个运行时 Props、声明类型、全部具名及静态导出、8 对 Demo、双语 API、默认插槽、attrs、Emits / model / Expose、主题样式与全部注入链。AST 起始扫描记录 175 个生产文件、189 个相关调用记录；仅作为清单索引，逐项继续沿“声明 → 传递 → 消费 → 行为”检查。useComponentConfig 的起始消费者有 109 处，语言快照通道 22 处与旧 Reactive 通道 6 处均逐文件核对。

最终 22 个 Props 如下；组件开放 map 仅传递该组件明确支持的默认值，不自动应用任意新能力。

| 字段组 | 当前清单 | 分类与验收 |
|---|---|---|
| 结构 | scopeTag | 新增显式有效 HTML / SVG host；默认 Fragment，不增加 DOM 包装，完整 Vue 子节点与条件插槽保留 |
| 前缀 | prefixCls、iconPrefixCls | 当前值传递、最近图标上下文、自定义前缀静态 CSS；兄弟与嵌套隔离 |
| 上下文 | locale、componentSize、componentDisabled、direction、variant | 继承、动态更新、false、撤回；语言不通过重挂刷新 |
| 主题 | theme | writable instance Ref、深写隔离、外部源重置、算法与 token 合并、CSS-only、SSR / 水合及投影清理 |
| 浮层 / 滚动 | getPopupContainer、getTargetContainer、virtual、popupMatchSelectWidth | 实际消费者接通，目标切换与清理；滚动目标只允许 HTMLElement / Window |
| 旧别名 | dropdownMatchSelectWidth、autoInsertSpaceInButton | 保留既有映射；现代字段与局部组件配置按优先级处理 |
| 空状态 / 告警 | renderEmpty、warning | 当前函数消费；显式空结果保留，warning 继续使用 Vue 注入通道 |
| 组件默认 | components、divider、empty、spin、form | 相同组件整项替换、精确别名优先、自有特殊键、表单消息实际同步到已挂载 store |

没有业务 Emits、v-model 或 Expose 方法。install 名为 AConfigProvider；ConfigContext 是 InjectionKey，config / setGlobalConfig 是模块级设置器，useConfig 返回计算引用。默认忽略 Provider attrs，显式 host 承接 attrs 且原生 style 优先。改变 scopeTag 是 Vue 根结构变化；主题或语言变化保持原业务树。

配置、Theme、size、disabled、warning、locale、Form 七条提供链之外，IconProvider 的前缀与 rootClassName 亦核对声明与实际 SVG 消费。

## 修复与已裁决变化

1. 移除条件 LocaleProvider 与相邻空主题元素 / Teleport 结构，改为稳定的 Icon / Form providers。locale 或 theme 的出现、撤回和更新保留正文节点、草稿、选区和焦点。
2. 主题配置复制到本实例可深写 Ref；不写回父级或 props，外部配置变化重新成为来源。useThemeConfig 读取 canonical Theme 上下文，支持同 app 的活动来源；未激活时保留 CSS-only。组件 token map 的字面量 `__proto__` 是自有键，不改变对象原型。
3. 最初固定 div display:contents 方案被真实 tbody SSR / hydration 的浏览器解析反证撤回。最终默认无 host，通过 Vue 原生根读取、生命周期及必要 MutationObserver 跟踪条件根与 Portal 根；只复用 Theme.createCSSVarScope 的所有权，不另建变量所有权引擎，不劫持 render 或搬运业务子树。
4. SSR 为直接原生插槽根写 Alias；不转发 attrs 的不透明组件或纯文本需要显式合法 scopeTag 才有完整首屏作用域。已覆盖 tbody / tr、ul / li、select / option、SVG g / text、显式 section，真实浏览器水合保持原节点及未受控草稿。
5. canonical useLocale 统一为只读 ComputedRef 元组并删除 useLocaleReactive。逐文件迁移生产读取，保留分片浅合并、默认分片函数、exist 与语言码回退语义。Provider 仅客户端注册存在的 Modal 分片，深更新 / 撤回 / 卸载仅清理自己的来源，SSR 不污染 confirm locale 栈。
6. 表单校验消息走默认 → 父 FormProvider → 本地语言 → 当前 form 配置；components.form 与精确 form 别名进入同一通道。form-core watchEffect 将当前消息同步给原 store，保留表单实例。
7. 移除无消费者的 csp / wave / popupOverflow、Theme.prefixCls、IconContextProps 的 csp / layer / zeroRuntime；IconProvider.value 使用真实精确类型。global.clear 由 Apollo overlay 生成 en_US / zh_CN 文案并提供英文默认值，原始上游快照不改。
8. 实际消费缺口成组修复：Table 当前语言、样式、排序 / 过滤前缀与空状态；TreeSelect virtual / popup width；Cascader width；Tabs 当前前缀、容器、语义及已声明 size / type / centered / className；App、BackTop、Checkbox / Radio / Switch 的方向，Card / Affix / BorderBeam / Watermark 的当前样式，以及 Select / Transfer / Mentions 的显式空状态。
9. 已打开 message / notification 的类型、图标、关闭类、默认关闭文案及 getPopupContainer 目标跟随当前 Provider；显式用户内容、样式、图标和 closable ARIA 保留。同 key 更新保持编辑器身份。手动 destroy 不调用 onClose，按钮 / 自然关闭保留原回调契约。显式空 icon、closable.disabled 及文档中 closable:null 的含义均补齐；null 仅在 Notification adapter 归一为 false，共享 computeClosable 不变。内核在客户端追踪当前容器解析器，保留普通元素与 ShadowRoot 的合法返回，移除 holder 的不安全 HTMLElement 断言。
10. GetTargetContainer 曾公开 ShadowRoot，Anchor 可见锚点路径实际抛错。集中裁决收窄为 HTMLElement | Window，保留 getPopupContainer 的 ShadowRoot；移除 Anchor / Affix 的不安全断言。两个组件跟随当前解析目标迁移监听，Affix 的非响应式延迟就绪 resolver 仍在每次测量时重新调用。
11. Transfer.Search 使用真实 Input.clear(MouseEvent) 与后续 input/change 顺序，一次清除只处理一次；普通输入保留原 Event / target，不克隆或伪造事件。

破坏性变化、优先级与可执行写法见[集中迁移](../migrations/config-provider-contracts.md)。Theme 底层公开类型扩展及根导出由整合负责人维护；没有新增 applyVariables API。

## 证据与验证

原始红证、实施前清单及完整日志位于 `/tmp/apollo-config-provider-audit/`，主要复现如下。先前 0 测试的 harness 配置错误不算红证。

| 证据 | 结果与用途 |
|---|---|
| probes-full-red.json | 起始 17 项，14 个有效失败与 3 个正常对照 |
| probes-locale-ssr-red.json | 缺 Modal 错清他人注册、深更新遗漏、直接 LocaleProvider SSR 泄漏 |
| probes-consumers-red.json / probes-more-consumers-red.json / probes-empty-red.json | 实际组件端的快照、缺配置、空状态问题；BorderBeam 的正确预修改重放另存 probes-border-red.json |
| probes-native-parent.json | 固定 div 在 tbody 的实际 HTML 解析 / 水合失败；因此撤回该方案 |
| probes-canonical-red.json / probes-watermark-red.json | canonical Theme 来源与 Watermark 样式缺口 |
| probes-existing-notices-red.json / probes-icon-options-red.json / probes-disabled-close-red.json | 既有通知旧类、显式 icon:0、关闭禁用缺陷 |
| probes-final-edges-red.json / probes-theme-map-red.json / scroll-targets-red.json | Tabs 声明无消费、ShadowRoot 抛错、新特殊 token 键与实际目标监听未迁移 |
| closable-null-red.json | 3 个正常对照与 1 个 null 文档契约失败；修复后四种配置均绿 |
| popup-notices-red.json | 两条真实 message / notification 全局容器切换失败；修复后保留正文、焦点与选区 |
| probes-final.json | 66 / 66，保留原始非法 ShadowRoot 红例副本，正例按迁移改为真实滚动元素 |

曾发现通知编辑器“重挂”的测试失败，组件链证明来自 VTU teleport stub 自身重建；改用真实 Teleport 后节点 / 焦点 / 草稿验证通过，另有真实浏览器反证。它没有被登记为生产 remount 缺陷。旧通知 S47 的冻结标签断言按本次明确裁决改为当前语言，并保留原 notice 身份断言。

最终本地命令、计数、文件 SHA 与日志见 [source freeze](evidence/config-provider-contract-source-freeze.json) 和 `/tmp/apollo-config-provider-audit/handoff.json`。检查覆盖 unit / DOM / a11y / theme、严格类型正负例、locale generator --check、格式、Node SSR 与真实 Chromium。浏览器不构建包、不写 dist 或 PNG。

冻结后验证：CP / Locale / Message / Notification 的四类运行门禁 495 通过、0 失败、3 个既有 skip；复现探针 66 / 66；Node SSR / Chromium 实际结构、水合、所有权、通知目标迁移、8 Demo × 4 主题交互与 axe、Button 同页对照共 62 / 62。严格 vue-tsc 无诊断，locale generator 检查 73 个输出通过，Biome 和 diff 空白检查通过。105 个所属源码 / 测试输入在所有读者前后 SHA 完全一致。这些计数不包含以下广关联尚待 Input owner 收口的失败。

广关联运行包括 5,604 个测试项：5,579 通过、22 失败、3 个生成器既有 skip。1 条失败是运行期间已读取的 closable:null 修改前断言，独立通知最终 13 / 13 通过；其余为 Form 的 20 条 DOM 与 Mentions 的 1 条样式断言，由 Input 的共享包装 / 选择器整合负责人继续核对。本报告不把这次广关联运行宣称为全绿或最终同提交全库结果。

locale generator 的 3 个原 skip 源于测试 fixture 只查 package-local / tmp 源，不查实际存在的根 node_modules；真实 `node registry/tools/gen-locale.mjs --check` 已检查全部 73 个输出并通过。没有取消断言或把 skip 计成通过。

## 另案与停止边界

同一浏览器、同静态默认 CSS 下，未改的已提交 Button、ThemeProvider{}、继承 ConfigProvider、显式 theme={} 四组均得到白字 #ffffff / 蓝底 #1677ff，axe 均为 4.1。Chromium 145 不支持 contrast-color，autoSolidColor / primaryColor / solidTextColor 变量均为空；这是既有不支持该原生函数时的 Button fallback 对比度缺陷，未发现 ConfigProvider 特有覆盖。[独立对照证据](evidence/config-provider-button-contrast-control.json)保留四组实际颜色、变量、CSS.supports 和源 SHA。尺寸 / 方向 / useConfig Demo 采用普通操作按钮，保留全部 axe 断言与独立 primary 场景，未修改 Button 实现。

已完成 Tree / DirectoryTree 的只读盘点属于另一负责人，本批不开始其实现。Locale、Icons、form-core 与上述实际消费者仅验收列出的关联链，不声明其完整组件 / 全包重新通过。本批完成文件冻结交接后按用户要求暂停，不开启新整改单元；关联共享失败、Registry、根导出、发布消费者和最终全量门禁仍由整合负责人在最终同一提交收口。
