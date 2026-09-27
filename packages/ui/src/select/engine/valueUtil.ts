/**
 * rc-select `utils/valueUtil.js` + `utils/commonUtil.js` 的 Vue 版（纯函数，无 DOM）。
 *
 * 契约来源：`@rc-component/select@1.10.1/es/utils/valueUtil.js`（127 行）与
 * `commonUtil.js`（31 行）。逐函数对拍，**不搬运实现**（H2/H3）。
 */

import { Comment, isVNode, Text, type VNode, type VNodeChild } from 'vue';
import type { DefaultOptionType, FieldNames, RawValueType } from '../interface';

// ---------------------------------------------------------------------------
// 通用
// ---------------------------------------------------------------------------

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  return value !== undefined && value !== null ? [value] : [];
}

/** rc `hasValue`：排除 null / undefined（0 与 '' 是有值）。 */
export function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null;
}

/** rc `isComboNoValue`：combobox 的「无值」（0 除外）。 */
export function isComboNoValue(value: unknown): boolean {
  return !value && value !== 0;
}

/** rc `isValidCount`：`maxCount` 是否是有效数字。 */
export function isValidCount(value: unknown): boolean {
  return typeof value === 'number' && !Number.isNaN(value);
}

/** rc `getTitle`：option / displayValue 的 title 取值。 */
export function getTitle(item: Record<string, unknown> | undefined | null): string | undefined {
  if (!item) return undefined;
  if (typeof item.title === 'string' || typeof item.title === 'number') {
    return String(item.title);
  }
  if (typeof item.label === 'string' || typeof item.label === 'number') {
    return String(item.label);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// fieldNames
// ---------------------------------------------------------------------------

export type ResolvedFieldNames = {
  label: string;
  value: string;
  options: string;
  groupLabel: string;
};

/**
 * rc `fillFieldNames`。
 *
 * ⚠️ `childrenAsData`（即用 `<Select><Option/></Select>` 而非 `options`）时
 * label 字段名是 `children` —— 上游同款 hack，`flattenOptions` 里会再改回。
 */
export function fillFieldNames(
  fieldNames: FieldNames | undefined,
  childrenAsData: boolean,
): ResolvedFieldNames {
  const label = fieldNames?.label || (childrenAsData ? 'children' : 'label');
  return {
    label,
    value: fieldNames?.value || 'value',
    options: fieldNames?.options || 'options',
    groupLabel: fieldNames?.groupLabel || label,
  };
}

// ---------------------------------------------------------------------------
// flatten
// ---------------------------------------------------------------------------

export interface FlattenItem {
  key: string | number;
  groupOption?: boolean;
  group?: boolean;
  data: DefaultOptionType;
  label?: unknown;
  value?: RawValueType;
}

function getKey(data: DefaultOptionType, index: number): string | number {
  // ⚠️ Vue 的 vnode.key 可能是 symbol，必须显式 String()（TS2731）
  const key = data.key;
  if (key !== null && key !== undefined) return String(key);
  const value = data.value;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return `rc-index-key-${index}`;
}

/**
 * rc `flattenOptions`：把「分组的树」摊成「一行一项」的列表。
 *
 * 分组本身也占一行（`group: true`），其子项标 `groupOption: true`。
 */
export function flattenOptions(
  options: DefaultOptionType[] | undefined,
  config: { fieldNames: FieldNames; childrenAsData: boolean },
): FlattenItem[] {
  const flattenList: FlattenItem[] = [];
  const {
    label: fieldLabel,
    value: fieldValue,
    options: fieldOptions,
    groupLabel,
  } = fillFieldNames(config.fieldNames, false);

  const dig = (list: unknown, isGroupOption: boolean): void => {
    if (!Array.isArray(list)) return;
    (list as DefaultOptionType[]).forEach((data) => {
      if (isGroupOption || !(fieldOptions in data)) {
        flattenList.push({
          key: getKey(data, flattenList.length),
          groupOption: isGroupOption,
          data,
          label: data[fieldLabel],
          value: (data[fieldValue] ?? undefined) as RawValueType | undefined,
        });
        return;
      }
      let groupLabelValue = data[groupLabel];
      if (groupLabelValue === undefined && config.childrenAsData) {
        groupLabelValue = data.label;
      }
      flattenList.push({
        key: getKey(data, flattenList.length),
        group: true,
        data,
        label: groupLabelValue,
      });
      dig(data[fieldOptions] as unknown, true);
    });
  };

  dig(options, false);
  return flattenList;
}

// ---------------------------------------------------------------------------
// tokenSeparators 切分
// ---------------------------------------------------------------------------

/**
 * rc `getSeparatedContent`：按分隔符递归切分，**没有命中任何分隔符时返回 null**
 * （这是「要不要当成批量粘贴」的判据，不能改成返回原串）。
 */
export function getSeparatedContent(
  text: string,
  tokens: string[] | undefined,
  end?: number,
): string[] | null {
  if (!tokens?.length) return null;

  let match = false;
  const separate = (str: string, [token, ...restTokens]: string[]): string[] => {
    if (!token) return [str];
    const list = str.split(token);
    match = match || list.length > 1;
    const flat: string[] = [];
    for (const unitStr of list) {
      for (const part of separate(unitStr, restTokens)) {
        flat.push(part);
      }
    }
    return flat;
  };

  const list = separate(text, tokens);
  if (match) {
    return typeof end !== 'undefined' ? list.slice(0, end) : list;
  }
  return null;
}

// ---------------------------------------------------------------------------
// children（Vue 的 slot vnode）→ options
// ---------------------------------------------------------------------------

/** 子组件挂的识别标记（对应 rc 的 `isSelectOption` / `isSelectOptGroup` 静态属性）。 */
export const OPTION_MARK = '__apolloSelectOption';
export const OPTGROUP_MARK = '__apolloSelectOptGroup';

function isComponent(node: unknown, mark: string): boolean {
  if (!isVNode(node)) return false;
  const type = node.type as unknown;
  return typeof type === 'object' && type !== null
    ? (type as Record<string, unknown>)[mark] === true
    : false;
}

/**
 * 把「插槽内容」收敛成一个可当 label 用的值：
 * 单个文本 vnode ⇒ 字符串（让 `label` 的等值比较与 `aria-label` 都成立）；
 * 元素 vnode ⇒ 原样保留（`<span>Label</span>` 这类富文本标签不丢结构）。
 */
function unwrapNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.length === 1 ? unwrapNode(node[0]) : node.map(unwrapNode);
  }
  if (isVNode(node)) {
    if (node.type === Text) return node.children;
    if (node.type === Comment) return null;
    return node;
  }
  return node;
}

