/**
 * registry/source/rc-map.mjs
 *
 * Ant Design 依赖 → 能力 → 我们的替代方案。
 *
 * 这是「rc-* 依赖分析」的权威决策表，由 gen-registry.mjs 消费后产出
 * registry/dependencies.json。
 *
 * strategy 取值：
 *   'reuse'  直接复用（该包与框架无关，纯数据/纯算法）
 *   'apollo' 由 @apollo-design 独立包承接
 *   'in-ui'  由 packages/ui 内部承接（只有单一消费者，不值得独立成包）
 *   'drop'   不需要（Vue 原生已覆盖，或仅服务 React）
 *
 * foundationPkg：当 strategy 为 'apollo'/'in-ui' 时，声明它归属哪个包。
 *                gen-registry 用它推导每个组件需要哪些 @apollo-design/* 包。
 */

/** @type {Array<{pkg:string,kind:'rc'|'ecosystem'|'transitive',capability:string,strategy:'reuse'|'apollo'|'in-ui'|'drop',target:string,foundationPkg:string|null,rationale:string,risk:'low'|'medium'|'high'}>} */
export const RC_MAP = [
  // =========================================================================
  // 地基级：被大量组件依赖，必须最先完成
  // =========================================================================
  {
    pkg: '@rc-component/util',
    kind: 'rc',
    capability:
      '通用工具集：is* 类型判断、warning、DOM 操作、raf、scroll、getScrollBarSize、useLayoutEffect、ref 合并、pickAttrs、support 检测、KeyCode 等',
    strategy: 'apollo',
    target: '@apollo-design/utils',
    foundationPkg: '@apollo-design/utils',
    rationale:
      '被 61 个组件引用，是整个 antd 的事实地基。绑定 React（peer 要求 react>=18，且依赖 react-is），必须自己实现。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/motion',
    kind: 'rc',
    capability:
      'CSSMotion：声明式 CSS 过渡/动画控制，支持 motionAppear / motionEnter / motionLeave / motionDeadline / motionLeaveImmediately / 多元素 stagger',
    strategy: 'apollo',
    target: '@apollo-design/motion',
    foundationPkg: '@apollo-design/motion',
    rationale:
      '被 12 个组件引用。Vue 内置 <Transition> 无法表达 motionDeadline、motionLeaveImmediately、以及「先渲染再离开」的两阶段语义。必须自研，但可以基于 Vue 的 Transition hooks 实现。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/trigger',
    kind: 'rc',
    capability:
      '浮层触发器：定位对齐（含翻转/自适应）、箭头、滚动容器跟随、点击/悬停/聚焦触发时机、getPopupContainer、延迟显隐',
    strategy: 'apollo',
    target: '@apollo-design/position（定位）+ @apollo-design/overlay（生命周期）',
    // ⚠️ 一拆二：rc 的 trigger 把「定位数学」与「浮层生命周期」耦合在一个组件里。
    //    本项目拆开，理由见 ARCHITECTURE.md §3.4 —— 定位是本项目最大的架构风险（AR1），
    //    拆开后 AR1 的 PoC 可以只用纯函数 + 尺寸测量验证，不必牵扯触发时机与生命周期。
    foundationPkg: ['@apollo-design/position', '@apollo-design/overlay'],
    rationale:
      '被 tooltip / popover / dropdown / select 等全部浮层组件依赖。是像素级视觉一致性的最大风险点（见 ARCHITECTURE.md AR1）。拆为 position（纯定位）+ overlay（触发时机与生命周期）后，AR1 可被独立验证。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/tooltip',
    kind: 'rc',
    capability: 'Tooltip 行为层：基于 trigger 的提示框逻辑，含箭头合并、PurePanel',
    strategy: 'apollo',
    target: '@apollo-design/position（定位部分）+ ui 内部（提示框语义）',
    foundationPkg: ['@apollo-design/position', '@apollo-design/overlay'],
    rationale:
      '其价值 90% 在定位能力，已由 @apollo-design/position 承接；生命周期由 @apollo-design/overlay 承接。剩余的 Tooltip 语义属于组件层，留在 ui 内部。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/resize-observer',
    kind: 'rc',
    capability: '元素尺寸变化监听（含多元素批量监听、单例 observer 复用）',
    strategy: 'apollo',
    target: '@apollo-design/utils（内部使用 @vueuse/core 的 useResizeObserver）',
    foundationPkg: '@apollo-design/utils',
    rationale:
      '只被 5 个组件使用，不值得独立成包。@vueuse/core 已提供成熟实现且已被 Vue 生态广泛验证。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/mutate-observer',
    kind: 'rc',
    capability: 'DOM 变更监听（MutationObserver 封装）',
    strategy: 'apollo',
    target: '@apollo-design/utils',
    foundationPkg: '@apollo-design/utils',
    rationale: '使用面窄（仅 layout 场景），并入 utils 即可。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/context',
    kind: 'transitive',
    capability: '高性能 context 选择器（避免 context 变化导致整棵树重渲染）',
    strategy: 'drop',
    target: 'Vue 原生 provide/inject',
    foundationPkg: null,
    rationale:
      '它存在的唯一理由是解决 React context 全量重渲染的性能问题。Vue 的响应式系统天然只更新依赖了变化数据的组件，该问题不存在。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/virtual-list',
    kind: 'transitive',
    capability: '虚拟滚动列表（定高/动态高度、横向、滚动到指定项）',
    strategy: 'apollo',
    target: '@apollo-design/virtual-list',
    foundationPkg: '@apollo-design/virtual-list',
    rationale:
      'antd 通过 select / tree / table / cascader / tree-select 传递依赖。是真实的高复用能力，且有明确的无视觉语义边界。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/overflow',
    kind: 'transitive',
    capability: '溢出检测与响应式折叠（哪些子项放不下）',
    strategy: 'apollo',
    target: '@apollo-design/utils（overflow 检测）+ ui 内部（折叠策略）',
    foundationPkg: '@apollo-design/utils',
    rationale: '被 float-button / segmented 使用。检测能力入 utils，折叠策略属组件语义留在 ui。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/portal',
    kind: 'transitive',
    capability: '渲染到指定容器（含 SSR 安全的挂载、容器上下文传递）',
    strategy: 'apollo',
    target: '@apollo-design/portal（基于 Vue Teleport）',
    foundationPkg: '@apollo-design/portal',
    rationale:
      'Vue 的 <Teleport> 解决了「渲染到别处」，但 antd 还需要：容器创建与复用、SSR 安全的延迟挂载、getPopupContainer 解析、z-index 层级管理、以及「同一容器内多个浮层的堆叠顺序」。这些必须自己实现。',
    risk: 'medium',
  },

  // =========================================================================
  // 领域引擎级：复杂但无视觉语义，独立成包
  // =========================================================================
  {
    pkg: '@rc-component/form',
    kind: 'rc',
    capability:
      '表单状态机 + 字段校验：字段注册/注销、依赖联动、异步校验、validateFields/setFieldsValue/getFieldsValue、错误状态管理',
    strategy: 'apollo',
    target: '@apollo-design/form-core',
    foundationPkg: '@apollo-design/form-core',
    rationale:
      '被 Form 之外的 12+ 个组件（Calendar/Card/Cascader/Checkbox/Input/InputNumber/Mentions/Pagination/Radio/Select/TimePicker/Transfer/TreeSelect）依赖其 context 与校验语义。依赖 @rc-component/async-validator，需要一并重写校验器。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/async-validator',
    kind: 'transitive',
    capability: '异步校验规则引擎（rules → 校验器映射、内置规则、自定义 validator）',
    strategy: 'apollo',
    target: '@apollo-design/form-core（内置校验器）',
    foundationPkg: '@apollo-design/form-core',
    rationale:
      'antd 的 Form rules 语义（required / type / pattern / min / max / validator / transform / 自定义 message）与它强绑定。必须实现同名同语义的校验器，否则用户迁移时会遇到校验行为差异。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/picker',
    kind: 'rc',
    capability:
      '日期/时间选择引擎：日历网格生成、周/月/季/年面板切换、区间选择状态机、键盘导航、locale 适配',
    strategy: 'apollo',
    target: '@apollo-design/picker',
    foundationPkg: '@apollo-design/picker',
    rationale:
      '被 DatePicker / TimePicker / Calendar / RangePicker 复用。依赖 dayjs（可直接复用）。面板切换与区间选择是完整的状态机，放在组件内部会导致无法共享。',
    risk: 'high',
  },

  // =========================================================================
  // 单组件内部引擎：留在 ui 内，不独立成包
  // =========================================================================
  {
    pkg: '@rc-component/select',
    kind: 'rc',
    capability: 'Select 引擎：选项过滤、键盘导航、多选/标签、搜索、虚拟滚动、下拉渲染',
    strategy: 'in-ui',
    target: 'packages/ui/src/select/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '消费者是 Select / AutoComplete / TreeSelect 三者，但它们共享的其实是「下拉 + 键盘 + 虚拟滚动」的组合，已由 trigger + virtual-list 覆盖。剩余部分是 Select 的视觉语义，留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/table',
    kind: 'rc',
    capability: 'Table 引擎：列定义、固定列/表头、虚拟滚动、展开行、排序过滤、行列合并、measure 行',
    strategy: 'in-ui',
    target: 'packages/ui/src/table/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '只有 Table 一个消费者。按 ARCHITECTURE.md §2 判据（≥2 消费者才独立成包），暂不提取。若未来出现第二个消费者（如可编辑表格 ProTable），再提取为 @apollo-design/table-core。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/tree',
    kind: 'rc',
    capability: 'Tree 引擎：树数据扁平化、展开/选中/勾选状态、拖拽、虚拟滚动、键盘导航',
    strategy: 'in-ui',
    target: 'packages/ui/src/tree/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Tree / TreeSelect（后者可复用前者）。暂留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/menu',
    kind: 'rc',
    capability: 'Menu 引擎：菜单项扁平化、展开收起、选中/高亮、键盘导航、溢出折叠',
    strategy: 'in-ui',
    target: 'packages/ui/src/menu/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Menu / Dropdown（Dropdown 复用 Menu 渲染）。留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/tabs',
    kind: 'rc',
    capability: 'Tabs 引擎：标签溢出计算、滑动指示条、键盘导航、可编辑标签',
    strategy: 'in-ui',
    target: 'packages/ui/src/tabs/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Tabs / Card（Card 的 tabList）。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/steps',
    kind: 'rc',
    capability: 'Steps 引擎：步骤状态推导、进度计算',
    strategy: 'in-ui',
    target: 'packages/ui/src/steps/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Steps / Timeline。留在 ui 内。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/collapse',
    kind: 'rc',
    capability: 'Collapse 引擎：手风琴模式、面板展开状态管理',
    strategy: 'in-ui',
    target: 'packages/ui/src/collapse/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。留在 ui 内。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/cascader',
    kind: 'rc',
    capability: 'Cascader 引擎：多级面板、路径选择、搜索、懒加载',
    strategy: 'in-ui',
    target: 'packages/ui/src/cascader/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者（可复用 select 的下拉与键盘能力）。留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/tree-select',
    kind: 'rc',
    capability: 'TreeSelect 引擎：树 + 选择器融合',
    strategy: 'in-ui',
    target: 'packages/ui/src/tree-select/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者，且可组合 Tree + Select 的能力。留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/checkbox',
    kind: 'rc',
    capability: 'Checkbox 引擎：受控/非受控、indeterminate、Checkbox.Group',
    strategy: 'in-ui',
    target: 'packages/ui/src/checkbox/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Checkbox / Radio。留在 ui 内。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/input',
    kind: 'rc',
    capability: 'Input 引擎：受控值同步、计数、TextArea 自适应高度、输入法组合态处理',
    strategy: 'in-ui',
    target: 'packages/ui/src/input/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '消费者为 Input / Typography（可编辑文本）。注意「输入法组合态（IME）」处理是必须保留的能力，不能简化。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/input-number',
    kind: 'rc',
    capability: 'InputNumber 引擎：数值格式化、精度、步进、边界钳制、键盘上下键',
    strategy: 'in-ui',
    target: 'packages/ui/src/input-number/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/slider',
    kind: 'rc',
    capability: 'Slider 引擎：单/双滑块、拖拽计算、刻度对齐、键盘控制',
    strategy: 'in-ui',
    target: 'packages/ui/src/slider/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Slider / ColorPicker（色相与透明度滑块）。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/switch',
    kind: 'rc',
    capability: 'Switch 引擎：受控切换、加载态、键盘切换',
    strategy: 'in-ui',
    target: 'packages/ui/src/switch/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者，逻辑简单。留在 ui 内。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/rate',
    kind: 'rc',
    capability: 'Rate 引擎：半星/整星、悬停预览、键盘调整',
    strategy: 'in-ui',
    target: 'packages/ui/src/rate/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。留在 ui 内。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/segmented',
    kind: 'rc',
    capability: 'Segmented 引擎：滑动指示器、键盘导航、溢出',
    strategy: 'in-ui',
    target: 'packages/ui/src/segmented/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/pagination',
    kind: 'rc',
    capability: 'Pagination 引擎：页码计算、省略号策略、跳转、每页条数切换',
    strategy: 'in-ui',
    target: 'packages/ui/src/pagination/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '消费者为 Pagination / Table / List / Transfer。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/upload',
    kind: 'rc',
    capability: 'Upload 引擎：文件选择、拖拽、请求队列、进度、文件列表管理',
    strategy: 'in-ui',
    target: 'packages/ui/src/upload/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。注意 XHR 上传与 abort 语义必须保留。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/mentions',
    kind: 'rc',
    capability: 'Mentions 引擎：@ 触发检测、光标位置、下拉候选、插入回填',
    strategy: 'in-ui',
    target: 'packages/ui/src/mentions/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者，与文本编辑强耦合。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/dropdown',
    kind: 'rc',
    capability: 'Dropdown 引擎：触发方式组合、菜单渲染、选中关闭',
    strategy: 'in-ui',
    target: 'packages/ui/src/dropdown/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '由 trigger + menu 组合而成，剩余部分属组件语义。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/dialog',
    kind: 'rc',
    capability: 'Dialog 引擎：焦点陷阱、Esc 关闭、遮罩、滚动锁定、可拖拽/可调整大小、SSR 安全挂载',
    strategy: 'in-ui',
    target: 'packages/ui/src/modal/engine/ + @apollo-design/portal',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '被 Modal / Drawer 共用。其中「挂载与层级」由 portal 承接；「焦点陷阱 + 滚动锁定 + Esc」属交互语义，留在 ui 内。焦点管理必须完整实现，不可简化（a11y 要求）。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/drawer',
    kind: 'rc',
    capability: 'Drawer 引擎：四向抽屉、尺寸调整、嵌套推挤',
    strategy: 'in-ui',
    target: 'packages/ui/src/drawer/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '与 dialog 共享焦点与挂载能力。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/notification',
    kind: 'rc',
    capability: 'Notification/Message 引擎：堆叠管理、自动关闭计时、位置、更新已有通知',
    strategy: 'in-ui',
    target: 'packages/ui/src/notification/engine/ + @apollo-design/portal + @apollo-design/motion',
    foundationPkg: '@apollo-design/ui',
    rationale: '被 Notification / Message 共用。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/image',
    kind: 'rc',
    capability: 'Image 引擎：预览浮层、缩放旋转、多图切换',
    strategy: 'in-ui',
    target: 'packages/ui/src/image/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/color-picker',
    kind: 'rc',
    capability: 'ColorPicker 引擎：色相/饱和度/明度面板、色值转换、取色、渐变',
    strategy: 'in-ui',
    target: 'packages/ui/src/color-picker/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者。色值数学部分复用 @ant-design/fast-color，面板交互留在 ui 内。',
    risk: 'high',
  },
  {
    pkg: '@rc-component/progress',
    kind: 'rc',
    capability: 'Progress 引擎：线/圆/仪表盘路径计算、进度动画',
    strategy: 'in-ui',
    target: 'packages/ui/src/progress/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '单消费者，主要是 SVG 路径数学。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/qrcode',
    kind: 'rc',
    capability: 'QRCode 引擎：二维码编码与画布绘制',
    strategy: 'reuse',
    target: '第三方纯 JS 二维码库（如 qrcode / qr-code-styling）+ ui 内部组件层',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '二维码编码是纯算法，重写无收益。rc 版本绑定 React，改用框架无关的第三方库，仅在 ui 内部包一层组件。⚠️ 选型需在开发 QRCode 组件时实测确认（候选：qrcode、qr-code-styling）。',
    risk: 'low',
  },
  {
    pkg: '@rc-component/listy',
    kind: 'rc',
    capability: 'Listy 引擎（v6 新增）：轻量列表的滚动与项渲染',
    strategy: 'in-ui',
    target: 'packages/ui/src/listy/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: 'antd v6 新组件，单消费者。留在 ui 内。',
    risk: 'medium',
  },
  {
    pkg: '@rc-component/tour',
    kind: 'rc',
    capability: 'Tour 引擎：步骤引导、目标高亮定位、步骤切换',
    strategy: 'in-ui',
    target: 'packages/ui/src/tour/engine/',
    foundationPkg: '@apollo-design/ui',
    rationale: '由 trigger + portal 组合而成。留在 ui 内。',
    risk: 'medium',
  },

  // =========================================================================
  // 生态包：框架无关的直接复用，绑定 React 的必须替换
  // =========================================================================
  {
    pkg: '@ant-design/icons',
    kind: 'ecosystem',
    capability: 'React 图标组件集（800+ 图标）',
    strategy: 'apollo',
    target: '@apollo-design/icons（以 @ant-design/icons-svg 为数据源生成 Vue 组件）',
    foundationPkg: '@apollo-design/icons',
    rationale:
      '图标是 React 组件，无法在 Vue 使用。但其底层数据包 @ant-design/icons-svg 是框架无关的纯 SVG 数据（零依赖），直接复用即可获得图标级像素一致性。',
    risk: 'low',
  },
  {
    pkg: '@ant-design/icons-svg',
    kind: 'ecosystem',
    capability: '图标原始 SVG 数据（框架无关）',
    strategy: 'reuse',
    target: '直接依赖',
    foundationPkg: '@apollo-design/icons',
    rationale:
      '纯数据包，peerDependencies 为空、零运行时依赖。复用它是达成图标视觉一致的最省成本路径。',
    risk: 'low',
  },
  {
    pkg: '@ant-design/colors',
    kind: 'ecosystem',
    capability: '预设色板生成算法（13 色 × 10 阶梯度）',
    strategy: 'reuse',
    target: '直接依赖',
    foundationPkg: '@apollo-design/theme',
    rationale: '纯算法，无框架耦合。复用可保证色板梯度与 antd 完全一致。',
    risk: 'low',
  },
  {
    pkg: '@ant-design/fast-color',
    kind: 'ecosystem',
    capability: '高性能颜色解析与转换（hex/rgb/hsl/hsv/alpha）',
    strategy: 'reuse',
    target: '直接依赖',
    foundationPkg: '@apollo-design/theme',
    rationale: '纯算法，零依赖。色值数学不必重写。',
    risk: 'low',
  },
  {
    pkg: '@ant-design/cssinjs',
    kind: 'ecosystem',
    capability: 'CSS-in-JS 运行时（动态样式生成、hash 类名、SSR 样式收集）',
    strategy: 'drop',
    target: '静态 CSS + CSS 变量（@apollo-design/theme 的 cssVar 层）',
    foundationPkg: null,
    rationale:
      '与 React 深度耦合（依赖 useInsertionEffect 等）。本项目采用零运行时 CSS 变量方案（ARCHITECTURE.md §4.3），antd 自身 v6 也引入了 zeroRuntime 模式，方向一致。',
    risk: 'high',
  },
  {
    pkg: '@ant-design/cssinjs-utils',
    kind: 'ecosystem',
    capability: 'CSS-in-JS 的工具层（genStyleHooks / genComponentStyleHook 的基础）',
    strategy: 'drop',
    target: '不需要',
    foundationPkg: null,
    rationale: '同上，CSS-in-JS 方案已整体弃用。',
    risk: 'low',
  },
  {
    pkg: '@ant-design/react-slick',
    kind: 'ecosystem',
    capability: 'Carousel 轮播（React 版 slick 移植）',
    strategy: 'drop',
    target: 'ui 内部自研 Carousel，或复用框架无关的 embla-carousel',
    foundationPkg: '@apollo-design/ui',
    rationale:
      '它是 React 组件移植，无法在 Vue 使用。Carousel 的滑动/无限循环/自动播放逻辑不复杂，自研可控性更高。⚠️ 若自研成本超预期，embla-carousel（框架无关）是备选。',
    risk: 'medium',
  },
  {
    pkg: 'dayjs',
    kind: 'ecosystem',
    capability: '日期时间处理（含 locale、插件体系）',
    strategy: 'reuse',
    target: '直接依赖',
    foundationPkg: null,
    rationale:
      '纯库、零依赖、框架无关。antd 的 DatePicker 系 API（如 value 接受 dayjs 对象）与它绑定，复用它是兼容性的必要条件。',
    risk: 'low',
  },
  {
    pkg: 'clsx',
    kind: 'ecosystem',
    capability: 'className 条件拼接',
    strategy: 'drop',
    target: 'Vue 内置 :class 的对象/数组语法',
    foundationPkg: null,
    rationale: 'Vue 模板原生支持 class 的对象与数组语法，不需要额外库。',
    risk: 'low',
  },
  {
    pkg: 'throttle-debounce',
    kind: 'ecosystem',
    capability: '节流与防抖',
    strategy: 'apollo',
    target: '@apollo-design/utils',
    foundationPkg: '@apollo-design/utils',
    rationale:
      '实现量极小（~50 行），但必须保证与 antd 相同的语义（leading/trailing、cancel、返回值）。',
    risk: 'low',
  },
  {
    pkg: 'scroll-into-view-if-needed',
    kind: 'ecosystem',
    capability: '将元素滚动到可视区域（含滚动容器链、平滑滚动降级）',
    strategy: 'reuse',
    target: '直接依赖',
    foundationPkg: null,
    rationale: '纯 DOM 库、零依赖、框架无关。复用可保证滚动行为一致。',
    risk: 'low',
  },
  {
    pkg: '@babel/runtime',
    kind: 'ecosystem',
    capability: 'Babel 转译辅助函数运行时',
    strategy: 'drop',
    target: 'Vite / esbuild 的构建期 target 降级',
    foundationPkg: null,
    rationale: '这是构建工具的产物，不是业务能力。Vite 在构建期处理，不需要运行时包。',
    risk: 'low',
  },
];

