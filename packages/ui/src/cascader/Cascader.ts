/**
 * Cascader —— antd `components/cascader/index.tsx`（527 行）的 Vue 版薄壳。
 *
 * 结构：BaseSelect（本仓 `select/engine/BaseSelect`，选择器外壳协议）+
 * `optionListRenderer` 注入本组件的多列面板（rc 的 `OptionList` prop 同构）。
 *
 * ── 关键判据（docs/analysis/cascader.md §3.6）───────────────────────────────
 * 1. 默认：placement=rtl?bottomRight:bottomLeft、allowClear、bordered→variant、
 *    trigger 类名含 `!customizePrefixCls && cascaderPrefixCls`。
 * 2. popup 类名：popupClassName||dropdownClassName → `-dropdown` → `-dropdown-rtl`
 *    → rootClassName → mergedClassNames.popup.root。
 * 3. `title` 不透传给 context（薄壳自用）；`onChange` payload 单选一维 / 多选二维。
 * 4. 语义槽：root/prefix/suffix/input/placeholder/content/item/itemContent/itemRemove
 *    + popup（`_default:'root'` 归并）——本仓 useMergeSemantic 无 popup 归并选项，
 *    popup.root 直通 classNames.popup（select 同款）。
 * 5. 键盘：BaseSelect 的 onInputKeyDown 回调驱动注入的 OptionList（optionListRef）。
 */

import { DownOutlined, LeftOutlined, LoadingOutlined, RightOutlined } from '@apollo-design/icons';
import { useControlledValue, useId } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, shallowRef, type VNodeChild } from 'vue';

import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import BaseSelect from '../select/engine/BaseSelect';
import type { SelectCommonPlacement } from '../select/interface';
import { useCompactItemContext } from '../space/Compact';
import { provideCascaderContext } from './context';
import { conductCheck } from './engine/tree';
import {
  computeSearchOptions,
  normalizeSearchConfig as normalizeSearchConfigFull,
  type SearchConfig,
} from './hooks/search';
import { computeDisplayValues, useOptions, useValues } from './hooks/values';
import RawOptionList from './OptionList';
import {
  type BaseOptionType,
  type DefaultOptionType,
  type FieldNames,
  fillFieldNames,
  formatStrategyValues,
  type RawValue,
  type ShowCheckedStrategy,
  toPathOptions,
  toRawValues,
  type ValueCell,
} from './utils';

type StyleLike = Record<string, string | number>;

