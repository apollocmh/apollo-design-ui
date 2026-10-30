import { useControlledValue } from '@apollo-design/utils';
import { type ComputedRef, computed, type Ref, type VNodeChild } from 'vue';
import { conductCheck, type DataEntity } from '../engine/tree';
import type { CascaderOutputValue, CascaderSelectedOptions, CascaderValue } from '../interface';
import {
  type BaseOptionType,
  type FilledFieldNames,
  fillFieldNames,
  formatStrategyValues,
  getOptionChildren,
  getOptionLabel,
  getOptionValue,
  type RawValue,
  type ShowCheckedStrategy,
  toPathKey,
  toPathKeys,
  toPathOptions,
  toRawValues,
  type ValueCell,
} from '../utils';

export type { DataEntity };

/** Lazy computed graph follows reactive fields, children and in-place option edits. */
export function useEntities(
  options: Ref<BaseOptionType[]>,
  fieldNames: Ref<FilledFieldNames>,
): () => Record<string, DataEntity> {
  const entities = computed(() => {
    const entries: [string, DataEntity][] = [];
    const fields = fieldNames.value;
    const visit = (
      list: BaseOptionType[],
      parents: BaseOptionType[],
      values: ValueCell,
      parent?: DataEntity,
    ): void => {
      list.forEach((node, index) => {
        const nodes = [...parents, node];
        const path = [...values, getOptionValue(node, fields)];
        const entity: DataEntity = {
          node,
          nodes,
          index,
          key: toPathKey(path),
          pos: `${parent?.pos ?? '0'}-${index}`,
          level: parents.length,
          parent,
        };
        entries.push([entity.key, entity]);
        if (parent) {
          parent.children ??= [];
          parent.children.push(entity);
        }
        visit(getOptionChildren(node, fields), nodes, path, entity);
      });
    };
    visit(options.value, [], []);
    return Object.fromEntries(entries);
  });
  return () => entities.value;
}
export interface UseOptionsResult {
  mergedOptions: ComputedRef<BaseOptionType[]>;
  getPathKeyEntities: () => Record<string, DataEntity>;
  getValueByKeyPath: (keys: string[]) => ValueCell[];
}
export function useOptions(
  fields: Ref<FilledFieldNames>,
  options: Ref<BaseOptionType[] | undefined>,
): UseOptionsResult {
  const mergedOptions = computed(() => options.value ?? []);
  const getPathKeyEntities = useEntities(mergedOptions, fields);
  const getValueByKeyPath = (keys: string[]): ValueCell[] =>
    keys.map((key) => {
      const entity = getPathKeyEntities()[key];
      if (!entity) throw new Error(`[Cascader] Unknown option path ${key}`);
      return entity.nodes.map((node) => getOptionValue(node, fields.value));
    });
  return { mergedOptions, getPathKeyEntities, getValueByKeyPath };
}
export function useMissingValues(
  options: Ref<BaseOptionType[]>,
  fields: Ref<FilledFieldNames>,
): (paths: ValueCell[]) => [ValueCell[], ValueCell[]] {
  return (paths) => {
    const existing: ValueCell[] = [],
      missing: ValueCell[] = [];
    for (const path of paths)
      (toPathOptions(path, options.value, fields.value).every((item) => item.option)
        ? existing
        : missing
      ).push(path);
    return [existing, missing];
  };
}
export interface UseValuesResult {
  checkedValues: ValueCell[];
  halfCheckedValues: ValueCell[];
  missingCheckedValues: ValueCell[];
}
export function useValues(
  multiple: boolean,
  raw: Ref<ValueCell[]>,
  getEntities: () => Record<string, DataEntity>,
  getValues: (keys: string[]) => ValueCell[],
  getMissing: (paths: ValueCell[]) => [ValueCell[], ValueCell[]],
): UseValuesResult {
  const [existing, missing] = getMissing(raw.value);
  if (!multiple || !raw.value.length)
    return { checkedValues: existing, halfCheckedValues: [], missingCheckedValues: missing };
  const { checkedKeys, halfCheckedKeys } = conductCheck(toPathKeys(existing), true, getEntities());
  return {
    checkedValues: getValues(checkedKeys),
    halfCheckedValues: getValues(halfCheckedKeys),
    missingCheckedValues: missing,
  };
}
export function createSelectHandler(
  multiple: boolean,
  triggerChange: (value: ValueCell | ValueCell[]) => void,
  checked: ValueCell[],
  half: ValueCell[],
  missing: ValueCell[],
  getEntities: () => Record<string, DataEntity>,
  getValues: (keys: string[]) => ValueCell[],
  strategy: ShowCheckedStrategy,
): (path: ValueCell) => void {
  return (path) => {
    if (!multiple) {
      triggerChange(path);
      return;
    }
    const key = toPathKey(path),
      checkedKeys = toPathKeys(checked);
    const isChecked = checkedKeys.includes(key);
    if (!isChecked && missing.some((item) => toPathKey(item) === key)) {
      triggerChange([
        ...missing.filter((item) => toPathKey(item) !== key),
        ...getValues(formatStrategyValues(checkedKeys, getEntities, strategy)),
      ]);
      return;
    }
    const next = isChecked ? checkedKeys.filter((item) => item !== key) : [...checkedKeys, key];
    const result = conductCheck(
      next,
      isChecked ? { checked: false, halfCheckedKeys: toPathKeys(half) } : true,
      getEntities(),
    );
    triggerChange([
      ...missing,
      ...getValues(formatStrategyValues(result.checkedKeys, getEntities, strategy)),
    ]);
  };
}
export interface DisplayValue {
  label: VNodeChild;
  value: string;
  key: string;
  valueCells: ValueCell;
  disabled?: boolean;
}
export type DisplayRender = (
  labels: VNodeChild[],
  options: (BaseOptionType | null)[],
) => VNodeChild;
export function defaultDisplayRender(
  labels: VNodeChild[],
  _options: (BaseOptionType | null)[],
  multiple: boolean,
): VNodeChild {
  const shown = multiple ? labels.slice(-1) : labels;
  if (shown.every((label) => typeof label === 'string' || typeof label === 'number'))
    return shown.join(' / ');
  return shown.flatMap((label, index) => (index ? [' / ', label] : [label]));
}
export function computeDisplayValues(
  paths: ValueCell[],
  options: BaseOptionType[],
  fields: FilledFieldNames,
  multiple: boolean,
  render?: DisplayRender,
): DisplayValue[] {
  return paths.map((valueCells) => {
    const path = toPathOptions(valueCells, options, fields);
    const labels = path.map((item) => getOptionLabel(item.option, fields, item.value));
    const selected = path.map((item) => item.option);
    const value = toPathKey(valueCells);
    return {
      label: render ? render(labels, selected) : defaultDisplayRender(labels, selected, multiple),
      value,
      key: value,
      valueCells,
      disabled: path.at(-1)?.option?.disabled,
    };
  });
}

