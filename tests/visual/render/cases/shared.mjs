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
.demo-divider-root { border-color: #7cb305; }
.demo-divider-content { letter-spacing: 1px; }
.demo-spin-root { border: 1px dashed #ccc; }
.demo-spin-indicator { filter: saturate(200%); }
.demo-spin-description { color: #1890ff; font-weight: bold; }

`;

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
