# Apollo Design · 兼容与迁移政策

## 兼容对象

Apollo 对自身公开 API、文档化行为、类型、语义样式接口和实际用户负责。Ant Design 不是唯一规格，不绑定 Apollo 的发布版本，也不要求组件/API/Token/DOM 数量相同。默认保留已有合理行为与视觉。

## 保留的边界

- 已有组件导出、props、事件 payload、`v-model` 名称、expose、令牌和样式入口默认保持兼容；开发阶段模板扩展 API 按 ADR 0006 直接迁移；为保留 React 回调/DOM 形态而妨碍 Vue 公共用法的行为按 ADR 0007 直接修正。
- 根节点使用 Vue `class` / `style`；先前已经完成的根别名迁移不回滚。非根 `classNames.*` / `styles.*` 和现存 deprecated alias 保留各组件已文档化行为。
- 同名 ConfigProvider 配置字段、数据项字段和组件 attrs 不等同，不因名称类似 React 而删除。
- 现有 VNode 数据和命令式服务按职责保留。组件顶层内容渲染函数 prop 直接替换为具名/作用域插槽，不保留函数兼容层或弃用期（用户裁决、ADR 0006）；逐组件同步实现、类型、调用者、文档与测试。数据项渲染字段另行按实际契约评估。迁移不得破坏数字动画、缓存或业务 payload。
- `prefixCls` 的 DOM 响应性需要保证，但现有静态 CSS 不自动支持任意前缀。完整前缀样式策略继续追踪 KNOWN-ISSUES 的 D04。
- `middle` 等既有值、子组件别名和已验收视觉不为独立化重新命名。

## 变更分类与迁移

错误实现 → 用场景与契约证明后修复；有意设计改变 → 记录理由、影响、类型、示例和回归；环境差异 → 记录平台与复现条件；上游差异 → 可作参考，不自动构成缺陷或豁免。

破坏性公共 API 必须单独记录：旧/新写法、受影响版本、替代方案、弃用期、运行时及类型兼容层、移除条件、验证命令。当前 `0.0.0` 未发布开发阶段，用户已授权模板扩展 API 直接迁移；这类变更记录旧/新写法与测试证据，兼容层和弃用期明确为无，无需逐组件重复申请批准。用户另已授权按 ADR 0007 直接修正牺牲 Vue 公共用法的 React 回调/DOM 兼容：不保留错误载荷或树形态的兼容层/弃用期；逐组件记录影响与验证。其他破坏性变更仍单独评审。

Vue 公共语义与 React 回调/DOM 冲突的直接修正规则见 [ADR 0007](docs/adr/0007-vue-public-contracts-over-react-shapes.md)。已批准的模板扩展迁移见 [ADR 0006](docs/adr/0006-development-template-slots.md)，Transfer 首批变化见 [迁移记录](docs/migrations/transfer-slots.md)。Alert / Collapse 已有内容插槽的优先级调整另见 [行为迁移记录](docs/migrations/content-slot-precedence.md)。List 的 `renderItem` → 泛型 `#item`、内容插槽及废弃告警调整见 [List 迁移记录](docs/migrations/list-slots.md)。其他待评估事项见 [独立化记录](docs/migrations/independence.md)，未裁决事项不算已批准。

Typography 的固定标签类型、Link 原生操作树、编辑/复制/测量、有效 Token 和关联 Table 主题变量修正见 [Typography 契约迁移](docs/migrations/typography-contracts.md)。

Badge / Ribbon 的原生根 style/ref、完整 text 内容/槽、当前配置与九 Token、数字/偏移及可读前景修正见 [Badge 契约迁移](docs/migrations/badge-contracts.md)；直接修正开发期错误落点，原二十六场景和参考证据保留。

## 上游参考与历史回归

List 当前配置、稳定内容结构、嵌套样式与分页修正，以及共享 `RenderEmptyHandler` 类型收窄，集中见 [List 契约迁移](docs/migrations/list-contracts.md)。