const Cascader = defineComponent({
  name: 'ACascader',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    id: { type: String, default: undefined },
    options: { type: Array as PropType<DefaultOptionType[]>, default: undefined },
    value: { type: null as unknown as PropType<RawValue | RawValue[]>, default: undefined },
    defaultValue: {
      type: null as unknown as PropType<RawValue | RawValue[]>,
      default: undefined,
    },
    fieldNames: { type: Object as PropType<FieldNames>, default: undefined },
    changeOnSelect: { type: Boolean, default: undefined },
    multiple: { type: Boolean, default: false },
    checkable: { type: Boolean, default: undefined },
    showCheckedStrategy: { type: String as PropType<ShowCheckedStrategy>, default: 'SHOW_PARENT' },
    size: { type: String as PropType<'small' | 'middle' | 'large'>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: undefined },
    variant: { type: String as PropType<'outlined' | 'borderless' | 'filled'>, default: undefined },
    bordered: { type: Boolean, default: true },
    allowClear: {
      type: [Boolean, Object] as PropType<boolean | { clearIcon?: VNodeChild }>,
      default: true,
    },
    clearIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffixIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    expandIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    loadingIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    expandTrigger: { type: String as PropType<'click' | 'hover'>, default: undefined },
    loadData: {
      type: Function as PropType<(options: BaseOptionType[]) => void>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    placement: { type: String as PropType<SelectCommonPlacement>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
    showSearch: {
      type: [Boolean, Object] as PropType<boolean | (SearchConfig & { searchIcon?: VNodeChild })>,
      default: undefined,
    },
    searchValue: { type: String, default: undefined },
    autoClearSearchValue: { type: Boolean, default: undefined },
    placeholder: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    displayRender: {
      type: Function as PropType<
        (labels: unknown[], options: (BaseOptionType | null)[]) => unknown
      >,
      default: undefined,
    },
    optionRender: {
      type: Function as PropType<(option: BaseOptionType) => unknown>,
      default: undefined,
    },
    popupClassName: { type: String, default: undefined },
    dropdownClassName: { type: String, default: undefined },
    popupStyle: { type: Object as PropType<StyleLike>, default: undefined },
    popupMenuColumnStyle: { type: Object as PropType<StyleLike>, default: undefined },
    popupRender: { type: Function as PropType<(menu: unknown) => unknown>, default: undefined },
    popupMatchSelectWidth: { type: [Boolean, Number], default: false },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    status: { type: String as PropType<'error' | 'warning'>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<Record<string, unknown>>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<Record<string, unknown>>, default: undefined },
    maxTagCount: { type: Number, default: undefined },
    maxTagTextLength: { type: Number, default: undefined },
    // antd 的 maxTagPlaceholder 是 `ReactNode | ((omittedValues) => ReactNode)` ⇒ 两形态
    maxTagPlaceholder: {
      type: [String, Number, Object, Array, Function] as unknown as PropType<
        VNodeChild | ((omittedValues: unknown[]) => VNodeChild)
      >,
      default: undefined,
    },
    placeholder2: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  },
  emits: ['update:value', 'update:open', 'update:searchValue'],
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as {
      onChange?: (value: unknown, options: unknown) => void;
      onSearch?: (text: string) => void;
      onOpenChange?: (open: boolean) => void;
      onPopupVisibleChange?: (open: boolean) => void;
      onDropdownVisibleChange?: (open: boolean) => void;
      onPopupClick?: (e: MouseEvent) => void;
      onFocus?: (e: FocusEvent) => void;
      onBlur?: (e: FocusEvent) => void;
      onClear?: () => void;
    };

    const context = useComponentConfig('cascader');
    const { getPrefixCls } = context;
    const mergedId = useId(props.id);
    const contextSemantic = context as {
      classNames?: Record<string, unknown>;
      styles?: Record<string, unknown>;
      expandIcon?: VNodeChild;
      loadingIcon?: VNodeChild;
      clearIcon?: VNodeChild;
      removeIcon?: VNodeChild;
      suffixIcon?: VNodeChild;
      searchIcon?: VNodeChild;
      className?: string;
      style?: StyleLike;
    };
    const formItem = useFormItemInputContext();
    const disabledFromForm = useDisabled(() => props.disabled);

    const prefixCls = computed(() => getPrefixCls('cascader', props.prefixCls));
    const rootPrefixCls = computed(() => getPrefixCls());

    // ============================ Values ==============================
    const multiple = computed(() => props.multiple || props.checkable !== undefined);
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
    const mergedDisabled = disabledFromForm;

    // ============================ Context =============================
    // ⚠️ Vue 的 provide 必须在 setup **同步阶段**调用（rc 的 Provider 在 render 里
    //    每帧给值——Vue 侧用 Proxy 桥达到同样效果：provide 一次，读取时取最新值）。
    provideCascaderContext(
      makeBridge(
        computed(() => ({
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          options: mergedOptions.value,
          fieldNames: mergedFieldNames.value,
          values: valuesResult.value.checkedValues,
          halfValues: valuesResult.value.halfCheckedValues,
          changeOnSelect: props.changeOnSelect,
          onSelect: (valuePath: ValueCell) => {
            if (!multiple.value || (searchConfig.autoClearSearchValue ?? true)) setSearchValue('');
            selectHandler.value(valuePath);
          },
          checkable: multiple.value,
          searchOptions: searchOptions.value,
          popupPrefixCls: props.prefixCls ? `${props.prefixCls}` : prefixCls.value,
          loadData: props.loadData,
          expandTrigger: props.expandTrigger,
          // ⚠️ 默认图标来自 antd `useIcons`（`RightOutlined` / RTL `LeftOutlined` /
          //    `LoadingOutlined spin`）——**不是** rc 的字面量 `'>'`。rc 的默认值在
          //    antd 层被覆盖掉了；照抄 rc 会让展开图标渲染成文字 `>`（L6 差异抓出）。
          expandIcon: (props.expandIcon ??
            contextSemantic.expandIcon ??
            (props.direction === 'rtl' ? h(LeftOutlined) : h(RightOutlined))) as VNodeChild | null,
          loadingIcon: (props.loadingIcon ??
            contextSemantic.loadingIcon ??
            h(LoadingOutlined, { spin: true })) as VNodeChild | null | undefined,
          popupMenuColumnStyle: props.popupMenuColumnStyle,
          optionRender: props.optionRender as
            | ((option: BaseOptionType) => VNodeChild)
            | null
            | undefined,
        })),
      ),
    );

    const mergedFieldNames = computed(() => fillFieldNames(props.fieldNames));
    const { mergedOptions, getPathKeyEntities, getValueByKeyPath } = useOptions(
      mergedFieldNames,
      computed(() => props.options as BaseOptionType[] | undefined),
    );

    const [internalSearchValue, setSearchValue] = useControlledValue<string>({
      defaultValue: () => '',
      getValue: () => props.searchValue,
      onChange: (next: string) => {
        emit('update:searchValue', next);
      },
    });
    const mergedSearchValue = computed(() => internalSearchValue.value || '');

    const [enabledSearch, searchConfig] = normalizeSearchConfigFull(props.showSearch, {
      autoClearSearchValue: props.autoClearSearchValue,
      searchValue: props.searchValue,
      onSearch: callbacks.onSearch,
    });

    const searchOptions = computed<BaseOptionType[]>(() =>
      computeSearchOptions(
        mergedSearchValue.value,
        mergedOptions.value,
        mergedFieldNames.value,
        prefixCls.value,
        searchConfig,
        props.changeOnSelect || multiple.value,
      ),
    );

    const rawValues = computed<ValueCell[]>(() => toRawValues(props.value ?? props.defaultValue));
    const valuesResult = computed(() => {
      const getMissing = (list: ValueCell[]): [ValueCell[], ValueCell[]] => {
        const exists: ValueCell[] = [];
        const missing: ValueCell[] = [];
        list.forEach((valueCell) => {
          const path = toPathOptions(valueCell, mergedOptions.value, mergedFieldNames.value);
          if (path.every((opt) => opt.option)) exists.push(valueCell);
          else missing.push(valueCell);
        });
        return [exists, missing];
      };
      return useValues(
        multiple.value,
        rawValues,
        getPathKeyEntities,
        getValueByKeyPath,
        getMissing,
      );
    });

    const displayValues = computed(() =>
      computeDisplayValues(
        rawValues.value.length ? valuesResult.value.checkedValues : [],
        mergedOptions.value,
        mergedFieldNames.value,
        multiple.value,
        props.displayRender,
      ),
    );

    const triggerChange = (nextValues: ValueCell | ValueCell[]): void => {
      const isMultipleShape = Array.isArray((nextValues as unknown[])[0] as unknown);
      const nextRaw = isMultipleShape ? (nextValues as ValueCell[]) : [nextValues as ValueCell];
      emit('update:value', isMultipleShape ? nextRaw : (nextRaw[0] as ValueCell));
      if (!callbacks.onChange) return;
      const valueOptions = nextRaw.map((valueCells) =>
        toPathOptions(valueCells, mergedOptions.value, mergedFieldNames.value).map(
          (valueOpt) => valueOpt.option,
        ),
      );
      callbacks.onChange(
        multiple.value ? nextRaw : (nextRaw[0] as ValueCell),
        multiple.value ? valueOptions : valueOptions[0],
      );
    };

    /** BaseSelect 的展示值增删（tag 移除 / 清空）→ 转成值路径选择。 */
    const onDisplayValuesChange = (
      _values: unknown[],
      info: { type: 'add' | 'remove' | 'clear'; values: { valueCells: ValueCell }[] },
    ): void => {
      if (info.type === 'clear') {
        triggerChange([]);
        return;
      }
      const valueCells = info.values[0]?.valueCells;
      if (!valueCells) return;
      if (!multiple.value || (searchConfig.autoClearSearchValue ?? true)) setSearchValue('');
      selectHandler.value(valueCells);
    };

    const selectHandler = computed(() => {
      const handler = (valuePath: ValueCell): void => {
        const { checkedValues, halfCheckedValues, missingCheckedValues } = valuesResult.value;
        if (!multiple.value) {
          triggerChange(valuePath);
          return;
        }
        const next = conductMultiple(
          valuePath,
          checkedValues,
          halfCheckedValues,
          missingCheckedValues,
        );
        triggerChange(next);
      };
      return handler;
    });

    /** 多选勾选传导（S2 的 createSelectHandler 语义，内联以拿最新受控快照）。 */
    function conductMultiple(
      valuePath: ValueCell,
      checkedValues: ValueCell[],
      halfCheckedValues: ValueCell[],
      missingCheckedValues: ValueCell[],
    ): ValueCell[] {
      const tree = { conductCheck, formatStrategyValues };
      const SPLIT = '__RC_CASCADER_SPLIT__';
      const toPathKeyLocal = (value: ValueCell): string => value.map(String).join(SPLIT);
      const pathKey = toPathKeyLocal(valuePath);
      const checkedPathKeys = checkedValues.map(toPathKeyLocal);
      const halfCheckedPathKeys = halfCheckedValues.map(toPathKeyLocal);
      const existInChecked = checkedPathKeys.includes(pathKey);
      const existInMissing = missingCheckedValues.some((c) => toPathKeyLocal(c) === pathKey);

      let nextCheckedValues = checkedValues;
      let nextMissingValues = missingCheckedValues;
      if (existInMissing && !existInChecked) {
        nextMissingValues = missingCheckedValues.filter((c) => toPathKeyLocal(c) !== pathKey);
      } else {
        const nextRawCheckedKeys = existInChecked
          ? checkedPathKeys.filter((key) => key !== pathKey)
          : [...checkedPathKeys, pathKey];
        const pathKeyEntities = getPathKeyEntities();
        let checkedKeys: string[];
        if (existInChecked) {
          ({ checkedKeys } = tree.conductCheck(
            nextRawCheckedKeys,
            { checked: false, halfCheckedKeys: halfCheckedPathKeys },
            pathKeyEntities,
          ));
        } else {
          ({ checkedKeys } = tree.conductCheck(nextRawCheckedKeys, true, pathKeyEntities));
        }
        const dedup = tree.formatStrategyValues(
          checkedKeys,
          getPathKeyEntities,
          props.showCheckedStrategy ?? 'SHOW_PARENT',
        );
        nextCheckedValues = getValueByKeyPath(dedup);
      }
      return [...nextMissingValues, ...nextCheckedValues];
    }

    // ============================ Search ==============================
    const onInternalSearch = (searchText: string, info: { source?: string }): void => {
      setSearchValue(searchText);
      if (info.source !== 'blur' && callbacks.onSearch) callbacks.onSearch(searchText);
    };

    // ============================ Semantic ============================
    const mergedProps = computed(() => ({ ...props }));
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
        // 根 style 是 Vue 原生 attrs；仍走语义 root 通道（与上游落点一致）
        () => (attrs.style ? { root: attrs.style as StyleLike } : undefined),
      ],
      mergedProps.value as never,
      // ⚠️ antd 第四参 `{ popup: { _default: 'root' } }`（KNOWN-ISSUES §1.7b 已补）：
      //    字符串形态 `classNames.popup = 'x'` 归到 `popup.root`，不再产垃圾键。
      { popup: { _default: 'root' } },
    );

    const mergedRootClassName = computed(
      () =>
        [
          !props.prefixCls ? prefixCls.value : '',
          mergedSize.value === 'large' ? `${prefixCls.value}-lg` : '',
          mergedSize.value === 'small' ? `${prefixCls.value}-sm` : '',
          compactItemClassnames.value,
          props.direction === 'rtl' ? `${prefixCls.value}-rtl` : '',
          enableVariantCls.value ? `${prefixCls.value}-${variant.value}` : '',
          formItem.value.isFormItemInput ? `${prefixCls.value}-in-form-item` : '',
          // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
          attrs.class,
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
      const renderEmpty = (context as { renderEmpty?: (name: string) => unknown }).renderEmpty;
      return renderEmpty ? renderEmpty('Cascader') : 'Not Found';
    });

    // ============================ Expose ==============================
    const baseSelectRef = shallowRef<{
      nativeElement: () => HTMLElement | null;
      focus?: () => void;
      blur?: () => void;
    } | null>(null);
    const optionListRef = shallowRef<{ onKeyDown: (e: KeyboardEvent) => void } | null>(null);
    expose({
      nativeElement: (): HTMLElement | null => baseSelectRef.value?.nativeElement() ?? null,
      focus: (): void => {
        baseSelectRef.value?.focus?.();
      },
      blur: (): void => {
        baseSelectRef.value?.blur?.();
      },
    });

    const { variant, enableVariantCls } = useVariant({
      component: 'cascader',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    // antd 逐字（cascader/index.js: useSize(ctx => customizeSize ?? compactSize ?? ctx)）
    //（2026-10-04 接上 Space.Compact 上下文 —— tree-select 同款）
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => props.direction,
    );
    const mergedSize = computed(() => props.size ?? compactSize.value);
    const mergedAllowClear = computed(() =>
      props.allowClear === true
        ? { clearIcon: props.clearIcon ?? contextSemantic.clearIcon ?? true }
        : props.allowClear,
    );

    // ============================ Render ==============================
    return () => {
      const emptyOptions = !(mergedSearchValue.value ? searchOptions.value : mergedOptions.value)
        .length;

      // ⚠️ 末尾的  会**整段覆盖**  / （对象展开后者胜）
      //    ⇒ 必须先把  /  摘掉，否则 mergedRootClassName 全丢。
      const {
        class: _attrsClass,
        style: _attrsStyle,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _attrsClass;
      void _attrsStyle;

      return h(
        BaseSelect,
        {
          ref: baseSelectRef as never,
          prefixCls: prefixCls.value,
          id: mergedId,
          className: mergedRootClassName.value,
          style: mergedStyles.value?.root,
          multiple: multiple.value,
          showSearch: enabledSearch,
          searchValue: mergedSearchValue.value,
          autoClearSearchValue: searchConfig.autoClearSearchValue ?? true,
          displayValues: displayValues.value,
          disabled: mergedDisabled.value,
          loading: props.loading,
          open: props.open,
          defaultOpen: props.defaultOpen,
          notFoundContent: mergedNotFoundContent.value,
          placeholder: (slots.placeholder?.() as VNodeChild) ?? props.placeholder,
          allowClear: mergedAllowClear.value,
          clearIcon: props.clearIcon ?? contextSemantic.clearIcon,
          // ⚠️ antd 把 `suffixIcon ?? contextSuffixIcon` 交给 select 的 `useSelectIcons`，
          //    由**后者**补默认值（`loading` ⇒ `LoadingOutlined spin`，否则 `DownOutlined`）。
          //    少了这一层默认，触发器**不会渲染箭头**（L6 实测：antd 侧
          //    `.ant-select-suffix` 12×12 @x=200 存在，本仓 `.apollo-cascader-suffix` 完全没有）。
          suffixIcon:
            props.suffixIcon ??
            contextSemantic.suffixIcon ??
            (props.loading ? h(LoadingOutlined, { spin: true }) : h(DownOutlined)),
          removeIcon: props.removeIcon ?? contextSemantic.removeIcon,
          maxTagCount: props.maxTagCount,
          maxTagTextLength: props.maxTagTextLength,
          maxTagPlaceholder: props.maxTagPlaceholder,
          emptyOptions,
          placement: memoPlacement.value,
          direction: props.direction,
          popupMatchSelectWidth: props.popupMatchSelectWidth ?? false,
          getPopupContainer: props.getPopupContainer,
          transitionName: `${rootPrefixCls.value}-slide-up`,
          popupClassName: mergedPopupClassName.value,
          popupStyle: {
            ...((mergedStyles.value as { popup?: { root?: StyleLike } }).popup?.root ?? {}),
            ...(props.popupStyle ?? {}),
          },
          popupRender: props.popupRender,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          onSearch: onInternalSearch,
          onDisplayValuesChange: onDisplayValuesChange,
          onOpenChange: (next: boolean) => setOpen(next),
          onInputKeyDown: (event: KeyboardEvent) => {
            optionListRef.value?.onKeyDown(event);
          },
          openOnTriggerClick: true,
          getRawInputElement: () => {
            // rc：getRawInputElement = () => children —— raw 元素作为触发器，
            // SSR/关闭态只渲染它（DOM 基线依赖）；事件由 BaseSelect 注入。
            const raw = slots.default?.() as VNodeChild;
            return (Array.isArray(raw) ? raw[0] : raw) as never;
          },
          optionListRenderer: () =>
            h(RawOptionList, {
              ref: optionListRef as never,
              prefixCls: prefixCls.value,
              multiple: multiple.value,
              searchValue: mergedSearchValue.value,
              open: mergedOpen.value,
              disabled: mergedDisabled.value,
              direction: props.direction,
              notFoundContent: mergedNotFoundContent.value,
              toggleOpen: (next: boolean) => setOpen(next),
            } as never),
          ...restAttrs,
        } as never,
        {},
      );
    };
  },
});

function makeBridge<T extends object>(source: { value: T }): T {
  return new Proxy({} as T, {
    get(_t, key) {
      return source.value[key as keyof T];
    },
  });
}

export default Cascader;