/** 取组件 vnode 的默认插槽内容（Vue 的 `children` 是 slots 对象）。 */
function slotChildren(node: VNode): unknown {
  const children = node.children as unknown;
  if (children && typeof children === 'object' && !Array.isArray(children)) {
    const slot = (children as Record<string, unknown>).default;
    if (typeof slot === 'function') {
      return unwrapNode((slot as () => unknown)());
    }
  }
  return unwrapNode(children);
}

function convertNodeToOption(node: VNode): DefaultOptionType {
  const props = (node.props ?? {}) as Record<string, unknown>;
  const { children, value, ...restProps } = props;
  return {
    key: node.key ?? undefined,
    value:
      value !== undefined
        ? (value as RawValueType)
        : ((node.key ?? undefined) as RawValueType | undefined),
    children: slotChildren(node) ?? (children as VNodeChild),
    ...restProps,
  } as DefaultOptionType;
}

/** rc `convertChildrenToData` 的 Vue 版（`children` = 默认插槽的 vnode 列表）。 */
export function convertChildrenToData(nodes: VNodeChild): DefaultOptionType[] {
  return toArray(nodes as VNode[])
    .map((node, index) => {
      if (!isVNode(node) || !node.type) return null;
      const isGroup = isComponent(node, OPTGROUP_MARK);
      const key = node.key;
      const props = (node.props ?? {}) as Record<string, unknown>;
      const { children, ...restProps } = props;
      if (!isGroup) {
        return convertNodeToOption(node);
      }
      return {
        key: `__RC_SELECT_GRP__${key === null || key === undefined ? index : String(key)}__`,
        label: key as unknown,
        ...restProps,
        options: convertChildrenToData((slotChildren(node) ?? children) as never),
      } as DefaultOptionType;
    })
    .filter((data): data is DefaultOptionType => data !== null);
}