共享reset的原生控件颜色配对修正见 [颜色迁移](docs/migrations/native-control-colors.md)。Spin全屏模式保留正文文档流，root为内容外壳，mask为实际覆盖层；相关落点变更与验证也见List契约迁移。

Spin的完整Vue内容、显式indicator scope、稳定section/indicator、SSR确定进度（含0）与4个有效Token集中见 [Spin契约迁移](docs/migrations/spin-contracts.md)。这按ADR0007直接修正旧DOM/首帧形态，不恢复已移除indicator prop或增加兼容通道。

QRCode的statusRender直接替换为#status、稳定refresh事件操作、根/图像样式拥有关系、默认白色宿主与可访问名称、当前遮罩Token和语言，集中见 [QRCode契约迁移](docs/migrations/qrcode-contracts.md)。原编码引擎与合法输入的矩阵/路径保留。

`tests/compat`、Oracle 与 `tests/visual/baselines/react` 保留来源版本以便复现；版本固定只约束这组参考实验。上游对照默认不决定新组件完成或发布验收。现有 DOM 回归测试仍执行，必要差异必须根据 Apollo 契约审查，不允许无依据放宽。

## 9. 历史差异登记

`image-optional-alt-accessible-name`：Image省略alt时，实际img使用空替代文本；预览触发器使用“Preview image”，弹层使用“Image preview”作为通用名称，避免公开可选prop产生无名称控件。旧React对照缺少触发器名称的5个场景保留，精确断言仅此差异，并以Apollo原生回归及实际浏览器axe验证。集中迁移与当前验证边界见 [Image契约修正](docs/migrations/image-contracts.md)。

原 D 编号及逐组件迁移证据完整保存在 [2026-10 历史兼容记录](docs/history/compatibility-2026-10.md)。旧链接/脚本引用该表时按历史记录解释；其中的 Phase、逐字同构和强制对拍要求已被本文取代。不要删除已有问题复现或第三方来源说明。

Statistic/Timer/Countdown的原生#value业务作用域、当前计时方向/非负事件、SSR/清理、attrs/ref及两字号Token修正集中见[Statistic契约迁移](docs/migrations/statistic-contracts.md)；不新增旧内容函数兼容层。

Skeleton及五个子组件的原生根attrs/style、嵌套块配置、Image默认槽、当前八Token和装饰占位语义修正集中见[Skeleton契约迁移](docs/migrations/skeleton-contracts.md)；直接修正开发期错误形态，不新增兼容通道。

Result全部状态的完整图标槽/默认图形开关、条件内容、原生根attrs/style、当前Provider/四Token和装饰语义修正集中见[Result契约迁移](docs/migrations/result-contracts.md)；开发期直接修正，不为旧React图形分支增加兼容通道。

Button完整内容宿主、独立color/variant、加载请求与指示器分离、当前Provider/58 Token及合法发布工具入口修正见[Button契约迁移](docs/migrations/button-contracts.md)；内部Search/Dropdown/FloatButton链路同步调整。

Empty 的完整 image/description/footer 内容、当前 Provider/语言、自然布局、空宿主及默认文字对比度修正见 [Empty 契约迁移](docs/migrations/empty-contracts.md)；保留插画几何与原始参考证据。

Tag / CheckableTag / CheckableTagGroup 的完整内容、所属原生关闭按钮/链接、Vue 事件和强类型模型、当前 Provider/三个 Token 与两套真实语义，集中见 [Tag 契约迁移](docs/migrations/tag-contracts.md)；原始参考矩阵保留，开发期直接修正错误 DOM/回调形态。

Avatar / AvatarGroup 的原生事件与同步取消钩子、完整内容槽、当前尺寸/Token、业务key和溢出按钮，集中见 [Avatar契约迁移](docs/migrations/avatar-contracts.md)；直接移除四个分组旧别名，保留原始参考证据。

### D-typography-native-controls

开发阶段按 ADR0007 直接修正 Link 的 span/a 所属结构、text 编辑键盘入口与原生按钮内装饰图标语义。原 76 场景、参考 HTML 与参考 PNG 不变；19 个场景的精确差异存于 Typography contract-differences.ts，任何额外差异继续失败。详情与迁移见 Typography 契约迁移。

