/**
 * Tree 的键实体工具（rc `utils/keyUtil.js` 的逐字移植，H5：不依赖 @rc-component/*）。
 */

import type { SafeKey, TreeKey } from './types';

/** 从键实体表里取实体（不存在返回 undefined）。 */
export default function getEntity<Entity>(
  keyEntities: Record<SafeKey, Entity>,
  key: SafeKey | TreeKey,
): Entity | undefined {
  return Object.hasOwn(keyEntities, key) ? keyEntities[key] : undefined;
}

/** 结构约束（避免 utils 反向依赖 interface 的泛型默认值）。 */
export interface BasicDataNodeLike {
  key?: TreeKey;
  title?: unknown;
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  isLeaf?: boolean;
  children?: BasicDataNodeLike[];
}