/**
 * rc 包 / 生态包 → 组件所需的 @apollo-design/* 包。
 * gen-registry.mjs 用它为每个组件推导 `needs`。
 */
export const PKG_TO_FOUNDATION = Object.fromEntries(
  RC_MAP.filter((e) => e.foundationPkg).map((e) => [e.pkg, e.foundationPkg]),
);

/**
 * 叶子模块路径前缀 → foundation 包。
 * 组件即使不直接依赖 rc 包，也可能通过叶子模块间接需要某个能力
 * （例如 Input 通过 `form/context` 需要 form-core 的表单上下文）。
 */
export const LEAF_PREFIX_TO_FOUNDATION = {
  'config-provider/': null, // 由 config-provider 组件承接，不算 foundation 包
  'form/': '@apollo-design/form-core',
  'select/': null, // select 是组件，其叶子模块复用由 ui 内部解决
  'space/': null,
  'grid/': null,
  'button/': null,
  'dropdown/': null,
  'menu/': null,
  'tooltip/': null,
  'popover/': null,
  'notification/': null,
  'app/': null,
  'modal/': null,
  'message/': null,
  'drawer/': null,
  'watermark/': null,
  'steps/': null,
  'timeline/': null,
  'date-picker/': null,
  'tree/': null,
  'input/': null,
  'checkbox/': null,
  'radio/': null,
  'color-picker/': null,
  'table/': null,
};