Descriptions 的稳定原生描述项、当前配置/十Token、所属attrs与label槽修正见[Descriptions契约迁移](docs/migrations/descriptions-contracts.md)。Timeline 的原生根事件、实际ref、完整标量内容、当前六Token与显式方向见[Timeline契约迁移](docs/migrations/timeline-contracts.md)。Breadcrumb 的所属内容/菜单按钮、参数、原生attrs、当前七Token与内容槽见[Breadcrumb契约迁移](docs/migrations/breadcrumb-contracts.md)；三单元已完成产物、正式视觉和Docs统一验收，见[四单元验收回执](docs/audit/evidence/four-unit-final-acceptance.json)。共享Menu Enter导航修复证据保留，完整Menu审计另行继续。

Space/Compact/Addon 的当前插槽、稳定内容身份、完整 separator 数据、紧凑上下文与主题作用域见[Space契约迁移](docs/migrations/space-contracts.md)；Grid/Row/Col 的原生样式、当前配置与响应式字段见[Grid契约迁移](docs/migrations/grid-contracts.md)。直接修正开发期错误行为，不新增内容回调兼容层；两单元已分别完成发布、视觉和Docs验收，Space关联Input窄链通过不代表完整Input API已验收。

Flex的完整内容、当前gap与原生样式见[Flex契约迁移](docs/migrations/flex-contracts.md)；Alert/ErrorBoundary的内容、关闭流程与Vue错误恢复见[Alert契约迁移](docs/migrations/alert-contracts.md)；Layout家族的原生根、当前配置与Sider受控/响应式链见[Layout契约迁移](docs/migrations/layout-contracts.md)。三者与Space已统一验收，证据及剩余边界见[本批最终回执](docs/audit/evidence/space-flex-alert-layout-final-acceptance.json)。

Theme的可写深响应式配置、同应用默认来源共享/跨应用与SSR隔离、mounted变量注入和可释放scope所有权，以及空算法/undefined覆盖、精确Alias类型和原生DOM引用target，集中见[Theme契约迁移](docs/migrations/theme-foundation-contracts.md)。开发期直接移除无消费的ThemeConfig.prefixCls；DOM类名沿用ConfigProvider顶层prefixCls，CSS变量名使用cssVarPrefix，不新增兼容通道。该源码里程碑不代表ConfigProvider/Tree完整单元或全库最终门禁已关闭。

共享 `useControlledValue` 的受控请求、撤控保留值与函数更新规则见[受控状态迁移](docs/migrations/controlled-value.md)。开发阶段直接修正 rc 内部状态语义，不提供旧行为开关。

组件 Token 配置保留字符串、数字和布尔标量，以支持已公开的 `InputNumber.handleVisible`；不接受函数或嵌套对象。各组件仍按其字段契约消费，布尔开关不会当作其他组件的 CSS 数值。

Switch 的 Provider 样式、具名槽、原生 attrs 和真实模板 ref 类型修正见[Switch API](packages/ui/src/switch/index.zh-CN.md)；全局 large 解析为该组件已支持的 medium，不新增尺寸能力。

十三个组件 Token 和已消费的全局别名读取当前主题，嵌套、替换和撤除均更新实际 CSS；保留原生与语义样式优先级。

### D-back-top-native-button

BackTop 改为原生 button 和完整内容槽，click 发送原生 MouseEvent，公开真实按钮引用；target 跟随当前模板 ref，并在换目标、重复点击和卸载时清理滚动动画。历史 div/首节点克隆的差异在本组件 semantic 测试中精确登记，参考基线保留。迁移见[BackTop API](packages/ui/src/back-top/index.zh-CN.md)。

### D-rate-native-events-and-focus

