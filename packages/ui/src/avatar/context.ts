import type { ComputedRef, InjectionKey } from 'vue';
import type { AvatarContextType } from './interface';

export type AvatarContextValue = AvatarContextType;
/** Each Group provides one stable reactive size/shape context. */
export const avatarContextKey: InjectionKey<AvatarContextValue> = Symbol('apolloAvatar');

/** Internal namespace ownership, independent of the public size/shape context. */
export const avatarGroupPrefixKey: InjectionKey<ComputedRef<string>> =
  Symbol('apolloAvatarGroupPrefix');
