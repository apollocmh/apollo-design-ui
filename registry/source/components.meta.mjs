/**
 * registry/source/components.meta.mjs
 *
 * 72 个组件的「人工决策」元数据。
 *
 * 分工：
 *   - 本文件 = 人的判断（分组、优先级、复杂度、备注）
 *   - registry/source/antd-<v>.raw.json = 从 antd 产物提取的客观事实（依赖、规模、Token）
 *   - registry/tools/gen-registry.mjs = 把两者合成 registry/components.json
 *
 * 优先级规则（AGENTS.md §3 + WORKFLOW.md G0）：
 *   P0 地基与首个垂直切片 —— 没有它就无法验证任何流水线
 *   P1 简单展示 —— 无浮层、无引擎，用来把 7 层测试跑顺
 *   P2 无浮层的表单/展示控件
 *   P3 浮层基础设施的第一个消费者（trigger / portal / motion 的验证点）
 *   P4 浮层之上的交互控件
 *   P5 数据密集型与复杂引擎
 *
 * 硬约束（由 validate-registry.mjs 检查）：
 *   组件的 priority 数值不得小于其任一阻塞性依赖的 priority 数值。
 *
 * complexity：S / M / L / XL —— 用于在同优先级内优先做小的，快速验证流水线。
 */

/** @typedef {{name:string, exportName:string, group:string, priority:'P0'|'P1'|'P2'|'P3'|'P4'|'P5', complexity:'S'|'M'|'L'|'XL', extraNeeds?:string[], notes?:string}} ComponentMeta */