Rate 的 change/hoverChange/focus/blur 使用 Vue emits，焦点事件带原始 FocusEvent；具名槽和真实实例引用保留精确类型。radio 组只保留一个已选值和一个 Tab 入口，动态 tooltip 不替换焦点项；新增可达性属性与旧前缀差异逐场景精确比较，不忽略整类属性。迁移见[Rate API](packages/ui/src/rate/index.zh-CN.md)。

六个组件 Token 读取当前主题，嵌套、替换、撤除和全局派生及时生效；原生与语义样式继续按既有优先级覆盖。

### D-pagination-native-model-inputs

Pagination 保留既有原生插槽交付，修正受控页码/尺寸撤控、总量收缩、键盘提交、焦点归属及禁用交互。尺寸选择器使用原生 class；十二个组件 Token 与输入样式读取当前主题。精确 DOM 差异保留在 semantic 测试，参考基线不变，详见[Pagination API](packages/ui/src/pagination/index.zh-CN.md)。

### D-input-number-native-contracts

InputNumber 的 change/step/pressEnter 统一为 Vue 事件，模板引用暴露实际元素与方法；显式 null、受控撤除、输入法、光标及异步清理遵守文档契约。当前 Provider、variant 和组件 Token 跟随配置替换或移除，详见[InputNumber API](packages/ui/src/input-number/index.zh-CN.md)。

### D-steps-live-tokens

Steps 使用唯一 change emit，接通九个有效组件 Token。直接移除从未被组件消费的 customIconSize/customIconTop/iconTop/titleLineHeight；使用现有 iconSize/customIconFontSize 或原生样式表达受支持的定制，不新增旧字段兼容。既有四槽和 inline Tooltip 成果保留，详见[Steps API](packages/ui/src/steps/index.zh-CN.md)。

### D-progress-live-contracts

Progress 补齐动态位置、原生样式、当前 Provider/六 Token、Circle 描边与渐变、CSS 长度宽度等已声明行为；保留 format/rounding 与现有别名。单色 inner 文字修正前景对比，语义 color 仍优先；自定义渐变和透明背景的配色边界见[Progress API](packages/ui/src/progress/index.zh-CN.md)。Upload 已交付进度语义不变。

### D-masonry-native-layout

Masonry 的 layoutChange 使用 Vue emits，MasonryRef 与文档化 nativeElement() getter 一致；同 key 数据替换和离场资源保持正确。CSS 字符串 gutter 交由浏览器解析，纵向百分比使用文档化 intrinsic/显式高度基准，避免根高反馈循环；item.height 仍是槽和事件的数据，不新增布局提示语义。详见[Masonry API](packages/ui/src/masonry/index.zh-CN.md)。

### D-tooltip-current-overlay

Tooltip 的 openChange/popupClick/afterOpenChange 使用 Vue emits，原生 class/style 只作用于浮层根，模板 ref 暴露真实元素属性。afterOpenChange 通知通过 Popover、Popconfirm 同链迁移为 `@after-open-change` / `onAfterOpenChange`，不保留旧回调 prop。当前主题、箭头、层级与定位跟随实际配置和尺寸更新，详见[Tooltip API](packages/ui/src/tooltip/index.zh-CN.md)。两层包装的其余契约仍按各自进行中任务处理。

### D-float-button-native-group

FloatButton / Group 使用当前插槽、Provider 与主题别名；Group 通知改为 Vue emits，原生 attrs 只作用于根，trigger 在列表前以支持自然 Tab 顺序，Escape 在接受关闭后返回焦点。BackTop 保留当前目标并释放动画/监听，PurePanel 展示真实分支；既有样式生成器正确消费显式自定义前缀，不新增运行时 CSS。详见[FloatButton API](packages/ui/src/float-button/index.zh-CN.md)。

### D-popover-current-owner

Popover 拥有 openChange/popupClick/afterOpenChange 的 Vue emits，继承的样式与销毁别名真实转发；自身四 Token、当前 Provider 与 PurePanel 颜色生效。包装层把当前层级基准传给 Tooltip，共享同一层级上下文，不重复叠加。真实引用、原生样式与内容插槽沿用既有成果；wireframe 的视觉缺口仍明确延期，详见[Popover API](packages/ui/src/popover/index.zh-CN.md)。

