/**
 * demo 里的**替身**元素样式。
 *
 * ── 为什么需要这个文件 ────────────────────────────────────────────────────────
 *
 * antd 的 15 个 Space demo 里有 13 个依赖 `Button` / `Input` / `Select` / `Card` /
 * `Typography` 等组件，而它们在本仓库**尚未实现**（Space 在 DAG 上先于它们）。
 * 如果 demo 直接 import 那些组件，`demoTest` 与 `a11yDemoTest` 会整批红。
 *
 * 所以 demo 用原生 `<button>` / `<input>` / `<select>` / `<div>` **替身**，
 * 并把样式钉成 antd 6.6.4 的默认 token 值（`#1677ff` / `#d9d9d9` / 6px 圆角 /
 * 32px 高 …）—— 目的是让 demo **看起来仍是 Space 的 demo**，而不是变成一堆裸元素。
 *
 * ── 三件必须说清楚的事 ───────────────────────────────────────────────────────
 *
 * 1. **替身不是「等价实现」**。它只保证「Space 的间距 / 分隔符 / 紧凑拼接在真实尺寸的
 *    子元素上是什么样」。替身自己的 hover / focus / disabled 视觉一概没有。
 *    缺口登记在 `README.md` §7。
 * 2. **数值必须带单位**。Vue 的运行时 `setStyle` **不做** px 补全
 *    （PITFALLS 32，与 React 的 `dangerousStyleValue` 不同）——
 *    写 `{ height: 32 }` 会被静默丢弃。
 * 3. **可交互替身必须有可访问名**。`a11yDemoTest` 对每个 demo 跑 axe，
 *    裸 `<input>` / `<select>` 会命中 `label` 规则。所以这里的输入类替身一律要求
 *    调用方补 `aria-label`（见各 demo）。
 */

/** 行内文字（与 antd 的 `fontSize` / `lineHeight` / `colorText` 同值）。 */
const TEXT = {
  fontFamily: 'inherit',
  fontSize: '14px',
  lineHeight: '1.5714285714285714',
  color: 'rgba(0, 0, 0, 0.88)',
} as const;

/** 按钮基座。 */
const BUTTON_BASE = {
  ...TEXT,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  padding: '4px 15px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  background: '#ffffff',
  cursor: 'pointer',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
} as const;

/** antd 的默认按钮（`<Button>`）。 */
export const BTN_DEFAULT = BUTTON_BASE;

/** antd 的主按钮（`<Button type="primary">`）。 */
export const BTN_PRIMARY = {
  ...BUTTON_BASE,
  border: '1px solid #1677ff',
  background: '#1677ff',
  color: '#ffffff',
} as const;

/** antd 的虚线按钮（`<Button type="dashed">`）。 */
export const BTN_DASHED = {
  ...BUTTON_BASE,
  borderStyle: 'dashed',
} as const;

/** antd 的文本/链接按钮（`<Button type="text">` / `type="link"`）。 */
export const BTN_TEXT = {
  ...BUTTON_BASE,
  border: '1px solid transparent',
  background: 'transparent',
  color: '#1677ff',
} as const;

/** 按钮的小尺寸（`size="small"`，高 24px）。 */
export const BTN_SMALL = {
  ...BUTTON_BASE,
  height: '24px',
  padding: '0 7px',
  fontSize: '14px',
} as const;

/** 输入框（`<Input>`）。⚠️ 调用方必须补 `aria-label`。 */
export const INPUT = {
  ...TEXT,
  height: '32px',
  padding: '4px 11px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  background: '#ffffff',
  boxSizing: 'border-box',
  width: '100%',
} as const;

/** 下拉框（`<Select>`）。⚠️ 调用方必须补 `aria-label`。 */
export const SELECT = {
  ...INPUT,
  padding: '4px 11px',
  cursor: 'pointer',
} as const;

/** 禁用态的输入框 / 下拉框。 */
export const INPUT_DISABLED = {
  ...INPUT,
  background: 'rgba(0, 0, 0, 0.04)',
  color: 'rgba(0, 0, 0, 0.25)',
  cursor: 'not-allowed',
} as const;

/** 卡片（`<Card size="small">`）。 */
export const CARD = {
  ...TEXT,
  width: '300px',
  padding: '0',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  background: '#ffffff',
  boxSizing: 'border-box',
} as const;

/** 卡片标题栏。 */
export const CARD_HEAD = {
  padding: '12px 16px',
  borderBottom: '1px solid #f0f0f0',
  fontWeight: '600',
} as const;

/** 卡片内容区。 */
export const CARD_BODY = { padding: '16px' } as const;

/**
 * `align` demo 里的「高矮不齐的块」。
 *
 * 与 antd 的 `mockBox` 同形：足够高、足够宽，让四种 `align` 的差异肉眼可见。
 */
export const MOCK_BOX = {
  ...TEXT,
  display: 'inline-block',
  padding: '24px 16px',
  background: 'rgba(150, 150, 150, 0.2)',
} as const;

/** `align` demo 里给每个 Space 套的外框。 */
export const ALIGN_BOX = {
  flex: 'none',
  margin: '4px',
  padding: '4px',
  border: '1px solid #1677ff',
} as const;

/** 让多个盒子横排（替代 antd 的 `<Flex wrap>`）。 */
export const ROW_WRAP = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' } as const;

/** 链接（`<Typography.Link>`）。 */
export const LINK = { ...TEXT, color: '#1677ff', textDecoration: 'none' } as const;
