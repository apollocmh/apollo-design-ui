/**
 * Avatar 的公共导出。
 *
 * 与 antd 的 `es/avatar/index.js` 对齐的对外面：
 *   - 默认导出 `Avatar`（含 `Group` 静态子组件）
 *   - 子组件同时提供**具名导出**（`AvatarGroup`）
 *   - 全部类型 + 样式生成函数 + Component Token
 *
 * ── 与 antd 的**形态**差异（PLATFORM，不是行为差异）────────────────────────────
 *
 * antd 用 `Avatar.Group = AvatarGroup` 这种「函数组件挂属性」做复合组件；
 * Vue 里对应 `Object.assign(组件, { Group })`。两者可观测行为一致：
 * `<Avatar.Group>`（JSX）与 `<AvatarGroup>` / `<AAvatarGroup>` 渲染同一棵 DOM。
 * ⚠️ `Object.assign` 而不是「先声明再赋值」—— `Object.assign` 的返回值是交叉类型，
 * `Avatar.Group` 在**类型层**才可见（裸赋值不更新类型，下游用 `Avatar.Group` 会报 TS2339）。
 * 与 `Skeleton` / `Space` / `Card` 同一条。
 */

import { withInstall } from '../_internal/with-install';
import AvatarComponent from './Avatar.vue';
import AvatarGroupComponent from './AvatarGroup.vue';

/** `Avatar.Group`。注册名 `AAvatarGroup`。 */
export const AvatarGroup = withInstall(AvatarGroupComponent);

/**
 * Avatar 复合组件。注册名 `AAvatar`。
 *
 * ⚠️ 静态子组件与具名导出指向**同一个对象**。
 */
export const Avatar = withInstall(
  Object.assign(AvatarComponent, {
    Group: AvatarGroup,
  }),
);

export default Avatar;

export type {
  AvatarConfig,
  AvatarContextType,
  AvatarGroupMax,
  AvatarGroupProps,
  AvatarGroupRef,
  AvatarGroupSlot,
  AvatarProps,
  AvatarRef,
  AvatarShape,
  AvatarSize,
  AvatarSlot,
  ScreenSizeMap,
} from './interface';
export { genAvatarStyle, genTokenDecls as genAvatarTokenDecls } from './style';
export type { ComponentToken as AvatarComponentToken } from './style/token';
export { prepareComponentToken as prepareAvatarComponentToken } from './style/token';