### D-tree-native-contracts

Tree / DirectoryTree 修正受控模型、完整事件转发、原生事件载荷、实际焦点/滚动/行测量与加载和拖放资源。顶层 titleRender、icon/switcherIcon 等内容函数迁为具名作用域插槽；数据项函数按数据职责保留，TreeSelect 同步迁移实际消费桥。九个组件 Token 使用当前主题，prototype 命名键安全保留；Directory 叶子显示文件图标，历史 DOM 参考只登记精确差异。详见[Tree API](packages/ui/src/tree/index.zh-CN.md)。

### D-mentions-current-contracts

Mentions 保留六组既有整改，补齐当前 Provider/二十一个有效组合 Token、可空容器与真实模板 ref；只读、禁用和 hidden 路由到实际拥有者。PurePanel 在自身 host 展示真实菜单。移除未消费的 Mentions addonBg 与 OptionProps.children，Option 内容使用默认槽、key 支持 string/number；Input 自己有效的 addonBg 保留。详见[Mentions API](packages/ui/src/mentions/index.zh-CN.md)。

### D-tabs-native-contracts

Tabs 保留已交付 popup/extra 槽，修正受控撤除、同 key 面板身份、item 级销毁优先级、SSR 稳定 ARIA id 与真实 ref 属性。导航和溢出选项拥有独立的可访问树，关闭按钮保留键盘入口；当前 Provider 与二十四个有效 Token 实际消费。移除从未实现的顶层 children 与两个空 margin Token，items[].children 和 horizontalItemGutter 保留；开发版 editable 命令类型要求 remove 携带 key。详见[Tabs API](packages/ui/src/tabs/index.zh-CN.md)。

### D-upload-native-contracts

Upload / Dragger 修正文件预处理替换、请求/移除竞态、受控列表与取消、预览资源释放，统一原生 attrs、插槽、真实引用及当前 Provider/Token。beforeUpload=false 的 change 文件统一为 UploadFile，通过 originFileObj 读取原文件；自定义请求收到实际文件与默认请求服务。删除无消费的 supportServerRender/styleAttrs 和 UploadListProps.className；预览、下载、异步移除等有返回值的业务回调保留。原生根样式落 wrapper，详见[Upload API](packages/ui/src/upload/index.zh-CN.md)。

### D-popconfirm-native-sessions

Popconfirm 的所属通知使用 Vue emits，确认 Promise 仍是业务回调；当前配置与 Token 由 Popconfirm 拥有，不误用 Popover 配置。异步结果只关闭发起它的已接受会话，卸载后不再触发旧关闭；引用暴露实际实例。详见[Popconfirm API](packages/ui/src/popconfirm/index.zh-CN.md)。

### D-select-native-search-and-events

Select 的通知使用 Vue emits，value/open/searchValue 使用对应 v-model；showSearch 仅承载过滤与排序等搜索算法配置。原 showSearch.searchValue/onSearch/searchIcon 分别迁到顶层模型、search 事件与 #searchIcon，移除 onDropdownVisibleChange。当前配置、有效 Token、实际模板引用和共享引擎消费者同步修正；详见[Select API](packages/ui/src/select/index.zh-CN.md)。AutoComplete 同步转发 searchValue 模型更新。

### D-drawer-native-lifecycle

Drawer 的 close/afterOpenChange/resize/resizeStart/resizeEnd 使用 Vue emits，引用暴露实际 nativeElement 与 focus。resizable 直接使用 boolean，原对象内回调迁为对应 Vue 事件（尺寸载荷为 number）；删除未消费的 panelRef/destroyInactivePanel。修复真实 motion 完成通知、延迟销毁、受控尺寸与拖拽、嵌套推移和焦点资源，详见[Drawer API](packages/ui/src/drawer/index.zh-CN.md)。

### D-locale-provider-order