/** @type {ComponentMeta[]} */
export const COMPONENTS = [
  // =========================================================================
  // P0 — 地基与首个垂直切片
  // =========================================================================
  {
    name: 'empty',
    exportName: 'Empty',
    group: '数据展示',
    priority: 'P0',
    complexity: 'S',
    notes:
      'config-provider 的 defaultRenderEmpty 依赖它，因此必须先于 config-provider 完成。' +
      ' 2026-09-17：G1→G14 走完，10 个维度 done / 2 个 n/a（token / interaction，依据见 layerNotes）' +
      ' / 1 个 blocked（visualStatus —— L6 视觉回归基建尚未落地，见 blockers）。' +
      ' 本组件同时是组件侧流水线的第一块试金石：它暴露并修掉了 4 个基础设施缺口' +
      '（ui 的 SFC 构建与类型产物、compat 基线机制、mountTest 的观察者误报、tests/build 的字母序构建）。',
  },
  {
    name: 'config-provider',
    exportName: 'ConfigProvider',
    group: '其他',
    priority: 'P0',
    complexity: 'L',
    notes:
      'Token / 主题 / locale / size / disabled / prefixCls 的统一入口，是全部组件的运行时网关。它是零运行时 CSS 变量方案（ARCHITECTURE.md §4.3）的落地点。',
  },
  {
    name: 'button',
    exportName: 'Button',
    group: '通用',
    priority: 'P0',
    complexity: 'M',
    notes:
      '【第一个 Vertical Slice】选择理由见 docs/PHASE-1-REPORT.md §17：规模适中（M）、无浮层无引擎、覆盖 Props/Events/Slots/Expose/Token/样式/主题/动效/wave 全部机制，是验证整条流水线成本最低的组件。',
  },
  {
    name: 'space',
    exportName: 'Space',
    group: '布局',
    priority: 'P0',
    complexity: 'S',
    notes: 'button 的阻塞性依赖；同时是 Compact 间距语义的承载者，被大量表单组件复用。',
  },
  {
    name: 'flex',
    exportName: 'Flex',
    group: '布局',
    priority: 'P0',
    complexity: 'S',
  },
  {
    name: 'grid',
    exportName: 'Grid',
    group: '布局',
    priority: 'P0',
    complexity: 'M',
    notes: '包含 Row / Col 子组件与 useBreakpoint 响应式断点能力，是布局体系的基础。',
  },
  {
    name: 'divider',
    exportName: 'Divider',
    group: '布局',
    priority: 'P0',
    complexity: 'S',
  },
  {
    name: 'typography',
    exportName: 'Typography',
    group: '通用',
    priority: 'P0',
    complexity: 'M',
    notes: '含 Title / Text / Paragraph / Link 子组件，以及 ellipsis / copyable / editable 能力。',
  },

  // =========================================================================
  // P1 — 简单展示（无浮层、无引擎）
  // =========================================================================
  { name: 'layout', exportName: 'Layout', group: '布局', priority: 'P1', complexity: 'M' },
  { name: 'tag', exportName: 'Tag', group: '数据展示', priority: 'P1', complexity: 'S' },
  { name: 'badge', exportName: 'Badge', group: '数据展示', priority: 'P1', complexity: 'S' },
  { name: 'alert', exportName: 'Alert', group: '反馈', priority: 'P1', complexity: 'M' },
  { name: 'skeleton', exportName: 'Skeleton', group: '反馈', priority: 'P1', complexity: 'S' },
  { name: 'spin', exportName: 'Spin', group: '反馈', priority: 'P1', complexity: 'S' },
  { name: 'result', exportName: 'Result', group: '反馈', priority: 'P1', complexity: 'S' },
  {
    name: 'watermark',
    exportName: 'Watermark',
    group: '数据展示',
    priority: 'P1',
    complexity: 'M',
  },
  {
    name: 'border-beam',
    exportName: 'BorderBeam',
    group: '通用',
    priority: 'P1',
    complexity: 'S',
    notes: 'antd v6 新增组件。',
  },
  {
    name: 'statistic',
    exportName: 'Statistic',
    group: '数据展示',
    priority: 'P1',
    complexity: 'S',
  },
  { name: 'affix', exportName: 'Affix', group: '导航', priority: 'P1', complexity: 'S' },
  { name: 'back-top', exportName: 'BackTop', group: '导航', priority: 'P1', complexity: 'S' },

  // =========================================================================
  // P2 — 无浮层的表单/展示控件
  // =========================================================================
  { name: 'checkbox', exportName: 'Checkbox', group: '数据录入', priority: 'P2', complexity: 'M' },
  { name: 'radio', exportName: 'Radio', group: '数据录入', priority: 'P2', complexity: 'M' },
  { name: 'switch', exportName: 'Switch', group: '数据录入', priority: 'P2', complexity: 'S' },
  {
    name: 'input',
    exportName: 'Input',
    group: '数据录入',
    priority: 'P2',
    complexity: 'M',
    notes:
      '含 Input / TextArea / Search / Password / OTP 子组件。必须保留输入法组合态（IME）处理能力，不可简化。',
  },
  {
    name: 'input-number',
    exportName: 'InputNumber',
    group: '数据录入',
    priority: 'P2',
    complexity: 'M',
  },
  {
    name: 'listy',
    exportName: 'Listy',
    group: '数据展示',
    priority: 'P2',
    complexity: 'M',
    notes: 'antd v6 新增组件。',
  },
  { name: 'qr-code', exportName: 'QRCode', group: '数据展示', priority: 'P2', complexity: 'M' },
  { name: 'upload', exportName: 'Upload', group: '数据录入', priority: 'P2', complexity: 'L' },
  { name: 'splitter', exportName: 'Splitter', group: '布局', priority: 'P2', complexity: 'M' },
  { name: 'carousel', exportName: 'Carousel', group: '数据展示', priority: 'P2', complexity: 'M' },
  { name: 'collapse', exportName: 'Collapse', group: '数据展示', priority: 'P2', complexity: 'M' },
  {
    name: 'descriptions',
    exportName: 'Descriptions',
    group: '数据展示',
    priority: 'P2',
    complexity: 'M',
  },

  // =========================================================================
  // P3 — 浮层基础设施的第一个消费者（架构风险验证点）
  // =========================================================================
  {
    name: 'tooltip',
    exportName: 'Tooltip',
    group: '数据展示',
    priority: 'P3',
    complexity: 'L',
    notes:
      '【trigger 的第一个消费者】用于验证 ARCHITECTURE.md AR1（浮层定位像素级一致性）。必须先通过 PoC 验证再继续。',
  },
  { name: 'popover', exportName: 'Popover', group: '数据展示', priority: 'P3', complexity: 'L' },
  { name: 'menu', exportName: 'Menu', group: '导航', priority: 'P3', complexity: 'L' },
  { name: 'dropdown', exportName: 'Dropdown', group: '导航', priority: 'P3', complexity: 'L' },
  {
    name: 'modal',
    exportName: 'Modal',
    group: '反馈',
    priority: 'P3',
    complexity: 'L',
    notes:
      '【portal + motion 的第一个消费者】用于验证 AR2。焦点陷阱、Esc 关闭、滚动锁定、焦点归还必须完整实现（a11y 硬要求）。',
  },
  { name: 'drawer', exportName: 'Drawer', group: '反馈', priority: 'P3', complexity: 'M' },
  { name: 'message', exportName: 'Message', group: '反馈', priority: 'P3', complexity: 'M' },
  {
    name: 'notification',
    exportName: 'Notification',
    group: '反馈',
    priority: 'P3',
    complexity: 'M',
  },
  {
    name: 'app',
    exportName: 'App',
    group: '其他',
    priority: 'P3',
    complexity: 'M',
    notes:
      '⚠️ antd 中 App / message / notification 存在互相引用。我们必须在 ui/src/_internal/ 中提取 AppContext 叶子模块来消除环（见 dependencies.json 的 cycleResolutions）。',
  },
  { name: 'image', exportName: 'Image', group: '数据展示', priority: 'P3', complexity: 'M' },

  // =========================================================================
  // P4 — 浮层之上的交互控件
  // =========================================================================
  {
    name: 'select',
    exportName: 'Select',
    group: '数据录入',
    priority: 'P4',
    complexity: 'L',
    notes:
      '【trigger + virtual-list 的第一个消费者】。含 Select / Option / OptGroup 及 AutoComplete 复用的下拉渲染能力。',
  },
  {
    name: 'auto-complete',
    exportName: 'AutoComplete',
    group: '数据录入',
    priority: 'P4',
    complexity: 'M',
  },
  { name: 'cascader', exportName: 'Cascader', group: '数据录入', priority: 'P4', complexity: 'L' },
  { name: 'tree', exportName: 'Tree', group: '数据展示', priority: 'P4', complexity: 'L' },
  {
    name: 'tree-select',
    exportName: 'TreeSelect',
    group: '数据录入',
    priority: 'P4',
    complexity: 'L',
  },
  { name: 'popconfirm', exportName: 'Popconfirm', group: '反馈', priority: 'P4', complexity: 'M' },
  { name: 'tour', exportName: 'Tour', group: '其他', priority: 'P4', complexity: 'L' },
  {
    name: 'float-button',
    exportName: 'FloatButton',
    group: '其他',
    priority: 'P4',
    complexity: 'M',
  },
  {
    name: 'form',
    exportName: 'Form',
    group: '数据录入',
    priority: 'P4',
    complexity: 'L',
    notes:
      '【form-core 的第一个消费者】。含 Form / Form.Item / useForm / Form.List / Form.ErrorList。',
  },
  { name: 'slider', exportName: 'Slider', group: '数据录入', priority: 'P4', complexity: 'L' },
  { name: 'rate', exportName: 'Rate', group: '数据录入', priority: 'P4', complexity: 'S' },
  { name: 'segmented', exportName: 'Segmented', group: '其他', priority: 'P4', complexity: 'M' },
  { name: 'steps', exportName: 'Steps', group: '导航', priority: 'P4', complexity: 'M' },
  { name: 'progress', exportName: 'Progress', group: '反馈', priority: 'P4', complexity: 'M' },

  // =========================================================================
  // P5 — 数据密集型与复杂引擎
  // =========================================================================
  { name: 'pagination', exportName: 'Pagination', group: '导航', priority: 'P5', complexity: 'M' },
  { name: 'breadcrumb', exportName: 'Breadcrumb', group: '导航', priority: 'P5', complexity: 'M' },
  { name: 'tabs', exportName: 'Tabs', group: '数据展示', priority: 'P5', complexity: 'L' },
  { name: 'card', exportName: 'Card', group: '数据展示', priority: 'P5', complexity: 'M' },
  { name: 'timeline', exportName: 'Timeline', group: '数据展示', priority: 'P5', complexity: 'M' },
  { name: 'masonry', exportName: 'Masonry', group: '数据展示', priority: 'P5', complexity: 'M' },
  { name: 'anchor', exportName: 'Anchor', group: '导航', priority: 'P5', complexity: 'M' },
  { name: 'list', exportName: 'List', group: '数据展示', priority: 'P5', complexity: 'M' },
  {
    name: 'table',
    exportName: 'Table',
    group: '数据展示',
    priority: 'P5',
    complexity: 'XL',
    notes:
      '最复杂组件：固定列/表头、虚拟滚动、展开行、排序过滤、行列合并。泛型签名是 AR6（Vue 泛型组件表达力）的验证点。',
  },
  { name: 'transfer', exportName: 'Transfer', group: '数据录入', priority: 'P5', complexity: 'XL' },
  { name: 'mentions', exportName: 'Mentions', group: '数据录入', priority: 'P5', complexity: 'XL' },
  {
    name: 'color-picker',
    exportName: 'ColorPicker',
    group: '数据录入',
    priority: 'P5',
    complexity: 'L',
  },
  {
    name: 'date-picker',
    exportName: 'DatePicker',
    group: '数据录入',
    priority: 'P5',
    complexity: 'XL',
    // ⚠️ 本字段是**派生**的（`gen-registry.mjs` 里是 `notes: meta.notes ?? null`）——
    //    改 components.json 的 notes 会被下一次 registry:gen 抹掉。
    //    想写「跨运行保留」的注记只有两个地方：`layerNotes`（保留字段）或本文件。
    notes:
      '【picker 引擎的第一个消费者】。含 DatePicker / RangePicker / WeekPicker 等。' +
      '核心成本在 rc 的 PickerInput（4290 行、未 Vue 化），不是 antd 薄壳（非 locale 2650 行）。' +
      'G1/G2 已完（docs/analysis/date-picker.md + interface.ts）；G4 分叉已裁决 = 完整对齐，' +
      '决策 id `date-picker-input-kernel`。' +
      'S1 功能 + 样式已落地（257 规则 / 45 声明）。' +
      '**S2 全部落地（2026-10-01）**：`format` 的**补齐层**（rc `useLocale`→`fillLocale`，' +
      'PITFALLS 235 更正了 234 的根因）+ `format` 的**函数形态**（PITFALLS 236）+ ' +
      '**提交时机状态机**（上游 `useRangeValueChange` 405 行的逐字移植，' +
      '`hooks/picker-value-change.ts`）。' +
      '⇒ S4 的字段导航**调度**已随之落地，S4 只剩 `-input-active` 分段**渲染**；' +
      '**S3 掩码模式已落地（2026-10-01）**（`components/mask-format.ts` + ' +
      '`components/mask-input.ts`，上游 `MaskFormat.js` + `Input.js` 的 `format` 分支）；' +
      '**S4 单值部分已落地（同日）**：`-focused` 根类名 + 确认离开才关浮层' +
      '（上游 `useFocusEvents.js`）；`-input-active` 与 `useFocusLock` 是**范围专属**，' +
      '随 S5 的 RangePicker 一起做。' +
      '**S5 第一片已落地（同日）**：面板粒度的**受控化 + 打开即重置**（上游 `:366` / `:451-456`）；' +
      '**`multiple` 全链路**（选择器渲染 + `tagRender` / `maxTagCount` / 删除；' +
      '顺带还清 `_internal/overflow` 的 `renderItem` 欠账）。' +
      'S5 剩余：范围两端（`RangePicker`）、`presets` / footer（需 Popup 层容器）。' +
      '**G5/G6 已收口（同日）**：`__tests__/index.test.ts` 镜像上游 `DatePicker.test.tsx` 的 testCases（29 条）。' +
      '⚠️ 移植中抓到并修掉两个真缺口：**废弃告警一条都没有**（`useDevWarning`，5 条，PITFALLS 246）' +
      '+ **`popupStyle` 算出来却从没绑到 `Trigger`**（PITFALLS 247）。' +
      '**G9 L6 二轮（2026-10-01）**：从 **3/21 → 12/21 exact**。' +
      '修掉三处（都是真 bug，不是调阈值）：① 表头导航图标 —— `PickerPanel` **少声明 4 个图标 props**' +
      '（PITFALLS 250，属 picker 包）；② 🚨 浮层**缺 `-panel-container` / `-panel-layout` 两层**' +
      '⇒ 面板在真实浏览器里**完全点不动**（浮层根 `pointer-events: none` 无人重置）+ 无阴影 ' +
      '+ `popup.container` 语义槽无宿主（PITFALLS 251）；③ `classNames.popup.root` **新 API 静默失效**' +
      '（PITFALLS 252）。新增 `__tests__/popup-shell.test.ts`（4 条）钉住浮层外壳。' +
      '**G9 L6 三轮（同日）：→ 21/21 exact**。补上浮层**页脚**（`components/Footer.ts` = 上游' +
      '`Popup/Footer.js` 逐字移植 + `getShowNow` = `useShowNow.js` + 接线），`renderExtraFooter` 一并生效' +
      '（PITFALLS 255；⚠️ 页脚样式早在 257 条规则里，缺的只是组件 + 接线）。' +
      '顺带修掉**既有 bug**：`picker-shared.ts` 的 `isRenderable` 是**语义写反的本地副本**，' +
      '收敛回 `@apollo-design/utils`（PITFALLS 254，含「修正把错规格钉住的测试」）。' +
      '**S5 剩余：范围两端（`RangePicker`）与 `presets`**；`panelRender` / 浮层焦点事件 / ' +
      '`isInvalidateDate` 的 `showTime.disabledTime` 支仍待补（README §5.5 逐条登记）。' +
      '与 G12/G13/G14。' +
      '⚠️ 本轮顺带补了**两个收口缺口**：`DatePicker` 从没加进 `packages/ui/src/index.ts`、' +
      '`date-picker` 从没注册进 `COMPONENT_STYLES`（⇒ CSS 从未产出）。',
  },
  {
    name: 'time-picker',
    exportName: 'TimePicker',
    group: '数据录入',
    priority: 'P5',
    complexity: 'L',
  },
  { name: 'calendar', exportName: 'Calendar', group: '数据展示', priority: 'P5', complexity: 'L' },
  { name: 'avatar', exportName: 'Avatar', group: '数据展示', priority: 'P5', complexity: 'M' },
];

