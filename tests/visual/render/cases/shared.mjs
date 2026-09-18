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
`;

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
