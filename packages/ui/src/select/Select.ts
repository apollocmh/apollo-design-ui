/**
 * Select value semantics and Vue public boundary.
 * BaseSelect owns interaction, Selector owns the native control DOM, and OptionList
 * owns option rendering. Option VNodes are normalized only at the render boundary.
 */

import {
  CheckOutlined,
  CloseCircleFilled,
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
  SearchOutlined,
} from '@apollo-design/icons';
import { useZIndex, ZINDEX_KEY } from '@apollo-design/portal';
import { isEmptyVNode, useControlledValue, useDevWarning, useId } from '@apollo-design/utils';
import type { CSSProperties, PropType, SlotsType, VNodeChild } from 'vue';
import {
  computed,
  defineComponent,
  h,
  inject,
  normalizeClass,
  normalizeStyle,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import { defaultRenderEmpty } from '../config-provider/default-render-empty';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import BaseSelect from './engine/BaseSelect';
import { type SelectContextValue, selectContextKey } from './engine/context';
import { filterOptions, parseOptions, resolveSearchConfig, useCache } from './engine/useOptions';
import type { ResolvedFieldNames } from './engine/valueUtil';
import {
  convertChildrenToData,
  fillFieldNames,
  flattenOptions,
  hasValue,
  isComboNoValue,
  toArray,
} from './engine/valueUtil';
import type {
  DefaultOptionType,
  DisplayValueType,
  FilterFunc,
  InternalSelectMode,
  LabeledValue,
  LabelInValueType,
  RawValueType,
  ScrollToArg,
  SelectCommonPlacement,
  SelectProps,
  SelectRef,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectSlots,
  SelectValue,
  SelectVariant,
} from './interface';
import { useSelectTheme } from './use-select-theme';

/** Existing style aliases retained by the current compatibility policy. */
const DEPRECATIONS: Array<[string, string]> = [
  ['dropdownMatchSelectWidth', 'popupMatchSelectWidth'],
  ['dropdownStyle', 'styles.popup.root'],
  ['dropdownClassName', 'classNames.popup.root'],
  ['popupClassName', 'classNames.popup.root'],
  ['bordered', 'variant'],
];

export const selectProps = {
  id: { type: String, default: undefined },
  prefixCls: { type: String, default: undefined },
  value: { type: null as unknown as PropType<SelectValue>, default: undefined },
  defaultValue: { type: null as unknown as PropType<SelectValue>, default: undefined },
  labelInValue: { type: Boolean, default: undefined },
  optionLabelProp: { type: String, default: undefined },
  fieldNames: { type: Object as PropType<SelectProps['fieldNames']>, default: undefined },
  mode: { type: String as PropType<SelectProps['mode']>, default: undefined },
  options: { type: Array as PropType<DefaultOptionType[]>, default: undefined },
  listHeight: { type: Number, default: undefined },
  listItemHeight: { type: Number, default: undefined },
  virtual: { type: Boolean, default: undefined },
  defaultActiveFirstOption: { type: Boolean, default: undefined },
  showSearch: {
    type: [Boolean, Object] as PropType<SelectProps['showSearch']>,
    default: undefined,
  },
  searchValue: { type: String, default: undefined },
  autoClearSearchValue: { type: Boolean, default: undefined },
  filterOption: {
    type: [Boolean, Function] as PropType<boolean | FilterFunc<DefaultOptionType>>,
    default: undefined,
  },
  filterSort: { type: Function as PropType<SelectProps['filterSort']>, default: undefined },
  optionFilterProp: { type: [String, Array] as PropType<string | string[]>, default: undefined },
  size: { type: String as PropType<SizeType>, default: undefined },
  variant: { type: String as PropType<SelectVariant>, default: undefined },
  bordered: { type: Boolean, default: undefined },
  status: { type: String as PropType<SelectProps['status']>, default: undefined },
  disabled: { type: Boolean, default: undefined },
  loading: { type: Boolean, default: undefined },
  placeholder: { type: String, default: undefined },
  showArrow: { type: Boolean, default: undefined },
  allowClear: {
    type: [Boolean, Object] as PropType<SelectProps['allowClear']>,
    default: undefined,
  },
  maxLength: { type: Number, default: undefined },
  maxCount: { type: Number, default: undefined },
  maxTagCount: { type: Number, default: undefined },
  maxTagTextLength: { type: Number, default: undefined },
  tokenSeparators: {
    type: [Array, Function] as PropType<string[] | ((input: string) => string[])>,
    default: undefined,
  },
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: undefined },
  placement: { type: String as PropType<SelectCommonPlacement>, default: undefined },
  direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
  popupMatchSelectWidth: { type: [Boolean, Number], default: undefined },
  getPopupContainer: {
    type: Function as PropType<SelectProps['getPopupContainer']>,
    default: undefined,
  },
  transitionName: { type: String, default: undefined },
  popupClassName: { type: String, default: undefined },
  dropdownClassName: { type: String, default: undefined },
  dropdownStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  dropdownMatchSelectWidth: { type: [Boolean, Number], default: undefined },
  popupStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  classNames: { type: Object as PropType<SelectSemanticClassNames>, default: undefined },
  styles: { type: Object as PropType<SelectSemanticStyles>, default: undefined },
  tabIndex: { type: Number, default: undefined },
  autoFocus: { type: Boolean, default: undefined },
  title: { type: String, default: undefined },
  role: { type: String, default: undefined },
};

