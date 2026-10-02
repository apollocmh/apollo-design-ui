/**
 * shared.mjs — React 侧与 Vue 侧**共用**的用例常量。
 *
 * 为什么必须共用：视觉回归比的是「同一个输入在两侧的渲染」。若两侧各写各的图片、
 * 各写各的文案，比出来的差异就是用例差异而不是实现差异 —— 那是假阳性。
 *
 * 这里的值一律**不依赖网络**（用 data URI），否则截图会 flaky。
 */

/** 自定义插画：data URI SVG，两侧字节级一致。 */
export const CUSTOM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='41' viewBox='0 0 64 41'%3E%3Cellipse fill='%23f5f5f5' cx='32' cy='33' rx='32' ry='7'/%3E%3Ctext x='32' y='26' text-anchor='middle' font-size='12' fill='%2300000073'%3Ecustom%3C/text%3E%3C/svg%3E";

/** 用例共用的文案。 */
export const LABEL = {
  customDescription: 'Customize Description',
  withFooter: 'Create Now',
  semantic: 'Semantic classNames / styles',
};

/** 语义化 classNames / styles 用例：两侧用同一组值。 */
export const SEMANTIC_CLASSNAMES = {
  root: 'demo-empty-root',
  image: 'demo-empty-image',
  description: 'demo-empty-description',
};

export const SEMANTIC_STYLES = {
  root: { backgroundColor: '#fafafa' },
  image: { opacity: '0.6' },
};

/**
 * footer / 描述里用到的元素样式。
 *
 * 为什么要显式写死：两侧的 reset 不同（antd 有 `dist/reset.css`，我们是自己的 base），
 * 若用裸 `<button>` / `<a>`，比出来的差异会是「reset 不同」而不是「Empty 不同」。
 * 这里把样式钉死，让差异只可能来自 Empty 本身。
 */
