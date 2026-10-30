import { isVNode, type VNodeChild } from 'vue';
import { convertDataToEntities, type DataEntity } from './engine/tree';

/** Internal path keys retain both the value type and path boundaries. */
export const SHOW_PARENT = 'SHOW_PARENT';
export const SHOW_CHILD = 'SHOW_CHILD';
export type ShowCheckedStrategy = typeof SHOW_PARENT | typeof SHOW_CHILD;
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
export type BaseOptionType = Record<string, unknown> & {
  disabled?: boolean;
  isLeaf?: boolean;
  loading?: boolean;
};
export type DefaultOptionType = BaseOptionType & {
  label?: VNodeChild;
  value?: string | number;
  children?: DefaultOptionType[];
};
export type ValueCell = (string | number)[];
export type RawValue = string | number | ValueCell;

export function toPathKey(value: ValueCell): string {
  return JSON.stringify(value);
}
export function toPathKeys(values: ValueCell[]): string[] {
  return values.map(toPathKey);
}
export function toPathValueStr(pathKey: string): string[] {
  const value: unknown = JSON.parse(pathKey);
  if (!Array.isArray(value) || !value.every(isValue))
    throw new TypeError('[Cascader] Invalid path key');
  return value.map(String);
}
export function fillFieldNames(fieldNames?: FieldNames): FilledFieldNames {
  const { label = 'label', value = 'value', children = 'children' } = fieldNames ?? {};
  return { label, value, key: value, children };
}
export function isValue(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}
export function getOptionValue(option: BaseOptionType, fields: FilledFieldNames): string | number {
  const value = option[fields.value];
  if (!isValue(value))
    throw new TypeError(`[Cascader] Option ${fields.value} must be a string or number`);
  return value;
}
export function isOption(value: unknown): value is BaseOptionType {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function getOptionChildren(
  option: BaseOptionType | undefined,
  fields: FilledFieldNames,
): BaseOptionType[] {
  const children = option?.[fields.children];
  if (children === undefined || children === null) return [];
  if (!Array.isArray(children) || !children.every(isOption))
    throw new TypeError(`[Cascader] Option ${fields.children} must be an array of options`);
  return children;
}
export function getSearchPath(option: BaseOptionType): BaseOptionType[] | undefined {
  const path = option[SEARCH_MARK];
  return Array.isArray(path) && path.every(isOption) ? path : undefined;
}
export function toContent(value: unknown): VNodeChild {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    isVNode(value)
  )
    return value;
  if (Array.isArray(value)) return value.map(toContent);
  throw new TypeError('[Cascader] Option labels must be Vue renderable content');
}
export function getOptionLabel(
  option: BaseOptionType | null,
  fields: FilledFieldNames,
  fallback: string | number,
): VNodeChild {
  const label = option?.[fields.label];
  return label === undefined ? fallback : toContent(label);
}
export function isLeaf(option: BaseOptionType | undefined, fields: FilledFieldNames): boolean {
  return option?.isLeaf ?? getOptionChildren(option, fields).length === 0;
}
export function scrollIntoParentView(element: HTMLElement): void {
  const parent = element.parentElement;
  if (!parent) return;
  const offset = element.offsetTop - parent.offsetTop;
  if (offset < parent.scrollTop) parent.scrollTo({ top: offset });
  else if (offset + element.clientHeight > parent.scrollTop + parent.clientHeight)
    parent.scrollTo({ top: offset + element.clientHeight - parent.clientHeight });
}
export const SEARCH_MARK = '__rc_cascader_search_mark__';
export function getFullPathKeys(
  options: BaseOptionType[],
  fields: FilledFieldNames,
): (ValueCell | undefined)[] {
  return options.map((option) =>
    getSearchPath(option)?.map((node) => getOptionValue(node, fields)),
  );
}
function isValueCell(value: unknown): value is ValueCell {
  return Array.isArray(value) && value.every(isValue);
}
export function toRawValues(value: RawValue | RawValue[] | undefined): ValueCell[] {
  if (value === undefined) return [];
  if (isValue(value)) return [[value]];
  if (!value.length) return [];
  if (isValueCell(value)) return [value];
  return value.map((path) => {
    if (!isValueCell(path))
      throw new TypeError('[Cascader] Values must be paths of strings or numbers');
    return path;
  });
}
export function formatStrategyValues(
  pathKeys: string[],
  getEntities: () => Record<string, DataEntity>,
  strategy: ShowCheckedStrategy,
): string[] {
  const checked = new Set(pathKeys);
  const entities = getEntities();
  return pathKeys.filter((key) => {
    const entity = Object.hasOwn(entities, key) ? entities[key] : undefined;
    if (entity?.node.disabled) return true;
    return strategy === SHOW_CHILD
      ? !entity?.children?.some((child) => checked.has(child.key))
      : !(entity?.parent && !entity.parent.node.disabled && checked.has(entity.parent.key));
  });
}
export interface PathOption {
  value: string | number;
  index: number;
  option: BaseOptionType | null;
}
export function toPathOptions(
  path: ValueCell,
  options: BaseOptionType[],
  fields: FilledFieldNames,
  stringMode = false,
): PathOption[] {
  let list = options;
  return path.map((value) => {
    const index = list.findIndex((option) =>
      stringMode ? String(option[fields.value]) === String(value) : option[fields.value] === value,
    );
    const option = list[index] ?? null;
    list = getOptionChildren(option ?? undefined, fields);
    return { value: option ? getOptionValue(option, fields) : value, index, option };
  });
}
export { convertDataToEntities };
