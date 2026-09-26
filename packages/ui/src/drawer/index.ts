/**
 * Drawer 的公共导出。
 *
 * 与 antd 的 `es/drawer/index.js` 对齐的对外面：
 *   - 默认导出 = `Drawer`（组件）；
 *   - `Drawer._InternalPanelDoNotUseOrYouWillBeFired` 是私有静态属性（见下）。
 *
 * ⚠️ `Drawer.vue` 骨架已删 —— 本组件是 `.ts` 实现（同 image / message / notification）。
 */
import { withInstall } from '../_internal/with-install';
import DrawerComponent from './Drawer';
import PurePanel from './PurePanel';

/** Drawer 组件。注册名 `ADrawer`（COMPONENT-RULES.md 规则 R2）。 */
// ⚠️ `withInstall` 的返回类型与「带静态属性的组件」不是可比较类型 ⇒ 按仓库惯例
//    （message 的静态方法集合同源）经 `unknown` 断言一次
export const Drawer = withInstall(DrawerComponent) as unknown as typeof DrawerComponent & {
  /** @private Internal Component. Do not use in your production. */
  _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
};

Drawer._InternalPanelDoNotUseOrYouWillBeFired = PurePanel;

export type {
  DrawerPlacement,
  DrawerProps,
  DrawerPurePanelProps,
  DrawerResizableConfig,
  DrawerSemanticType,
  DrawerSize,
  FocusableConfig,
  MaskType,
  PushState,
} from './interface';
export { PurePanel as DrawerPurePanel };
export default Drawer;
