/**
 * matrix.mjs — 视觉回归的截图矩阵定义。
 *
 * 约定：`id = <component>/<variant>__<theme>__<viewport>`，两侧（react / vue）共用同一 id，
 * 因此一张 React 截图与一张 Vue 截图天然配对。
 *
 * ── 与其他层的关系 ──────────────────────────────────────────────────────────
 *
 * `tests/compat` 在 jsdom 里比 DOM 结构（`A9` 允许它 import antd）；本目录在真实
 * 浏览器里比**像素**。两者互补，不重叠。
 *
 * ── 关于 dark / compact ─────────────────────────────────────────────────────
 *
 * `TESTING.md` §9.1 把 dark / compact 列为必选。但我们的主题切换依赖
 * `ConfigProvider`，而 `ConfigProvider` **组件**尚未实现（只有 `context.ts`），
 * 且零运行时架构下 `tokens.css` 是**构建期产物** —— 运行时无法切换算法。
 * 所以本阶段 `THEMES` 只有 light。这不是「降低门槛」（`H8`），而是把不可比的部分
 * 显式登记在 `LIMITATIONS` 里，等 ConfigProvider 落地后补齐。
 */

/** viewport：`TESTING.md` §9.1 要求每个状态至少覆盖 3 个。 */
export const VIEWPORTS = [
  { id: 'mobile', width: 375, height: 667 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
];

/**
 * 主题。dark / compact 见文件头说明。
 *
 * `antdTheme` 传给 antd 的 `ConfigProvider`；`apolloTokens` 是对应的构建期 token 产物名。
 */
export const THEMES = [{ id: 'light', antdTheme: 'default', apolloTokens: 'light' }];

/**
 * 组件矩阵。
 *
 * ⚠️ `variants` **不是** demo 名。antd 的 demo 与我们的 demo 并不一一对应
 * （antd 的 `customize` / `config-provider` / `style-class` 依赖 antd-style、
 * Select / Table 等我们尚未实现的组件），拿 demo 互相截图比的是「demo 不同」。
 *
 * 所以这里是**视觉用例**：两侧各写一份、语义逐条对齐，覆盖组件的**视觉面**。
 * 同名用例放在 `render/cases/react/<component>.jsx` 与 `render/cases/vue/<component>.js`，
 * 共用 `render/cases/shared.mjs` 里的常量，确保输入一致。
 */
export const COMPONENTS = {
  affix: {
    // 5 个 variant × 3 个 viewport = 15 张
    // ⚠️ 只覆盖**未固钉**的静态形态：页面停在顶部时 `getBoundingClientRect` 的
    //    top 远大于阈值 ⇒ 不固钉（`docs/analysis/affix.md` §8）。
    //    固钉态（position:fixed）需要真实滚动，不进视觉比对。
    variants: [
      'basic', // offsetTop=80 + 内容（未固钉：内层无 apollo-affix 类名、无占位层）
      'offset-bottom', // offsetBottom=80（与 offsetTop 互斥）
      'class', // className / rootClassName
      'style', // style 透传到外层占位测量层
      'no-children', // 无子内容（SSR 下 React 会警告 ResizeObserver 空子，仍可渲染）
    ],
  },
  button: {
    // 9 个 variant × 3 个 viewport = 27 张
    variants: [
      'type', // 五种旧版类型糖 + 两个中文字（D7 的形态差异在像素层裁决）
      'size', // small / middle / large
      'loading', // 布尔与 { delay: 0 } 两条「立刻加载」路径
      'disabled', // <button> 分支与 <a> 分支的不对称表达
      'danger', // danger 与五种 type 的组合
      'ghost', // ghost 把 solid 退化成 outlined（放在有色背景上）
      'icon', // prop 图标 / icon-only / iconPlacement=end / shape
      'color-variant', // v6 的 color × variant 六组
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  'config-provider': {
    // 组件本身不产 DOM，所以这三条比的是「它对下游产生的效果」。
    // 具体下游链路见 `render/cases/shared.mjs` 的 ConfigProvider 段。
    variants: [
      'locale', // locale → Empty 的描述文案
      'theme-token', // theme.token.colorPrimary → Spin 的主色
      'theme-dark', // theme.algorithm = darkAlgorithm → Empty 的描述色
    ],
  },
  divider: {
    variants: [
      'horizontal', // 水平（含 dashed）
      'with-text', // 标题 center / start / end + styles.content.margin
      'vertical', // 垂直（orientation 与 vertical 两条路径）
      'variant', // solid / dotted / dashed
      'size', // small / medium / large
      'plain', // 正文样式的标题
      'customize-style', // style prop 覆盖 borderColor / borderWidth
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  empty: {
    variants: [
      'default', // 默认：locale 文案 + 默认插画
      'simple', // PRESENTED_IMAGE_SIMPLE（触发 -normal 类名）
      'no-description', // description={false}：不渲染描述块
      'custom-description', // description 传节点
      'custom-image', // image 传 data URI
      'with-footer', // 默认插槽 → footer
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  flex: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 水平默认 + vertical 切换（gap=medium）
      'vertical', // vertical 与 orientation 两条路径（含 orientation 压过 vertical）
      'gap', // 三档预设（token 派生）+ 自定义 '16px'
      'wrap', // 多行换行（12 块）
      'justify-align', // justify / align 对齐（含垂直 justify）
    ],
  },
  grid: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // span 24/12/8/6 阶梯
      'gutter', // gutter 数字与数组（margin/padding/rowGap 链路）
      'offset-sort', // offset 与 push/pull
      'justify-align', // justify 六种 + align 三种
      'responsive', // xs/sm/md 响应式类（固定 viewport 验证 media query 生效）
      'flex', // flex 布局填充与响应式 flex 变量
    ],
  },
  badge: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // count wrapper 形态（5 / 99+ / 0+showZero）
      'status', // 状态点五态 + text（processing 波纹不在比对面）
      'colorful', // 13 预设色状态点
      'dot', // 纯点形态
      'ribbon', // Ribbon 预设色/自定义色/双挂角
      'offset-size', // 封顶 + offset + size small
    ],
  },
  'border-beam': {
    // 2 个 variant × 3 个 viewport = 6 张（流光动画本身不在比对面，截静态形态）
    variants: ['basic', 'color'],
  },
  result: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'exception', 'semantic'],
  },
  'back-top': {
    // 1 个 variant × 3 个 viewport = 3 张（fixed 定位；visibilityHeight=0 恒显）
    variants: ['basic'],
  },
  tag: {
    // 3 个 variant × 3 个 viewport = 9 张
    variants: ['basic', 'checkable', 'semantic'],
  },
  skeleton: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'basic', // 默认：title（38%）+ 3 行 paragraph（末行 61%）
      'avatar', // 头像三组合：avatar+title+paragraph / +title:false / +paragraph:false
      'round', // 胶囊圆角（标题与段落行的 border-radius 换成 100px）
      'paragraph', // rows / width 数组 / width 数字（含 `-active` 的微光动画）
      'title', // title 宽度的三张表（38% / 50% / 数字）
      'element', // Skeleton.Button / Input / Avatar（含 block / size / shape）
      'node-image', // Skeleton.Node（自定义插槽）与 Skeleton.Image（内置占位图）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  alert: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // 四 type（outlined，无图标）
      'icon', // showIcon + description（with-description 形态）
      'banner', // banner 四态（含 no-icon）
      'closable', // 关闭按钮 + closeText
      'filled', // filled 形态
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  checkbox: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 默认态 + checked + disabled
      'indeterminate', // 半选（含 checked 半选组合）
      'group', // options 三形态（字符串/对象/对象 disabled）
      'check-all', // 全选 + 半选 + Divider
      'semantic', // 语义化 classNames / styles
    ],
  },
  layout: {
    // 6 个 variant × 3 个 viewport = 18 张
    variants: [
      'basic', // Header + Content + Footer（无 Sider）
      'side', // Layout + Sider(dark) + Content
      'side-light', // Sider theme=light
      'collapsible', // Sider collapsible（带 trigger）
      'collapsed', // Sider collapsed=true（默认图标方向）
      'zero-width', // collapsedWidth=0（零宽触发器）
    ],
  },
  watermark: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 单行文本水印（默认 rotate -22 / gap 100）
      'multi-line', // 多行（第二行独立 fontSize）
      'image', // 图片水印（内联 SVG data URL，避免网络依赖）
      'gap-offset', // gap + offset 自定义（交错平铺锚点）
    ],
  },
  statistic: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // title/value/precision/prefix/suffix（含千分位与小数）
      'status', // styles.content 染色（涨/跌两态）
      'loading', // Skeleton 骨架分支
      'semantic', // classNames / styles 语义化覆盖
      'timer', // Statistic.Timer（format 只到「天」——秒级截图两侧漂移）
    ],
  },
  space: {
    // 9 个 variant × 3 个 viewport = 27 张
    variants: [
      'basic', // 默认：水平 + 默认 size（small）+ 默认 align（center）
      'size', // small / medium / large + 数字 24 四档
      'align', // center / start / end / baseline 四档（含高矮不齐的块）
      'vertical', // orientation="vertical" + size="medium" + 三张卡片
      'wrap', // size={[8, 16]} + wrap（12 个块，跨行）
      'separator', // separator 传 Divider（垂直）与传字符串两条路径
      'compact', // Space.Compact：block / 非 block、两个输入、输入+按钮
      'compact-vertical', // Space.Compact orientation="vertical" 的边框合并
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  spin: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'basic', // 非嵌套：根元素自己就是 section
      'size', // small / medium / large（dot 尺寸三档）
      'description', // 三个尺寸 + 文案（嵌套形态）
      'nested', // 嵌套：转 / 不转 两个状态并排
      'custom-indicator', // 自定义指示器（indicator > ConfigProvider > setDefaultIndicator）
      'percent', // 定长进度环（percent=60；'auto' 是时间驱动的，不进视觉比对）
      'fullscreen', // 遮罩 + 居中（在建立包含块的盒子里，见 shared.mjs）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  typography: {
    // 8 个 variant × 3 个 viewport = 24 张
    variants: [
      'text', // Text：基础 + 四种语义 type + disabled
      'title', // Title：h1 ~ h5 五级
      'paragraph', // Paragraph：默认 + 多段（含 `div&` 的 margin-bottom）
      'decorations', // code / mark / underline / delete / strong / keyboard / italic
      'link', // Link：默认 / 语义 type / disabled / target=_blank
      'ellipsis', // 单行 + 多行 + expandable（JS 二分裁剪路径）
      'copyable', // 复制按钮（未复制态）
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
  radio: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 普通 / 选中 / 禁用 / 选中+禁用（含 `::after` 的 \a0 基线占位）
      'group', // options 三形态（字符串 / 对象 / 对象 disabled）+ vertical + block
      'button', // Radio.Button 三态（正常 / 单项禁用 / 整组禁用）+ solid
      'size', // large / 默认 / small（size 只对 button 形态生效）
      'semantic', // 语义化 classNames / styles
    ],
  },
  switch: {
    // 5 个 variant × 3 个 viewport = 15 张
    variants: [
      'basic', // 普通 / 选中 / 禁用 / 选中+禁用（把手位移 + 圆点状态）
      'loading', // loading（强制 disabled）+ size small 的 loading 图标尺寸
      'size', // 默认 / small（轨道与把手两档）
      'text', // checkedChildren / unCheckedChildren 四种形态（字符串 / 数字 / 图标 / 图标+文字）
      'semantic', // 语义化 classNames / styles
    ],
  },
  'qr-code': {
    // 3 个 variant × 3 个 viewport = 9 张（canvas 绘制两侧矩阵同源 ⇒ 像素一致）
    variants: [
      'basic', // 默认 canvas + 边框
      'custom', // 自定义前景/背景/尺寸
      'svg', // svg 形态
    ],
  },
  splitter: {
    // 3 个 variant × 3 个 viewport = 9 张（SSR 帧容器未测量 ⇒ dragger 无激活态，稳定）
    variants: [
      'basic', // 两面板 + 默认 dragger
      'vertical', // 纵向布局
      'multiple', // 3 面板 + min/max
    ],
  },
  listy: {
    // 3 个 variant × 3 个 viewport = 9 张
    // ⚠️ Raw 路径（antd 默认 virtual=false）；虚拟模式像素不稳定（滚动位置依赖时序）不进静态帧
    variants: [
      'basic', // 数据驱动项 + 分隔线 + hover 通道
      'groupSticky', // 分组 + CSS sticky 组头 + 渐变底
      'height', // height ⇒ maxHeight + overflowY:auto（有滚动条空间）
    ],
  },
  descriptions: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 默认 3 列 + 行尾补齐（colSpan=3）
      'bordered', // th/td 分格 + labelBg + 圆角
      'vertical', // label 行 + content 行
      'size', // small / medium 两档 padding
    ],
  },
  carousel: {
    // 4 个 variant × 3 个 viewport = 12 张
    variants: [
      'basic', // 默认 3 张 + 底部圆点（slick 轨道 / slide 排布 / 圆点几何）
      'fade', // effect=fade：当前张可见、其余透明（无 clone）
      'arrows', // arrows + 默认箭头几何（√2 的 ::after 旋转边框）
      'vertical', // dotPlacement=start：纵向布局 + 左侧圆点（宽高对调）
    ],
  },
};