/**
 * 别名目录 → 主组件。它们不单独作为 registry 条目，但需要在 DAG 中被识别。
 * antd 的 es/ 里有独立目录，实际是同一组件的再导出。
 */
export const ALIASES = {
  qrcode: 'qr-code',
  row: 'grid',
  col: 'grid',
};

/**
 * 已知的循环依赖及其解决方式。
 * 这些环来自 antd 自身的叶子模块互相引用，我们通过提取 _internal 叶子模块来消除。
 */
export const CYCLE_RESOLUTIONS = [
  {
    cycle: ['app', 'message', 'notification'],
    antdCause:
      'app/index 导入 message/useMessage、notification/useNotification 用于挂载 contextHolder；message 与 notification 又导入 app/context 读取 message/notification 配置。',
    resolution:
      '把 AppContext 提取为 packages/ui/src/_internal/app-context.ts（纯 context 定义，无组件依赖）。App / message / notification 三方都只依赖该叶子模块，环消除。',
  },
  {
    cycle: ['config-provider', 'form', 'tooltip'],
    antdCause:
      'config-provider 导入 form/validateMessagesContext 与 tooltip/UniqueProvider；form 与 tooltip 又导入 config-provider/context。',
    resolution:
      '把 ConfigContext / DisabledContext / SizeContext / ValidateMessagesContext / UniqueContext 全部提取为 packages/ui/src/_internal/context/*.ts 叶子模块。所有组件只从 _internal 读 context，不再从 config-provider 组件目录读。',
  },
  {
    cycle: ['tooltip', 'table', 'color-picker'],
    antdCause: 'tooltip 导入 table/TableMeasureRowContext 与 color-picker/util。',
    resolution:
      'measure-row 的 context 移入 packages/ui/src/_internal/context/measure-row.ts；颜色工具函数移入 @apollo-design/utils（或 @ant-design/fast-color 的封装）。',
  },
  {
    cycle: ['select', 'cascader', 'tree-select', 'mentions', 'auto-complete'],
    antdCause:
      '这些组件互相导入对方的 hooks / style / 常量（select/useIcons、select/mergedBuiltinPlacements、select/style 等）。',
    resolution:
      '把 Select 的下拉基础能力（下拉渲染、图标、定位常量、popup 渲染）提取为 packages/ui/src/select/_shared/ 叶子模块，供 Select 系组件共同依赖，而不互相依赖组件入口。',
  },
];

