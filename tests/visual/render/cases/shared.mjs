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
`;
