/**
 * TreeSelect —— antd `components/tree-select/index.js`（273 行薄壳）+
 * rc `TreeSelect.js`（528 行值归一层）的 Vue 等价物。
 *
 * 结构：BaseSelect（本仓 `select/engine/BaseSelect`，Cascader 同范式）+
 * `optionListRenderer` 注入树型选项列表（内嵌本仓 Tree）。
 *
 * ── 关键判据（docs/analysis/tree-select.md）─────────────────────────────────
 * 1. **key === value**：fieldNames 默认 key 字段取 value（fillFieldNames）。
 * 2. 勾选级联在**本层**算（conductCheck），内嵌树永远 checkStrictly=true。
 * 3. 展示值按 showCheckedStrategy 裁剪（默认 checkable ? SHOW_CHILD : SHOW_ALL）。
 * 4. maxCount：SHOW_ALL(非 strictly)/SHOW_PARENT 组合下无效（antd 薄壳）；
 *    rc 层仅 SHOW_CHILD/strictly/非 checkable 生效。
 * 5. listItemHeight 默认 controlHeightSM + paddingXXS（28），非 rc 默认 20。
 * 6. treeCheckable 包成 `<span class="{p}-checkbox-inner">`（antd 壳逐字）。
 * 7. treeMotion 恒 null（树动画关闭）。
 * 8. listItemHeight/listHeight 经 props 传 OptionList；virtual 与
 *    popupMatchSelectWidth 联合判定。
 */

import {
  CloseCircleFilled,
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { useControlledValue, useId } from '@apollo-design/utils';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h, ref, shallowRef } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import BaseSelect from '../select/engine/BaseSelect';
import type { DisplayValueType, SelectCommonPlacement } from '../select/interface';
import { conductCheck } from '../tree/utils/conductUtil';
import { useCheckedKeys } from './hooks/use-checked-keys';
import { useDataEntities } from './hooks/use-data-entities';
import { useFilterTreeData } from './hooks/use-filter-tree-data';
import { useTreeData } from './hooks/use-tree-data';
import type {
  ChangeEventExtra,
  InternalLabeledValue,
  LabeledValueType,
  SearchConfig,
  SimpleModeConfig,
  TreeSelectDataNode,
  TreeSelectValue,
} from './interface';
import OptionList from './OptionList';
import { fillAdditionalInfo, fillLegacyProps } from './utils/legacy-util';
import {
  formatStrategyValues,
  SHOW_ALL,
  SHOW_CHILD,
  type ShowCheckedStrategy as ShowCheckedStrategyType,
} from './utils/strategy-util';
import { type FilledFieldNames, fillFieldNames, isNil, toArray } from './utils/value-util';

type StyleLike = Record<string, string | number>;

function isRawValue(value: unknown): value is string | number {
  return !value || typeof value !== 'object';
}

