/** Avatar and its identical named/static Group export, public contracts and style helpers. */

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
  AvatarEmits,
  AvatarGroupMax,
  AvatarGroupProps,
  AvatarGroupRef,
  AvatarGroupSlot,
  AvatarProps,
  AvatarRef,
  AvatarShape,
  AvatarSize,
  AvatarSlot,
  AvatarSlots,
  ScreenSizeMap,
} from './interface';
export { genAvatarStyle, genTokenDecls as genAvatarTokenDecls } from './style';
export type { ComponentToken as AvatarComponentToken } from './style/token';
export { prepareComponentToken as prepareAvatarComponentToken } from './style/token';