LocaleProvider 与 ConfigProvider 的静态确认语言来源按挂载顺序固定优先级，内容更新不重新占位；清空来源后旧清理不恢复过期语言。普通 Modal 只读取本应用响应式语言，静态 confirm 仍可显式传 locale；无上下文静态服务的全局来源边界保留。详见[Locale 当前契约](docs/foundation/locale-contract.md)。

### D-a11y-accepted-navigation

useRovingFocus 的 activeIndex 按既有文档作为受控输入，拒绝请求不再修改已接受值或抢焦点，撤控保留已接受值。需要本地初值时不传受控 activeIndex，调用 setActive(index, false)；零偏移保持当前位置，跳末项使用 moveEnd。键盘事件保留原生阻止/输入法边界，挂载前播报在真实宿主就绪后保留。详见[a11y 当前契约](docs/foundation/a11y-contract.md)。

### D-auto-complete-native-combobox

AutoComplete 的通知改为 Vue emits，并明确 value/searchValue/open 三个模型、实际模板引用与像素/条目滚动参数。backfill 只预览键盘候选，Enter/Tab/点击才提交；Tab 保留原生焦点移动。Provider 展示配置由真实包装者拥有，继续共享已文档化的 Select Token。原 showSearch.onSearch 迁为 search 事件，旧 onDropdownVisibleChange 迁 openChange；详见[AutoComplete API](packages/ui/src/auto-complete/index.zh-CN.md)。

### D-color-picker-native-content

ColorPicker 的 panelRender/showText 内容函数直接迁为 #panelRender/#showText；panel 作用域改为稳定组件引用，可用 `<component :is="panel" />`，不再需要 VNode 渲染适配器。默认触发器和预设色块具备原生键盘交互，尺寸采用共享 SizeType，attrs 落到实际触发节点；PurePanel 使用正常文档流并转发真实槽/事件，移除轮询和高度镜像。当前配置、渐变 alpha 与数字颜色输入同步修正，详见[ColorPicker API](packages/ui/src/color-picker/index.zh-CN.md)。

### D-transfer-native-models

Transfer 保留已有四槽成果，补齐 targetKeys/selectedKeys 双模型、所属 Vue 事件与真实引用。Search.handleClear 和 Operation.moveToLeft/moveToRight 命令 prop 改为 clear/move-to-left/move-to-right 事件；选择范围基于当前筛选视图，业务 key 和 Vue 节点身份保留。七 Token 接受 string/number 并读取当前主题；移除从未消费的 ListBodyProps.filteredItems，#list.filteredItems 保留。详见[Transfer API](packages/ui/src/transfer/index.zh-CN.md)。

### D-picker-native-panels

Picker 面板引擎的通知使用 Vue emits，PickerPanel 提供 value/pickerValue/mode 三个模型；cellRender 内容 prop 迁为 #cellRender，对日期与时间列提供真实 Dayjs/number/meridiem 类型。当前时间配置、Provider、原生槽和面板引用直接消费；滚动对齐、取消与卸载资源已修复。DatePicker/RangePicker/Calendar 仅同步引擎消费桥，CellRenderInfo.locale 修正为实际面板语言子集，包装器其余契约继续各自整改。详见[Picker 当前契约](docs/foundation/picker-contract.md)。

### D-dropdown-native-menu

Dropdown/DropdownButton 的开关、动效与主按钮通知使用 Vue emits，afterOpenChange prop 迁为 after-open-change 事件；真实引用保留既有三个 getter 方法。Provider、有效 Token、原生 attrs 与完整按钮/浮层槽真实消费，未实现的 icon 类型字段改用已有图标槽；id 落到实际触发节点。Menu 同步当前前缀、分组/动效、selectable 与键盘监听，语义样式传至实际菜单项。PurePanel 保持正常静态定位，详见[Dropdown API](packages/ui/src/dropdown/index.zh-CN.md)。

### D-form-core-native-scopes

