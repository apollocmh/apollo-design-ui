/**
 * Avatar 的公共导出。
 *
 * 与 antd 的 es/avatar/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import AvatarComponent from './Avatar.vue';

/** Avatar 组件。注册名 `AAvatar`（COMPONENT-RULES.md 规则 R2）。 */
export const Avatar = withInstall(AvatarComponent);

export default Avatar;

// TODO(G2): export type { AvatarProps, AvatarRef, ... } from './interface';
// TODO(G4): export { genAvatarStyle } from './style';
// TODO(G4): export type { ComponentToken as AvatarComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareAvatarComponentToken } from './style/token';
