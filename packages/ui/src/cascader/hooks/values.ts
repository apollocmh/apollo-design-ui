/**
 * Cascader 的值域 hooks —— `@rc-component/cascader` 的
 * `useEntities` / `useOptions` / `useMissingValues` / `useValues` / `useSelect` /
 * `useDisplayValues` 的 Vue 版。
 *
 * Vue 化判据：
 * - React `useMemo` → `computed`；
 * - 返回**工厂函数**的 hook（`getMissingValues` / `getPathKeyEntities` /
 *   `useSelect`）保持工厂形态（它们不是响应值，而是带缓存的查表器）；
 * - `useEntities` 的缓存判据：options 引用变化才重算（与上游 `cacheRef` 同构，
 *   Vue 里用闭包 ref 而不是 useMemo）。
 */

import { type ComputedRef, computed, type Ref } from 'vue';

import { conductCheck, convertDataToEntities, type DataEntity } from '../engine/tree';
import {
  type BaseOptionType,
  type FilledFieldNames,
  fillFieldNames,
  formatStrategyValues,
  type RawValue,
  type ShowCheckedStrategy,
  toPathKey,
  toPathKeys,
  toPathOptions,
  toRawValues,
  VALUE_SPLIT,
  type ValueCell,
} from '../utils';

export type { DataEntity };

// =============================== useEntities ===============================

/**
 * 把 options 摊成 `pathKeyEntities`（key = 各层 value 用 VALUE_SPLIT 连接）。
 * 懒解析：只在 options 引用变化后第一次调用时重算（上游注释：avoid perf issue
 * in single mode）。
 */
export function useEntities(
  options: Ref<BaseOptionType[]>,
  fieldNames: Ref<FilledFieldNames>,
): () => Record<string, DataEntity> {
  let cachedOptions: BaseOptionType[] | null = null;
  let cachedInfo: Record<string, DataEntity> = {};

  return () => {
    if (cachedOptions !== options.value) {
      cachedOptions = options.value;
      cachedInfo = convertDataToEntities(options.value, {
        fieldNames: { key: fieldNames.value.value, children: fieldNames.value.children },
        initWrapper: (wrapper) => ({ ...wrapper, pathKeyEntities: {} }),
        processEntity: (entity, wrapper) => {
          const pathKey = entity.nodes
            .map((node) => node[fieldNames.value.value] as string)
            .join(VALUE_SPLIT);
          (wrapper.pathKeyEntities as Record<string, DataEntity>)[pathKey] = entity;
          // 覆写 key，让 conduct 逻辑以「路径」为键（上游注释：very hack but …）
          entity.key = pathKey;
        },
      }).pathKeyEntities as Record<string, DataEntity>;
    }
    return cachedInfo;
  };
}

// =============================== useOptions ================================

export interface UseOptionsResult {
  mergedOptions: ComputedRef<BaseOptionType[]>;
  getPathKeyEntities: () => Record<string, DataEntity>;
  getValueByKeyPath: (pathKeys: string[]) => ValueCell[];
}

/** options 兜底空数组 + 实体表 + pathKey → valueCells 的反查。 */
export function useOptions(
  fieldNames: Ref<FilledFieldNames>,
  options: Ref<BaseOptionType[] | undefined>,
): UseOptionsResult {
  const mergedOptions = computed(() => options.value ?? []);
  const getPathKeyEntities = useEntities(mergedOptions, fieldNames);

  const getValueByKeyPath = (pathKeys: string[]): ValueCell[] => {
    const keyPathEntities = getPathKeyEntities();
    return pathKeys.map((pathKey) => {
      // noUncheckedIndexedAccess：pathKey 来自 formatStrategyValues 的产出，防御式收窄
      const entity = keyPathEntities[pathKey];
      if (!entity) return [];
      return entity.nodes.map((node) => node[fieldNames.value.value] as string | number);
    });
  };

  return { mergedOptions, getPathKeyEntities, getValueByKeyPath };
}

// ============================= useMissingValues ============================

/** 按「路径能否在 options 里逐层找到」拆分存在 / 缺失的值。 */
export function useMissingValues(
  options: Ref<BaseOptionType[]>,
  fieldNames: Ref<FilledFieldNames>,
): (rawValues: ValueCell[]) => [ValueCell[], ValueCell[]] {
  return (rawValues: ValueCell[]): [ValueCell[], ValueCell[]] => {
    const missingValues: ValueCell[] = [];
    const existsValues: ValueCell[] = [];
    rawValues.forEach((valueCell) => {
      const pathOptions = toPathOptions(valueCell, options.value, fieldNames.value);
      if (pathOptions.every((opt) => opt.option)) {
        existsValues.push(valueCell);
      } else {
        missingValues.push(valueCell);
      }
    });
    return [existsValues, missingValues];
  };
}

// ================================ useValues ================================

export interface UseValuesResult {
  checkedValues: ValueCell[];
  halfCheckedValues: ValueCell[];
  missingCheckedValues: ValueCell[];
}

/** 多选时走勾选传导（父子联动 + 半选）；单选直接透传存在值。 */
export function useValues(
  multiple: boolean,
  rawValues: Ref<ValueCell[]>,
  getPathKeyEntities: () => Record<string, DataEntity>,
  getValueByKeyPath: (pathKeys: string[]) => ValueCell[],
  getMissingValues: (rawValues: ValueCell[]) => [ValueCell[], ValueCell[]],
): UseValuesResult {
  const [existValues, missingValues] = getMissingValues(rawValues.value);
  if (!multiple || !rawValues.value.length) {
    return {
      checkedValues: existValues,
      halfCheckedValues: [],
      missingCheckedValues: missingValues ?? [],
    };
  }

  const keyPathValues = toPathKeys(existValues);
  const keyPathEntities = getPathKeyEntities();
  const { checkedKeys, halfCheckedKeys } = conductCheck(keyPathValues, true, keyPathEntities);

  return {
    checkedValues: getValueByKeyPath(checkedKeys),
    halfCheckedValues: getValueByKeyPath(halfCheckedKeys),
    missingCheckedValues: missingValues ?? [],
  };
}