/**
 * foundation 包的就绪标准（Phase 1 结束前必须达成）。
 * gen-registry 用它计算 blockedBy 中需要用户先行裁决/实现的项。
 */
export const FOUNDATION_READINESS = {
  '@apollo-design/utils':
    'Phase 1 需完成最小可用集（is / warning / dom / raf / scroll / throttle-debounce / resize-observer 封装）',
  '@apollo-design/theme':
    'Phase 1 需完成 Seed→Map→Alias→Component 的完整派生链 + cssVar 注入 + default/dark/compact 三算法',
  '@apollo-design/icons':
    'Phase 1 需完成从 @ant-design/icons-svg 生成 Vue 组件的构建管线（可先只生成被 P0/P1 组件用到的图标）',
  '@apollo-design/motion': 'Phase 1 需完成 CSSMotion 等价物的 PoC（AR2）',
  '@apollo-design/portal': 'Phase 1 需完成 Teleport 封装 + 容器管理 + z-index 层级',
  '@apollo-design/trigger': 'Phase 1 需完成定位 PoC（AR1：topLeft/center/bottom* + 翻转 + 箭头）',
  '@apollo-design/virtual-list': 'Phase 1 只需确定接口契约，实现可延后到 Select 开发前',
  '@apollo-design/form-core': 'Phase 1 只需确定接口契约，实现可延后到 Form 开发前',
  '@apollo-design/picker': 'Phase 1 只需确定接口契约，实现可延后到 DatePicker 开发前',
  '@apollo-design/test-utils': 'Phase 1 需完成全部共享测试契约',
};