export const selectEmits = {
  change: (_value: SelectValue, _option: DefaultOptionType | DefaultOptionType[] | undefined) =>
    true,
  'update:value': (_value: SelectValue) => true,
  select: (_value: RawValueType | LabeledValue, _option: DefaultOptionType) => true,
  deselect: (_value: RawValueType | LabeledValue, _option: DefaultOptionType) => true,
  search: (_value: string) => true,
  'update:searchValue': (_value: string) => true,
  openChange: (_open: boolean) => true,
  'update:open': (_open: boolean) => true,
  focus: (_event: FocusEvent) => true,
  blur: (_event: FocusEvent) => true,
  clear: () => true,
  popupScroll: (_event: Event) => true,
  inputKeyDown: (_event: KeyboardEvent) => true,
};

type SelectConfig = Partial<SelectProps> & {
  className?: string;
  style?: CSSProperties;
  suffixIcon?: VNodeChild;
  loadingIcon?: VNodeChild;
  clearIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  menuItemSelectedIcon?: VNodeChild;
};

/** @internal Resolved presentation configuration for the two existing wrappers. */
export interface SelectEngineComponentConfig {
  componentName: 'select' | 'autoComplete';
  className?: string;
  style?: CSSProperties;
  classNames?: SelectSemanticClassNames;
  styles?: SelectSemanticStyles;
  showSearch?: SelectProps['showSearch'];
  allowClear?: SelectProps['allowClear'];
  suffixIcon?: VNodeChild;
  loadingIcon?: VNodeChild;
  clearIcon?: VNodeChild;
  removeIcon?: VNodeChild;
  menuItemSelectedIcon?: VNodeChild;
}