// ================================ useSelect ===============================

/**
 * 选中处理器（工厂）。
 *
 * - 单选：直接 `triggerChange(valuePath)`；
 * - 多选：勾选传导 + `formatStrategyValues` 去重 + 拼回 `[...missing, ...checked]`。
 */
export function createSelectHandler(
  multiple: boolean,
  triggerChange: (nextValues: ValueCell | ValueCell[]) => void,
  checkedValues: ValueCell[],
  halfCheckedValues: ValueCell[],
  missingCheckedValues: ValueCell[],
  getPathKeyEntities: () => Record<string, DataEntity>,
  getValueByKeyPath: (pathKeys: string[]) => ValueCell[],
  showCheckedStrategy: ShowCheckedStrategy,
): (valuePath: ValueCell) => void {
  // ⚠️ 参数兜底：调用方（S4 薄壳）在响应式更新竞态下可能传入 undefined 快照
  const checked = checkedValues ?? [];
  const halfChecked = halfCheckedValues ?? [];
  const missing = missingCheckedValues ?? [];

  return (valuePath: ValueCell): void => {
    if (!multiple) {
      // 单选：change 的 payload 是一维路径（上游 triggerValues = nextRawValues[0]）
      triggerChange(valuePath);
      return;
    }

    const pathKey = toPathKey(valuePath);
    const checkedPathKeys = toPathKeys(checkedValues);
    const halfCheckedPathKeys = toPathKeys(halfCheckedValues);
    const existInChecked = checkedPathKeys.includes(pathKey);
    const existInMissing = missing.some((valueCells) => toPathKey(valueCells) === pathKey);

    let nextCheckedValues = checked;
    let nextMissingValues = missing;
    if (existInMissing && !existInChecked) {
      // 缺失值只做移除（不在实体表里，无法传导）
      nextMissingValues = missing.filter((valueCells) => toPathKey(valueCells) !== pathKey);
    } else {
      const nextRawCheckedKeys = existInChecked
        ? checkedPathKeys.filter((key) => key !== pathKey)
        : [...checkedPathKeys, pathKey];
      const pathKeyEntities = getPathKeyEntities();

      let checkedKeys: string[];
      if (existInChecked) {
        ({ checkedKeys } = conductCheck(
          nextRawCheckedKeys,
          { checked: false, halfCheckedKeys: halfCheckedPathKeys },
          pathKeyEntities,
        ));
      } else {
        ({ checkedKeys } = conductCheck(nextRawCheckedKeys, true, pathKeyEntities));
      }

      // 向上收 / 保留叶子
      const deDuplicatedKeys = formatStrategyValues(
        checkedKeys,
        getPathKeyEntities,
        showCheckedStrategy,
      );
      nextCheckedValues = getValueByKeyPath(deDuplicatedKeys);
    }
    triggerChange([...nextMissingValues, ...nextCheckedValues]);
  };
}

// ============================= useDisplayValues ============================

export interface DisplayValue {
  label: unknown;
  value: string;
  key: string;
  valueCells: ValueCell;
  disabled?: boolean;
}

export type DisplayRender = (
  labels: unknown[],
  selectedOptions: (BaseOptionType | null)[],
) => unknown;

/** 默认展示渲染：单选取全路径 ` / ` 连接；多选取最后一段。 */
export function defaultDisplayRender(
  labels: unknown[],
  selectedOptions: (BaseOptionType | null)[],
  multiple: boolean,
): unknown {
  const mergedLabels = multiple ? labels.slice(-1) : labels;
  const SPLIT = ' / ';
  if (mergedLabels.every((label) => ['string', 'number'].includes(typeof label))) {
    return mergedLabels.join(SPLIT);
  }
  // 含非字符串值：数组形态（`' / '` 作为分隔节点），由 BaseSelect 的标签渲染消费
  return mergedLabels.reduce<unknown[]>((list, label, index) => {
    if (index === 0) return [label];
    return [...list, SPLIT, label];
  }, []);
}

/** rawValues → 展示值（label / key / disabled 等，供 BaseSelect 的 displayValues 用）。 */
export function computeDisplayValues(
  rawValues: ValueCell[],
  options: BaseOptionType[],
  fieldNames: FilledFieldNames,
  multiple: boolean,
  displayRender?: DisplayRender,
): DisplayValue[] {
  const mergedDisplayRender: DisplayRender =
    displayRender ?? ((labels) => defaultDisplayRender(labels, [], multiple));

  return rawValues.map((valueCells) => {
    const valueOptions = toPathOptions(valueCells, options, fieldNames);
    const label = mergedDisplayRender(
      valueOptions.map(({ option, value }) => option?.[fieldNames.label] ?? value),
      valueOptions.map(({ option }) => option),
    );
    const value = toPathKey(valueCells);
    return {
      label,
      value,
      key: value,
      valueCells,
      disabled: valueOptions[valueOptions.length - 1]?.option?.disabled,
    };
  });
}

// ============================ 兼容旧签名（S4 用） ============================

/** 受控 value（RawValue 形态）标准化 —— S4 的薄壳直接调它。 */
export function normalizeRawValue(value: RawValue | RawValue[] | undefined): ValueCell[] {
  return toRawValues(value);
}

export { fillFieldNames };
