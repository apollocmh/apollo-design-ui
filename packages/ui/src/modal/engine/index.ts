/**
 * modal 内核的出口 —— rc-dialog 的 Vue 自建（`@rc-component/dialog@1.10.0`，534 行 / 10 文件）。
 *
 * 文件对应关系：
 *   | rc 侧 | 本仓 |
 *   |---|---|
 *   | `DialogWrap.js`（80） | `DialogWrap.ts`（Portal 包裹 + `destroyOnHidden` 短路 + `afterClose` 三步） |
 *   | `Dialog/index.js`（175） | `Dialog.ts`（root + mask + wrap + 焦点归还 + `isFixedPos`） |
 *   | `Dialog/Content/index.js`（76） | `Content.ts`（CSSMotion + `transformOrigin`） |
 *   | `Dialog/Content/Panel.js`（135） | `Panel.ts`（三段结构 + 关闭按钮 + role/aria + 焦点陷阱） |
 *   | `Dialog/Content/MemoChildren.js`（3） | `MemoChildren.ts` |
 *   | `Dialog/Mask.js`（30） | `Mask.ts` |
 *   | `util.js`（35） | `util.ts`（`getMotionName` / `offset` / `clsx`） |
 *   | `context.js`（2） | `context.ts`（面板元素引用的透传） |
 *   | `index.js`（4） | 本文件 |
 *
 * 复用的基建（不重写）：
 *   - 挂载与层级 → `@apollo-design/portal`（`autoLock` / `onEsc`）
 *   - 动效 → `@apollo-design/motion` 的 `CSSMotion`
 *   - 焦点陷阱 → `@apollo-design/utils` 的 `useLockFocus`
 *   - 焦点归还 → `@apollo-design/a11y` 的 `useFocusRestore`
 */

export { default as Content } from './Content';
export { type DialogRefContextValue, dialogRefContextKey } from './context';
export { default as Dialog } from './Dialog';
export { default as DialogWrap } from './DialogWrap';
export { default as Mask } from './Mask';
export { default as MemoChildren } from './MemoChildren';
export { default as Panel } from './Panel';
export { clsx, getMotionName, offset, toCssSize } from './util';