// The public render boundary normalizes option VNodes. Ordinary child props then
// invalidate the value/filter/cache chain without writing reactive state in render.
/** @internal Shared implementation for Select and AutoComplete's combobox. */
export const SelectEngine = defineComponent({
  name: 'ApolloSelectEngine',
  inheritAttrs: false,
  props: {
    ...selectProps,
    componentConfig: { type: Object as PropType<SelectEngineComponentConfig>, default: undefined },
    mode: { type: String as PropType<InternalSelectMode>, default: undefined },
    backfill: { type: Boolean, default: undefined },
    optionChildren: { type: Array as PropType<DefaultOptionType[]>, default: () => [] },
  },
  slots: Object as SlotsType<SelectSlots>,
  emits: selectEmits,
  setup(props, { slots, emit, attrs, expose }) {
    /**
     * ⚠️ **不在 setup 解构 `attrs`**。
     *
     * `useAttrs()` 返回的是普通对象（由父级 render 原地打补丁），setup 期解构出来的
     * `restAttrs` 是一份**快照** —— 父级只改 `aria-*` / `data-*` / `tabindex` /
     * 原生监听器时，重渲染读到的还是首帧那一份（Issue #4.2）。
     * 解构移到渲染函数里（见下方 `...restAttrs`）。
     */
    const selectConfig = useComponentConfig<SelectConfig>('select');
    const componentConfig = computed(() => props.componentConfig ?? selectConfig);
    const config = useConfigContext();
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('select'));
    const rootPrefixCls = computed(() => config.getPrefixCls());

    const activeValue = ref<string | null>(null);
    const multiple = computed(() => props.mode === 'multiple' || props.mode === 'tags');
    const defaultId = useId();
    const mergedId = computed(() => props.id ?? defaultId);

    // ------------------------ deprecated 告警 ------------------------
    const warning = useDevWarning('Select');
    for (const [oldName, newName] of DEPRECATIONS) {
      if ((props as unknown as Record<string, unknown>)[oldName] !== undefined) {
        warning(false, `\`${oldName}\` is deprecated. Please use \`${newName}\` instead.`);
      }
    }
    if (props.showArrow !== undefined) {
      warning(
        false,
        '`showArrow` is deprecated which will be removed in next major version. It will be a default behavior, you can hide it with `showArrow: false` or an empty `#suffixIcon` slot.',
      );
    }
    if (props.maxCount !== undefined && !multiple.value) {
      warning(false, '`maxCount` only works with mode `multiple` or `tags`');
    }

    // --------------------------- 外观 ---------------------------
    const { variant, enableVariantCls } = useVariant({
      component: props.componentConfig?.componentName ?? 'select',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const formItem = useFormItemInputContext();
    const mergedStatus = computed(() => getMergedStatus(formItem.value.status, props.status));
    // ⚠️ 传 getter：`useDisabled` 支持 `MaybeRefOrGetter`，传裸值会让
    //    「父级切换 disabled」永远读不到新值（Issue #4.1）。
    const mergedDisabled = useDisabled(() => props.disabled);
    const directionCtx = useDirection();
    const mergedDirection = computed<'ltr' | 'rtl'>(
      () => props.direction ?? directionCtx.value ?? 'ltr',
    );
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => mergedDirection.value,
    );
    const mergedSize = useSize<SizeType | undefined>(
      (ctx) => props.size ?? compactSize.value ?? ctx,
    );

    const selectTheme = useSelectTheme();
    const listHeight = computed(() => props.listHeight ?? 256);
    const listItemHeight = computed(() => props.listItemHeight ?? selectTheme.optionHeight.value);

    const readSlot = (
      name:
        | 'prefix'
        | 'loadingIcon'
        | 'searchIcon'
        | 'clearIcon'
        | 'removeIcon'
        | 'notFoundContent'
        | 'placeholder',
    ): VNodeChild => {
      const nodes = slots[name]?.();
      return isEmptyVNode(nodes) ? null : nodes;
    };

    // --------------------------- 搜索配置 ---------------------------
    // Search algorithms stay in configuration; state and notifications use Vue models/emits.
    const showSearchProp = computed(() => props.showSearch ?? componentConfig.value.showSearch);
    const searchTuple = computed(() =>
      resolveSearchConfig(
        showSearchProp.value,
        {
          filterOption: props.filterOption,
          searchValue: props.searchValue,
          optionFilterProp: props.optionFilterProp,
          filterSort: props.filterSort,
          autoClearSearchValue: props.autoClearSearchValue,
        },
        props.mode,
      ),
    );
    const mergedShowSearch = computed(() => searchTuple.value[0]);
    const searchConfig = computed(() => searchTuple.value[1]);
    const normalizedOptionFilterProp = computed<string[]>(() => {
      const raw = searchConfig.value.optionFilterProp ?? props.optionFilterProp;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : [raw];
    });

    const [innerSearch, syncSearchValue] = useControlledValue<string>({
      defaultValue: () => searchConfig.value.searchValue ?? '',
      getValue: () => searchConfig.value.searchValue,
      onChange: () => undefined,
    });
    const setSearchValue = (value: string): void => {
      syncSearchValue(value);
      emit('update:searchValue', value);
    };
    // ⚠️ 非受控时读 `innerSearch`（受控时 `getValue()` 恒有值，与 rc 的
    //    `useControlledState` 同语义）—— 不能写成 `searchConfig.searchValue ?? ''`，
    //    那样输入永远读不到内部状态。
    const mergedSearchValue = computed(() => innerSearch.value || '');

    // --------------------------- options ---------------------------
    const childrenAsData = computed(() => !props.options);
    const mergedFieldNames = computed<ResolvedFieldNames>(() =>
      fillFieldNames(props.fieldNames, childrenAsData.value),
    );
    const parsed = computed(() =>
      parseOptions(
        props.options,
        childrenAsData.value,
        props.optionChildren,
        mergedFieldNames.value,
        normalizedOptionFilterProp.value,
        props.optionLabelProp,
      ),
    );

    // ----------------------------- 值 -----------------------------
    const [innerValue, setInnerValue] = useControlledValue<SelectValue>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
      onChange: () => undefined,
    });

    const convert2LabelValues = (draft: unknown): LabelInValueType[] =>
      toArray(draft as unknown[]).map((val) => {
        let rawValue: RawValueType | undefined;
        let rawLabel: unknown;
        if (val === null || typeof val !== 'object') {
          rawValue = val as RawValueType;
        } else {
          const labeled = val as LabelInValueType;
          rawLabel = labeled.label;
          rawValue = labeled.value;
        }
        const option = parsed.value.valueOptions.get(rawValue as RawValueType);
        let disabled: boolean | undefined;
        let title: string | undefined;
        if (option) {
          if (rawLabel === undefined) {
            rawLabel = option[props.optionLabelProp ?? mergedFieldNames.value.label];
          }
          disabled = option.disabled;
          title = option.title as string | undefined;
        }
        return {
          label: rawLabel,
          value: rawValue as RawValueType,
          key: rawValue as RawValueType,
          disabled,
          title,
        };
      });

    const rawLabeledValues = computed<LabelInValueType[]>(() => {
      const raw = multiple.value && innerValue.value === null ? [] : innerValue.value;
      const values = convert2LabelValues(raw);
      if (props.mode === 'combobox' && isComboNoValue(values[0]?.value)) return [];
      return values;
    });

    const [mergedValues, getMixedOption] = useCache(
      rawLabeledValues,
      computed(() => parsed.value.valueOptions),
    );

    const getDisplayValues = (): DisplayValueType[] => {
      if (!props.mode && mergedValues.value.length === 1) {
        const first = mergedValues.value[0];
        if (first?.value === null && (first?.label === null || first?.label === undefined)) {
          return [];
        }
      }
      return mergedValues.value.map((item) => ({
        ...item,
        label: slots.labelRender ? slots.labelRender(item) : (item.label ?? item.value),
      }));
    };

    const rawValues = computed(
      () =>
        new Set(
          mergedValues.value.map((v) => v.value).filter((v): v is RawValueType => v !== undefined),
        ),
    );

    watch(
      () => mergedValues.value,
      () => {
        if (props.mode === 'combobox') {
          activeValue.value = null;
          const strValue = mergedValues.value[0]?.value;
          syncSearchValue(hasValue(strValue) ? String(strValue) : '');
        }
      },
    );

    // ------------------------ 过滤 / 展示选项 ------------------------
    const createTagOption = (val: RawValueType, label?: unknown): DefaultOptionType => ({
      [mergedFieldNames.value.value]: val,
      [mergedFieldNames.value.label]: label ?? val,
    });

    const filledTagOptions = computed<DefaultOptionType[]>(() => {
      if (props.mode !== 'tags') return parsed.value.options;
      const clone = [...parsed.value.options];
      [...mergedValues.value]
        .sort((a, b) => (String(a.value) < String(b.value) ? -1 : 1))
        .forEach((item) => {
          if (item.value !== undefined && !parsed.value.valueOptions.has(item.value)) {
            clone.push(createTagOption(item.value, item.label));
          }
        });
      return clone;
    });

    const filteredOptions = computed(() =>
      filterOptions(
        filledTagOptions.value,
        mergedFieldNames.value,
        mergedSearchValue.value,
        searchConfig.value.filterOption,
        normalizedOptionFilterProp.value,
      ),
    );

    const filledSearchOptions = computed<DefaultOptionType[]>(() => {
      const hasItemMatchingSearch = (item: DefaultOptionType): boolean => {
        if (normalizedOptionFilterProp.value.length) {
          return normalizedOptionFilterProp.value.some(
            (prop) => item?.[prop] === mergedSearchValue.value,
          );
        }
        return item?.value === mergedSearchValue.value;
      };
      if (
        props.mode !== 'tags' ||
        !mergedSearchValue.value ||
        filteredOptions.value.some(hasItemMatchingSearch)
      ) {
        return filteredOptions.value;
      }
      if (
        filteredOptions.value.some(
          (item) => item[mergedFieldNames.value.value] === mergedSearchValue.value,
        )
      ) {
        return filteredOptions.value;
      }
      if (parsed.value.valueOptions.get(mergedSearchValue.value)?.disabled) {
        return filteredOptions.value;
      }
      return [createTagOption(mergedSearchValue.value), ...filteredOptions.value];
    });

    const sorter = (inputOptions: DefaultOptionType[]): DefaultOptionType[] => {
      const sortFn = searchConfig.value.filterSort;
      if (!sortFn) return inputOptions;
      return [...inputOptions]
        .sort((a, b) => sortFn(a, b, { searchValue: mergedSearchValue.value }))
        .map((item) =>
          Array.isArray(item[mergedFieldNames.value.options])
            ? {
                ...item,
                [mergedFieldNames.value.options]: sorter(
                  item[mergedFieldNames.value.options] as DefaultOptionType[],
                ),
              }
            : item,
        );
    };

    const displayOptions = computed(() =>
      flattenOptions(sorter(filledSearchOptions.value), {
        fieldNames: mergedFieldNames.value,
        childrenAsData: childrenAsData.value,
      }),
    );

    // ----------------------------- 事件 -----------------------------
    const triggerChange = (values: LabelInValueType[]): void => {
      const labeledValues = convert2LabelValues(values);
      const changed =
        labeledValues.length !== mergedValues.value.length ||
        labeledValues.some((newVal, index) => mergedValues.value[index]?.value !== newVal?.value);
      setInnerValue((multiple.value ? labeledValues : labeledValues[0]) as unknown as SelectValue);
      if (!changed) return;
      const returnValues = props.labelInValue
        ? labeledValues.map(({ label, value }) => ({ label, value }))
        : labeledValues.map((v) => v.value);
      const rawOptions = labeledValues.map(
        (v) => (getMixedOption(v.value as RawValueType) ?? {}) as DefaultOptionType,
      );
      const outValue = multiple.value ? returnValues : returnValues[0];
      const outOption = multiple.value ? rawOptions : rawOptions[0];
      emit('update:value', outValue as SelectValue);
      emit('change', outValue as SelectValue, outOption);
    };

    const triggerSelect = (
      val: RawValueType,
      selected: boolean,
      type?: 'add' | 'remove' | 'clear',
    ): void => {
      const option = (getMixedOption(val) ?? {}) as DefaultOptionType;
      const wrapped = props.labelInValue
        ? { label: option[mergedFieldNames.value.label], value: val }
        : val;
      if (selected) {
        emit('select', wrapped, option);
      } else if (type !== 'clear') {
        emit('deselect', wrapped, option);
      }
    };

    const onInternalSelect = (val: RawValueType, info: { selected: boolean }): void => {
      const mergedSelect = multiple.value ? info.selected : true;
      const cloneValues: LabelInValueType[] = mergedSelect
        ? multiple.value
          ? [...mergedValues.value, { value: val } as LabelInValueType]
          : [{ value: val } as LabelInValueType]
        : mergedValues.value.filter((v) => v.value !== val);
      triggerChange(cloneValues);
      triggerSelect(val, Boolean(mergedSelect));
      if (props.mode === 'combobox') {
        activeValue.value = null;
        setSearchValue(String(val));
      } else if (!multiple.value || searchConfig.value.autoClearSearchValue) {
        setSearchValue('');
        activeValue.value = '';
      }
    };

    const onDisplayValuesChange = (
      nextValues: DisplayValueType[],
      info: { type: 'add' | 'remove' | 'clear'; values: DisplayValueType[] },
    ): void => {
      triggerChange(nextValues as unknown as LabelInValueType[]);
      if (info.type === 'remove' || info.type === 'clear') {
        info.values.forEach((item) => {
          if (item.value !== undefined) triggerSelect(item.value, false, info.type);
        });
      }
    };

    const onInternalSearch = (
      searchText: string,
      info: { source: 'typing' | 'effect' | 'submit' | 'blur' },
    ): void => {
      setSearchValue(searchText);
      activeValue.value = null;

      if (info.source === 'submit') {
        const formatted = (searchText || '').trim();
        if (!formatted) return;
        if (parsed.value.valueOptions.get(formatted)?.disabled) {
          setSearchValue('');
          return;
        }
        if (
          rawValues.value.has(formatted) ||
          (props.maxCount !== undefined && rawValues.value.size >= props.maxCount)
        ) {
          setSearchValue('');
          return;
        }
        const newRawValues = [...rawValues.value, formatted];
        triggerChange(newRawValues.map((v) => ({ value: v }) as LabelInValueType));
        triggerSelect(formatted, true);
        setSearchValue('');
        return;
      }
      if (info.source !== 'blur') {
        if (props.mode === 'combobox') {
          triggerChange([{ value: searchText } as LabelInValueType]);
        }
        emit('search', searchText);
      }
    };

    const onInternalSearchSplit = (words: string[]): void => {
      const patchValues: RawValueType[] =
        props.mode === 'tags'
          ? (words as RawValueType[]).filter((val) => !parsed.value.valueOptions.get(val)?.disabled)
          : words
              .map((word) => parsed.value.labelOptions.get(word)?.value as RawValueType | undefined)
              .filter((val): val is RawValueType => val !== undefined);
      const additions = [...new Set(patchValues)].filter((value) => !rawValues.value.has(value));
      const available =
        props.maxCount === undefined
          ? additions
          : additions.slice(0, Math.max(0, props.maxCount - rawValues.value.size));
      const newRawValues = [...rawValues.value, ...available];
      triggerChange(newRawValues.map((v) => ({ value: v }) as LabelInValueType));
      available.forEach((v) => {
        triggerSelect(v, true);
      });
    };

    // --------------------------- 无障碍 ---------------------------
    const accessibilityIndex = ref(0);
    const onActiveValue = (
      active: RawValueType | null,
      index: number,
      info?: { source?: 'keyboard' | 'mouse' },
    ): void => {
      accessibilityIndex.value = index;
      if (props.mode === 'combobox' && props.backfill && info?.source === 'keyboard') {
        activeValue.value = active === null ? null : String(active);
      }
    };
    watch([() => props.backfill, () => props.mode, mergedDisabled], () => {
      activeValue.value = null;
    });
    const mergedDefaultActiveFirstOption = computed(() =>
      props.defaultActiveFirstOption !== undefined
        ? props.defaultActiveFirstOption
        : props.mode !== 'combobox',
    );

    // ---------------------------- 图标（slot 优先） ----------------------------
    const showSuffixIcon = computed(() => (props.showArrow !== undefined ? props.showArrow : true));
    const getSuffixIconNode = (arrowIcon?: VNodeChild): VNodeChild => {
      const nodes: VNodeChild[] = [];
      if (showSuffixIcon.value !== false && !isEmptyVNode(arrowIcon)) {
        nodes.push(arrowIcon);
      }
      if (formItem.value.hasFeedback && formItem.value.feedbackIcon) {
        nodes.push(formItem.value.feedbackIcon);
      }
      return nodes.length ? nodes : null;
    };

    const getSuffixIcon = (
      state: NonNullable<Parameters<NonNullable<SelectSlots['suffixIcon']>>[0]>,
    ): VNodeChild => {
      if (props.loading && slots.loadingIcon) return getSuffixIconNode(readSlot('loadingIcon'));
      if (!props.loading && state.open && state.showSearch && slots.searchIcon)
        return getSuffixIconNode(readSlot('searchIcon'));
      if (slots.suffixIcon) return getSuffixIconNode(slots.suffixIcon(state));
      if (props.loading)
        return getSuffixIconNode(
          componentConfig.value.loadingIcon ?? h(LoadingOutlined, { spin: true }),
        );
      if (state.open && state.showSearch) return getSuffixIconNode(h(SearchOutlined));
      return getSuffixIconNode(componentConfig.value.suffixIcon ?? h(DownOutlined));
    };

    const getClearIcon = () =>
      slots.clearIcon
        ? readSlot('clearIcon')
        : (componentConfig.value.clearIcon ?? h(CloseCircleFilled));
    const getRemoveIcon = () =>
      slots.removeIcon
        ? readSlot('removeIcon')
        : (componentConfig.value.removeIcon ?? h(CloseOutlined));
    const getAllowClear = () => {
      const value = props.allowClear ?? componentConfig.value.allowClear;
      if (value === true) return { clearIcon: getClearIcon() };
      if (value && typeof value === 'object' && slots.clearIcon)
        return { ...value, clearIcon: getClearIcon() };
      return value;
    };
    const getNotFound = () => {
      if (slots.notFoundContent) return readSlot('notFoundContent');
      if (props.mode === 'combobox') return null;
      return config.renderEmpty ? config.renderEmpty('Select') : defaultRenderEmpty('Select');
    };

    // --------------------------- 语义槽 ---------------------------
    // ⚠️ antd 第四参 `{ popup: { _default: 'root' } }`（KNOWN-ISSUES §1.7b 已补）：
    //    字符串形态 `classNames.popup = 'x'` 归到 `popup.root`，不再产垃圾键。
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      typeof props,
      SelectSemanticClassNames,
      SelectSemanticStyles
    >(
      [() => componentConfig.value.classNames, () => props.classNames],
      [() => componentConfig.value.styles, () => props.styles],
      props,
      {
        popup: { _default: 'root' },
      },
    );

    const parentZIndex = inject(ZINDEX_KEY, null);
    const zIndex = useZIndex('SelectLike', () => {
      const custom =
        props.popupStyle?.zIndex ??
        props.dropdownStyle?.zIndex ??
        mergedStyles.value?.popup?.root?.zIndex;
      if (custom !== undefined) {
        const numeric = typeof custom === 'number' ? custom : Number(custom);
        return Number.isFinite(numeric) ? numeric : undefined;
      }
      return parentZIndex?.value === undefined ? selectTheme.zIndexPopup.value : undefined;
    });

    const cssVarCls = computed(() => `${prefixCls.value}-css-var`);

    /**
     * 根类名。
     *
     * 🚨 **必须是渲染期求值的函数，不能是 `computed`**：列表里含 `attrs.class`
     * （调用方原生 class），而 `useAttrs()` 的对象不参与依赖追踪 —— 包成 computed
     * 后只有「尺寸/方向/变体/状态变化」才会重算，**父级只改 class 时永远读到旧值**
     * （与 Issue #4.2 同一根因，故一并修）。
     */
    const getRootClassName = (): string | undefined =>
      normalizeClass([
        mergedSize.value === 'large' ? `${prefixCls.value}-lg` : '',
        mergedSize.value === 'small' ? `${prefixCls.value}-sm` : '',
        mergedDirection.value === 'rtl' ? `${prefixCls.value}-rtl` : '',
        enableVariantCls.value ? `${prefixCls.value}-${variant.value}` : '',
        formItem.value.isFormItemInput ? `${prefixCls.value}-in-form-item` : '',
        getStatusClassNames(prefixCls.value, mergedStatus.value, formItem.value.hasFeedback),
        compactItemClassnames.value,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        componentConfig.value.className,
        attrs.class,
        cssVarCls.value,
        'css-var-root',
        // ⚠️ 不含 mergedClassNames.root —— BaseSelect 的根类里已有
        //    props.classNames?.root，这里再拼会双份（AutoComplete 期抓出）
      ]) || undefined;

    const mergedPopupClassName = computed(
      () =>
        [
          mergedClassNames.value?.popup?.root,
          props.popupClassName,
          props.dropdownClassName,
          mergedDirection.value === 'rtl' ? `${prefixCls.value}-dropdown-rtl` : '',
          cssVarCls.value,
          'css-var-root',
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    );

    const memoPlacement = computed<SelectCommonPlacement>(() => {
      if (props.placement !== undefined) return props.placement;
      return mergedDirection.value === 'rtl' ? 'bottomRight' : 'bottomLeft';
    });

    // --------------------------- context ---------------------------
    const virtual = computed(() => props.virtual ?? config.virtual);
    const popupMatchSelectWidth = computed(
      () =>
        props.popupMatchSelectWidth ??
        props.dropdownMatchSelectWidth ??
        (config.popupMatchSelectWidth as boolean | number | undefined),
    );

    provide(
      selectContextKey,
      computed<SelectContextValue>(() => ({
        flattenOptions: displayOptions.value,
        onActiveValue,
        defaultActiveFirstOption: mergedDefaultActiveFirstOption.value,
        onSelect: onInternalSelect,
        rawValues: rawValues.value,
        fieldNames: mergedFieldNames.value,
        virtual: virtual.value !== false && popupMatchSelectWidth.value !== false,
        direction: mergedDirection.value,
        listHeight: listHeight.value,
        listItemHeight: listItemHeight.value,
        childrenAsData: childrenAsData.value,
        maxCount: multiple.value ? props.maxCount : undefined,
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
      })),
    );

    const baseSelectRef = shallowRef<{
      focus: (options?: FocusOptions) => void;
      blur: () => void;
      scrollTo: (arg?: ScrollToArg) => void;
      nativeElement: () => HTMLElement | null;
    } | null>(null);

    expose({
      focus: (options?: FocusOptions) => baseSelectRef.value?.focus(options),
      blur: () => baseSelectRef.value?.blur(),
      scrollTo: (arg?: ScrollToArg) => baseSelectRef.value?.scrollTo(arg),
      get nativeElement(): HTMLElement | null {
        return baseSelectRef.value?.nativeElement() ?? null;
      },
    });

    return () => {
      // ⚠️ 在这里（渲染期）解构 —— 见 setup 顶部关于「setup 解构即快照」的说明。
      //    `aria-label` / `aria-labelledby` 单独走 props（antd 只把它们放在
      //    combobox input 上，不随 attrs 扩散）。
      const {
        class: _class,
        style: _style,
        tabindex: _tabindex,
        'aria-label': _ariaLabel,
        'aria-labelledby': _ariaLabelledby,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _class;
      void _style;
      void _tabindex;
      void _ariaLabel;
      void _ariaLabelledby;
      return h(
        BaseSelect,
        {
          ...restAttrs,
          ref: baseSelectRef,
          prefixCls: prefixCls.value,
          id: mergedId.value,
          className: getRootClassName(),
          // 根 style 是 Vue 原生 attrs（位置与原先的语义 root 之后：调用方最后胜出）
          style: [
            selectTheme.style.value,
            componentConfig.value.style,
            mergedStyles.value?.root,
            normalizeStyle(attrs.style),
          ],
          mode: props.mode,
          multiple: multiple.value,
          showSearch: mergedShowSearch.value,
          searchValue: mergedSearchValue.value,
          autoClearSearchValue: searchConfig.value.autoClearSearchValue,
          displayValues: getDisplayValues(),
          activeValue: activeValue.value ?? undefined,
          activeDescendantId: `${mergedId.value}_list_${accessibilityIndex.value}`,
          disabled: mergedDisabled.value,
          loading: props.loading,
          open: props.open,
          defaultOpen: props.defaultOpen,
          notFoundContent: getNotFound(),
          placeholder: slots.placeholder ? readSlot('placeholder') : props.placeholder,
          maxLength: props.maxLength,
          tabIndex:
            props.tabIndex ??
            (typeof attrs.tabindex === 'string' || typeof attrs.tabindex === 'number'
              ? Number(attrs.tabindex)
              : undefined),
          // ⚠️ `autoFocus` 被声明成 prop 之后就不再进 `attrs` ⇒ 必须显式转发，
          //    否则 BaseSelect → Selector → SearchInput 这条链永远收不到（Issue #4.6）。
          autoFocus: props.autoFocus,
          title: props.title,
          role: props.role,
          allowClear: getAllowClear(),
          clearIcon: getClearIcon(),
          prefix: readSlot('prefix'),
          suffixIcon: getSuffixIcon,
          removeIcon: getRemoveIcon(),
          tokenSeparators: props.tokenSeparators,
          tagRender: multiple.value ? slots.tagRender : undefined,
          maxTagCount: props.maxTagCount,
          maxTagTextLength: props.maxTagTextLength,
          maxTagPlaceholder: slots.maxTagPlaceholder
            ? (omitted: DisplayValueType[]) =>
                slots.maxTagPlaceholder?.({
                  omittedValues: omitted,
                })
            : undefined,
          maxCount: multiple.value ? props.maxCount : undefined,
          emptyOptions: displayOptions.value.length === 0,
          zIndex: zIndex.value,
          placement: memoPlacement.value,
          direction: mergedDirection.value,
          popupMatchSelectWidth: popupMatchSelectWidth.value ?? true,
          // antd：`getPopupContainer || getContextPopupContainer`（`select/index.js:259`）
          // —— 局部优先、**回退到 ConfigProvider 的全局设置**（Issue #4.7）。
          getPopupContainer: props.getPopupContainer ?? config.getPopupContainer,
          transitionName: props.transitionName ?? `${rootPrefixCls.value}-slide-up`,
          popupClassName: mergedPopupClassName.value,
          popupStyle: {
            ...selectTheme.style.value,
            ...(mergedStyles.value?.popup?.root ?? {}),
            ...(props.popupStyle ?? props.dropdownStyle ?? {}),
          },
          popupRender: slots.popupRender
            ? (menu: VNodeChild) => slots.popupRender?.({ menu })
            : undefined,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          onSearch: onInternalSearch,
          onSearchSplit: onInternalSearchSplit,
          onDisplayValuesChange: onDisplayValuesChange,
          onActiveValueChange: onActiveValue,
          onOpenChange: (next: boolean) => {
            emit('openChange', next);
            emit('update:open', next);
          },
          onFocus: (event: FocusEvent) => {
            emit('focus', event);
          },
          onBlur: (event: FocusEvent) => {
            emit('blur', event);
          },
          onClear: () => {
            emit('clear');
          },
          onPopupScroll: (event: Event) => {
            emit('popupScroll', event);
          },
          onInputKeyDown: (event: KeyboardEvent) => {
            emit('inputKeyDown', event);
          },
          // ⚠️ 可访问名**不随 attrs 扩散**：antd 只把它放在 combobox input 上
          //    （实测 antd 6.6.4 SSR）。所以这里把它从 attrs 里摘出来单独传，
          //    其余 attrs 照旧（pagination 的尺寸切换器需要它，见 SearchInput 的说明）。
          ariaLabel: (attrs as Record<string, unknown>)['aria-label'] as string | undefined,
          ariaLabelledby: (attrs as Record<string, unknown>)['aria-labelledby'] as
            | string
            | undefined,
        },
        {
          optionRender: slots.optionRender,
          menuItemSelectedIcon: (info: {
            value?: RawValueType;
            disabled?: boolean;
            isSelected?: boolean;
          }) =>
            slots.menuItemSelectedIcon
              ? slots.menuItemSelectedIcon(info)
              : info.isSelected
                ? (componentConfig.value.menuItemSelectedIcon ??
                  (multiple.value ? h(CheckOutlined) : undefined))
                : undefined,
        },
      );
    };
  },
});

