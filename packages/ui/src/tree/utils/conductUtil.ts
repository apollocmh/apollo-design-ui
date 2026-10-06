/**
 * Tree 的勾选级联工具（rc `utils/conductUtil.js` 的逐字移植，H5：不依赖 @rc-component/*）。
 *
 * 两段式语义（rc 逐字，勿改）：
 *   - fill（checked=true）：自上而下补满子级 → 自下而上回算父级（全选/半选）
 *   - clean（checked={checked:false, halfCheckedKeys}）：自上而下按「父未勾且未半选」
 *     删除子级 → 自下而上回算父级
 *   - disabled 节点不参与级联（isCheckDisabled：disabled / disableCheckbox / checkable===false）
 *   - 最终 halfCheckedKeys 要从 checkedKeys 里剔除（removeFromCheckedKeys）
 */

import { warning } from '@apollo-design/utils';
import type { SafeKey } from '../interface';
import type { BasicDataNodeLike } from './keyUtil';

/** 级联计算用的最小实体视图（TreeDataEntity 的结构子集，node 收窄为 BasicDataNodeLike）。 */
export interface ConductEntity {
  key: SafeKey;
  pos: string;
  level: number;
  node: BasicDataNodeLike;
  parent?: ConductEntity;
  children?: ConductEntity[];
}

function removeFromCheckedKeys(
  halfCheckedKeys: Set<SafeKey>,
  checkedKeys: Set<SafeKey>,
): Set<SafeKey> {
  const filteredKeys = new Set<SafeKey>();
  halfCheckedKeys.forEach((key) => {
    if (!checkedKeys.has(key)) {
      filteredKeys.add(key);
    }
  });
  return filteredKeys;
}

/** 节点是否不参与级联勾选。 */
export function isCheckDisabled(node: BasicDataNodeLike | null | undefined): boolean {
  const { disabled, disableCheckbox, checkable } = node || {};
  return Boolean(disabled || disableCheckbox) || checkable === false;
}

type GetCheckDisabled = (node: BasicDataNodeLike | null | undefined) => boolean;

// 自上而下补满
function fillConductCheck(
  keys: Set<SafeKey>,
  levelEntities: Map<number, Set<ConductEntity>>,
  maxLevel: number,
  syntheticGetCheckDisabled: GetCheckDisabled,
): { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] } {
  const checkedKeys = new Set(keys);
  const halfCheckedKeys = new Set<SafeKey>();

  // Add checked keys top to bottom
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set<ConductEntity>();
    entities.forEach((entity) => {
      const { key, node, children = [] } = entity;
      if (checkedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children
          .filter((childEntity) => !syntheticGetCheckDisabled(childEntity.node))
          .forEach((childEntity) => {
            checkedKeys.add(childEntity.key);
          });
      }
    });
  }

  // Add checked keys from bottom to top
  const visitedKeys = new Set<SafeKey>();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set<ConductEntity>();
    entities.forEach((entity) => {
      const { parent, node } = entity;

      // Skip if no need to check
      // ⚠️ 判据用**局部变量** `parent`（不是 `entity.parent`）—— 这样 TS 能把它收窄，
      //    下面就不需要 10 处 `parent!`（那些 `!` 正是 PITFALLS 记的「改成 `?.` 会往 Set 里塞 undefined」）
      if (syntheticGetCheckDisabled(node) || !parent || visitedKeys.has(parent.key)) {
        return;
      }

      // Skip if parent is disabled
      if (syntheticGetCheckDisabled(parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || [])
        .filter((childEntity) => !syntheticGetCheckDisabled(childEntity.node))
        .forEach(({ key }) => {
          const checked = checkedKeys.has(key);
          if (allChecked && !checked) {
            allChecked = false;
          }
          if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
            partialChecked = true;
          }
        });
      if (allChecked) {
        checkedKeys.add(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys)),
  };
}