// ---------------------------------------------------------------------------
// 组件 → 需要哪些 foundation 能力（策展规则）
//
// 为什么需要人工策展，而不是全从 rc 依赖自动推导：
//   rc 依赖表只说明「antd 用了哪个包」，不说明「我们把它归到哪一层能力」。
//   典型例子：modal 的 rcDeps 是 `dialog`，而 dialog 在 rc-map 里策略是 `in-ui`
//   （因为 Dialog 本身是组件形态，不该独立成包）—— 但 modal **仍然需要**
//   portal（挂载）、a11y（焦点陷阱）、motion（动效）这三个包的能力。
//   这种「能力需求」只能人工确认，且必须可审查，所以集中放在这里。
// ---------------------------------------------------------------------------

/** 锚定浮层：需要 position（定位）+ overlay（触发时机与生命周期）+ portal（挂载） */
export const OVERLAY_COMPONENTS = new Set([
  'auto-complete',
  'cascader',
  'color-picker',
  'date-picker',
  'dropdown',
  'mentions',
  'popconfirm',
  'popover',
  'select',
  'slider', // 滑块手柄的 tooltip
  'table', // 筛选/排序下拉
  'time-picker',
  'tooltip',
  'tour',
  'tree-select',
]);

/** 需要 portal：脱离文档流挂载到容器（浮层、对话框、全局提示、图片预览） */
export const PORTAL_COMPONENTS = new Set([
  'drawer',
  'image', // Preview 预览层
  'message',
  'modal',
  'notification',
  'qr-code', // 全屏预览（若存在）
]);