/** Default option VNodes are normalized at this render boundary. */
export const Select = defineComponent({
  name: 'ASelect',
  inheritAttrs: false,
  props: selectProps,
  slots: Object as SlotsType<SelectSlots>,
  emits: selectEmits,
  expose: ['focus', 'blur', 'scrollTo', 'nativeElement'],
  setup(props, { attrs, slots, emit }) {
    const engine = shallowRef<SelectRef | null>(null);
    const noOptionChildren: DefaultOptionType[] = [];
    const renderSelect = () =>
      h(
        SelectEngine,
        {
          ...attrs,
          ...props,
          componentConfig: undefined,
          ref: engine,
          optionChildren:
            props.options === undefined
              ? convertChildrenToData(slots.default?.())
              : noOptionChildren,
          onChange: (
            value: SelectValue,
            option: DefaultOptionType | DefaultOptionType[] | undefined,
          ) => emit('change', value, option),
          'onUpdate:value': (value: SelectValue) => emit('update:value', value),
          onSelect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
            emit('select', value, option),
          onDeselect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
            emit('deselect', value, option),
          onSearch: (value: string) => emit('search', value),
          'onUpdate:searchValue': (value: string) => emit('update:searchValue', value),
          onOpenChange: (open: boolean) => emit('openChange', open),
          'onUpdate:open': (open: boolean) => emit('update:open', open),
          onFocus: (event: FocusEvent) => emit('focus', event),
          onBlur: (event: FocusEvent) => emit('blur', event),
          onClear: () => emit('clear'),
          onPopupScroll: (event: Event) => emit('popupScroll', event),
          onInputKeyDown: (event: KeyboardEvent) => emit('inputKeyDown', event),
        },
        slots,
      );
    return {
      focus: (options?: FocusOptions) => engine.value?.focus(options),
      blur: () => engine.value?.blur(),
      scrollTo: (arg?: ScrollToArg) => engine.value?.scrollTo(arg),
      nativeElement: computed(() => engine.value?.nativeElement ?? null),
      renderSelect,
    };
  },
  render() {
    return this.renderSelect();
  },
});

export default Select;
