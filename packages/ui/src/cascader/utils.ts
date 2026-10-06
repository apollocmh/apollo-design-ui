/**
 * Cascader 的工具集 —— `@rc-component/cascader` 的 `es/utils/commonUtil.js` +
 * `es/utils/treeUtil.js` 的 Vue 版移植（逐函数对齐，行为契约见
 * `docs/analysis/cascader.md` §3.1）。
 */

import { convertDataToEntities, type DataEntity } from './engine/tree';

/** 多维值在 pathKey 里的分隔符（rc 的内部约定，进 keyEntities 的键）。 */
export const VALUE_SPLIT = '__RC_CASCADER_SPLIT__';

/** 多选回填策略：向上收（父）或保留叶子（子）。 */
export const SHOW_PARENT = 'SHOW_PARENT';
export const SHOW_CHILD = 'SHOW_CHILD';
export type ShowCheckedStrategy = typeof SHOW_PARENT | typeof SHOW_CHILD;

/** 字段名映射（Cascader 的 options 形状可定制）。 */
export interface FieldNames {
  label?: string;
  value?: string;
  children?: string;
}

export interface FilledFieldNames {
  label: string;
  value: string;
  key: string;
  children: string;
}

/** 选项的宽松形状（字段名可映射，所以全部索引访问）。 */
export type BaseOptionType = Record<string, unknown> & {
  disabled?: boolean;
  isLeaf?: boolean;
  loading?: boolean;
};

/** 默认形状的选项。 */
export type DefaultOptionType = BaseOptionType & {
  label?: unknown;
  value?: string | number | null;
  children?: DefaultOptionType[];
};

/** 值路径：从根到叶（或 changeOnSelect 的中间层）的 value 串。 */
export type ValueCell = (string | number)[];
export type RawValue = string | number | ValueCell;

/** value → pathKey（`VALUE_SPLIT` 连接）。 */
export function toPathKey(value: ValueCell): string {
  return value.map(String).join(VALUE_SPLIT);
}

/** 批量 value → pathKey。 */
export function toPathKeys(values: ValueCell[]): string[] {
  return values.map(toPathKey);
}

/** pathKey → value（拆回数组；保留原始字符串形态）。 */
export function toPathValueStr(pathKey: string): string[] {
  return pathKey.split(VALUE_SPLIT);
}

/** 补全字段名；⚠️ `key` 与 `value` **同字段**（rc 判据）。 */
export function fillFieldNames(fieldNames?: FieldNames): FilledFieldNames {
  const { label, value, children } = fieldNames ?? {};
  const val = value || 'value';
  return {
    label: label || 'label',
    value: val,
    key: val,
    children: children || 'children',
  };
}

/** 叶子判定：显式 `isLeaf` 优先，否则看 children。 */
export function isLeaf(option: BaseOptionType | undefined, fieldNames: FilledFieldNames): boolean {
  return option?.isLeaf ?? !(option?.[fieldNames.children] as BaseOptionType[] | undefined)?.length;
}

/** 把激活项滚进父容器可视区（键盘导航用；调用方传 HTMLElement）。 */
export function scrollIntoParentView(element: HTMLElement): void {
  const parent = element.parentElement;
  if (!parent) return;
  const offset = element.offsetTop - parent.offsetTop;
  if (offset - parent.scrollTop < 0) {
    parent.scrollTo({ top: offset });
  } else if (offset + element.clientHeight - parent.scrollTop > parent.clientHeight) {
    parent.scrollTo({ top: offset + element.clientHeight - parent.clientHeight });
  }
}

/** 搜索结果项的完整路径（挂在 SEARCH_MARK 下）。 */
export const SEARCH_MARK = '__rc_cascader_search_mark__';

/** 取搜索结果项的完整路径 keys（供 formatStrategyValues / 展示用）。 */
export function getFullPathKeys(
  options: BaseOptionType[],
  fieldNames: FilledFieldNames,
): (string[] | undefined)[] {
  return options.map((item) =>
    (item[SEARCH_MARK] as BaseOptionType[] | undefined)?.map(
      (opt) => opt[fieldNames.value] as string,
    ),
  );
}

/** 值是否为「二维数组」形态（multiple 时的 value）。 */
function isMultipleValue(value: unknown): value is ValueCell[] {
  return Array.isArray(value) && Array.isArray((value as unknown[])[0]);
}

/** 受控 value → 标准化的 `ValueCell[]`（rc 判据：一维**整体**包一层，不是逐项）。 */
export function toRawValues(value: RawValue | RawValue[] | undefined): ValueCell[] {
  if (!value) return [];
  if (isMultipleValue(value)) return value as ValueCell[];
  // ⚠️ 上游是 `[value]` 整体包一层（一维值 ['a','b'] 是**单个**路径，不能拆成两项），
  //    然后逐项「是数组就原样、否则包一层」：
  //    'a' → [['a']]；['a','b'] → [['a','b']]；二维已在上面短路返回。
  const list = (Array.isArray(value) ? value : [value]) as unknown[];
  return (list.length === 0 ? [] : [list]).map((val) =>
    Array.isArray(val) ? (val as ValueCell) : [val as string | number],
  );
}

/**
 * 多选回填去重：SHOW_CHILD 保留叶子（有子被选的父不保留）；
 * SHOW_PARENT 向上收（父被选时子丢弃）。disabled 项始终保留。
 */
export function formatStrategyValues(
  pathKeys: string[],
  getPathKeyEntities: () => Record<string, DataEntity>,
  showCheckedStrategy: ShowCheckedStrategy,
): string[] {
  const valueSet = new Set(pathKeys);
  const keyPathEntities = getPathKeyEntities();
  return pathKeys.filter((key) => {
    const entity = keyPathEntities[key];
    const parent = entity?.parent ?? null;
    const children = entity?.children ?? null;
    if (entity?.node.disabled) return true;
    return showCheckedStrategy === SHOW_CHILD
      ? !children?.some((child) => child.key && valueSet.has(child.key))
      : !(parent && !parent.node.disabled && valueSet.has(parent.key));
  });
}

export interface PathOption {
  value: unknown;
  index: number;
  option: BaseOptionType | null;
}

/** 沿 value 路径逐层找 option（找不到的层 option 为 null —— missing 判据）。 */
export function toPathOptions(
  valueCell: ValueCell,
  options: BaseOptionType[],
  fieldNames: FilledFieldNames,
  stringMode = false,
): PathOption[] {
  let currentList: BaseOptionType[] | undefined = options;
  const valueOptions: PathOption[] = [];
  for (let i = 0; i < valueCell.length; i += 1) {
    const valueCellItem = valueCell[i];
    const foundIndex = currentList?.findIndex((option) => {
      const val = option[fieldNames.value];
      return stringMode ? String(val) === String(valueCellItem) : val === valueCellItem;
    });
    const foundOption =
      foundIndex !== undefined && foundIndex !== -1 ? currentList?.[foundIndex] : null;
    valueOptions.push({
      value: foundOption?.[fieldNames.value] ?? valueCellItem,
      index: foundIndex ?? -1,
      option: foundOption ?? null,
    });
    currentList = foundOption?.[fieldNames.children] as BaseOptionType[] | undefined;
  }
  return valueOptions;
}

export { convertDataToEntities };