Form Core 的通知由 Vue emits 拥有，store/useForm 的业务回调仍保留。Form、Field、List 默认槽分别接收 `{ values, form }`、`{ control, meta, form }`、`{ fields, operations, meta }`，模板与 h() 使用同一对象；UI Form/FormItem 同步迁移，FormList 已有对象形态保留。外部 store、动态注册、受控 fields 和校验资源同步修正，实际宿主通过 nativeElement 返回。详见[Form Core 当前契约](docs/foundation/form-core-contract.md)；UI Form 的完整外观整改仍单独推进。

### D-cascader-native-paths

Cascader/CascaderPanel 的通知使用 Vue emits，选择器提供 value/open/searchValue 三个模型。displayRender、optionRender、popupRender、showSearch.render、函数式标签与图标内容迁为原生槽；popupRender 的 menu 可直接用 `<component :is="menu" />`。移除未消费的 trigger/placeholder2 与重复开关通知，nativeElement 改为实际属性；过滤、排序和异步加载保留函数。修正类型安全的路径身份、当前配置/Token、键盘、异步会话和 raw 浮层传递，详见[Cascader API](packages/ui/src/cascader/index.zh-CN.md)。

### D-date-picker-native-input-and-panels

DatePicker/RangePicker 的内容函数迁为 cellRender/panelRender/extraFooter/tagRender 等具名槽，移除无实际替换链路的 components/inputRender、失效的 changeOnBlur 与无运行时组件的 PurePanel 类型。通知使用 Vue emits，value/open/pickerValue/mode 支持模型请求；keydown 只接收原生 KeyboardEvent，preventDefault() 在内部操作前生效，暴露 DOM 引用准确包含 null。修正输入草稿/IME、受控撤控、范围活动端与禁用时间、只读面板键盘、动态槽与主题及观察器清理；TimePicker 仅同步关联包装桥，详见[DatePicker API](packages/ui/src/date-picker/index.zh-CN.md)。

### D-menu-native-notifications

Menu 的选择/展开通知统一使用 Vue emits，原生键盘监听使用 onKeydown（模板为 @keydown），替代 React 拼法 onKeyDown；顶层 expandIcon 与静态子组件图标渲染迁为具名槽，数据项的图标和操作函数保留。移除从未消费的 children 类型，继续使用 items 数据源；实际 Overflow 根引用、当前 Provider/语义样式、已有十个 Token 和 popup/inline 层级职责同步修正，详见[Menu API](packages/ui/src/menu/index.zh-CN.md)。

### D-tree-select-native-tree-owner

TreeSelect 的通知统一为 Vue emits，保留 value/open/searchValue/treeExpandedKeys/treeLoadedKeys 模型，监听 change 不再改变值的形态。顶层标题/标签/浮层与图标内容函数迁为具名槽，数据项 title/icon 与过滤、加载服务保留真实数据职责；旧开关通知别名改为 openChange，nativeElement() 改为实际属性。配置由 TreeSelect 自己拥有，继续共享 Tree/Select Token；修正原始数据服务载荷、异步 children 更新、键盘和实际 tree ARIA 目标，详见[TreeSelect API](packages/ui/src/tree-select/index.zh-CN.md)。

### D-time-picker-native-owner

TimePicker/TimeRangePicker 固定为时间轴，移除从 DatePicker 误继承且无实际行为的 mode/defaultMode/update:mode、日期导航和多选标签声明，保留 value/open/pickerValue 模型与真实七/八个槽。两者读取当前 timePicker 配置并只合并一次语义样式，普通 Date Range 继续读取 rangePicker；独立 TimePicker 语言提示和动态撤回生效。没有新增 TimePicker Token 或内部面板，详见[TimePicker API](packages/ui/src/time-picker/index.zh-CN.md)。

### D-test-utils-native-contracts

Test Utils 保留既有 Vue 测试入口，修正真实 VNodeChild、CSS/DOM 精确归一、焦点与原生属性断言、异常卸载/observer目标身份和收集器恢复；空执行范围不能冒称通过。ObserverBaseline.resizeTargets 由数量改为实际目标身份集合，包外没有旧字段消费者。C11 只检查公开组件的真实 runtime props，保留精确非模型数据豁免；Steps 同步补齐 update:current，模板可直接使用 v-model:current，原 change 数字载荷保留。