/** 本阶段明确不覆盖的维度 —— 出现在报告里，避免「没做」被误读为「做了」。 */
export const LIMITATIONS = [
  {
    dimension: 'theme',
    missing: ['dark', 'compact'],
    reason:
      '`THEMES` 是**页面级**维度：把 dark / compact 加进去，等于要为 divider / empty / spin 重新生成一整套基线（3 组件 × 8 variant × 3 viewport × 2 主题），而 `baselines/` 是入库的共享资源 —— 并行流里改它会撞车。ConfigProvider 已落地，dark 先以「用例内部的 `theme.algorithm`」形式在 `config-provider/theme-dark` 里覆盖到；compact 同理，尚未有用例。',
    unblockWhen: '整合期（并行流收敛后）把 dark / compact 并入 THEMES，一次性重生成全部基线。',
  },
  {
    dimension: 'config-provider',
    missing: [
      'componentSize',
      'componentDisabled',
      'direction',
      'prefixCls',
      'renderEmpty',
      'wave',
      'virtual',
    ],
    reason:
      '这些能力**没有可观测的下游**：已落地的三个组件（divider / empty / spin）都不读 SizeContext / DisabledContext / direction，`prefixCls` 换了反而会让静态 CSS 匹配不上（那是「换前缀 → 丢样式」，不是视觉差异），`renderEmpty` 需要 Table / List / Select 等宿主组件。它们的语义由 L1/L2/L4 钉住（`packages/ui/src/config-provider/__tests__/`），视觉层补不了也不会假称补了。',
    unblockWhen:
      '有组件开始消费 SizeContext / DisabledContext / direction（如 Button / Input）后，按消费方逐个补视觉用例。',
  },
  {
    dimension: 'state',
    missing: ['hover', 'active', 'focus', 'disabled'],
    reason:
      'Empty 与 Divider 都是纯展示组件：无事件、无状态、无可交互元素（与 registry 的 interactionStatus = n/a 同源）。Spin 的 `loading` 态**已覆盖**（`nested` 用例并排了 spinning 真/假两个状态）。',
    unblockWhen: 'hover / active / focus / disabled 仍不适用：Spin 没有可聚焦元素与事件。',
  },
  {
    dimension: 'spin·fullscreen',
    missing: ['viewport-sized overlay'],
    reason:
      '`.spin-fullscreen{position:fixed;inset:0}` 铺满**视口**，而本目录的截图目标是 `#stage`（`run.mjs` 固定）—— 高度会塌成 0 无法截图，且两侧 body 默认 margin 不同会让裁剪区域错开。用例改在外层盒子上加 `transform` 建立包含块，遮罩改为铺满该盒子；比到的仍是 `-fullscreen` 那套规则（遮罩色 / 居中 / 白色文案）。',
    unblockWhen: '截图目标支持「按视口截图」后，补一个真正的全屏用例。',
  },
  {
    dimension: 'spin·percent',
    missing: ["percent='auto'"],
    reason:
      '`auto` 是时间驱动的（每 200ms 渐近推进一跳），截图时刻不确定 ⇒ 视觉层会 flaky。它的语义由 L2 在 `vi.useFakeTimers()` 下钉住（`__tests__/index.test.ts`）。',
    unblockWhen: '需要「视觉上确认 auto 的推进观感」时，用固定推进帧数的受控用例补。',
  },
  {
    dimension: 'space·standins',
    missing: ['真实 Button / Input / Select / Card 被 Space 驱动'],
    reason:
      'antd 的 Space demo 依赖 Button / Input / Select / Card / Typography，但它们在本仓库**尚未实现**（Space 在 DAG 上先于它们）。若 React 侧用 antd 的 Button、Vue 侧用原生 button，比出来的差异会是「Button 的实现差异」—— 那是假阳性。所以 9 个用例全部改用**两侧同一份**原生 `<button>` / `<input>` 替身（`render/cases/shared.mjs` 的 `SPACE_*_STYLE`，取值是 antd 6.6.4 的默认 Button / Input）。代价：`Space.Compact` 的**边框合并**只验证到替身上，没验证到真实 Button / Input 的类名拼接上 —— 而后者才是 `useCompactItemContext` 真正的消费方（10 个下游组件）。',
    unblockWhen:
      'Button / Input 落地后，把 `compact` / `compact-vertical` 两个用例换成真实组件（那时比的是「Compact 协议 + Button 实现」的合成结果）。',
  },
  {
    dimension: 'space·state',
    missing: ['hover', 'active', 'focus', 'disabled'],
    reason:
      'Space / Space.Compact / Space.Addon 本身都没有可交互元素（不设 tabindex、不绑事件、没有禁用态），所以这四态对它们不适用 —— 与 Empty / Divider 同源。⚠️ 但 `Space.Compact` 会**改变子元素的 hover 层级**（`genCompactItemStyle` 给 `-compact-item:hover` 设 `z-index: 4`、`[disabled]` 设 `z-index: 0`）。那两条规则作用在**子组件自己的类名**上，而截图是静态的、不会触发 hover ⇒ 视觉层观测不到。它的语义由 `theme.test.ts` 钉住**选择器与顺序**（可判定），层叠结果等真实子组件落地后再补。',
    unblockWhen:
      '有真实的可聚焦子组件（Button / Input）后，用 Playwright 的 `hover()` 补一条「紧凑项 hover 时边框不被邻居遮住」的用例。',
  },
  {
    dimension: 'typography·state',
    missing: ['hover', 'active', 'focus-visible', 'copied', 'editing'],
    reason:
      'Typography 是第一个**有交互态**的组件：`Link` 与四个操作按钮（expand / collapse / edit / copy）各有 hover / focus / active / disabled 四态，`copyable` 还有 `copied` 态。`run.mjs` 只截**静态帧**（渲染完成即截图，无交互步骤），所以这些状态进不了像素比对。它们的语义由 L1/L2 钉住（`__tests__/index.test.ts` 的 `trigger` / `vi.useFakeTimers` 用例），CSS 规则本身由 `__tests__/theme.test.ts` 断言存在。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / click 后再截）后，补 `link-hover` / `copy-copied` 两个用例。',
  },
  {
    dimension: 'typography·editable',
    missing: ['编辑态（`editable` 进入后的 textarea）'],
    reason:
      'antd 的编辑态渲染 `Input.TextArea`（`ResizableTextArea` 包裹层 + `ant-input` 类 + `ant-typography-edit-content` 上的 `-textarea` 语义槽），而 Input 组件尚未落地。我们用**原生 `<textarea>`** 承载同一套 `-edit-content` CSS（差异 D-typography-3，见 `packages/ui/src/typography/README.md` §7）—— DOM 与视觉都**不**与 antd 一致，拿它进像素比对只会得到一个必然失败的用例。编辑态的**行为**（Enter 确认 / Esc 取消 / blur 确认 / IME 守卫）由 L1/L2 在 `__tests__/` 里钉住，不受此影响。',
    unblockWhen:
      'Input / TextArea 落地后，把编辑态换成真 TextArea 并把 `editable` 补进 `variants`。',
  },
  {
    dimension: 'typography·tooltip',
    missing: ['`ellipsis.tooltip`', '`copyable.tooltips`', '`editable.tooltip` 的悬浮气泡'],
    reason:
      'Tooltip 组件尚未落地。antd 的 Tooltip 在**未展开**时不额外产 DOM（只 clone 子元素并挂事件），所以本阶段用例里的 `copyable` / `ellipsis` 与 antd 逐像素一致；缺的是「悬浮后出现气泡」那一半 —— 那需要交互式截图（`run.mjs` 目前只截静态帧）。`ellipsis.tooltip` 对根元素 `aria-label` 的影响由 L4 钉住。',
    unblockWhen: 'Tooltip 落地后补 hover 态用例（需要给 `run.mjs` 加交互步骤）。',
  },
  {
    // ⚠️ 这一条不是「没做」，而是「做了、红了、并且已经定位到组件外的根因」。
    //    它必须留在 LIMITATIONS 里，否则后人看到报告里的 21/24 会以为只是没覆盖。
    dimension: 'typography·visual-residual',
    missing: ['`typography/copyable__light__{mobile,tablet,desktop}` 的逐像素一致'],
    reason:
      '24 组里 21 组 0.000% exact；`copyable` 三组是 `block-diff`（差异率 0.3211% / 0.1568% / 0.0836%，散点占比 1.7% —— 差异**成块**而非抗锯齿散点）。diff 图显示红色区域**只落在复制图标**上（`tests/visual/diff/typography/copyable__light__*.png`），文字部分逐像素一致。根因在组件之外：`@apollo-design/icons` 导出了 `getIconStyle(iconPrefixCls)`（D15：只导出、不注入），但**仓库里没有任何地方消费它** —— 于是图标缺基础样式（`.apollo-icon` 没有 `display:inline-flex`、没有 `vertical-align:-0.125em`），SVG 退化成 `display:inline`，字形基线与 antd 差一点点。⚠️ 为什么不在本组件的收口里修：修法是在全局 `BASE_CSS` 里接上 `getIconStyle`，那会改变**所有**渲染图标的组件（`spin` 的 `LoadingOutlined` 等）的像素输出，属于 foundation 层的接线工作，超出本组件的改动面（`packages/ui/src/typography/**` + registry + memory）。缺口已登记在 `packages/ui/src/typography/README.md` §7 与 registry 的 `layerNotes.visual`。',
    unblockWhen:
      '`packages/ui/src/style/index.ts` 的 `BASE_CSS` 接上 `getIconStyle(iconPrefixCls)`（或 `@apollo-design/icons` 提供默认注入路径）后，重跑 `--mode compare`，三组应变 0.000% exact；届时同步复核 `spin` / `empty` 等已入库基线。',
  },
  {
    dimension: 'radio·state',
    missing: ['hover', 'active', 'focus-visible', 'checked 的过渡帧'],
    reason:
      'Radio 是第一个**状态几乎全在 CSS 里**的组件：`-wrapper-checked` / `-checked` / `-disabled` 三个类名落 DOM（L4 已钉），但 `:hover` 的边框色、`input:focus-visible` 的焦点环、圆点 `::after` 的 `scale(0)→opacity:1` 过渡帧都只存在于 CSS 状态里，而 `run.mjs` 只截**静态帧**（渲染完成即截图，无交互步骤）。5 个用例覆盖的是「未交互时的确定形态」：默认 / 选中 / 禁用 / button 三态 / 三档尺寸 / 语义化。⚠️ `defaultChecked` 的形态**已被覆盖**（`basic` 用例第 2 个）—— 它同时是上游「wrapper 类名不含非受控内部态」那条不一致的视觉证据。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / focus 后再截）后，补 `hover` / `focus-visible` 两个用例；过渡帧永远不进像素比对（时刻不确定，属 flaky 源）。',
  },
  {
    dimension: 'radio·wave',
    missing: ['点击波纹（`Wave` 的 `ant-wave-target` 动画）'],
    reason:
      'Wave 基建未落地（D43，与 button / skeleton / checkbox 同判）。`ant-wave-target` 类名**已逐字保留**（非 button 形态），所以两侧 DOM 一致；缺的只是「点击后出现的波纹元素与动画」—— 它是运行时 DOM 注入，静态帧里本来就不存在。',
    unblockWhen: 'Wave 基建落地后，用交互式截图（click 后再截）补一条。',
  },
  {
    dimension: 'switch·state',
    missing: ['hover', 'active（按压反馈）', 'focus-visible', '切换过渡帧'],
    reason:
      'Switch 的**核心视觉全在状态里**：`:hover:not(-disabled)` 的轨道色、`:active` 时把手 `::before` 拉长 30% 与内容区让位、`:focus-visible` 焦点环、以及 `transition: all 0.2s` 的把手位移过程。`run.mjs` 只截**静态帧**，所以 5 个用例覆盖的是「未交互时的确定形态」（含选中/禁用/loading/size/children）。⚠️ 其中 `basic` 的选中态已经把「把手位移到 `inset-inline-start: calc(100% - (handleSize + trackPadding))`」与「`-inner` 的负 margin 轮换」这两条最容易写错的几何钉住了。',
    unblockWhen:
      '给 `run.mjs` 加交互步骤（hover / mousedown 后再截）后，补 `hover` / `active` 两个用例；过渡帧永远不进像素比对（时刻不确定）。',
  },
  {
    dimension: 'switch·wave',
    missing: ['点击波纹'],
    reason:
      'Wave 基建未落地（与 button / skeleton / checkbox / radio 同判）。⚠️ Switch **本来就没有** `ant-wave-target` 类（antd 的 Wave 在 6.6.4 不往子元素注入该类，实测 SSR 产物确认），所以两侧 DOM 逐字一致，缺的只是运行时注入的波纹元素与动画。',
    unblockWhen: 'Wave 基建落地后，用交互式截图（click 后再截）补一条。',
  },
  {
    dimension: 'switch·dark-compact',
    missing: ['dark / compact 主题下的开关形态'],
    reason:
      '与全局 `theme` 维度同源：`THEMES` 目前只有 light。⚠️ Switch 有一条**只在该维度下才会暴露**的风险：13 个 Component Token 是**构建期算好的解析值**（`22px` / `44px` / `18px` / `#fff` / `rgba(0,35,11,0.2)` …），其中 `handleBg`（= `colorWhite`）与 `handleShadow`（antd 硬编码 `#00230b`）在 dark 主题下 antd 会重新生成、我们不会 ⇒ **dark 主题下这两个值会与 antd 分叉**。已登记为 D50。',
    unblockWhen:
      '整合期把 dark 并入 THEMES 后重生成基线；届时需要决定是否为这两个 token 补 dark 分支（或接受分叉并写入 COMPATIBILITY）。',
  },
  {
    dimension: 'switch·icon-children',
    missing: ['`checkedChildren` / `unCheckedChildren` 放**真图标组件**（`@apollo-design/icons`）'],
    reason:
      '视觉侧的 vue 渲染入口只链接了 `@apollo-design/theme` 与 `@apollo-design/ui` 两个 workspace 包（根 `package.json` 的 devDependencies），**拿不到** `@apollo-design/icons`；而 react 侧经 antd 的依赖可以拿到 `@ant-design/icons`。若只在一侧用真图标，比出来的会是「图标基线差异」而不是「Switch 差异」—— 那是假阳性。所以 `text` 用例改用**两侧逐字相同**的内联结构（`Flex` + `<b>` + 文本）当替身，与 `space·standins` 同思路。图标形态的 children 由 7 个 demo 里的 `text.vue` 与 L1「children 四种形态」覆盖。',
    unblockWhen:
      '把 `@apollo-design/icons` 加进根 `package.json` 的 devDependencies（需重生成 pnpm-lock）后，`text` 用例可以换成真图标。',
  },
  {
    dimension: 'carousel·motion',
    missing: [
      '切换动画中间帧',
      '拖拽过程帧',
      'autoplay 的圆点进度动画帧',
      '拖到边界的橡皮筋阻尼帧',
    ],
    reason:
      'Carousel 的动画全部是**运行时**行为（track 的 transform transition、opacity 交叉淡化、拖拽位移、`--dot-duration` 进度动画），`run.mjs` 只截**静态帧**—— 时刻不确定的帧不进像素比对。4 个用例覆盖的是「初始定位形态」：轨道 % 公式、fade 的透明度分档、箭头 √2 几何、纵向宽高对调。翻页/拖拽的状态机语义由 L1 钉（29 条）。',
    unblockWhen:
      '给 `run.mjs` 加「交互后截帧」能力后补；进度动画帧永远不进像素比对（时刻不确定）。',
  },
];

/** 展开成截图任务列表。 */
export function buildCases({ component, variants } = {}) {
  const names = component ? [component] : Object.keys(COMPONENTS);
  const cases = [];

  for (const name of names) {
    const def = COMPONENTS[name];
    if (!def) throw new Error(`组件 ${name} 未在 matrix.mjs 的 COMPONENTS 中登记`);
    const useVariants = variants ?? def.variants;

    for (const variant of useVariants) {
      if (!def.variants.includes(variant)) {
        throw new Error(
          `组件 ${name} 没有 variant「${variant}」（已登记：${def.variants.join(', ')}）`,
        );
      }
      for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
          cases.push({
            component: name,
            variant,
            theme: theme.id,
            antdTheme: theme.antdTheme,
            apolloTokens: theme.apolloTokens,
            viewport: viewport.id,
            width: viewport.width,
            height: viewport.height,
            id: `${name}/${variant}__${theme.id}__${viewport.id}`,
          });
        }
      }
    }
  }
  return cases;
}

/** 渲染页的 URL：`?component=&variant=&theme=` */
export function caseUrl(c) {
  const q = new URLSearchParams({
    component: c.component,
    variant: c.variant,
    theme: c.theme,
  });
  return `/?${q.toString()}`;
}
