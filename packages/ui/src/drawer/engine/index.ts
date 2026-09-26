/**
 * drawer 内核的出口 —— rc-drawer 的 Vue 自建（`@rc-component/drawer@1.4.2`，449 行 / 7 文件）。
 *
 * 文件对应关系：
 *   | rc 侧 | 本仓 |
 *   |---|---|
 *   | `Drawer.js`（129） | `Drawer.ts`（open 归一化 + 焦点还原 + Portal 包裹） |
 *   | `DrawerPopup.js`（264） | `DrawerPopup.ts`（mask + 面板 + 动效 + push + resizable） |
 *   | `DrawerPanel.js`（33） | `DrawerSection.ts`（rc 的 panel：`{p}-section` div） |
 *   | `hooks/useDrag.js`（97） | `useDrag.ts` |
 *   | `hooks/useFocusable.js`（17） | `useFocusable.ts` |
 *   | `context.js` | `context.ts`（推挤链 + panelRef 透传） |
 */

export type { DrawerContextValue, DrawerRefContextValue } from './context';
export { drawerContextKey, drawerRefContextKey } from './context';
export { default as Drawer } from './Drawer';
export type { DrawerMotion } from './DrawerPopup';
export { default as DrawerPopup } from './DrawerPopup';
export { default as DrawerSection } from './DrawerSection';
export { useDrag } from './useDrag';
export { useFocusable } from './useFocusable';