export const FOOTER_BUTTON_STYLE = {
  display: 'inline-block',
  padding: '4px 15px',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: '#fff',
  backgroundColor: '#1677ff',
  border: '1px solid #1677ff',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export const LINK_STYLE = { color: '#1677ff', textDecoration: 'none' };

/**
 * 语义化用例的配套 CSS。
 *
 * React 侧/antd 用 `antd-style` 生成类名，我们这边是静态 CSS —— 两边生成机制本就不同，
 * 若让样式来自各自的 CSS-in-JS，比的就是「CSS-in-JS 是否等价」而不是「组件是否等价」。
 * 所以这里直接注入一段**两侧完全相同**的 CSS，让 classNames/styles 的挂载结果可比。
 */
export const SEMANTIC_INJECT_CSS = `
.demo-empty-root { border: 1px dashed #ccc; padding: 16px; }
.demo-empty-image { filter: grayscale(100%); }
.demo-empty-description { color: #1890ff; font-weight: bold; }
.demo-btn-root { border: 1px dashed #7cb305; }
.demo-btn-icon { color: #7cb305; }
.demo-btn-content { letter-spacing: 2px; }
.demo-divider-root { border-color: #7cb305; }
.demo-divider-content { letter-spacing: 1px; }
.demo-spin-root { border: 1px dashed #ccc; }
.demo-spin-indicator { filter: saturate(200%); }
.demo-spin-description { color: #1890ff; font-weight: bold; }
.demo-space-root { border: 1px solid #d9d9d9; }
.demo-space-item { border-radius: 4px; }
.demo-space-separator { letter-spacing: 2px; }

---

.demo-typography-root { border: 1px dashed #ccc; padding: 8px; }
.demo-typography-actions { letter-spacing: 2px; }
.demo-typography-action { opacity: 0.5; }
.demo-typography-textarea { outline: 2px solid #1890ff; }

/* ⚠️ 下面这一段必须留在**最后**：上面 typography 段之前有一个孤立的「---」行，
   它会把紧随其后的那条规则的选择器吞掉（变成「--- .demo-typography-root」）。
   新增组件的类名一律追加在文件末尾，避免被同一个坑影响。 */
.demo-skeleton-root { border: 1px dashed #ccc; }
.demo-skeleton-header { outline: 1px solid #7cb305; }
.demo-skeleton-section { outline: 1px solid #1890ff; }
.demo-skeleton-avatar { box-shadow: 0 0 0 2px #f5222d; }
.demo-skeleton-title { box-shadow: 0 0 0 2px #722ed1; }
.demo-skeleton-paragraph { box-shadow: 0 0 0 2px #13c2c2; }
.demo-breadcrumb-root { border: 1px dashed #ccc; padding: 4px; }
.demo-breadcrumb-item { letter-spacing: 1px; }
.demo-breadcrumb-separator { color: #7cb305; }

`;

// ===========================================================================
// Button
// ===========================================================================

/**
 * 按钮用例的**上下文字体**必须写死成同一个具体值，理由与 `DIVIDER_CONTEXT_FONT`
 * 完全一致（2026-09-18 实测：两侧 reset 的 `font-family` 一个是泛型 `sans-serif`、
 * 一个是 token 字体栈 ⇒ 换行一致但每个墨点都不同）。
 */
const BUTTON_CONTEXT_FONT = 'sans-serif';

/** 用例容器：两侧同形，把按钮按 `gap` 排开。 */
export const BUTTON_ROW_STYLE = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  alignItems: 'center',
  fontFamily: BUTTON_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** `ghost` 用例的背景 —— 写死一个具体色，让两侧拿到同一个输入。 */
export const BUTTON_GHOST_BG_STYLE = {
  ...BUTTON_ROW_STYLE,
  background: 'rgb(190, 200, 200)',
  padding: '8px',
};

/** 用例文案（两侧逐字相同，长度固定）。 */
export const BUTTON_TEXT = {
  primary: 'Primary',
  default: 'Default',
  dashed: 'Dashed',
  text: 'Text',
  link: 'Link',
  danger: 'Danger',
  loading: 'Loading',
  submit: 'Submit',
  twoCN: '确定',
  semantic: 'Semantic',
};

/** `color-variant` 用例的六种组合（与 demo 同集合）。 */
export const BUTTON_COLOR_VARIANTS = [
  { color: 'blue', variant: 'solid' },
  { color: 'purple', variant: 'outlined' },
  { color: 'cyan', variant: 'filled' },
  { color: 'green', variant: 'dashed' },
  { color: 'volcano', variant: 'text' },
  { color: 'gold', variant: 'link' },
];

/** 语义化用例：两侧同一组 classNames / styles。 */
export const BUTTON_SEMANTIC_CLASSNAMES = {
  root: 'demo-btn-root',
  icon: 'demo-btn-icon',
  content: 'demo-btn-content',
};

export const BUTTON_SEMANTIC_STYLES = {
  root: { borderRadius: '16px' },
  content: { fontWeight: 'bold' },
};

// ===========================================================================
// ConfigProvider
// ===========================================================================

/**
 * ConfigProvider **自己不产 DOM**（它的渲染结果就是子节点，或最多一层
 * `display: contents` 的主题作用域元素）。所以它的视觉用例比的是
 * 「它对下游产生了什么效果」—— 三个用例各打一条下游链路：
 *
 *   `locale`       → Empty 的描述文案
 *   `theme-token`  → Spin 的主色（`colorPrimary`）
 *   `theme-dark`   → Empty 的描述色（`darkAlgorithm` 派生出的 `colorTextDescription`）
 */

/**
 * `locale` 用例的语言包片段（两侧逐字相同）。
 *
 * ⚠️ 为什么是字面量而不是 `import { en_US } from '@apollo-design/locale'`：
 *    Vue 侧用例文件在 `tests/visual/render/cases/vue/` 下，模块解析只能走到
 *    **仓库根** `node_modules`，而那里并没有 `@apollo-design/locale` —— 它只是
 *    `packages/ui` 的依赖，链接在 `packages/ui/node_modules` 下。
 *
 *    何况「语言包的值是否等于 antd」由 locale 包自己的单元测试保证；这里要验的是
 *    「ConfigProvider 的 `locale` 有没有真的传导到 Empty」。两侧 `useLocale` 都只
 *    按组件名浅取一段，所以给一个只含 `Empty` 的片段正好只测这一件事。
 */
export const CP_LOCALE = { locale: 'fr_FR', Empty: { description: 'Aucune donnée' } };

/** `theme-token` 用例的主色（antd 官方 demo 常用的绿色）。 */
export const CP_COLOR_PRIMARY = '#00b96b';

/**
 * `theme-dark` 用例的背景。
 *
 * ⚠️ 写死 `#141414`（antd dark 的 `colorBgContainer`）而不是 `var(--apollo-color-bg-container)`：
 *    antd 侧默认**不**把 token 暴露成 CSS 变量，两侧拿不到同一个变量名；
 *    写死同一个字面量才能让差异只可能来自「dark 算法派生出的文字色」。
 */
export const CP_DARK_BG_STYLE = { background: '#141414', padding: '16px' };

// ===========================================================================
// Divider
// ===========================================================================

/**
 * ⚠️⚠️ 上下文的字体**必须写死成同一个具体值**，不能用 `inherit`。
 *
 * 2026-09-18 实测（24 组全部 block-diff 3.8%~9.1%，差异全落在段落文字带、
 * Divider 自己的线**零差异**，见 README §6.3）：
 *
 *   React 页（`import 'antd/dist/reset.css'`）→ `html{font-family:sans-serif}`
 *   Vue 页（`import '@apollo-design/ui/style.css'`）→ `html{font-family:var(--apollo-font-family)}`
 *
 * `sans-serif` 是**泛型**，Chrome 在 macOS 上解析成一个系统回退字体；
 * 而 `--apollo-font-family` 是 antd 的 token 字体栈（`-apple-system, BlinkMacSystemFont, …`）。
 * 两者**度量接近但字形不同** —— 所以换行位置一致、每个墨点都不同，看起来像「组件画错了」。
 *
 * 根因在**夹具的上下文**而不是组件：antd 的 `resetComponent` 与我们的
 * `style/index.ts:80` 都把 token 字体显式写在**组件根**上，所以 Divider 自己的标题文字
 * 逐像素一致（这也正是「差异只出现在段落带」的原因）。
 *
 * 因此这里把上下文文字钉到同一个具体值 `sans-serif`：
 * React 侧本来就是它（改完重生成基线，哈希不变即可反证诊断），Vue 侧显式对齐。
 * 这不是放宽 —— 组件自身的字体仍由 `.apollo-divider{font-family:var(--apollo-font-family)}`
 * 与 antd 的 `resetComponent` 各自保证，仍被下面的用例覆盖。
 */
const DIVIDER_CONTEXT_FONT = 'sans-serif';

/**
 * 段落文字样式 —— **必须显式钉死**。
 *
 * 两侧的全局 reset 不同：antd 的 `reset.css` 有 `p { margin-top: 0; margin-bottom: 1em }`，
 * 我们的 `BASE_CSS` 目前只覆盖 box-sizing 与字体（见 `packages/ui/src/style/index.ts`），
 * `<p>` 会退回 UA 的 `margin: 1em 0`。若不管，比出来的差异会是「reset 不同」而不是
 * 「Divider 不同」—— 那是假阳性。
 *
 * 值取 antd 6.6.4 的默认排版 token（fontSize / lineHeight / colorText），
 * 字体取上面那个具体值（理由见 `DIVIDER_CONTEXT_FONT`）。
 */
export const DIVIDER_PARAGRAPH_STYLE = {
  margin: '0 0 16px',
  fontFamily: DIVIDER_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** 垂直分割线的用例里包在两侧的行内文字。与 antd 的 demo 同形。 */
export const DIVIDER_INLINE_STYLE = {
  fontFamily: DIVIDER_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

export const DIVIDER_LINK_STYLE = {
  ...DIVIDER_INLINE_STYLE,
  color: '#1677ff',
  textDecoration: 'none',
};

/**
 * Divider 用例共用的文案。
 *
 * 与 antd 的 demo 一致用 Lorem ipsum —— 两侧逐字相同，长度固定，
 * 这样换行位置也可比（换行不同会让高度差异被误读成组件差异）。
 */
export const DIVIDER_TEXT = {
  lorem:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta? Refert tamen, quo modo.',
  center: 'Text',
  start: 'Left Text',
  end: 'Right Text',
  solid: 'Solid',
  dotted: 'Dotted',
  dashed: 'Dashed',
  inline: 'Text',
  link: 'Link',
};

/** 语义化用例：两侧同一组 classNames / styles。 */
export const DIVIDER_SEMANTIC_CLASSNAMES = {
  root: 'demo-divider-root',
  rail: 'demo-divider-rail',
  content: 'demo-divider-content',
};

export const DIVIDER_SEMANTIC_STYLES = {
  root: { borderWidth: '2px', borderStyle: 'dashed' },
  content: { fontStyle: 'italic' },
  rail: { opacity: '0.85' },
};

/** 语义化用例的配套 CSS 已并入上面的 `SEMANTIC_INJECT_CSS`（两侧共用一个注入点）。 */

/** `customize-style` 用例的边框色（antd 官方 demo 用的绿色）。 */
export const DIVIDER_CUSTOM_BORDER = '#7cb305';

// ===========================================================================
// Skeleton
// ===========================================================================

/**
 * ⚠️ Skeleton **不渲染任何文字** —— 它是纯几何块（背景色 + 圆角 + 尺寸）。
 *
 * 所以 Divider / Spin 那类「上下文字体不同 ⇒ 每个墨点都不同」的噪声在这里**不存在**，
 * 不需要 `SKELETON_CONTEXT_FONT`。
 *
 * 唯一要钉死的是**宽度**：`title` / `paragraph` 的默认宽度是百分比
 * （38% / 50% / 61%），容器宽度不确定则块宽不可比。`#stage` 是「视口宽 − 32px」、
 * 两侧同构，所以只要用例不再引入宽度不确定的容器即可。
 *
 * ⚠️ `active` 的微光动画被 `STABILIZE_CSS` 的 `animation:none !important` 关掉，
 *    但 **`background` 那一条线性渐变仍然生效**（只是停在起点位置）——
 *    所以 `active` 在像素上是**可观测**的，且是确定性的。
 */

/** 竖向排布：多个骨架屏上下展示。 */
export const SKELETON_COLUMN_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

/** 横向排布：`element` 用例把子组件并排。 */
export const SKELETON_ROW_STYLE = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '16px',
};

/**
 * `Skeleton.Node` 插槽里的替身内容样式。
 *
 * 用原生 `<span>` 而不是某个组件：Skeleton 的 5 个下游里没有任何一个已经落地，
 * 引入未落地组件会让两侧的差异变成「那个组件没实现」。
 */
export const SKELETON_NODE_CHILD_STYLE = {
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** `Skeleton.Node` 插槽的文案（两侧逐字相同）。 */
export const SKELETON_NODE_TEXT = 'Custom Content';

/**
 * `paragraph.width` 数组用例的取值。
 *
 * 三项分别覆盖 **字符串 / 数字 / 字符串**；`rows` 给 4 让第 4 行**越界**
 * （`width[3]` 是 `undefined` ⇒ 该行退回 CSS 的 `width:100%`）——
 * 这是 `getWidth` 数组分支唯一能被像素观测到的边界。
 */
export const SKELETON_PARAGRAPH_WIDTHS = ['10%', 200, '30%'];

/** 语义化用例：两侧同一组 classNames / styles。 */
export const SKELETON_SEMANTIC_CLASSNAMES = {
  root: 'demo-skeleton-root',
  header: 'demo-skeleton-header',
  section: 'demo-skeleton-section',
  avatar: 'demo-skeleton-avatar',
  title: 'demo-skeleton-title',
  paragraph: 'demo-skeleton-paragraph',
};

export const SKELETON_SEMANTIC_STYLES = {
  root: { padding: '8px' },
  title: { backgroundColor: '#d9d9d9' },
  paragraph: { backgroundColor: '#f0f0f0' },
};

/** Skeleton 语义化用例的配套 CSS 已并入上面的 `SEMANTIC_INJECT_CSS`。 */

// ===========================================================================
// Space
// ===========================================================================

/**
 * Space 用例里的**上下文文字**一律钉成具体字体。
 *
 * 理由与 `DIVIDER_CONTEXT_FONT` / `SPIN_CONTEXT_FONT` 完全同源（2026-09-18 实测）：
 * React 页来自 antd 的 `reset.css`（`html{font-family:sans-serif}`，泛型），
 * Vue 页来自 `--apollo-font-family`（具体字体栈）—— 度量接近但字形不同，
 * 会让整段文字成为噪声。
 *
 * ⚠️ Space **自己没有任何文字样式**：上游 `genStyleHooks(['Space','Compact'], …,
 *    { resetStyle: false })` 显式关掉了 `genCommonStyle`（Space 的注释：
 *    'Space component don't apply extra font style'）。所以「字体」这件事在
 *    Space 上**完全由上下文决定** —— 不钉死的话，比出来的差异 100% 是上下文的。
 *    （`Addon` 是例外：它走默认的 resetStyle，自己带 `font-family` / `font-size`。）
 */
const SPACE_CONTEXT_FONT = 'sans-serif';

/** Space 用例共用的文字样式（两侧逐字相同）。 */
export const SPACE_TEXT_STYLE = {
  fontFamily: SPACE_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/**
 * ★ 每个用例的**外层容器**都要套这个。
 *
 * ⚠️ 为什么 Space 比 Divider / Spin 更需要它：`Space` 的根上**没有任何文字样式**
 *    （上游 `genStyleHooks(['Space','Compact'], …, { resetStyle: false })` 显式关掉了
 *    `genCommonStyle`，注释是 'Space component don't apply extra font style'）。
 *    于是 `-item` 里的裸文本（比如 `basic` 用例的 `"Space"`）字体**完全继承自页面**：
 *      React 页 → antd 的 `reset.css`：`html{font-family:sans-serif}`（泛型）
 *      Vue 页   → 我们的 base：`html{font-family:var(--apollo-font-family)}`（具体栈）
 *    两者度量接近但字形不同 ⇒ 整段文字成为噪声，看起来像「Space 画错了」。
 *    套一层显式样式，差异才只可能来自 Space。
 *
 * 值与 `SPACE_TEXT_STYLE` 同源（antd 6.6.4 的 fontSize / lineHeight / colorText）。
 */
export const SPACE_CONTEXT_STYLE = { ...SPACE_TEXT_STYLE };

/**
 * 链接样式 —— **必须显式钉死**。
 *
 * 同 `SPACE_CONTEXT_STYLE` 的理由：antd 的页面里 `<a>` 被 `genLinkStyle` 全局重置过
 * （`color: #1677ff`、`text-decoration: none`、hover/active 三态），
 * 我们的 base 没有这一段。不钉死的话，比出来的差异会是「reset 不同」而不是
 * 「Space 的分隔符位置不同」—— 那是假阳性。取值取 antd 的默认链接色。
 */
export const SPACE_LINK_STYLE = {
  ...SPACE_TEXT_STYLE,
  color: '#1677ff',
  textDecoration: 'none',
};

/**
 * 替身按钮的基座。
 *
 * ⚠️ 为什么用原生 `<button>` 而不是 antd 的 `<Button>`：
 *    `Button` 在本仓库**尚未实现**（Space 在 DAG 上先于它）。若 React 侧用 antd 的
 *    Button、Vue 侧用原生 button，比出来的差异会是「Button 的实现差异」——
 *    那是假阳性。两侧都用**同一份**替身样式，差异才只可能来自 Space。
 *    取值是 antd 6.6.4 的默认 Button：高 32px、内边距 4px 15px、圆角 6px、
 *    边框 `#d9d9d9`、主色 `#1677ff`。
 */
export const SPACE_BUTTON_STYLE = {
  ...SPACE_TEXT_STYLE,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  padding: '4px 15px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  background: '#ffffff',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
};

/** 替身主按钮（antd 的 `<Button type="primary">`）。 */
export const SPACE_BUTTON_PRIMARY_STYLE = {
  ...SPACE_BUTTON_STYLE,
  border: '1px solid #1677ff',
  background: '#1677ff',
  color: '#ffffff',
};

/** 替身输入框（antd 的 `<Input>`）。 */
export const SPACE_INPUT_STYLE = {
  ...SPACE_TEXT_STYLE,
  height: '32px',
  padding: '4px 11px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  background: '#ffffff',
  boxSizing: 'border-box',
  width: '100%',
};

/**
 * `align` / `vertical` 用例里的「高矮不齐的块」。
 *
 * 与 antd 官方 demo 的 `mockBox` 同形：足够高、足够宽，让四种 `align`
 * 与垂直方向的间距肉眼可比。
 */
export const SPACE_MOCK_BOX_STYLE = {
  ...SPACE_TEXT_STYLE,
  display: 'inline-block',
  padding: '24px 16px',
  background: 'rgba(150, 150, 150, 0.2)',
};

/** `align` 用例里给每个 Space 套的外框。 */
export const SPACE_ALIGN_BOX_STYLE = {
  flex: 'none',
  margin: '4px',
  padding: '4px',
  border: '1px solid #1677ff',
};

/** 让多个盒子横排（替代 antd 的 `<Flex wrap>` —— Flex 尚未实现）。 */
export const SPACE_ROW_STYLE = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
};

/** `vertical` 用例里的卡片（替代 antd 的 `<Card size="small">`）。 */
export const SPACE_CARD_STYLE = {
  ...SPACE_TEXT_STYLE,
  width: '300px',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  background: '#ffffff',
  boxSizing: 'border-box',
};

export const SPACE_CARD_HEAD_STYLE = {
  padding: '12px 16px',
  borderBottom: '1px solid #f0f0f0',
  fontWeight: '600',
};

export const SPACE_CARD_BODY_STYLE = { padding: '16px' };

/** 用例共用的文案（两侧逐字相同）。 */
export const SPACE_TEXT = {
  base: 'Space',
  button: 'Button',
  primary: 'Primary',
  block: 'Block',
  card: 'Card',
  cell: 'Cell',
  link: 'Link',
  pipe: '|',
};

/** 语义化用例：两侧同一组 classNames / styles。 */
export const SPACE_SEMANTIC_CLASSNAMES = {
  root: 'demo-space-root',
  item: 'demo-space-item',
  separator: 'demo-space-separator',
};

export const SPACE_SEMANTIC_STYLES = {
  root: { borderWidth: '2px', borderStyle: 'dashed', padding: '8px' },
  item: { backgroundColor: '#f0f0f0', padding: '4px' },
  separator: { color: '#ff4d4f', fontWeight: 'bold' },
};

/** Space 语义化用例的配套 CSS 已并入上面的 `SEMANTIC_INJECT_CSS`（两侧共用一个注入点）。 */

// ===========================================================================
// Spin
// ===========================================================================

/**
 * Spin 用例里的**上下文文字**一律钉成具体字体。
 *
 * 理由与 `DIVIDER_CONTEXT_FONT` 完全同源（2026-09-18 实测）：React 页来自 antd 的
 * `reset.css`（`html{font-family:sans-serif}`，泛型），Vue 页来自
 * `--apollo-font-family`（具体字体栈）—— 度量接近但字形不同，会让整段文字成为噪声。
 * Spin 自己的根上有 `font-family:var(--apollo-font-family)` / antd 的
 * `resetComponent`，所以组件自身的文字仍被覆盖，这里只钉**上下文**。
 */
const SPIN_CONTEXT_FONT = 'sans-serif';

/** 用例文案（两侧逐字相同）。 */
export const SPIN_TEXT = {
  description: 'Loading...',
  title: 'Alert message title',
  body: 'Further details about the context of this alert.',
  semantic: 'Semantic classNames / styles',
};

/** 定长进度值。`'auto'` 是时间驱动的（200ms 一跳），不能进视觉比对 —— 会 flaky。 */
export const SPIN_PERCENT = 60;

/** 横向排布的容器（三个尺寸并排）。 */
export const SPIN_ROW_STYLE = { display: 'flex', alignItems: 'center', gap: '32px' };

/** 嵌套用例里被包裹的内容块（与 antd 的 `tip.tsx` 同形，值写死避免 reset 差异）。 */
export const SPIN_CONTENT_STYLE = {
  padding: '24px 32px',
  background: 'rgba(0, 0, 0, 0.05)',
  borderRadius: '4px',
  fontFamily: SPIN_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/**
 * `fullscreen` 用例的容器。
 *
 * ⚠️ 为什么必须带 `transform: translateZ(0)`：截图目标是 `#stage`，而
 *    `.apollo-spin-fullscreen{position:fixed;inset:0}` 会脱离文档流 —— `#stage`
 *    高度塌成 0，Playwright 截不了图；即使不塌，fixed 相对**视口**定位，
 *    而两侧页面的 `body` 默认 margin 不同（antd 的 `reset.css` 归零，我们的
 *    base 没有），裁出来的区域会错开几个像素。
 *
 *    `transform` 会给 fixed 后代建立**包含块**，于是遮罩改为相对这个 320×200 的
 *    盒子铺满 —— 两侧完全同构，比到的确实是 `-fullscreen` 那套规则
 *    （遮罩色 / 居中 / 白色文案），只是铺满的是盒子而不是视口。
 *    代价与理由都登记在 `matrix.mjs` 的 `LIMITATIONS`。
 */
export const SPIN_FULLSCREEN_BOX_STYLE = {
  position: 'relative',
  width: '320px',
  height: '200px',
  transform: 'translateZ(0)',
};

/** 语义化用例：两侧同一组 classNames / styles。 */
export const SPIN_SEMANTIC_CLASSNAMES = {
  root: 'demo-spin-root',
  indicator: 'demo-spin-indicator',
  description: 'demo-spin-description',
};

export const SPIN_SEMANTIC_STYLES = {
  root: { padding: '16px' },
  indicator: { color: '#00d4ff' },
};

/** Spin 语义化用例的配套 CSS 已并入上面的 `SEMANTIC_INJECT_CSS`（两侧共用一个注入点）。 */

// ===========================================================================
// Typography
// ===========================================================================

/**
 * ⚠️ 这里**没有** `TYPOGRAPHY_CONTEXT_FONT`（Divider / Spin 都有）。
 *
 * 理由：Typography 是字体驱动的组件，我们逐字保留了 antd `genCommonStyle` 的
 * `.apollo-typography{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size)}`
 * （见 `packages/ui/src/typography/style/index.ts` 的「跳过了什么」）。于是**两侧组件根上**
 * 的字体都是 token 字体栈、字号都是 14px，不存在 Divider/Spin 遇到的那类「上下文字体
 * 不同导致每个墨点都不同」的噪声。
 *
 * 用例里也刻意**不渲染任何 Typography 之外的文字** —— 那部分在两侧确实不同
 * （React 页 `html{font-family:sans-serif}`，Vue 页是 token 字体栈）。
 */

/** 用例文案（两侧逐字相同）。 */
export const TYPOGRAPHY_TEXT = {
  base: 'Apollo Design Typography',
  secondary: 'Secondary',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  disabled: 'Disabled',
  /** 五级标题各自的文案 —— 用同一句话让字号差异可辨。 */
  title: 'Heading',
  /** 段落用 Lorem ipsum：长度固定，换行位置可比。 */
  lorem:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista probare, quae sunt a te dicta?',
  /** 装饰：七个标签各自的内容。 */
  decoration: 'decorated',
  /** 链接文案。 */
  link: 'Apollo Design',
  /** 省略用例的长文本：足够长以在 220px 宽度下溢出。 */
  ellipsis:
    'Ant Design, a design language for background applications, is refined by Ant UED Team. This sentence is intentionally long enough to overflow a 220px wide box, so both sides have to decide where to cut it.',
  /** 复制按钮的 aria-label 依赖 locale（`Copy`），两侧都取 en_US。 */
  copyable: 'Copy me to the clipboard',
};

/** 省略用例的定宽盒子 —— 宽度必须写死，否则两侧的换行位置不可比。 */
export const TYPOGRAPHY_ELLIPSIS_BOX_STYLE = { width: '220px' };

/** 竖向排布（多个用例并排展示时用）。 */
export const TYPOGRAPHY_COLUMN_STYLE = { display: 'flex', flexDirection: 'column', gap: '8px' };

/** 横向排布（四个语义色并排）。 */
export const TYPOGRAPHY_ROW_STYLE = { display: 'flex', flexWrap: 'wrap', gap: '16px' };

/** 语义化用例：两侧同一组 classNames / styles。 */
export const TYPOGRAPHY_SEMANTIC_CLASSNAMES = {
  root: 'demo-typography-root',
  actions: 'demo-typography-actions',
  action: 'demo-typography-action',
};

export const TYPOGRAPHY_SEMANTIC_STYLES = {
  root: { backgroundColor: '#fafafa' },
  actions: { marginInlineStart: '8px' },
};

/** Typography 语义化用例的配套 CSS 已并入上面的 `SEMANTIC_INJECT_CSS`。 */

// ===========================================================================
// DatePicker
// ===========================================================================

/**
 * ⚠️ 上下文的字体必须钉成具体值 —— 理由与 `DIVIDER_CONTEXT_FONT` 完全同源。
 *
 * date-picker 的**触发器**根上有 `font-family`（上游 `resetComponent`，本仓照搬了），
 * 但**面板**是 `resetFont: false`（`style/panel.js`）⇒ 面板里的文字**继承页面**：
 *
 *   React 页（`antd/dist/reset.css`）→ `html{font-family:sans-serif}`（泛型）
 *   Vue 页（本仓 base）              → `html{font-family:var(--apollo-font-family)}`（具体栈）
 *
 * 两者度量接近但字形不同 ⇒ 不钉的话差异全落在面板文字上，看起来像「面板画错了」。
 * 裁决同 `docs/COMPONENT-CHECKLIST.md` 第 15 条：**用例内钉字体，不动全局 BASE_CSS**。
 */
const DATE_PICKER_CONTEXT_FONT = 'sans-serif';

/**
 * 用例容器。
 *
 * 🚨 **`position: relative` 是必须的**：浮层走 `getPopupContainer` 落进这个盒子
 * （见两侧用例的说明）—— 没有它浮层会以更外层为包含块，坐标跑飞。
 * `minHeight` 由各用例通过第二参覆盖（面板要占位）。
 */
export const DATE_PICKER_BOX_STYLE = {
  position: 'relative',
  padding: '24px',
  fontFamily: DATE_PICKER_CONTEXT_FONT,
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/**
 * 两侧共用的**固定**日期字面量。
 *
 * ⚠️ 一律用字面量、**不用 `dayjs()`** —— 否则截图随运行日变化，基线第二天就红。
 */
export const DATE_PICKER_VALUE = '2026-09-30';
export const DATE_PICKER_MULTIPLE = ['2026-09-30', '2026-10-01'];

/**
 * 范围用例的区间。
 *
 * ⚠️ **刻意跨月**（9/10 → 10/5）：双面板下左面板是 9 月、右面板是 10 月，
 * 两个面板各自都能看到「选中 / 区间内 / 区间端点」三种格子态 ——
 * 同月区间会让右面板一格都不选中，等于少测一半。
 */
export const DATE_PICKER_RANGE = ['2026-09-10', '2026-10-05'];

/** 面板锚定的日期（`defaultPickerValue`）—— 让面板显示的月份与运行时刻无关。 */
export const DATE_PICKER_PANEL_ANCHOR = '2026-09-30';

/** 默认字段格式（= 语言包补齐层的兜底值，见 `hooks/picker-filled.ts`）。 */
export const DATE_PICKER_FORMAT = 'YYYY-MM-DD';

/** `showTime` 用例的字段格式（三段全开）。 */
export const DATE_PICKER_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * `variants` 用例：一排触发器的说明文字 + props（两侧逐字相同）。
 *
 * ⚠️ **竖排**（`DATE_PICKER_VARIANTS_STYLE` 用 `flex-direction: column`）而不是横排：
 * 横排在窄视口会换行，而两侧的**换行位置**取决于每个触发器算出来的宽度 ——
 * 一旦有细微差异就会连锁改变布局，让「一个组件错了」变成「整页都错」。
 */
export const DATE_PICKER_VARIANTS = [
  { label: 'outlined', props: {} },
  { label: 'filled', props: { variant: 'filled' } },
  { label: 'borderless', props: { variant: 'borderless' } },
  { label: 'underlined', props: { variant: 'underlined' } },
  { label: 'small', props: { size: 'small' } },
  { label: 'large', props: { size: 'large' } },
  { label: 'status-error', props: { status: 'error' } },
  { label: 'status-warning', props: { status: 'warning' } },
  { label: 'disabled', props: { disabled: true } },
  { label: 'allow-clear-false', props: { allowClear: false } },
  { label: 'prefix', props: { prefix: '¥' } },
  { label: 'no-suffix', props: { suffixIcon: false } },
];

/** `variants` 用例的竖排容器。 */
export const DATE_PICKER_VARIANTS_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  alignItems: 'flex-start',
};

/** `variants` 用例每一行的容器（标签 + 触发器）。 */
export const DATE_PICKER_VARIANT_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

/** `variants` 用例的标签样式 —— 宽度写死，否则两侧的文字度量差异会挪动触发器的位置。 */
export const DATE_PICKER_VARIANT_LABEL_STYLE = {
  width: '140px',
  flex: 'none',
  color: 'rgba(0, 0, 0, 0.65)',
};

// ---------------------------------------------------------------------------
// Masonry
// ---------------------------------------------------------------------------

/**
 * Masonry 用例的**固定**高度。
 *
 * ⚠️ 必须固定：Masonry 的排布完全由**实测高度**决定 ⇒ 用随机值 / `Math.random`
 * 会让截图随运行变化（基线第二天就红）。
 * 这组值刻意「高低交错」，好让三个列的累计高度互不相同（能测出「选最矮列」）。
 */
export const MASONRY_HEIGHTS = [150, 30, 90, 70, 110, 130];

/**
 * 用例容器。
 *
 * 🚨 **必须钉字体**：masonry 的条目内容是用户自己渲染的（`itemRender`），
 * 而 React 页（`antd/dist/reset.css`）与 Vue 页（本仓 base）的 `html` 字体栈不同 ——
 * 不钉的话差异全落在条目文字上，看起来像「排布错了」。
 * 裁决同 `docs/COMPONENT-CHECKLIST.md` 第 15 条：**用例内钉字体，不动全局 BASE_CSS**。
 *
 * ⚠️ 宽度固定 320px：比最小视口（375px）窄 ⇒ 三个视口下容器宽度一致，
 * 排布差异只会来自 `columns` 的响应式解析（那正是 `responsive` 用例要测的）。
 */
export const MASONRY_BOX_STYLE = {
  width: '320px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** 条目内容的样式（两侧逐字相同）。背景/边框都写死，避免依赖主题变量。 */
export const MASONRY_CARD_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#e6f4ff',
  border: '1px solid #91caff',
  boxSizing: 'border-box',
};

// ---------------------------------------------------------------------------
// Anchor
// ---------------------------------------------------------------------------

/**
 * 用例容器。
 *
 * ⚠️ **必须钉字体**：`.{p}-link-title` 是文字，而 React 页（`antd/dist/reset.css`）
 * 与 Vue 页（本仓 base）的 `html` 字体栈不同 —— 不钉的话差异全落在文字上。
 * 裁决同 `docs/COMPONENT-CHECKLIST.md` 第 15 条：**用例内钉字体，不动全局 BASE_CSS**。
 *
 * ⚠️ `position: relative` 不是给浮层用的（Anchor 没有浮层），而是让用例里的
 * **锚点目标**能正常参与文档流；`height` 由各用例通过参数覆盖。
 */
export const ANCHOR_BOX_STYLE = {
  position: 'relative',
  width: '360px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/**
 * 锚点目标的**零高度夹具**。
 *
 * 🚨 为什么不是「几个可见的灰色方块」（2026-10-01 改）：
 *    `getInternalCurrentAnchor` 的判据是 `目标的视口 top <= offsetTop + bounds`
 *    （默认 0 / 5），而视觉用例**不滚动页面** —— 把目标放在锚点**下方**时它们的 top
 *    全都大于阈值，**永远没有任何链接是 active**、ink 也永远不显示。
 *    旧写法就是这样：用例看起来在测核心视觉面，实际只多渲染了几个灰色方块
 *    （证据：旧 `active` / `affix` / `rtl` 三张基线与 `basic` **逐字节相同**）。
 *
 * 现在改成：目标放进一个 `height: 0; overflow: hidden` 的**零高度**容器，用
 * `position: absolute` + `top` 把它们拉开 600px。这样
 *   1. 容器不占高度、目标被裁掉 ⇒ 截图里只有 Anchor 自己，噪声为零；
 *   2. 三个目标的 top ≈ 106 / 706 / 1306，间隔远大于布局漂移 ⇒
 *      「哪条链接 active」由 `bounds` 唯一决定（见下面两个常量）。
 */
export const ANCHOR_TARGET_FIXTURE_STYLE = { height: 0, overflow: 'hidden' };

/**
 * 单个目标的绝对定位样式（`top` 由 `ANCHOR_TARGET_OFFSETS` 给）。
 *
 * ⚠️ `left` / `right` 必须给 —— `getOffsetTop` 里有 `if (rect.width || rect.height)`
 * 分支，宽高都为 0 时它直接返回 `rect.top`（走的是另一条路径）。
 */
export const ANCHOR_TARGET_ABS_STYLE = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: '1px',
};

/** 目标 id（对应 `ANCHOR_ITEMS` 的 `href`）与它们的 `top` 偏移。 */
export const ANCHOR_TARGET_OFFSETS = [
  ['a', 0],
  ['b', 600],
  ['c', 1200],
];

/**
 * `bounds`：阈值，只有 `目标视口 top <= offsetTop + bounds` 的链接才算候选，
 * 命中多个时取 top **最大**的那个（`getInternalCurrentAnchor` 的 `reduce`）。
 *
 * - `ANCHOR_BOUNDS_FIRST`（400）：只命中 a（top≈106），b（≈706）不命中 ⇒ 第 1 条 active。
 * - `ANCHOR_BOUNDS_LAST`（2000）：三条全命中 ⇒ 取 top 最大的 c ⇒ 第 3 条 active。
 *
 * ⚠️ 这两个值与实测 top 差 294px / 694px，布局小漂移不会让「谁 active」悄悄换人。
 */
export const ANCHOR_BOUNDS_FIRST = 400;
export const ANCHOR_BOUNDS_LAST = 2000;

/** `items`（两侧逐字相同）。 */
export const ANCHOR_ITEMS = [
  { key: 'a', href: '#section-a', title: 'Section A' },
  { key: 'b', href: '#section-b', title: 'Section B' },
  { key: 'c', href: '#section-c', title: 'Section C' },
];

/** 嵌套 `items`（垂直时才展开）。 */
export const ANCHOR_NESTED_ITEMS = [
  {
    key: 'a',
    href: '#section-a',
    title: 'Section A',
    children: [
      { key: 'a1', href: '#section-a1', title: 'Section A1' },
      { key: 'a2', href: '#section-a2', title: 'Section A2' },
    ],
  },
  { key: 'b', href: '#section-b', title: 'Section B' },
];

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

/**
 * 用例容器。
 *
 * ⚠️ **必须钉字体**：`.{p}-link` 是文字，而 React 页（`antd/dist/reset.css`）与
 * Vue 页（本仓 base）的 `html` 字体栈不同 —— 不钉的话差异全落在文字上。
 * 裁决同 `docs/COMPONENT-CHECKLIST.md` 第 15 条：**用例内钉字体，不动全局 BASE_CSS**。
 *
 * ⚠️ 宽度 **320px**：比最小视口（375px）窄 ⇒ 三个视口下容器宽度一致；
 * 同时内容**不会换行**（`ol` 是 `flex-wrap: wrap`，而换行位置取决于文字度量 ⇒
 * 一旦换行，差异会从「一个字」放大成「整段错位」）。
 */
export const BREADCRUMB_BOX_STYLE = {
  width: '320px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** `items`（两侧逐字相同）。最后一项**没有 `href`** ⇒ 渲染成 `<span>`（不是 `<a>`）。 */
export const BREADCRUMB_ITEMS = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

/** `params` 用例的路径参数。 */
export const BREADCRUMB_PARAMS = { id: '7' };

/**
 * `:param` 替换用例（**标题里带 `:id`，让替换在像素上可见**）。
 *
 * 🚨 这里刻意**不**把「`href` 累加」当视觉断言：`href` 是**属性**，截图上根本看不见 ——
 * 第一版用 `title: 'List'` 时本变体与 `basic` **逐字节相同**（实测 `md5` 同哈希），
 * 是空转的。`href` 的累加归 **L4 的 DOM 契约**（`breadcrumb.dom.json`）。
 *
 * ⇒ 视觉上真正要钉的是：**`title` 里的 `:param` 会被替换成实际值**（`List :id` → `List 7`）。
 */
export const BREADCRUMB_PATH_ITEMS = [
  { title: 'Home', path: 'home' },
  { title: 'List :id', path: 'list/:id' },
  { title: 'Detail' },
];

/** `type: 'separator'` 的显式分隔符用例（与「注入的分隔符」并存）。 */
export const BREADCRUMB_SEPARATOR_ITEMS = [
  { title: 'Home', href: '#/home' },
  { type: 'separator', separator: '|' },
  { title: 'Detail' },
];

/**
 * 带 `menu` 的项 ⇒ 会被 `Dropdown` 包一层 `.{p}-overlay-link`，
 * 并渲染 `dropdownIcon`（默认 `DownOutlined`）。
 *
 * ⚠️ 这是**唯一**会渲染图标并命中 `.{p}-overlay-link > .apollo-icon` 的用例。
 */
export const BREADCRUMB_MENU_ITEMS = [
  { title: 'Home', href: '#/home' },
  {
    title: 'Group',
    menu: {
      items: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
    },
  },
  { title: 'Detail' },
];

/**
 * 图标用例：**两侧同一份内联 `<svg>` 替身**。
 *
 * ⚠️ 为什么不用 `@apollo-design/icons`：视觉层只链接 `theme` + `ui` 两个 workspace 包
 * ⇒ **用例文件**里 import `@apollo-design/icons` 解析不到（组件内部 import 没问题）。
 * 用裸 `<svg>` 正好命中 `.{p}-link > svg` 那条「第三方图标」规则。
 */
export const BREADCRUMB_ICON_PATH = 'M512 64 960 512 512 960 64 512z';
export const BREADCRUMB_ICON_SVG_PROPS = {
  viewBox: '0 0 1024 1024',
  width: '1em',
  height: '1em',
  fill: 'currentColor',
};
// ⚠️ 装饰性图标的 `aria-hidden="true"` **在两侧用例里字面量写**，不放这个常量里 ——
//    biome 的 `a11y/noSvgWithoutTitle` **看不穿对象 spread**，放常量里会报
//    「Alternative text title element cannot be empty」（实测）。

/** 图标用例的 `items`（每一项是「图标 + 文字」）。 */
export const BREADCRUMB_ICON_ITEMS = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/**
 * Card 用例的容器。
 *
 * ⚠️ 宽度固定 320px（**窄于最小视口 375px**）⇒ 三个视口下容器宽度一致；
 * 且正文**不换行**（换行位置依赖文字度量，一旦换行差异会从「一行」放大成「整段错位」）。
 */
export const CARD_BOX_STYLE = {
  width: '320px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** 卡片正文段落（两侧逐字相同，含 margin —— 默认 `p` 的 margin 会污染像素）。 */
export const CARD_PARAGRAPH_STYLE = { margin: '0 0 8px' };

/**
 * 封面 / 头像的替身：**纯色块**。
 *
 * ⚠️ 刻意**不用外链图片** —— 图片加载时序会让截图不稳定（antd 的 demo 用的是
 * alipayobjects 的外链）。纯色块同样命中 `.{p}-cover > *` 与 `-meta-avatar` 两条规则。
 */
export const CARD_COVER_STYLE = { height: '60px', background: '#d9d9d9' };
export const CARD_AVATAR_STYLE = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: '#d9d9d9',
};

/** `Card.Grid` 的样式（对齐 antd 的 grid-card demo：25% + 居中）。 */
export const CARD_GRID_STYLE = { width: '25%', textAlign: 'center' };

/** `tabList`（走 **`tab` 通道** —— 与 antd 的 tabs demo 一致）。 */
export const CARD_TAB_LIST = [
  { key: 'tab1', tab: 'Tab 1' },
  { key: 'tab2', tab: 'Tab 2' },
];

/** `Card.Meta` 的文案。 */
export const CARD_META_TITLE = 'Card title';
export const CARD_META_DESCRIPTION = 'This is the description';

/**
 * 语义化变体的槽位类名与样式。
 *
 * 🚨 `styles` 必须是**肉眼可见**的值 —— 只给 `classNames` 的话本变体与 `basic`
 * **逐字节相同**（类名是属性，截图上不可见）⇒ 空转（PITFALLS 276）。
 */
export const CARD_SEMANTIC_CLASS_NAMES = {
  root: 'demo-card-root',
  header: 'demo-card-header',
  body: 'demo-card-body',
  extra: 'demo-card-extra',
  title: 'demo-card-title',
  actions: 'demo-card-actions',
  cover: 'demo-card-cover',
};
export const CARD_SEMANTIC_STYLES = {
  root: { background: '#ffe7ba' },
  header: { background: '#bae7ff' },
  body: { padding: '8px' },
};

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/**
 * Avatar 用例的容器。
 *
 * ⚠️ 容器宽度固定 320px（**窄于最小视口 375px**）⇒ 三个视口下容器一致。
 * ⚠️ 字体在用例内钉住（头像的文字是**被测量**的对象，字体一变 scale 就变）。
 */
export const AVATAR_BOX_STYLE = {
  width: '320px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** 行内间距（每个用例把头像排成一行）。 */
export const AVATAR_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

/**
 * 图片头像的替身：**data URI**（1×1 PNG）。
 *
 * ⚠️ 刻意**不用外链图片** —— 加载时序会让截图不稳定（与 `image` / `avatar` 的 demo 同判）。
 */
export const AVATAR_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/** 字符头像的文案（`USER` 用于测「自动缩字」；`A` 是单字符）。 */
export const AVATAR_TEXT_SHORT = 'U';
export const AVATAR_TEXT_LONG = 'USER';
/** 需要缩放的长文本（`gap` 默认 4 ⇒ 触发 `setScaleParam` 的缩放分支）。 */
export const AVATAR_TEXT_OVERFLOW = 'Edward King 3';

/** 响应式尺寸表（对齐 antd 的 responsive demo）。 */
export const AVATAR_RESPONSIVE_SIZE = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 80,
  xxl: 100,
};

/**
 * List 用例的容器。
 *
 * ⚠️ 与 avatar / card 同判的两条硬约定：**字体在用例内钉住** + **容器宽度 320px**
 * （窄于最小视口 ⇒ 三视口一致、正文不换行；唯一该变的是 grid 的列数）。
 */
export const LIST_BOX_STYLE = {
  width: '320px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
};

/** 列表数据。⚠️ **固定值**（不用 `Math.random`，否则冒烟与基线都不可复现）。 */
export const LIST_DATA = ['Alpha', 'Beta', 'Gamma'];
export const LIST_DATA_LONG = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
export const LIST_DESC = 'description text';
/** `Item.Meta` 头像的替身（纯色方块 —— 不引入第二个组件的样式面）。 */
export const LIST_AVATAR_STYLE = {
  display: 'inline-block',
  width: '32px',
  height: '32px',
  background: '#999',
  borderRadius: '50%',
};
