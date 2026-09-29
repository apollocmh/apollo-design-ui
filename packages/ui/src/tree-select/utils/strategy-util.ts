/**
 * 勾选策略裁剪（rc `utils/strategyUtil.js` 逐字语义）。
 *
 * - SHOW_CHILD：只保留「无子节点」或「子节点未全部勾选」的 key；
 * - SHOW_PARENT：只保留「无父」或「自身/父 disabled」或「父未勾选」的 key；
 * - SHOW_ALL：原样返回。
 */

import type { TreeEntity } from '../../tree/utils/treeUtil';
import type { TreeSelectDataNode } from '../interface';
import { type FilledFieldNames, isCheckDisabled } from './value-util';

export const SHOW_ALL = 'SHOW_ALL';
export const SHOW_PARENT = 'SHOW_PARENT';
export const SHOW_CHILD = 'SHOW_CHILD';

export type ShowCheckedStrategy = typeof SHOW_ALL | typeof SHOW_PARENT | typeof SHOW_CHILD;

type EntityMap = Record<string, TreeEntity<TreeSelectDataNode>>;

export function formatStrategyValues(
  values: (string | number)[],
  strategy: ShowCheckedStrategy,
  keyEntities: EntityMap,
  fieldNames: FilledFieldNames,
): (string | number)[] {
  const valueSet = new Set(values);
  if (strategy === SHOW_CHILD) {
    return values.filter((key) => {
      const entity = keyEntities[key];
      return (
        !entity ||
        !entity.children ||
        !entity.children.some(({ node }) => valueSet.has(node[fieldNames.value] as string)) ||
        !entity.children.every(
          ({ node }) => isCheckDisabled(node) || valueSet.has(node[fieldNames.value] as string),
        )
      );
    });
  }
  if (strategy === SHOW_PARENT) {
    return values.filter((key) => {
      const entity = keyEntities[key];
      const parent = entity ? entity.parent : null;
      return (
        !entity ||
        !parent ||
        isCheckDisabled(entity.node) ||
        isCheckDisabled(parent.node) ||
        !valueSet.has(parent.key)
      );
    });
  }
  return values;
}
