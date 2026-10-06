/**
 * Select —— antd 6.6.4 `components/select/index.tsx`（518 行）的 Vue 版。
 *
 * ── 分工 ────────────────────────────────────────────────────────────────────
 *
 * 本文件 = **antd 壳 + rc-select 的 `Select.js`（值语义层）**；
 * 交互外壳在 `engine/BaseSelect.ts`，DOM 在 `engine/Selector.ts` / `OptionList.ts`。
 *
 * ── antd 壳在这文件里做的事（对拍 `index.tsx`）───────────────────────────────
 *
 *  1. prefixCls / rootPrefixCls（**动效名是 rootPrefixCls 前缀** ⇒ `apollo-slide-up`）
 *  2. `listHeight = 256` / `listItemHeight = controlHeight`（rc 默认是 200 / 20）
 *  3. size → `-lg` / `-sm`；variant → `-outlined` / `-filled` / …
 *  4. status → `-status-*` / `-in-form-item`
 *  5. disabled（DisabledContext ?? prop）
 *  6. direction → `-rtl`；placement 默认 bottomLeft（rtl ⇒ bottomRight）
 *  7. mode：`'combobox'` 被吞（只有 SECRET 常量才真走 combobox）
 *  8. notFoundContent（combobox ⇒ null；否则 `renderEmpty('Select')`）
 *  9. 图标（down / search / loading / close-circle / check / close）
 * 10. popupClassName 合并顺序 + zIndex
 * 11. `maxCount` / `tagRender` 只在 multiple / tags 下发
 * 12. 7 个 deprecated 告警
 */

import {
  CheckOutlined,
  CloseCircleFilled,
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
  SearchOutlined,
} from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { isEmptyVNode, useControlledValue, useDevWarning, useId } from '@apollo-design/utils';
import type { CSSProperties, PropType } from 'vue';
import { computed, defineComponent, h, provide, type Ref, ref, shallowRef, watch } from 'vue';
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
  LabelInValueType,
  OptionRenderFn,
  RawValueType,
  ScrollToArg,
  SearchConfig,
  SelectCommonPlacement,
  SelectProps,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectValue,
  SelectVariant,
} from './interface';
import { selectTokenValues } from './style/token';

/** antd 的 7 个 deprecated（`index.tsx` 的 `deprecatedProps`）。 */
const DEPRECATIONS: Array<[string, string]> = [
  ['dropdownMatchSelectWidth', 'popupMatchSelectWidth'],
  ['dropdownStyle', 'styles.popup.root'],
  ['dropdownClassName', 'classNames.popup.root'],
  ['popupClassName', 'classNames.popup.root'],
  ['onDropdownVisibleChange', 'onOpenChange'],
  ['bordered', 'variant'],
];