// 自上而下清除
function cleanConductCheck(
  keys: Set<SafeKey>,
  halfKeys: Set<SafeKey>,
  levelEntities: Map<number, Set<ConductEntity>>,
  maxLevel: number,
  syntheticGetCheckDisabled: GetCheckDisabled,
): { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] } {
  const checkedKeys = new Set(keys);
  let halfCheckedKeys = new Set(halfKeys);

  // Remove checked keys from top to bottom
  for (let level = 0; level <= maxLevel; level += 1) {
    const entities = levelEntities.get(level) || new Set<ConductEntity>();
    entities.forEach((entity) => {
      const { key, node, children = [] } = entity;
      if (!checkedKeys.has(key) && !halfCheckedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children
          .filter((childEntity) => !syntheticGetCheckDisabled(childEntity.node))
          .forEach((childEntity) => {
            checkedKeys.delete(childEntity.key);
          });
      }
    });
  }

  // Remove checked keys from bottom to top
  halfCheckedKeys = new Set<SafeKey>();
  const visitedKeys = new Set<SafeKey>();
  for (let level = maxLevel; level >= 0; level -= 1) {
    const entities = levelEntities.get(level) || new Set<ConductEntity>();
    entities.forEach((entity) => {
      const { parent, node } = entity;

      // 同上：判据用局部变量 `parent`，让 TS 收窄（去掉 `parent!`）
      if (syntheticGetCheckDisabled(node) || !parent || visitedKeys.has(parent.key)) {
        return;
      }

      if (syntheticGetCheckDisabled(parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      let allChecked = true;
      let partialChecked = false;
      (parent.children || [])
        .filter((childEntity) => !syntheticGetCheckDisabled(childEntity.node))
        .forEach(({ key }) => {
          const checked = checkedKeys.has(key);
          if (allChecked && !checked) {
            allChecked = false;
          }
          if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
            partialChecked = true;
          }
        });
      if (!allChecked) {
        checkedKeys.delete(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys)),
  };
}

/**
 * 级联勾选的主入口。
 *
 * @param keyList  当前勾选 key 列表（不存在的 key 会告警并跳过）
 * @param checked  `true` = fill；否则为 `{ checked: false, halfCheckedKeys }` = clean
 * @param keyEntities 键实体表
 * @param getCheckDisabled 自定义「不参与级联」判据（默认 isCheckDisabled）
 */
export function conductCheck(
  keyList: (SafeKey | TreeKeyLike)[],
  checked: true | { checked: false; halfCheckedKeys: SafeKey[] },
  keyEntities: Record<SafeKey, ConductEntity>,
  getCheckDisabled?: GetCheckDisabled,
): { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] } {
  const warningMissKeys: (SafeKey | TreeKeyLike)[] = [];
  const syntheticGetCheckDisabled: GetCheckDisabled = getCheckDisabled ?? isCheckDisabled;

  // We only handle exist keys
  const keys = new Set(
    keyList.filter((key) => {
      const hasEntity = Boolean(keyEntities[key as SafeKey]);
      if (!hasEntity) {
        warningMissKeys.push(key);
      }
      return hasEntity;
    }),
  );
  const levelEntities = new Map<number, Set<ConductEntity>>();
  let maxLevel = 0;

  // Convert entities by level for calculation
  Object.keys(keyEntities).forEach((key) => {
    const entity: ConductEntity | undefined = keyEntities[key as SafeKey];
    if (!entity) return;
    const { level } = entity;
    let levelSet = levelEntities.get(level);
    if (!levelSet) {
      levelSet = new Set<ConductEntity>();
      levelEntities.set(level, levelSet);
    }
    levelSet.add(entity);
    maxLevel = Math.max(maxLevel, level);
  });
  warning(
    !warningMissKeys.length,
    `Tree missing follow keys: ${warningMissKeys
      .slice(0, 100)
      .map((key) => `'${key}'`)
      .join(', ')}`,
  );

  let result: { checkedKeys: SafeKey[]; halfCheckedKeys: SafeKey[] };
  if (checked === true) {
    result = fillConductCheck(keys, levelEntities, maxLevel, syntheticGetCheckDisabled);
  } else {
    result = cleanConductCheck(
      keys,
      new Set(checked.halfCheckedKeys),
      levelEntities,
      maxLevel,
      syntheticGetCheckDisabled,
    );
  }
  return result;
}

/** 兼容传入非 SafeKey 的 key 形态（TreeKey 的宽化）。 */
type TreeKeyLike = string | number;