### D-checkbox-native-input-events

Checkbox 的 change 改为 `(event: Event, checked: boolean)`：首参为原生事件，第二参保留本次提议；移除合成 target/nativeEvent 包装及旧 Target DTO。其余 DOM 通知采用原生拼写与事件，Group change 保留值数组；值范围统一为实际支持的 string/number/boolean。修正父拒绝更新后的 checked/indeterminate、动态 skipGroup 注册、当前 Provider 和原生样式，引用暴露真实 nullable DOM。Radio 仅同步已证实的勾选恢复边界，完整事件迁移仍另行审计；Table/Transfer 已同步本次消费，详见[Checkbox API](packages/ui/src/checkbox/index.zh-CN.md)。

### D-motion-native-slots-and-events

CSSMotion/MotionList 的可见性通知统一为 owned `visibleChanged` 事件，原 hooks.onVisibleChanged 迁为 `@visible-changed` / onVisibleChanged；其余有返回值的动效服务 hooks 保留。CSSMotion 将原生 attrs 与原 ref 合并到真实单个动画根，支持条件空槽和 Fragment，多个真实根明确不支持；MotionList 默认槽泛型保留移除项的浅快照元数据，component 支持原生标签、Vue 组件或 null。修正动态配置、异步准备错误归属与根替换后的监听释放，Trigger、Modal、Segmented、Form 和 Masonry 同步必要消费。详见[Motion 当前契约](docs/foundation/motion-contract.md)。

### D-form-native-content-and-instances

Form 的 requiredMark 内容函数迁为 `#requiredMark={ label, required }`，label 是可直接渲染的稳定组件；feedbackIcons / hasFeedback.icons 迁为 Form 或 FormItem 的 `#feedbackIcon={ status, errors, warnings }`，hasFeedback 保留 boolean。useFormInstance 读取最近的真实 Form 实例，useForm 保留工厂职责；getFieldInstance 返回实际控制实例，是否支持 focus 取决于该控件。移除无消费的 Item status/fieldId，使用已有 validateStatus/id；requiredMark 在 Form 上配置。同步修正动态槽撤除、路径聚合、原生 attrs、实际焦点/滚动、响应式列与当前十一 Token，详见[Form API](packages/ui/src/form/index.zh-CN.md)。

### D-table-native-data-and-content

Table 的顶层 title/footer/summary/expandedRowRender/expandIcon/emptyText 内容函数迁为具名槽，expandable 内同名全表内容函数也统一迁移；共享语言与组件 locale.emptyText 只承载静态内容，动态空态使用 #emptyText。按列或数据承担业务职责的 render/title/filterDropdown、排序过滤和选择操作函数保留。通知使用 Vue emits，change 保留四个实际业务载荷，scroll 使用原生 Event；公开泛型贯穿数据、列、槽、事件与真实模板引用，不要求用户添加索引签名。修正受控提议与撤控、同 key 行内容与焦点、当前配置和实际滚动资源；虚拟列表的 Vue holder/行按真实 HTMLElement 根测量，隐藏测量单元不再重复挂载表头交互，不可展开行使用装饰占位。详见[Table API](packages/ui/src/table/index.zh-CN.md)。

### D-radio-native-input-and-group

Radio/RadioButton 的 change 改为 `(event: Event, checked: boolean)`，RadioGroup 的 change 改为 `(value: RadioValue, event: Event)`，分别保留 checked/value 模型；RadioChangeEvent 仅为原生 Event 别名，不再构造 target/nativeEvent 包装。选项 change 同步原生双参，Table 保留同一事件，Calendar/Header Demo 使用已有 update:value。移除无实际职责的 Radio skipGroup/type/optionType 声明，Group 的 optionType 保留。修正当前 Provider/十六 Token、完整内容和原生 attrs、选项身份/焦点、Button 引用与单次通知；已交付的受控整组 DOM 恢复继续保留，详见[Radio API](packages/ui/src/radio/index.zh-CN.md)。
