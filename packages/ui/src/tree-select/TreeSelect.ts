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
import { useControlledValue, useId } from '@apollo-design/utils';
import type { CSSProperties, PropType, SlotsType, VNode, VNodeChild } from 'vue';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  normalizeClass,
  normalizeStyle,
  shallowRef,
} from 'vue';
import { conductCheck } from '../_internal/tree/conduct-util';
import { useConsumerZIndex } from '../_internal/use-consumer-z-index';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import BaseSelect, { type SearchSource } from '../select/engine/BaseSelect';
import type { DisplayValueType, SelectCommonPlacement, SelectSlots } from '../select/interface';
import { useSelectTheme } from '../select/use-select-theme';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import type { TreeScrollConfig } from '../tree/interface';
import { useTreeTheme } from '../tree/use-tree-theme';
import { useCheckedKeys } from './hooks/use-checked-keys';
import { useDataEntities } from './hooks/use-data-entities';
import { useFilterTreeData } from './hooks/use-filter-tree-data';
import { useTreeData } from './hooks/use-tree-data';
import type {
  ChangeEventExtra,
  InternalLabeledValue,
  SearchConfig,
  SimpleModeConfig,
  TreeSelectDataNode,
  TreeSelectProps,
  TreeSelectSemanticClassNames,
  TreeSelectSemanticStyles,
  TreeSelectSlots,
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
import {
  type FilledFieldNames,
  fillFieldNames,
  getNodeValue,
  isNil,
  type RawValue,
  toArray,
} from './utils/value-util';

interface TreeSelectDisplayValue extends DisplayValueType {
  value: RawValue;
  label?: VNodeChild;
}

type TreeSelectConfig = Pick<
  TreeSelectProps,
  | 'classNames'
  | 'styles'
  | 'showSearch'
  | 'allowClear'
  | 'switcherIcon'
  | 'clearIcon'
  | 'suffixIcon'
  | 'removeIcon'
> & {
  className?: string;
  style?: CSSProperties;
};

const treeSelectEmits = {
  'update:value': (_value: TreeSelectValue) => true,
  change: (_value: TreeSelectValue, _labels: VNodeChild[] | null, _extra: ChangeEventExtra) => true,
  select: (_value: string | number, _node: TreeSelectDataNode | null | undefined) => true,
  deselect: (_value: string | number, _node: TreeSelectDataNode | null | undefined) => true,
  'update:open': (_open: boolean) => true,
  openChange: (_open: boolean) => true,
  'update:searchValue': (_value: string) => true,
  search: (_value: string) => true,
  'update:treeExpandedKeys': (_keys: (string | number)[]) => true,
  treeExpand: (_keys: (string | number)[]) => true,
  'update:treeLoadedKeys': (_keys: (string | number)[]) => true,
  treeLoad: (_keys: (string | number)[]) => true,
  clear: () => true,
  popupScroll: (_event: Event) => true,
  focus: (_event: FocusEvent) => true,
  blur: (_event: FocusEvent) => true,
  inputKeyDown: (_event: KeyboardEvent) => true,
};

const TreeSelect = defineComponent({
  name: 'ATreeSelect',
  inheritAttrs: false,
  props: {
    // ---- shell ----
    prefixCls: { type: String, default: undefined },
    id: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<TreeSelectProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<TreeSelectProps['styles']>, default: undefined },
    size: { type: String as PropType<TreeSelectProps['size']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    status: { type: String as PropType<TreeSelectProps['status']>, default: undefined },
    variant: { type: String as PropType<TreeSelectProps['variant']>, default: undefined },
    bordered: { type: Boolean, default: undefined },
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
    treeCheckable: { type: Boolean, default: undefined },
    treeCheckStrictly: { type: Boolean, default: undefined },
    treeDefaultExpandAll: { type: Boolean, default: undefined },
    treeExpandedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
    treeDefaultExpandedKeys: { type: Array as PropType<(string | number)[]>, default: undefined },
    treeLine: {
      type: [Boolean, Object] as PropType<TreeSelectProps['treeLine']>,
      default: undefined,
    },
    treeIcon: { type: Boolean, default: undefined },
    showTreeIcon: { type: Boolean, default: undefined },
    switcherIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
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
    maxTagPlaceholder: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    listHeight: { type: Number, default: 256 },
    listItemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    dropdownMatchSelectWidth: { type: [Boolean, Number], default: undefined },
    placement: { type: String as PropType<SelectCommonPlacement>, default: undefined },
    /**
     * ⚠️ 默认 `undefined` 而不是字面的 `'ltr'`（Issue #13.4）—— 字面默认会让
     *    「局部 ?? ConfigProvider ?? 'ltr'」这条回退链永远短路在第一支。
     */
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    getPopupContainer: {
      type: Function as PropType<TreeSelectProps['getPopupContainer']>,
      default: undefined,
    },
    allowClear: {
      type: [Boolean, Object] as PropType<TreeSelectProps['allowClear']>,
      default: undefined,
    },
    clearIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffixIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    popupClassName: { type: String, default: undefined },
    dropdownClassName: { type: String, default: undefined },
    popupStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    loading: { type: Boolean, default: undefined },
    tabIndex: { type: Number, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    maxLength: { type: Number, default: undefined },
  },
  slots: Object as SlotsType<TreeSelectSlots>,
  emits: treeSelectEmits,
  expose: ['nativeElement', 'focus', 'blur', 'scrollTo'],
  setup(props, { attrs, emit, slots }) {
    const componentConfig = useComponentConfig<TreeSelectConfig>('treeSelect');
    const selectTheme = useSelectTheme();
    const treeTheme = useTreeTheme();
    const defaultId = useId();
    const mergedId = computed(() => props.id ?? defaultId);
    const formItem = useFormItemInputContext();
    const mergedDisabled = useDisabled(() => props.disabled);
    /**
     * 方向（Issue #13.4）：上游 `useBase(customizePrefixCls, direction)` 的
     * `mergedDirection` ⇒ **局部 prop 优先、回退 ConfigProvider 的 `direction`**。
     * 本仓此前写 `default: 'ltr'` ⇒ 全局 RTL 永远不生效（`-rtl` / `-dropdown-rtl` /
     * placement 默认 / compact 类名 四处同时错）。
     */
    const directionCtx = useDirection();
    const mergedDirection = computed<'ltr' | 'rtl'>(
      () => props.direction ?? directionCtx.value ?? 'ltr',
    );
    /** ConfigProvider 的全局配置（`getPopupContainer` 等，Issue #13.4）。 */
    const config = useConfigContext();
    const rootPrefixCls = computed(() => componentConfig.getPrefixCls());

    const prefixCls = computed(() => componentConfig.getPrefixCls('tree-select', props.prefixCls));
    // antd 薄壳三前缀：customize 模式下合一；默认模式本仓单前缀直通（见文件头 §判据 6）。

    // ===================== 开合 =====================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        emit('openChange', next);
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
      return props.showCheckedStrategy ?? SHOW_CHILD;
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
    const showSearch = computed(() => props.showSearch ?? componentConfig.showSearch ?? false);
    const searchConfig = computed(() =>
      typeof showSearch.value === 'object' ? showSearch.value : {},
    );
    const autoClearSearchValue = computed(
      () => searchConfig.value.autoClearSearchValue ?? props.autoClearSearchValue ?? true,
    );
    const treeNodeFilterProp = computed(
      () => searchConfig.value.treeNodeFilterProp ?? props.treeNodeFilterProp ?? 'value',
    );
    const filterTreeNode = computed(
      () => searchConfig.value.filterTreeNode ?? props.filterTreeNode,
    );
    const [internalSearchValue, setSearchValue] = useControlledValue<string>({
      defaultValue: () => '',
      getValue: () => props.searchValue,
      onChange: (next: string) => {
        emit('update:searchValue', next);
      },
    });
    const mergedSearchValue = computed(() => internalSearchValue.value || '');
    const onInternalSearch = (searchText: string, info: SearchSource): void => {
      if (info.source === 'effect' && !autoClearSearchValue.value) return;
      if (mergedSearchValue.value !== searchText) setSearchValue(searchText);
      if (info.source === 'typing') emit('search', searchText);
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
      treeNodeFilterProp,
      filterTreeNode,
    });

    // ===================== Label =====================
    const getLabel = (item: TreeSelectDataNode | undefined): VNodeChild => {
      if (!item) return undefined;
      const resolve = (title: TreeSelectDataNode['title']): VNodeChild =>
        typeof title === 'function' ? title(item) : title;
      if (props.treeNodeLabelProp)
        return resolve(item[props.treeNodeLabelProp] as TreeSelectDataNode['title']);
      for (const titleKey of mergedFieldNames.value._title) {
        const title = item[titleKey];
        if (title !== undefined) return resolve(title as TreeSelectDataNode['title']);
      }
      return undefined;
    };

    // ===================== 值归一 =====================
    const toLabeledValues = (draftValues: TreeSelectValue): InternalLabeledValue[] =>
      toArray(draftValues).flatMap((val): InternalLabeledValue[] => {
        if (typeof val === 'string' || typeof val === 'number') return [{ value: val }];
        return val.value === undefined ? [] : [{ ...val, value: val.value }];
      });

    /**
     * 受控值（rc `useControlledState(defaultValue, value)`）。⚠️ 内部值一律是
     * **LabeledValueType[] 形态**（rc setInternalValue 语义），对外 emit 才按
     * labelInValue / 单多选整形。
     */
    const [internalValue, setInternalValue] = useControlledValue<TreeSelectValue>({
      // rc `useControlledState(defaultValue, value)` —— 初值来自 defaultValue
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });

    const convert2LabelValues = (
      draftValues: TreeSelectValue,
      currentInternal: TreeSelectValue,
    ): InternalLabeledValue[] =>
      toLabeledValues(draftValues).map((item) => {
        let rawLabel = item.label;
        const rawValue = item.value;
        const rawHalfChecked = item.halfChecked;
        let rawDisabled: boolean | undefined;
        const entity = valueEntities.value.get(rawValue);
        if (entity) {
          rawLabel = rawLabel ?? getLabel(entity.node);
          rawDisabled = entity.node.disabled;
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
    const displayValues = computed<TreeSelectDisplayValue[]>(() => {
      const displayKeys = formatStrategyValues(
        rawCheckedValues.value,
        mergedShowCheckedStrategy.value,
        keyEntities.value,
        mergedFieldNames.value,
      );
      const values = displayKeys.map(
        (key) => getNodeValue(keyEntities.value[key]?.node, mergedFieldNames.value.value) ?? key,
      );
      const labeledValues = values.map((val) => {
        const targetItem = rawLabeledValues.value.find((item) => item.value === val);
        return { value: val, label: targetItem?.label };
      });
      const rawDisplayValues = convert2LabelValues(labeledValues, internalValue.value);
      const firstVal = rawDisplayValues[0];
      if (!isMultiple.value && firstVal && isNil(firstVal.value) && isNil(firstVal.label)) {
        return [];
      }
      return rawDisplayValues.map((item) => ({
        value: item.value,
        label: item.label,
        disabled: item.disabled,
      }));
    });

    /** label 缓存（rc useCache：树数据异步加载后 tag 标签不丢）。 */
    const labelCache = new Map<RawValue, VNodeChild>();
    const cachedDisplayValues = computed<TreeSelectDisplayValue[]>(() => {
      const filled = displayValues.value.map((item) => {
        const mergedLabel = item.label ?? labelCache.get(item.value) ?? item.value;
        labelCache.set(item.value, mergedLabel);
        return { ...item, label: mergedLabel };
      });
      const currentValues = new Set(filled.map((item) => item.value));
      for (const key of labelCache.keys()) if (!currentValues.has(key)) labelCache.delete(key);
      return filled;
    });

    // ===================== Change =====================
    const triggerChange = (
      newRawValues: (string | number)[],
      extra: Partial<{ triggerValue: string | number; selected: boolean }> | undefined,
      source: string,
    ): boolean => {
      const formattedKeyList = formatStrategyValues(
        newRawValues,
        mergedShowCheckedStrategy.value,
        keyEntities.value,
        mergedFieldNames.value,
      );
      // rc 层 maxCount 拦截（超出时值不变）
      if (mergedMaxCount.value && formattedKeyList.length > mergedMaxCount.value) {
        return false;
      }
      const previousValue = rawLabeledValues.value;
      const halfValues = props.treeCheckStrictly
        ? rawHalfLabeledValues.value.filter((item) => !newRawValues.includes(item.value))
        : [];

      if (autoClearSearchValue.value && mergedSearchValue.value !== '') {
        setSearchValue('');
      }

      let eventValues = newRawValues;
      if (treeConduction.value) {
        eventValues = formattedKeyList.map((key): string | number => {
          return (
            getNodeValue(valueEntities.value.get(key)?.node, mergedFieldNames.value.value) ?? key
          );
        });
      }
      const { triggerValue, selected } = extra ?? {};
      const returnLabeledValues = convert2LabelValues(
        [...eventValues, ...halfValues],
        internalValue.value,
      );
      setInternalValue(convert2LabelValues([...newRawValues, ...halfValues], internalValue.value));
      const additionalInfo: ChangeEventExtra = {
        preValue: previousValue,
        triggerValue,
      };
      let showPosition = true;
      if (props.treeCheckStrictly || (source === 'selection' && !selected)) {
        showPosition = false;
      }
      fillAdditionalInfo(
        additionalInfo,
        triggerValue,
        newRawValues,
        mergedTreeData.value,
        mergedFieldNames.value,
        // 🚨 判据下沉到 `fillAdditionalInfo`（Issue #13.2）—— 此前在这里再定义一次
        //    同名 getter，而新 getter 内又读 `additionalInfo.allCheckedNodes`
        //    （= 它自己）⇒ 访问即 `RangeError: Maximum call stack size exceeded`。
        showPosition,
      );
      if (mergedCheckable.value) additionalInfo.checked = selected;
      else additionalInfo.selected = selected;

      const returnValues = mergedLabelInValue.value
        ? returnLabeledValues
        : returnLabeledValues.map((item) => item.value);
      /**
       * 🚨 **单选时是单值**（Issue #13.3）—— 多选数组 / 单选单值，
       * 与 `labelInValue` 无关。此前 `labelInValue` 分支直接把数组发出去了
       * ⇒ 单选 + `labelInValue` 时 `v-model:value` 拿到 `[{value,label}]`
       *     而不是 `{value,label}`（与 `onChange` 首参也不一致）。
       */
      const nextValue = isMultiple.value ? returnValues : returnValues[0];
      emit(
        'change',
        nextValue,
        mergedLabelInValue.value ? null : returnLabeledValues.map((item) => item.label),
        additionalInfo,
      );
      // C11：update:value 与 onChange 同发；形状 = rc onChange **首参**（同一份）。
      emit('update:value', nextValue);
      return true;
    };

    // ===================== OptionList 选择 =====================
    const onOptionSelect = (
      selectedKey: string | number,
      info: { selected: boolean; source?: string },
    ): void => {
      const entity = keyEntities.value[selectedKey];
      const selectedValue = getNodeValue(entity?.node, mergedFieldNames.value.value) ?? selectedKey;

      if (!isMultiple.value) {
        if (
          !triggerChange([selectedValue], { selected: true, triggerValue: selectedValue }, 'option')
        )
          return;
      } else {
        let newRawValues: (string | number)[] = info.selected
          ? [...rawValues.value, selectedValue]
          : rawCheckedValues.value.filter((v) => v !== selectedValue);
        if (treeConduction.value) {
          const missingRawValues: (string | number)[] = newRawValues.filter(
            (val) => !valueEntities.value.has(val),
          );
          const existRawValues = newRawValues.filter((val) => valueEntities.value.has(val));
          // biome-ignore lint/style/noNonNullAssertion: 上一行已用 .has(val) 过滤 ⇒ get 必命中（Map.get 的类型收窄不掉）
          const keyList = existRawValues.map((val) => valueEntities.value.get(val)!.key);
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
              return (
                getNodeValue(keyEntities.value[key]?.node, mergedFieldNames.value.value) ?? key
              );
            }),
          ];
        }
        const changed = triggerChange(
          newRawValues,
          { selected: info.selected, triggerValue: selectedValue },
          info.source || 'option',
        );
        if (!changed) return;
      }

      const legacyNode = fillLegacyProps(entity?.node ?? null);
      if (info.selected || !isMultiple.value) {
        emit('select', selectedValue, legacyNode);
      } else {
        emit('deselect', selectedValue, legacyNode);
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
      if (first?.value !== undefined) {
        onOptionSelect(first.value, {
          selected: false,
          source: 'selection',
        });
      }
    };

    // ===================== Current presentation =====================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      Readonly<TreeSelectProps>,
      TreeSelectSemanticClassNames,
      TreeSelectSemanticStyles
    >(
      [() => componentConfig.classNames, () => props.classNames],
      [() => componentConfig.styles, () => props.styles],
      props,
      { popup: { _default: 'root' } },
    );
    const mergedStatus = computed(() => props.status || formItem.value.status);
    const { variant, enableVariantCls } = useVariant({
      component: 'treeSelect',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => mergedDirection.value,
    );
    const mergedSize = useSize((ctxSize) => props.size ?? compactSize.value ?? ctxSize);
    const getRootClassName = () =>
      normalizeClass([
        mergedSize.value === 'large' && `${prefixCls.value}-lg`,
        mergedSize.value === 'small' && `${prefixCls.value}-sm`,
        mergedDirection.value === 'rtl' && `${prefixCls.value}-rtl`,
        enableVariantCls.value && `${prefixCls.value}-${variant.value}`,
        formItem.value.isFormItemInput && `${prefixCls.value}-in-form-item`,
        getStatusClassNames(prefixCls.value, mergedStatus.value, formItem.value.hasFeedback),
        compactItemClassnames.value,
        componentConfig.className,
        attrs.class,
      ]);
    const mergedPopupClassName = computed(() =>
      normalizeClass([
        props.popupClassName,
        props.dropdownClassName,
        mergedDirection.value === 'rtl' && `${prefixCls.value}-dropdown-rtl`,
        mergedClassNames.value.popup?.root,
      ]),
    );
    const memoPlacement = computed<SelectCommonPlacement>(
      () => props.placement ?? (mergedDirection.value === 'rtl' ? 'bottomRight' : 'bottomLeft'),
    );
    const zIndex = useConsumerZIndex(
      'SelectLike',
      () => props.popupStyle?.zIndex ?? mergedStyles.value.popup?.root?.zIndex,
      () => selectTheme.zIndexPopup.value,
    );

    // ===================== Public instance =====================
    const baseSelectRef = shallowRef<{
      nativeElement: () => HTMLElement | null;
      focus: (options?: FocusOptions) => void;
      blur: () => void;
    } | null>(null);
    const optionListRef = shallowRef<{
      onKeyDown: (e: KeyboardEvent) => void;
      scrollTo: (arg?: number | TreeScrollConfig | null) => void;
    } | null>(null);

    // ===================== Render =====================
    const renderTreeSelect = () => {
      const {
        class: _nativeClass,
        style: nativeStyle,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        tabindex,
        ...restAttrs
      } = attrs;
      const notFoundContent = slots.notFoundContent
        ? slots.notFoundContent()
        : props.notFoundContent !== undefined
          ? props.notFoundContent
          : componentConfig.renderEmpty
            ? componentConfig.renderEmpty('TreeSelect')
            : 'Not Found';
      const displayValues = cachedDisplayValues.value.map((item) => {
        const entity = valueEntities.value.get(item.value);
        return entity && slots.treeTitleRender
          ? { ...item, label: slots.treeTitleRender({ node: entity.node }) }
          : item;
      });
      const suffixIcon: NonNullable<SelectSlots['suffixIcon']> = (scope) => {
        const icon = slots.suffixIcon
          ? slots.suffixIcon(scope)
          : props.suffixIcon !== undefined
            ? props.suffixIcon
            : componentConfig.suffixIcon !== undefined
              ? componentConfig.suffixIcon
              : props.loading
                ? slots.loadingIcon
                  ? slots.loadingIcon()
                  : h(LoadingOutlined, { spin: true })
                : h(DownOutlined);
        return formItem.value.hasFeedback ? [icon, formItem.value.feedbackIcon] : icon;
      };
      const rawContent = slots.default?.();
      const singleRaw = isVNode(rawContent)
        ? rawContent
        : Array.isArray(rawContent) && rawContent.length === 1 && isVNode(rawContent[0])
          ? rawContent[0]
          : undefined;
      // Text and arrays retain their full content in one native trigger host.
      const rawHost: VNode | undefined = !slots.default
        ? undefined
        : singleRaw &&
            (typeof singleRaw.type === 'string' ||
              typeof singleRaw.type === 'object' ||
              typeof singleRaw.type === 'function')
          ? singleRaw
          : h('span', {}, Array.isArray(rawContent) ? rawContent : [rawContent]);
      const rawTrigger = rawHost
        ? cloneVNode(rawHost, {
            class: normalizeClass([
              componentConfig.className,
              mergedClassNames.value.root,
              attrs.class,
            ]),
            style: [
              selectTheme.style.value,
              treeTheme.style.value,
              componentConfig.style,
              mergedStyles.value.root,
              normalizeStyle(nativeStyle),
            ],
          })
        : undefined;
      return h(BaseSelect, {
        ...restAttrs,
        ref: baseSelectRef,
        prefixCls: prefixCls.value,
        id: mergedId.value,
        ariaLabel: typeof ariaLabel === 'string' ? ariaLabel : undefined,
        ariaLabelledby: typeof ariaLabelledby === 'string' ? ariaLabelledby : undefined,
        'aria-haspopup': 'tree',
        className: getRootClassName(),
        style: [
          selectTheme.style.value,
          treeTheme.style.value,
          componentConfig.style,
          mergedStyles.value.root,
          normalizeStyle(nativeStyle),
        ],
        mode: undefined,
        multiple: isMultiple.value,
        showSearch: !!showSearch.value,
        searchValue: mergedSearchValue.value,
        autoClearSearchValue: autoClearSearchValue.value,
        displayValues,
        disabled: mergedDisabled.value,
        loading: props.loading,
        tabIndex:
          props.tabIndex ??
          (typeof tabindex === 'number'
            ? tabindex
            : typeof tabindex === 'string'
              ? Number(tabindex)
              : undefined),
        autoFocus: props.autoFocus,
        maxLength: props.maxLength,
        open: mergedOpen.value,
        defaultOpen: props.defaultOpen,
        notFoundContent,
        placeholder: slots.placeholder ? slots.placeholder() : props.placeholder,
        prefix: slots.prefix?.(),
        allowClear: props.allowClear ?? componentConfig.allowClear,
        clearIcon: slots.clearIcon
          ? slots.clearIcon()
          : (props.clearIcon ?? componentConfig.clearIcon ?? h(CloseCircleFilled)),
        suffixIcon,
        removeIcon: slots.removeIcon
          ? slots.removeIcon()
          : (props.removeIcon ??
            componentConfig.removeIcon ??
            (isMultiple.value ? h(CloseOutlined) : undefined)),
        tagRender: slots.tagRender,
        maxTagCount: props.maxTagCount,
        maxTagTextLength: props.maxTagTextLength,
        maxTagPlaceholder: slots.maxTagPlaceholder
          ? (omittedValues) => slots.maxTagPlaceholder?.({ omittedValues })
          : props.maxTagPlaceholder,
        maxCount: mergedMaxCount.value,
        emptyOptions: !mergedTreeData.value.length,
        placement: memoPlacement.value,
        direction: mergedDirection.value,
        popupMatchSelectWidth:
          props.popupMatchSelectWidth ??
          props.dropdownMatchSelectWidth ??
          config.popupMatchSelectWidth ??
          true,
        getPopupContainer: props.getPopupContainer ?? config.getPopupContainer,
        transitionName: `${rootPrefixCls.value}-slide-up`,
        popupClassName: mergedPopupClassName.value,
        popupStyle: {
          ...selectTheme.style.value,
          ...treeTheme.style.value,
          ...mergedStyles.value.popup?.root,
          ...props.popupStyle,
          zIndex: zIndex.value,
        },
        popupRender: slots.popupRender ? (menu) => slots.popupRender?.({ menu }) : undefined,
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
        onSearch: onInternalSearch,
        onDisplayValuesChange,
        onClear: () => emit('clear'),
        onOpenChange: setOpen,
        onFocus: (event) => emit('focus', event),
        onBlur: (event) => emit('blur', event),
        onInputKeyDown: (event) => {
          if (mergedOpen.value && !mergedDisabled.value && !event.isComposing)
            optionListRef.value?.onKeyDown(event);
          emit('inputKeyDown', event);
        },
        getRawInputElement: rawTrigger ? () => rawTrigger : undefined,
        optionListRenderer: () =>
          h(
            OptionList,
            {
              ref: optionListRef,
              prefixCls: prefixCls.value,
              id: `${mergedId.value}_list`,
              multiple: isMultiple.value,
              searchValue: mergedSearchValue.value,
              open: mergedOpen.value,
              notFoundContent,
              toggleOpen: setOpen,
              virtual: props.virtual ?? config.virtual,
              listHeight: props.listHeight,
              listItemHeight: props.listItemHeight ?? treeTheme.itemHeight.value,
              popupMatchSelectWidth:
                props.popupMatchSelectWidth ??
                props.dropdownMatchSelectWidth ??
                config.popupMatchSelectWidth ??
                true,
              treeData: filteredTreeData.value,
              fieldNames: mergedFieldNames.value,
              onSelect: onOptionSelect,
              treeExpandAction: props.treeExpandAction,
              onPopupScroll: (event) => emit('popupScroll', event),
              leftMaxCount:
                mergedMaxCount.value === undefined
                  ? null
                  : mergedMaxCount.value - displayValues.length,
              leafCountOnly:
                mergedShowCheckedStrategy.value === 'SHOW_CHILD' &&
                !props.treeCheckStrictly &&
                !!props.treeCheckable,
              valueEntities: valueEntities.value,
              checkable: mergedCheckable.value,
              loadData: props.loadData,
              treeLoadedKeys: props.treeLoadedKeys,
              onTreeLoad: (keys) => {
                emit('treeLoad', keys);
                emit('update:treeLoadedKeys', keys);
              },
              checkedKeys: rawCheckedValues.value,
              halfCheckedKeys: rawHalfCheckedValues.value,
              treeDefaultExpandAll: props.treeDefaultExpandAll,
              treeExpandedKeys: props.treeExpandedKeys,
              treeDefaultExpandedKeys: props.treeDefaultExpandedKeys,
              onTreeExpand: (keys) => {
                emit('treeExpand', keys);
                emit('update:treeExpandedKeys', keys);
              },
              treeIcon: props.treeIcon,
              showTreeIcon: props.showTreeIcon,
              switcherIcon: props.switcherIcon ?? componentConfig.switcherIcon,
              treeLine: props.treeLine,
              treeNodeFilterProp: treeNodeFilterProp.value,
              filterTreeNode: filterTreeNode.value,
              keyEntities: keyEntities.value,
            },
            {
              treeTitleRender: slots.treeTitleRender,
              treeIcon: slots.treeIcon,
              switcherIcon: slots.switcherIcon,
              switcherLoadingIcon: slots.switcherLoadingIcon,
            },
          ),
      });
    };
    return {
      nativeElement: computed(() => baseSelectRef.value?.nativeElement() ?? null),
      focus: (options?: FocusOptions) => baseSelectRef.value?.focus(options),
      blur: () => baseSelectRef.value?.blur(),
      scrollTo: (arg?: number | TreeScrollConfig | null) => optionListRef.value?.scrollTo(arg),
      renderTreeSelect,
    };
  },
  render() {
    return this.renderTreeSelect();
  },
});

export default TreeSelect;