/** 需要 a11y 运行时原语：焦点陷阱 / roving tabindex / active-descendant / live region / typeahead */
export const A11Y_COMPONENTS = new Set([
  'auto-complete',
  'cascader',
  'checkbox',
  'drawer',
  'dropdown',
  'form',
  'input',
  'input-number',
  'menu',
  'mentions',
  'message', // live region 播报
  'modal',
  'notification', // live region 播报
  'pagination',
  'radio',
  'rate',
  'select',
  'slider',
  'steps',
  'switch',
  'table',
  'tabs',
  'time-picker',
  'tour',
  'transfer',
  'tree',
  'tree-select',
  'upload',
]);

/** 需要 locale：内置文案（占位符、空状态、校验提示、月份/星期名等）必须可被 ConfigProvider 覆盖 */
export const LOCALE_COMPONENTS = new Set([
  'calendar',
  'cascader',
  'date-picker',
  'empty',
  'form',
  'image',
  'input',
  'list',
  'modal',
  'pagination',
  'popconfirm',
  'select',
  'table',
  'time-picker',
  'transfer',
  'tree-select',
  'upload',
]);

/** 需要 motion：进入/离开动效（含 antd 的 wave 涟漪） */
export const MOTION_COMPONENTS = new Set([
  'alert',
  'back-top',
  'badge',
  'button',
  'collapse',
  'drawer',
  'float-button',
  'form', // 校验提示的进出
  'masonry',
  'menu', // 子菜单展开
  'message',
  'modal',
  'notification',
  'progress',
  'spin',
  'tabs',
  'tag', // 可关闭标签的移除
  'tooltip',
  'upload',
]);

/** 需要 virtual-list：大数据量滚动 */
export const VIRTUAL_LIST_COMPONENTS = new Set(['select', 'table', 'tree', 'tree-select', 'list']);

/** 需要 form-core：字段注册、校验、依赖联动 */
export const FORM_CORE_COMPONENTS = new Set([
  'form',
  'input',
  'input-number',
  'select',
  'checkbox',
]);

/** 需要 picker 引擎：日期/时间面板 */
export const PICKER_COMPONENTS = new Set(['date-picker', 'time-picker', 'calendar']);

/**
 * 组件级 → 视觉语义。用于给 registry 的 category 兜底校验。
 * 真正的 category 由 components.meta.mjs 人工指定（对齐 antd 文档分组）。
 */
export const ANT_DESIGN_DOC_GROUPS = [
  '通用',
  '布局',
  '导航',
  '数据录入',
  '数据展示',
  '反馈',
  '其他',
];