export const Select = defineComponent({
  name: 'ASelect',
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    prefixCls: { type: String, default: undefined },
    value: { type: null as unknown as PropType<SelectValue>, default: undefined },
    defaultValue: { type: null as unknown as PropType<SelectValue>, default: undefined },
    labelInValue: { type: Boolean, default: undefined },
    optionLabelProp: { type: String, default: undefined },
    fieldNames: { type: Object as PropType<SelectProps['fieldNames']>, default: undefined },
    mode: { type: String as PropType<InternalSelectMode | undefined>, default: undefined },
    options: { type: Array as PropType<DefaultOptionType[]>, default: undefined },
    listHeight: { type: Number, default: undefined },
    listItemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    defaultActiveFirstOption: { type: Boolean, default: undefined },
    showSearch: { type: [Boolean, Object] as PropType<boolean | object>, default: undefined },
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
    allowClear: { type: [Boolean, Object] as PropType<boolean | object>, default: undefined },
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
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
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
    // ---- 事件（prop 形态；emits 同名同发）----
    onChange: {
      type: Function as PropType<(value: SelectValue, option: unknown) => void>,
      default: undefined,
    },
    onSelect: {
      type: Function as PropType<(value: RawValueType, option: DefaultOptionType) => void>,
      default: undefined,
    },
    onDeselect: {
      type: Function as PropType<(value: RawValueType, option: DefaultOptionType) => void>,
      default: undefined,
    },
    onSearch: { type: Function as PropType<(value: string) => void>, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onDropdownVisibleChange: {
      type: Function as PropType<(open: boolean) => void>,
      default: undefined,
    },
    onFocus: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onPopupScroll: { type: Function as PropType<(event: Event) => void>, default: undefined },
    onInputKeyDown: {
      type: Function as PropType<(event: KeyboardEvent) => void>,
      default: undefined,
    },
  },
  /**
   * ⚠️ 只声明 `update:*`（供 `v-model:value` / `v-model:open`），**不**声明
   * `change` / `select` / `search` … —— antd 的这些是 props 形态回调，声明成
   * emits 会被 Vue 从 attrs 摘掉，且 `emit()` 会自动调用同名 prop ⇒ 双触发
   * （PITFALLS 35 / CHECKLIST #78）。它们与 v-model **同时**发出（规则 C11）。
   */
  emits: ['update:value', 'update:open'],
  setup(props, { slots, emit, attrs, expose }) {
    // aria-label / aria-labelledby 单独走 props（见下面 h(BaseSelect) 处的说明）
    const {
      'aria-label': ariaLabelAttr,
      'aria-labelledby': ariaLabelledbyAttr,
      ...restAttrs
    } = attrs as Record<string, unknown>;
    void ariaLabelAttr;
    void ariaLabelledbyAttr;
    const { getPrefixCls } = useComponentConfig('select');
    const config = useConfigContext();
    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('select'));
    const rootPrefixCls = getPrefixCls();

    const multiple = computed(() => props.mode === 'multiple' || props.mode === 'tags');
    const mergedId = useId(props.id);

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
    const mergedSize = useSize<SizeType | undefined>((ctx) => props.size ?? ctx);
    const { variant, enableVariantCls } = useVariant({
      component: 'select',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const formItem = useFormItemInputContext();
    const mergedStatus = computed(() => getMergedStatus(formItem.value.status, props.status));
    const mergedDisabled = useDisabled(props.disabled);
    const directionCtx = useDirection();
    const mergedDirection = computed<'ltr' | 'rtl'>(
      () => props.direction ?? directionCtx.value ?? 'ltr',
    );
    const { compactItemClassnames } = useCompactItemContext(prefixCls, () => mergedDirection.value);

    const tokenValues = selectTokenValues();
    const listHeight = computed(() => props.listHeight ?? 256);
    const listItemHeight = computed(
      () => props.listItemHeight ?? (Number.parseInt(String(tokenValues.optionHeight), 10) || 32),
    );

    const componentConfig = computed(
      () => (config.components?.select ?? {}) as Record<string, unknown>,
    );

    // ---------------- slot：ReactNode / render prop 的唯一入口（规则 C8-R2）----------------
    /**
     * 读一个 slot；「提供了但渲染为空」归一为 null（语义：隐藏），「未提供」为
     * undefined。判空必须走 `isEmptyVNode` —— Vue 会把 slot 返回的 null / 空数组
     * 归一成 comment vnode，不能比 `null` / `length`（is.ts §空渲染判据）。
     */
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? null : nodes;
    };

    // --------------------------- 搜索配置 ---------------------------
    // antd：`showSearch ?? contextShowSearch` 之后才交给 rc 做模式推导。
    const showSearchProp = computed(
      () =>
        (props.showSearch ?? componentConfig.value.showSearch) as
          | boolean
          | (SearchConfig<DefaultOptionType> & { searchIcon?: unknown })
          | undefined,
    );
    const searchTuple = computed(() =>
      resolveSearchConfig(
        showSearchProp.value,
        {
          filterOption: props.filterOption,
          searchValue: props.searchValue,
          optionFilterProp: props.optionFilterProp,
          filterSort: props.filterSort,
          onSearch: props.onSearch,
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

    const [innerSearch, setSearchValue] = useControlledValue<string>({
      defaultValue: () => searchConfig.value.searchValue ?? '',
      getValue: () => searchConfig.value.searchValue,
      onChange: () => undefined,
    });
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
        childrenAsData.value ? convertChildrenToData(slots.default?.() as never) : [],
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
      rawLabeledValues as unknown as Ref<LabelInValueType[]>,
      computed(() => parsed.value.valueOptions),
    );

    const displayValues = computed<DisplayValueType[]>(() => {
      if (!props.mode && mergedValues.value.length === 1) {
        const first = mergedValues.value[0];
        if (first?.value === null && (first?.label === null || first?.label === undefined)) {
          return [];
        }
      }
      const labelRenderFn = slots.labelRender
        ? (item: DisplayValueType) => (slots.labelRender as (p: DisplayValueType) => unknown)(item)
        : undefined;
      return mergedValues.value.map((item) => ({
        ...item,
        label: (labelRenderFn ? labelRenderFn(item) : item.label) ?? item.value,
      })) as DisplayValueType[];
    });

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
          const strValue = mergedValues.value[0]?.value;
          setSearchValue(hasValue(strValue) ? String(strValue) : '');
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
      props.onChange?.(outValue as SelectValue, outOption);
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
        props.onSelect?.(wrapped as RawValueType, option);
      } else if (props.onDeselect && type !== 'clear') {
        props.onDeselect(wrapped as RawValueType, option);
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
        activeValue.value = '';
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
        const newRawValues = Array.from(new Set([...rawValues.value, formatted]));
        triggerChange(newRawValues.map((v) => ({ value: v }) as LabelInValueType));
        triggerSelect(formatted, true);
        setSearchValue('');
        return;
      }
      if (info.source !== 'blur') {
        if (props.mode === 'combobox') {
          triggerChange([{ value: searchText } as LabelInValueType]);
        }
        // antd：`showSearch.onSearch`（config 形态）与平铺 `onSearch` 是同一条
        // 搜索事件的两条通道（resolveSearchConfig 已把 config 并入）——
        // AutoComplete 的候选驱动全走 config 通道（AutoComplete 期抓出）。
        (props.onSearch ?? searchConfig.value.onSearch)?.(searchText);
      }
    };

    const onInternalSearchSplit = (words: string[]): void => {
      const patchValues: RawValueType[] =
        props.mode === 'tags'
          ? (words as RawValueType[]).filter((val) => !parsed.value.valueOptions.get(val)?.disabled)
          : words
              .map((word) => parsed.value.labelOptions.get(word)?.value as RawValueType | undefined)
              .filter((val): val is RawValueType => val !== undefined);
      const newRawValues = Array.from(new Set([...rawValues.value, ...patchValues]));
      triggerChange(newRawValues.map((v) => ({ value: v }) as LabelInValueType));
      newRawValues.forEach((v) => {
        triggerSelect(v, true);
      });
    };

    // --------------------------- 无障碍 ---------------------------
    const activeValue = ref<string | null>(null);
    const accessibilityIndex = ref(0);
    const onActiveValue = (
      active: RawValueType | null,
      index: number,
      info?: { source?: 'keyboard' | 'mouse' },
    ): void => {
      accessibilityIndex.value = index;
      // combobox 的 `backfill`：键盘激活项回填到输入框（v1 未接 backfill，仅记录）
      if (props.mode === 'combobox') {
        activeValue.value = active === null ? null : String(active);
      }
      void info;
    };
    const mergedDefaultActiveFirstOption = computed(() =>
      props.defaultActiveFirstOption !== undefined
        ? props.defaultActiveFirstOption
        : props.mode !== 'combobox',
    );

    // ---------------------------- 图标（slot 优先） ----------------------------
    const showSuffixIcon = computed(() => (props.showArrow !== undefined ? props.showArrow : true));
    const getSuffixIconNode = (arrowIcon?: unknown): unknown => {
      const nodes: unknown[] = [];
      if (showSuffixIcon.value !== false && arrowIcon !== undefined && arrowIcon !== null) {
        nodes.push(arrowIcon);
      }
      if (formItem.value.hasFeedback && formItem.value.feedbackIcon) {
        nodes.push(formItem.value.feedbackIcon);
      }
      return nodes.length ? nodes : null;
    };

    const mergedSuffixIcon = computed<unknown>(() => {
      if (props.loading) {
        return getSuffixIconNode(
          readSlot('loadingIcon') ??
            componentConfig.value.loadingIcon ??
            h(LoadingOutlined, { spin: true }),
        );
      }
      return (st: { open?: boolean; showSearch?: boolean }): unknown => {
        if (st.open && st.showSearch) {
          return getSuffixIconNode(
            (props.showSearch as { searchIcon?: unknown } | undefined)?.searchIcon ??
              (componentConfig.value.showSearch as { searchIcon?: unknown } | undefined)
                ?.searchIcon ??
              h(SearchOutlined),
          );
        }
        if (slots.suffixIcon) {
          return getSuffixIconNode(
            readSlot('suffixIcon') !== undefined
              ? readSlot('suffixIcon')
              : (slots.suffixIcon as (p: Record<string, unknown>) => unknown)({
                  open: Boolean(st.open),
                  showSearch: Boolean(st.showSearch),
                  searchValue: mergedSearchValue.value,
                  focused: false,
                  loading: props.loading,
                }),
          );
        }
        return getSuffixIconNode(componentConfig.value.suffixIcon ?? h(DownOutlined));
      };
    });

    const mergedClearIcon = computed<unknown>(
      () => readSlot('clearIcon') ?? componentConfig.value.clearIcon ?? h(CloseCircleFilled),
    );
    const mergedRemoveIcon = computed<unknown>(
      () => readSlot('removeIcon') ?? componentConfig.value.removeIcon ?? h(CloseOutlined),
    );
    const mergedItemIcon = computed<unknown>(() => {
      if (slots.menuItemSelectedIcon) {
        return (info: { value?: unknown; disabled?: boolean; isSelected?: boolean }) =>
          (slots.menuItemSelectedIcon as (p: typeof info) => unknown)(info);
      }
      return (
        componentConfig.value.menuItemSelectedIcon ?? (multiple.value ? h(CheckOutlined) : null)
      );
    });
    const mergedAllowClear = computed(() => {
      const final = props.allowClear ?? (componentConfig.value.allowClear as boolean | undefined);
      return final === true ? { clearIcon: mergedClearIcon.value } : final;
    });

    // ------------------------ notFoundContent ------------------------
    const mergedNotFound = computed<unknown>(() => {
      const fromSlot = readSlot('notFoundContent');
      if (fromSlot !== undefined) return fromSlot;
      if (props.mode === 'combobox') return null;
      return config.renderEmpty?.('Select') ?? defaultRenderEmpty('Select');
    });

    const zIndex = useZIndex('SelectLike', () => {
      const custom =
        (props.popupStyle?.zIndex as number | undefined) ??
        (props.dropdownStyle?.zIndex as number | undefined) ??
        (props.styles?.popup?.root?.zIndex as number | undefined);
      return custom;
    });

    // --------------------------- 语义槽 ---------------------------
    // ⚠️ antd 第四参 `{ popup: { _default: 'root' } }`（KNOWN-ISSUES §1.7b 已补）：
    //    字符串形态 `classNames.popup = 'x'` 归到 `popup.root`，不再产垃圾键。
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      SelectProps,
      SelectSemanticClassNames,
      SelectSemanticStyles
    >([() => props.classNames], [() => props.styles], {} as never, {
      popup: { _default: 'root' },
    });

    const cssVarCls = computed(() => `${prefixCls.value}-css-var`);

    const mergedRootClassName = computed(
      () =>
        [
          mergedSize.value === 'large' ? `${prefixCls.value}-lg` : '',
          mergedSize.value === 'small' ? `${prefixCls.value}-sm` : '',
          mergedDirection.value === 'rtl' ? `${prefixCls.value}-rtl` : '',
          enableVariantCls.value ? `${prefixCls.value}-${variant.value}` : '',
          formItem.value.isFormItemInput ? `${prefixCls.value}-in-form-item` : '',
          getStatusClassNames(prefixCls.value, mergedStatus.value, formItem.value.hasFeedback),
          compactItemClassnames.value,
          // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
          attrs.class as string | undefined,
          cssVarCls.value,
          'css-var-root',
          // ⚠️ 不含 mergedClassNames.root —— BaseSelect 的根类里已有
          //    props.classNames?.root，这里再拼会双份（AutoComplete 期抓出）
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    );

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
        // `as never`：optionRender 包装器的 slot 签名与 OptionRenderFn 结构兼容但
        // 字面参数不同（info 由调用方 OptionList 保证），不做无谓的字段重排。
        flattenOptions: displayOptions.value,
        onActiveValue,
        defaultActiveFirstOption: mergedDefaultActiveFirstOption.value,
        onSelect: onInternalSelect,
        menuItemSelectedIcon: mergedItemIcon.value,
        rawValues: rawValues.value,
        fieldNames: mergedFieldNames.value,
        virtual: virtual.value !== false && popupMatchSelectWidth.value !== false,
        direction: mergedDirection.value,
        listHeight: listHeight.value,
        listItemHeight: listItemHeight.value,
        childrenAsData: childrenAsData.value,
        maxCount: multiple.value ? props.maxCount : undefined,
        optionRender: slots.optionRender
          ? (...args: Parameters<OptionRenderFn>) =>
              (slots.optionRender as (...a: Parameters<OptionRenderFn>) => unknown)(...args)
          : undefined,
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

    return () =>
      h(
        BaseSelect,
        {
          ref: baseSelectRef as never,
          prefixCls: prefixCls.value,
          id: mergedId,
          className: mergedRootClassName.value,
          // 根 style 是 Vue 原生 attrs（位置与原先的语义 root 之后：调用方最后胜出）
          style: {
            ...(mergedStyles.value?.root ?? {}),
            ...((attrs.style as CSSProperties | undefined) ?? {}),
          },
          mode: props.mode,
          multiple: multiple.value,
          showSearch: mergedShowSearch.value,
          searchValue: mergedSearchValue.value,
          autoClearSearchValue: searchConfig.value.autoClearSearchValue,
          displayValues: displayValues.value,
          activeValue: activeValue.value ?? undefined,
          activeDescendantId: `${mergedId}_list_${accessibilityIndex.value}`,
          disabled: mergedDisabled.value,
          loading: props.loading,
          open: props.open,
          defaultOpen: props.defaultOpen,
          notFoundContent: mergedNotFound.value,
          placeholder: readSlot('placeholder') ?? props.placeholder,
          maxLength: props.maxLength,
          tabIndex: props.tabIndex,
          title: props.title,
          allowClear: mergedAllowClear.value as
            | boolean
            | { clearIcon?: unknown; label?: string }
            | undefined,
          clearIcon: mergedClearIcon.value,
          prefix: readSlot('prefix'),
          suffixIcon: mergedSuffixIcon.value,
          removeIcon: mergedRemoveIcon.value,
          tokenSeparators: props.tokenSeparators,
          tagRender: multiple.value
            ? slots.tagRender
              ? (info: never) => (slots.tagRender as (p: never) => unknown)(info)
              : undefined
            : undefined,
          maxTagCount: props.maxTagCount,
          maxTagTextLength: props.maxTagTextLength,
          maxTagPlaceholder: slots.maxTagPlaceholder
            ? (omitted: DisplayValueType[]) =>
                (slots.maxTagPlaceholder as (p: { omittedValues: DisplayValueType[] }) => unknown)({
                  omittedValues: omitted,
                })
            : undefined,
          maxCount: multiple.value ? props.maxCount : undefined,
          emptyOptions: displayOptions.value.length === 0,
          zIndex: zIndex.value,
          placement: memoPlacement.value,
          direction: mergedDirection.value,
          popupMatchSelectWidth: popupMatchSelectWidth.value ?? true,
          getPopupContainer: props.getPopupContainer,
          transitionName: props.transitionName ?? `${rootPrefixCls}-slide-up`,
          popupClassName: mergedPopupClassName.value,
          popupStyle: {
            ...(mergedStyles.value?.popup?.root ?? {}),
            ...(props.popupStyle ?? props.dropdownStyle ?? {}),
          },
          popupRender: slots.popupRender
            ? (menu: unknown) => (slots.popupRender as (p: { menu: unknown }) => unknown)({ menu })
            : undefined,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          onSearch: onInternalSearch,
          onSearchSplit: onInternalSearchSplit,
          onDisplayValuesChange: onDisplayValuesChange,
          onActiveValueChange: onActiveValue,
          onOpenChange: (next: boolean) => {
            props.onOpenChange?.(next);
            props.onDropdownVisibleChange?.(next);
            emit('update:open', next);
          },
          onFocus: (event: FocusEvent) => {
            props.onFocus?.(event);
          },
          onBlur: (event: FocusEvent) => {
            props.onBlur?.(event);
          },
          onClear: () => {
            props.onClear?.();
          },
          onPopupScroll: (event: Event) => {
            props.onPopupScroll?.(event);
          },
          onInputKeyDown: (event: KeyboardEvent) => {
            props.onInputKeyDown?.(event);
          },
          // ⚠️ 可访问名**不随 attrs 扩散**：antd 只把它放在 combobox input 上
          //    （实测 antd 6.6.4 SSR）。所以这里把它从 attrs 里摘出来单独传，
          //    其余 attrs 照旧（pagination 的尺寸切换器需要它，见 SearchInput 的说明）。
          ariaLabel: (attrs as Record<string, unknown>)['aria-label'] as string | undefined,
          ariaLabelledby: (attrs as Record<string, unknown>)['aria-labelledby'] as
            | string
            | undefined,
          ...restAttrs,
        } as never,
        {},
      );
  },
});

export default Select;