/** Shared state and selection semantics for the floating and standalone pickers. */
export function useCascaderValues(
  props: {
    value?: CascaderValue;
    defaultValue?: CascaderValue;
    options?: BaseOptionType[];
    fieldNames?: import('../utils').FieldNames;
    showCheckedStrategy: ShowCheckedStrategy;
  },
  multiple: Ref<boolean>,
  notify: (value: CascaderOutputValue, options: CascaderSelectedOptions) => void,
) {
  const [value, setValue] = useControlledValue<CascaderValue>({
    getValue: () => props.value,
    defaultValue: () => props.defaultValue ?? [],
  });
  const fields = computed(() => fillFieldNames(props.fieldNames));
  const {
    mergedOptions: options,
    getPathKeyEntities,
    getValueByKeyPath,
  } = useOptions(
    fields,
    computed(() => props.options),
  );
  const raw = computed(() => toRawValues(value.value));
  const getMissing = useMissingValues(options, fields);
  const values = computed(() =>
    useValues(multiple.value, raw, getPathKeyEntities, getValueByKeyPath, getMissing),
  );
  const visiblePaths = computed(() => {
    const { checkedValues, missingCheckedValues } = values.value;
    return [
      ...missingCheckedValues,
      ...(multiple.value
        ? getValueByKeyPath(
            formatStrategyValues(
              toPathKeys(checkedValues),
              getPathKeyEntities,
              props.showCheckedStrategy,
            ),
          )
        : checkedValues),
    ];
  });
  const change = (next: ValueCell | ValueCell[]): void => {
    const paths = toRawValues(next);
    const output = multiple.value ? paths : (paths[0] ?? []);
    const selected = paths.map((path) =>
      toPathOptions(path, options.value, fields.value).map((item) => item.option),
    );
    setValue(output);
    notify(output, multiple.value ? selected : (selected[0] ?? []));
  };
  const select = (path: ValueCell): void => {
    const { checkedValues, halfCheckedValues, missingCheckedValues } = values.value;
    createSelectHandler(
      multiple.value,
      change,
      checkedValues,
      halfCheckedValues,
      missingCheckedValues,
      getPathKeyEntities,
      getValueByKeyPath,
      props.showCheckedStrategy,
    )(path);
  };
  return { fields, options, values, visiblePaths, change, select };
}
export function normalizeRawValue(value: RawValue | RawValue[] | undefined): ValueCell[] {
  return toRawValues(value);
}
export { fillFieldNames };