const TreeSelect = defineComponent({
  name: 'ATreeSelect',
  inheritAttrs: false,
  props: {
    // ---- shell ----
    prefixCls: { type: String, default: undefined },
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<Record<string, unknown>>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<Record<string, unknown>>, default: undefined },
    size: { type: String as PropType<'small' | 'middle' | 'large'>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    status: { type: String as PropType<'error' | 'warning'>, default: undefined },
    variant: { type: String as PropType<'outlined' | 'borderless' | 'filled'>, default: undefined },
    bordered: { type: Boolean, default: true },
    // ---- value ----
    value: { type: null as unknown as PropType<TreeSelectValue>, default: undefined },
    defaultValue: { type: null as unknown as PropType<TreeSelectValue>, default: undefined },
    labelInValue: { type: Boolean, default: undefined },
    maxCount: { type: Number, default: undefined },
    // ---- tree data ----
    treeData: { type: Array as PropType<TreeSelectDataNode[]>, default: undefined },
    treeDataSimpleMode: {
      type: [Boolean, Object] as PropType<boolean | SimpleModeConfig>,
      default: undefined,
    },
    fieldNames: {
      type: Object as PropType<{ value?: string; label?: string; children?: string }>,
      default: undefined,
    },
    loadData: {
      type: Function as PropType<(node: TreeSelectDataNode) => Promise<unknown>>,
      default: undefined,
    },
    treeLoadedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
    treeCheckable: { type: [Boolean, Object], default: undefined },
    treeCheckStrictly: { type: Boolean, default: undefined },
    treeDefaultExpandAll: { type: Boolean, default: undefined },
    treeExpandedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
    treeDefaultExpandedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
    treeLine: { type: [Boolean, Object], default: undefined },
    treeIcon: { type: Boolean, default: undefined },
    showTreeIcon: { type: Boolean, default: undefined },
    switcherIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    treeTitleRender: {
      type: Function as PropType<(node: TreeSelectDataNode) => VNodeChild>,
      default: undefined,
    },
    treeExpandAction: {
      type: [Boolean, String] as PropType<false | 'click' | 'doubleClick'>,
      default: undefined,
    },
    treeNodeFilterProp: { type: String, default: undefined },
    filterTreeNode: {
      type: [Boolean, Function] as PropType<
        boolean | ((inputValue: string, treeNode: TreeSelectDataNode) => boolean)
      >,
      default: undefined,
    },
    treeNodeLabelProp: { type: String, default: undefined },
    showCheckedStrategy: {
      type: String as PropType<'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD'>,
      default: undefined,
    },
    // ---- shell behavior ----
    multiple: { type: Boolean, default: undefined },
    showSearch: { type: [Boolean, Object] as PropType<boolean | SearchConfig>, default: undefined },
    searchValue: { type: String, default: undefined },
    autoClearSearchValue: { type: Boolean, default: undefined },
    placeholder: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    maxTagCount: { type: Number, default: undefined },
    maxTagTextLength: { type: Number, default: undefined },
    maxTagPlaceholder: { type: null as unknown as PropType<unknown>, default: undefined },
    listHeight: { type: Number, default: 256 },
    listItemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    dropdownMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    placement: { type: String as PropType<SelectCommonPlacement>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    allowClear: {
      type: [Boolean, Object] as PropType<boolean | { clearIcon?: unknown }>,
      default: undefined,
    },
    clearIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    suffixIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    removeIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    tagRender: {
      type: Function as PropType<(props: Record<string, unknown>) => VNodeChild>,
      default: undefined,
    },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    popupRender: { type: Function as PropType<(menu: unknown) => unknown>, default: undefined },
    dropdownRender: { type: Function as PropType<(menu: unknown) => unknown>, default: undefined },
    popupClassName: { type: String, default: undefined },
    dropdownClassName: { type: String, default: undefined },
    popupStyle: { type: Object as PropType<StyleLike>, default: undefined },
    loading: { type: Boolean, default: undefined },
  },
  emits: [
    'update:value',
    'update:open',
    'update:searchValue',
    'update:treeExpandedKeys',
    'update:treeLoadedKeys',
  ],
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as {
      onChange?: (value: unknown, labels: unknown, info: ChangeEventExtra) => void;
      onSelect?: (value: unknown, node: TreeSelectDataNode | null | undefined) => void;
      onDeselect?: (value: unknown, node: TreeSelectDataNode | null | undefined) => void;
      onSearch?: (text: string) => void;
      onOpenChange?: (open: boolean) => void;
      onPopupVisibleChange?: (open: boolean) => void;
      onDropdownVisibleChange?: (open: boolean) => void;
      onTreeExpand?: (keys: (string | number)[]) => void;
      onTreeLoad?: (keys: (string | number)[]) => void;
      onClear?: () => void;
      onPopupScroll?: (e: UIEvent) => void;
      onFocus?: (e: FocusEvent) => void;
      onBlur?: (e: FocusEvent) => void;
    };

    const context = useComponentConfig('treeSelect');
    const contextSemantic = context as {
      getPrefixCls: (suffix?: string, customize?: string) => string;
      getPopupContainer?: (node: HTMLElement) => HTMLElement;
      renderEmpty?: (name: string) => unknown;
      switcherIcon?: unknown;
      classNames?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      className?: string;
      style?: StyleLike;
      clearIcon?: unknown;
      removeIcon?: unknown;
      suffixIcon?: unknown;
    };
    const { getPrefixCls } = contextSemantic;
    const mergedId = useId(props.id);
    const formItem = useFormItemInputContext();
    const mergedDisabled = useDisabled(() => props.disabled);
    const rootPrefixCls = getPrefixCls();

    const prefixCls = computed(() => getPrefixCls('tree-select', props.prefixCls));
    // antd 薄壳三前缀：customize 模式下合一；默认模式本仓单前缀直通（见文件头 §判据 6）。

    // ===================== 开合 =====================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        callbacks.onOpenChange?.(next);
        callbacks.onPopupVisibleChange?.(next);
        callbacks.onDropdownVisibleChange?.(next);
        emit('update:open', next);
      },
    });

    // ===================== 派生开关 =====================
    const isMultiple = computed(() => !!(props.treeCheckable || props.multiple));
    const treeConduction = computed(() => !!props.treeCheckable && !props.treeCheckStrictly);
    const mergedCheckable = computed(() => !!(props.treeCheckable || props.treeCheckStrictly));
    const mergedLabelInValue = computed(() => props.treeCheckStrictly || !!props.labelInValue);
    const mergedShowCheckedStrategy = computed<ShowCheckedStrategyType>(() => {
      if (!props.treeCheckable) return SHOW_ALL;
      return (props.showCheckedStrategy as ShowCheckedStrategyType) || SHOW_CHILD;
    });
    // antd 薄壳：SHOW_ALL(非 strictly)/SHOW_PARENT 下 maxCount 无效
    const mergedMaxCount = computed<number | undefined>(() => {
      if (
        props.maxCount &&
        ((props.showCheckedStrategy === 'SHOW_ALL' && !props.treeCheckStrictly) ||
          props.showCheckedStrategy === 'SHOW_PARENT')
      ) {
        return undefined;
      }
      return props.maxCount;
    });

    // ===================== 搜索 =====================
    const [internalSearchValue, setSearchValue] = useControlledValue<string>({
      defaultValue: () => '',
      getValue: () => props.searchValue,
      onChange: (next: string) => {
        emit('update:searchValue', next);
      },
    });
    const mergedSearchValue = computed(() => internalSearchValue.value || '');
    const onInternalSearch = (searchText: string): void => {
      setSearchValue(searchText);
      callbacks.onSearch?.(searchText);
    };

    // ===================== 数据 =====================
    const mergedFieldNames = computed<FilledFieldNames>(() => fillFieldNames(props.fieldNames));
    const mergedTreeData = useTreeData(
      computed(() => props.treeData),
      computed(() => props.treeDataSimpleMode),
    );
    const entities = useDataEntities(mergedTreeData, mergedFieldNames);
    const keyEntities = computed(() => entities.value.keyEntities);
    const valueEntities = computed(() => entities.value.valueEntities);
    const filteredTreeData = useFilterTreeData(mergedTreeData, mergedSearchValue, {
      fieldNames: mergedFieldNames,
      treeNodeFilterProp: computed(() => props.treeNodeFilterProp ?? 'value'),
      filterTreeNode: computed(() => props.filterTreeNode),
    });

    // ===================== Label =====================
    const getLabel = (item: Record<string, unknown> | undefined): unknown => {
      if (!item) return undefined;
      if (props.treeNodeLabelProp) return item[props.treeNodeLabelProp];
      for (const titleKey of mergedFieldNames.value._title) {
        const title = item[titleKey];
        if (title !== undefined) return title;
      }
      return undefined;
    };

    // ===================== 值归一 =====================
    const toLabeledValues = (draftValues: unknown): InternalLabeledValue[] =>
      toArray(draftValues).map((val) =>
        isRawValue(val)
          ? { value: val as never }
          : ({ ...(val as LabeledValueType) } as InternalLabeledValue),
      );

    /**
     * 受控值（rc `useControlledState(defaultValue, value)`）。⚠️ 内部值一律是
     * **LabeledValueType[] 形态**（rc setInternalValue 语义），对外 emit 才按
     * labelInValue / 单多选整形。
     */
    const [internalValue, setInternalValue] = useControlledValue<unknown>({
      // rc `useControlledState(defaultValue, value)` —— 初值来自 defaultValue
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });

    const convert2LabelValues = (
      draftValues: unknown[],
      currentInternal: unknown,
    ): InternalLabeledValue[] =>
      toLabeledValues(draftValues).map((item) => {
        let rawLabel = item.label;
        const rawValue = item.value;
        const rawHalfChecked = item.halfChecked;
        let rawDisabled: boolean | undefined;
        const entity = valueEntities.value.get(rawValue);
        if (entity) {
          rawLabel = props.treeTitleRender
            ? props.treeTitleRender(entity.node as TreeSelectDataNode)
            : (rawLabel ?? getLabel(entity.node as Record<string, unknown>));
          rawDisabled = (entity.node as { disabled?: boolean }).disabled;
        } else if (rawLabel === undefined) {
          const labelInValueItem = toLabeledValues(currentInternal).find(
            (labeledItem) => labeledItem.value === rawValue,
          );
          rawLabel = labelInValueItem?.label;
        }
        return {
          label: rawLabel,
          value: rawValue,
          halfChecked: rawHalfChecked,
          disabled: rawDisabled,
        };
      });

    const rawMixedLabeledValues = computed(() => toLabeledValues(internalValue.value ?? []));
    /** 全勾 / 半勾分流（rc 逐字）。 */
    const rawLabeledValues = computed<InternalLabeledValue[]>(() => {
      const full: InternalLabeledValue[] = [];
      rawMixedLabeledValues.value.forEach((item) => {
        if (!item.halfChecked) full.push(item);
      });
      return full;
    });
    const rawHalfLabeledValues = computed<InternalLabeledValue[]>(() => {
      const half: InternalLabeledValue[] = [];
      rawMixedLabeledValues.value.forEach((item) => {
        if (item.halfChecked) half.push(item);
      });
      return half;
    });

    const rawValues = computed(() => rawLabeledValues.value.map((item) => item.value));
    const checkedKeysResult = useCheckedKeys(
      rawLabeledValues,
      rawHalfLabeledValues,
      treeConduction,
      keyEntities,
    );
    const rawCheckedValues = computed(() => checkedKeysResult.value[0]);
    const rawHalfCheckedValues = computed(() => checkedKeysResult.value[1]);

    // ===================== 展示值 =====================
    const displayValues = computed<DisplayValueType[]>(() => {
      const displayKeys = formatStrategyValues(
        rawCheckedValues.value,
        mergedShowCheckedStrategy.value,
        keyEntities.value,
        mergedFieldNames.value,
      );
      const values = displayKeys.map(
        (key) =>
          (keyEntities.value[key]?.node as Record<string, unknown> | undefined)?.[
            mergedFieldNames.value.value
          ] ?? key,
      );
      const labeledValues = values.map((val) => {
        const targetItem = rawLabeledValues.value.find((item) => item.value === val);
        const label = mergedLabelInValue.value
          ? targetItem?.label
          : props.treeTitleRender?.(targetItem as never);
        return { value: val, label };
      });
      const rawDisplayValues = convert2LabelValues(labeledValues, internalValue.value);
      const firstVal = rawDisplayValues[0];
      if (!isMultiple.value && firstVal && isNil(firstVal.value) && isNil(firstVal.label)) {
        return [];
      }
      return rawDisplayValues.map((item) => ({
        value: item.value,
        label: item.label ?? item.value,
        disabled: item.disabled,
      })) as DisplayValueType[];
    });

    /** label 缓存（rc useCache：树数据异步加载后 tag 标签不丢）。 */
    const labelCache = ref(new Map<unknown, unknown>());
    const cachedDisplayValues = computed<DisplayValueType[]>(() => {
      const valueLabelsCache = new Map<unknown, unknown>();
      const filled = displayValues.value.map((item) => {
        const mergedLabel = item.label ?? labelCache.value.get(item.value);
        valueLabelsCache.set(item.value, mergedLabel);
        return { ...item, label: mergedLabel };
      });
      labelCache.value = valueLabelsCache;
      return filled;
    });

    // ===================== Change =====================
    const triggerChange = (
      newRawValues: (string | number)[],
      extra: Partial<{ triggerValue: unknown; selected: boolean }> | undefined,
      source: string,
    ): void => {
      const formattedKeyList = formatStrategyValues(
        newRawValues,
        mergedShowCheckedStrategy.value,
        keyEntities.value,
        mergedFieldNames.value,
      );
      // rc 层 maxCount 拦截（超出时值不变）
      if (mergedMaxCount.value && formattedKeyList.length > mergedMaxCount.value) {
        return;
      }
      const labeledValues = convert2LabelValues(newRawValues, internalValue.value);
      setInternalValue(labeledValues);

      if (props.autoClearSearchValue !== false) {
        setSearchValue('');
      }

      if (callbacks.onChange) {
        let eventValues = newRawValues;
        if (treeConduction.value) {
          eventValues = formattedKeyList.map((key): string | number => {
            const node = valueEntities.value.get(key)?.node as Record<string, unknown> | undefined;
            return (node?.[mergedFieldNames.value.value] as string | number | undefined) ?? key;
          });
        }
        const { triggerValue, selected } = extra ?? {};
        let returnRawValues = eventValues;
        if (props.treeCheckStrictly) {
          const halfValues = rawHalfLabeledValues.value.filter(
            (item) => !eventValues.includes(item.value),
          );
          returnRawValues = [...returnRawValues, ...halfValues.map((item) => item.value)];
        }
        const returnLabeledValues = convert2LabelValues(returnRawValues, internalValue.value);
        const additionalInfo: Record<string, unknown> = {
          preValue: rawLabeledValues.value as LabeledValueType[],
          triggerValue,
        };
        let showPosition = true;
        if (props.treeCheckStrictly || (source === 'selection' && !selected)) {
          showPosition = false;
        }
        fillAdditionalInfo(
          additionalInfo,
          triggerValue as string | number | undefined,
          newRawValues,
          mergedTreeData.value as TreeSelectDataNode[],
          mergedFieldNames.value,
        );
        if (showPosition === false) {
          // allCheckedNodes 不带位置信息时返回纯节点（rc 语义）
          Object.defineProperty(additionalInfo, 'allCheckedNodes', {
            get() {
              const nodes = (additionalInfo as unknown as { allCheckedNodes?: unknown })
                .allCheckedNodes;
              return nodes;
            },
            configurable: true,
          });
        }
        if (mergedCheckable.value) additionalInfo.checked = selected;
        else additionalInfo.selected = selected;

        const returnValues = mergedLabelInValue.value
          ? returnLabeledValues
          : returnLabeledValues.map((item) => item.value);
        callbacks.onChange(
          isMultiple.value ? returnValues : returnValues[0],
          mergedLabelInValue.value ? null : returnLabeledValues.map((item) => item.label),
          additionalInfo as unknown as ChangeEventExtra,
        );
        // C11：update:value 与 onChange 同发；形状 = rc onChange 首参
        // （多选数组 / 单选单值；labelInValue 时为 LabeledValueType）。
        const emitValue = mergedLabelInValue.value
          ? returnLabeledValues
          : isMultiple.value
            ? returnLabeledValues.map((item) => item.value)
            : (returnLabeledValues.map((item) => item.value)[0] as never);
        emit('update:value', emitValue as never);
      } else {
        // 无 onChange 回调时仍按同一形状 emit（C11）
        const emitValue = mergedLabelInValue.value
          ? labeledValues
          : isMultiple.value
            ? labeledValues.map((item) => item.value)
            : (labeledValues.map((item) => item.value)[0] as never);
        emit('update:value', emitValue as never);
      }
    };

    // ===================== OptionList 选择 =====================
    const onOptionSelect = (
      selectedKey: string | number,
      info: { selected: boolean; source?: string },
    ): void => {
      const entity = keyEntities.value[selectedKey as string];
      const node = entity?.node as Record<string, unknown> | undefined;
      const selectedValue = (node?.[mergedFieldNames.value.value] ?? selectedKey) as
        | string
        | number;

      if (!isMultiple.value) {
        triggerChange([selectedValue], { selected: true, triggerValue: selectedValue }, 'option');
      } else {
        let newRawValues: (string | number)[] = info.selected
          ? [...rawValues.value, selectedValue]
          : rawCheckedValues.value.filter((v) => v !== selectedValue);
        if (treeConduction.value) {
          const missingRawValues: (string | number)[] = newRawValues.filter(
            (val) => !valueEntities.value.has(val),
          );
          const existRawValues = newRawValues.filter((val) => valueEntities.value.has(val));
          const keyList = existRawValues.map((val) => valueEntities.value.get(val)!.key as string);
          let checkedKeys: (string | number)[];
          if (info.selected) {
            ({ checkedKeys } = conductCheck(keyList, true, keyEntities.value));
          } else {
            ({ checkedKeys } = conductCheck(
              keyList,
              {
                checked: false,
                halfCheckedKeys: rawHalfCheckedValues.value,
              },
              keyEntities.value,
            ));
          }
          newRawValues = [
            ...missingRawValues,
            ...checkedKeys.map((key): string | number => {
              const node = keyEntities.value[key]?.node as Record<string, unknown> | undefined;
              return (node?.[mergedFieldNames.value.value] as string | number | undefined) ?? key;
            }),
          ];
        }
        triggerChange(
          newRawValues,
          { selected: info.selected, triggerValue: selectedValue },
          info.source || 'option',
        );
      }

      const legacyNode = fillLegacyProps((entity?.node as TreeSelectDataNode | undefined) ?? null);
      if (info.selected || !isMultiple.value) {
        callbacks.onSelect?.(selectedValue, legacyNode);
      } else {
        callbacks.onDeselect?.(selectedValue, legacyNode);
      }
    };

    /** BaseSelect 展示值增删（tag 移除 / 清空）。 */
    const onDisplayValuesChange = (
      _values: DisplayValueType[],
      info: { type: 'add' | 'remove' | 'clear'; values: DisplayValueType[] },
    ): void => {
      // rc onDisplayValuesChange：clear ⇒ 第一参数（新值 = []）；remove ⇒ info.values[0]
      if (info.type === 'clear') {
        triggerChange([], {}, 'selection');
        return;
      }
      const first = info.values[0];
      if (first) {
        onOptionSelect(first.value as string | number, {
          selected: false,
          source: 'selection',
        });
      }
    };

    // ===================== 语义合并 =====================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      Record<string, never>,
      Record<string, string>,
      Record<string, StyleLike>
    >(
      [
        () => contextSemantic.classNames as Record<string, string> | undefined,
        () => props.classNames as Record<string, string> | undefined,
      ],
      [
        () => contextSemantic.styles as Record<string, StyleLike> | undefined,
        () => (contextSemantic.style ? { root: contextSemantic.style } : undefined),
        () => props.styles as Record<string, StyleLike> | undefined,
        () => (props.style ? { root: props.style } : undefined),
      ],
      { ...props } as never,
    );

    const mergedRootClassName = computed(
      () =>
        [
          !props.prefixCls ? prefixCls.value : '',
          mergedSize.value === 'large' ? `${prefixCls.value}-lg` : '',
          mergedSize.value === 'small' ? `${prefixCls.value}-sm` : '',
          props.direction === 'rtl' ? `${prefixCls.value}-rtl` : '',
          enableVariantCls.value ? `${prefixCls.value}-${variant.value}` : '',
          formItem.value.isFormItemInput ? `${prefixCls.value}-in-form-item` : '',
          // antd getStatusClassNames：`${p}-status-${status}`（hasFeedback 图标本仓 form 未接）
          props.status ? `${prefixCls.value}-status-${props.status}` : '',
          props.className,
          props.rootClassName,
          (mergedClassNames.value as { root?: string }).root,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    );

    const mergedPopupClassName = computed(
      () =>
        [
          props.popupClassName || props.dropdownClassName,
          `${prefixCls.value}-dropdown`,
          props.direction === 'rtl' ? `${prefixCls.value}-dropdown-rtl` : '',
          props.rootClassName,
          (mergedClassNames.value as { popup?: { root?: string } }).popup?.root,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    );

    const memoPlacement = computed<SelectCommonPlacement>(() => {
      if (props.placement !== undefined) return props.placement;
      return props.direction === 'rtl' ? 'bottomRight' : 'bottomLeft';
    });

    const mergedNotFoundContent = computed<unknown>(() => {
      if (props.notFoundContent !== undefined) return props.notFoundContent;
      return contextSemantic.renderEmpty ? contextSemantic.renderEmpty('Select') : 'Not Found';
    });

    const { variant, enableVariantCls } = useVariant({
      component: 'treeSelect',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const mergedSize = computed(() => props.size);
    // allowClear=true 时保持布尔：clearIcon 由独立 prop 传（resolveAllowClear 的
    // fallback 链 config.clearIcon ?? clearIcon —— 布尔 true 会吞掉 prop 的 VNode）
    const mergedAllowClear = computed(() => props.allowClear);

    // ===================== zIndex =====================
    const zIndex = useZIndex('SelectLike', () => props.popupStyle?.zIndex as number | undefined);

    // ===================== Expose =====================
    const baseSelectRef = shallowRef<{
      nativeElement: () => HTMLElement | null;
      focus?: () => void;
      blur?: () => void;
    } | null>(null);
    const optionListRef = shallowRef<{ onKeyDown: (e: KeyboardEvent) => void } | null>(null);
    expose({
      nativeElement: (): HTMLElement | null => baseSelectRef.value?.nativeElement() ?? null,
      focus: (): void => baseSelectRef.value?.focus?.(),
      blur: (): void => baseSelectRef.value?.blur?.(),
    });

    // ===================== Render =====================
    return () => {
      const emptyOptions = !mergedTreeData.value.length;
      // antd：controlHeightSM(24) + paddingXXS(4) = 28（构建期派生常量写死）
      const listItemHeight = props.listItemHeight ?? 28;

      return h(
        BaseSelect,
        {
          ref: baseSelectRef as never,
          prefixCls: prefixCls.value,
          id: mergedId,
          className: mergedRootClassName.value,
          style: mergedStyles.value?.root,
          multiple: isMultiple.value,
          showSearch: props.showSearch === undefined ? false : !!props.showSearch,
          searchValue: mergedSearchValue.value,
          autoClearSearchValue: props.autoClearSearchValue ?? true,
          displayValues: cachedDisplayValues.value,
          disabled: mergedDisabled.value,
          loading: props.loading,
          open: props.open,
          defaultOpen: props.defaultOpen,
          notFoundContent: mergedNotFoundContent.value,
          placeholder: (slots.placeholder?.() as VNodeChild) ?? props.placeholder,
          allowClear: mergedAllowClear.value,
          // antd useIcons：clearIcon 默认 CloseCircleFilled（fallback 链最后一位）
          clearIcon: props.clearIcon ?? contextSemantic.clearIcon ?? h(CloseCircleFilled),
          suffixIcon:
            props.suffixIcon ??
            contextSemantic.suffixIcon ??
            (props.loading ? h(LoadingOutlined, { spin: true }) : h(DownOutlined)),
          // antd useIcons：multiple 的 removeIcon 默认 CloseOutlined（逐字）
          removeIcon:
            props.removeIcon ??
            contextSemantic.removeIcon ??
            (isMultiple.value ? h(CloseOutlined) : undefined),
          maxTagCount: props.maxTagCount,
          maxTagTextLength: props.maxTagTextLength,
          maxTagPlaceholder: props.maxTagPlaceholder,
          maxCount: mergedMaxCount.value,
          emptyOptions,
          placement: memoPlacement.value,
          direction: props.direction,
          popupMatchSelectWidth:
            props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth ?? true,
          getPopupContainer: props.getPopupContainer,
          transitionName: `${rootPrefixCls}-slide-up`,
          popupClassName: mergedPopupClassName.value,
          popupStyle: {
            ...((mergedStyles.value as { popup?: { root?: StyleLike } }).popup?.root ?? {}),
            ...(props.popupStyle ?? {}),
            zIndex,
          },
          popupRender: props.popupRender ?? props.dropdownRender,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          onSearch: onInternalSearch,
          onDisplayValuesChange: onDisplayValuesChange,
          onClear: () => callbacks.onClear?.(),
          onOpenChange: (next: boolean) => setOpen(next),
          onInputKeyDown: (event: KeyboardEvent) => {
            optionListRef.value?.onKeyDown(event);
          },
          openOnTriggerClick: true,
          optionListRenderer: () =>
            h(OptionList, {
              ref: optionListRef as never,
              prefixCls: prefixCls.value,
              multiple: isMultiple.value,
              searchValue: mergedSearchValue.value,
              open: mergedOpen.value,
              notFoundContent: mergedNotFoundContent.value,
              toggleOpen: (next: boolean) => setOpen(next),
              virtual: props.virtual,
              listHeight: props.listHeight,
              listItemHeight,
              listItemScrollOffset: 0,
              popupMatchSelectWidth:
                props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth ?? true,
              treeData: filteredTreeData.value as never,
              fieldNames: mergedFieldNames.value,
              onSelect: onOptionSelect as never,
              treeExpandAction: props.treeExpandAction,
              treeTitleRender: props.treeTitleRender,
              onPopupScroll: callbacks.onPopupScroll,
              leftMaxCount:
                mergedMaxCount.value === undefined
                  ? null
                  : mergedMaxCount.value - cachedDisplayValues.value.length,
              leafCountOnly:
                mergedShowCheckedStrategy.value === 'SHOW_CHILD' &&
                !props.treeCheckStrictly &&
                !!props.treeCheckable,
              valueEntities: valueEntities.value,
              checkable: props.treeCheckable
                ? h('span', { class: `${prefixCls.value}-checkbox-inner` })
                : mergedCheckable.value,
              loadData: props.loadData,
              treeLoadedKeys: props.treeLoadedKeys,
              onTreeLoad: (keys: (string | number)[]) => {
                callbacks.onTreeLoad?.(keys);
                emit('update:treeLoadedKeys', keys);
              },
              checkedKeys: rawCheckedValues.value as never,
              halfCheckedKeys: rawHalfCheckedValues.value,
              treeDefaultExpandAll: props.treeDefaultExpandAll,
              treeExpandedKeys: props.treeExpandedKeys,
              treeDefaultExpandedKeys: props.treeDefaultExpandedKeys,
              onTreeExpand: (keys: (string | number)[]) => {
                callbacks.onTreeExpand?.(keys);
                emit('update:treeExpandedKeys', keys);
              },
              treeIcon: props.treeIcon,
              showTreeIcon: props.showTreeIcon,
              switcherIcon: props.switcherIcon ?? contextSemantic.switcherIcon,
              treeLine: props.treeLine,
              treeNodeFilterProp: props.treeNodeFilterProp ?? 'value',
              keyEntities: keyEntities.value,
            } as never),
          ...attrs,
        } as never,
        {},
      );
    };
  },
});

export default TreeSelect;
