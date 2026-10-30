import {
  CloseCircleFilled,
  DownOutlined,
  LeftOutlined,
  LoadingOutlined,
  RightOutlined,
} from '@apollo-design/icons';
import { useControlledValue, useId } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  normalizeClass,
  normalizeStyle,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useConsumerZIndex } from '../_internal/use-consumer-z-index';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import BaseSelect from '../select/engine/BaseSelect';
import type { DisplayValueType, SelectCommonPlacement } from '../select/interface';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { type CascaderContextProps, provideCascaderContext } from './context';
import { computeSearchOptions, normalizeSearchConfig } from './hooks/search';
import { computeDisplayValues, useCascaderValues } from './hooks/values';
import type {
  CascaderOutputValue,
  CascaderProps,
  CascaderSelectedOptions,
  CascaderSemanticClassNames,
  CascaderSemanticStyles,
  CascaderSlots,
} from './interface';
import RawOptionList, {
  type CascaderOptionListRef,
  getNavigationKey,
  navigationKeys,
} from './OptionList';
import { cascaderProps } from './props';
import { useCascaderTheme } from './use-cascader-theme';

const Cascader = defineComponent({
  name: 'ACascader',
  inheritAttrs: false,
  props: cascaderProps,
  slots: Object as SlotsType<CascaderSlots>,
  emits: {
    'update:value': (_value: CascaderOutputValue) => true,
    change: (_value: CascaderOutputValue, _options: CascaderSelectedOptions) => true,
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean) => true,
    'update:searchValue': (_value: string) => true,
    search: (_value: string) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    clear: () => true,
    popupScroll: (_event: Event) => true,
    keydown: (_event: KeyboardEvent) => true,
    keyup: (_event: KeyboardEvent) => true,
    mousedown: (_event: MouseEvent) => true,
  },
  expose: ['nativeElement', 'focus', 'blur'],
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<
      CascaderProps & { className?: string; style?: import('vue').CSSProperties }
    >('cascader');
    const config = useConfigContext();
    const direction = useDirection();
    const prefix = computed(() => context.getPrefixCls('cascader', props.prefixCls));
    const rootPrefix = computed(() => context.getPrefixCls());
    const mergedDirection = computed(() => props.direction ?? direction.value ?? 'ltr');
    const disabled = useDisabled(() => props.disabled);
    const form = useFormItemInputContext();
    const multiple = computed(() => props.multiple || props.checkable === true);
    const id = useId(props.id);
    const [open, updateOpen] = useControlledValue<boolean>({
      getValue: () => props.open,
      defaultValue: () => props.defaultOpen ?? false,
      onChange: (value) => {
        emit('update:open', value);
        emit('openChange', value);
      },
    });
    const setOpen = (next: boolean): void => {
      if (next !== open.value && (!disabled.value || !next)) updateOpen(next);
    };
    const [search, setSearch] = useControlledValue<string>({
      getValue: () => props.searchValue,
      defaultValue: '',
      onChange: (value) => emit('update:searchValue', value),
    });
    const searchConfig = computed(() =>
      normalizeSearchConfig(props.showSearch ?? multiple.value, {
        autoClearSearchValue: props.autoClearSearchValue,
      }),
    );
    const enabledSearch = computed(() => searchConfig.value[0]);
    const state = useCascaderValues(props, multiple, (value, selected) => {
      emit('update:value', value);
      emit('change', value, selected);
    });
    const searchOptions = computed(() =>
      computeSearchOptions(
        search.value,
        state.options.value,
        state.fields.value,
        prefix.value,
        searchConfig.value[1],
        props.changeOnSelect || multiple.value,
      ),
    );
    const semantic = useMergeSemantic<
      Readonly<CascaderProps>,
      CascaderSemanticClassNames,
      CascaderSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => props.styles],
      props,
      { popup: { _default: 'root' } },
    );
    const theme = useCascaderTheme();
    const zIndex = useConsumerZIndex(
      'SelectLike',
      () => props.popupStyle?.zIndex ?? semantic.styles.value.popup?.root?.zIndex,
      () => theme.zIndexPopup.value,
    );
    const { variant, enableVariantCls } = useVariant({
      component: 'cascader',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefix,
      () => mergedDirection.value,
    );
    const size = useSize((current) => props.size ?? compactSize.value ?? current);
    provideCascaderContext(
      computed<CascaderContextProps>(() => ({
        options: state.options.value,
        fieldNames: state.fields.value,
        values: state.values.value.checkedValues,
        halfValues: state.values.value.halfCheckedValues,
        classNames: semantic.classNames.value,
        styles: semantic.styles.value,
        changeOnSelect: props.changeOnSelect,
        onSelect: (path) => {
          state.select(path);
          if (!multiple.value || (searchConfig.value[1].autoClearSearchValue ?? true))
            setSearch('');
        },
        searchOptions: searchOptions.value,
        loadData: props.loadData,
        expandTrigger: props.expandTrigger,
        expandIcon:
          props.expandIcon !== undefined
            ? props.expandIcon
            : context.expandIcon !== undefined
              ? context.expandIcon
              : h(mergedDirection.value === 'rtl' ? LeftOutlined : RightOutlined),
        loadingIcon:
          props.loadingIcon !== undefined
            ? props.loadingIcon
            : context.loadingIcon !== undefined
              ? context.loadingIcon
              : h(LoadingOutlined, { spin: true }),
        popupMenuColumnStyle: props.popupMenuColumnStyle,
      })),
    );
    const base = shallowRef<{
      nativeElement: () => HTMLElement | null;
      focus: (options?: FocusOptions) => void;
      blur: () => void;
    } | null>(null);
    const list = shallowRef<CascaderOptionListRef | null>(null);
    const api = {
      get nativeElement(): HTMLElement | null {
        return base.value?.nativeElement() ?? null;
      },
      focus: (options?: FocusOptions): void => {
        base.value?.focus(options);
      },
      blur: (): void => {
        base.value?.blur();
      },
    };
    const handleKeydown = (event: KeyboardEvent): void | Promise<void> => {
      let result: void | Promise<void> | undefined;
      if (!disabled.value && !event.isComposing) {
        const key = getNavigationKey(event);
        if (
          !open.value &&
          (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ')
        ) {
          event.preventDefault();
          setOpen(true);
        } else if (!(key === 'Backspace' && multiple.value)) result = list.value?.onKeyDown(event);
      }
      emit('keydown', event);
      return result;
    };
    const renderCascader = () => {
      const {
        class: nativeClass,
        style: nativeStyle,
        tabindex,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby,
        ...rest
      } = attrs;
      const displayValues = computeDisplayValues(
        state.visiblePaths.value,
        state.options.value,
        state.fields.value,
        multiple.value,
        slots.displayRender
          ? (labels, selectedOptions) => slots.displayRender?.({ labels, selectedOptions })
          : undefined,
      );
      const notFound = slots.notFoundContent
        ? slots.notFoundContent()
        : props.notFoundContent !== undefined
          ? props.notFoundContent
          : context.renderEmpty
            ? context.renderEmpty('Cascader')
            : 'Not Found';
      const clearIcon = slots.clearIcon
        ? slots.clearIcon()
        : props.clearIcon !== undefined
          ? props.clearIcon
          : context.clearIcon !== undefined
            ? context.clearIcon
            : h(CloseCircleFilled);
      const suffix = (
        scope: Parameters<NonNullable<CascaderSlots['suffixIcon']>>[0],
      ): VNodeChild => {
        const icon =
          enabledSearch.value && slots.searchIcon && scope.focused
            ? slots.searchIcon(scope)
            : slots.suffixIcon
              ? slots.suffixIcon(scope)
              : props.suffixIcon !== undefined
                ? props.suffixIcon
                : context.suffixIcon !== undefined
                  ? context.suffixIcon
                  : props.loading
                    ? h(LoadingOutlined, { spin: true })
                    : h(DownOutlined);
        return form.value.hasFeedback ? [icon, form.value.feedbackIcon] : icon;
      };
      const custom = slots.default?.();
      const rawContent =
        custom === undefined
          ? undefined
          : isVNode(custom)
            ? custom
            : Array.isArray(custom) && custom.length === 1 && isVNode(custom[0])
              ? custom[0]
              : h('span', {}, Array.isArray(custom) ? custom : [custom]);
      const rawTrigger = rawContent
        ? cloneVNode(
            rawContent,
            {
              id: props.id ?? id,
              class: [context.className, semantic.classNames.value.root, nativeClass],
              style: [
                theme.style.value,
                context.style,
                semantic.styles.value.root,
                normalizeStyle(nativeStyle),
              ],
              onKeyup: (event: KeyboardEvent) => emit('keyup', event),
            },
            true,
          )
        : undefined;
      const maxTagPlaceholder = slots.maxTagPlaceholder
        ? (omitted: DisplayValueType[]) =>
            slots.maxTagPlaceholder?.({
              omittedValues: omitted.flatMap((item) => {
                const value = displayValues.find((display) => display.value === item.value);
                return value
                  ? [{ value: value.valueCells, label: value.label, disabled: value.disabled }]
                  : [];
              }),
            })
        : props.maxTagPlaceholder;
      return h(BaseSelect, {
        ...rest,
        ref: base,
        prefixCls: prefix.value,
        id: props.id ?? id,
        ariaLabel: typeof ariaLabel === 'string' ? ariaLabel : undefined,
        ariaLabelledby: typeof ariaLabelledby === 'string' ? ariaLabelledby : undefined,
        tabIndex:
          typeof tabindex === 'number'
            ? tabindex
            : typeof tabindex === 'string'
              ? Number(tabindex)
              : undefined,
        className: normalizeClass([
          context.className,
          nativeClass,
          compactItemClassnames.value,
          size.value === 'large' && `${prefix.value}-lg`,
          size.value === 'small' && `${prefix.value}-sm`,
          mergedDirection.value === 'rtl' && `${prefix.value}-rtl`,
          enableVariantCls.value && `${prefix.value}-${variant.value}`,
          form.value.isFormItemInput && `${prefix.value}-in-form-item`,
          getStatusClassNames(
            prefix.value,
            props.status || form.value.status,
            form.value.hasFeedback,
          ),
        ]),
        style: [
          theme.style.value,
          context.style,
          semantic.styles.value.root,
          normalizeStyle(nativeStyle),
        ],
        classNames: semantic.classNames.value,
        styles: semantic.styles.value,
        multiple: multiple.value,
        showSearch: enabledSearch.value,
        searchValue: search.value,
        autoClearSearchValue: searchConfig.value[1].autoClearSearchValue ?? true,
        displayValues,
        disabled: disabled.value,
        loading: props.loading,
        open: open.value,
        placeholder: slots.placeholder ? slots.placeholder() : props.placeholder,
        notFoundContent: notFound,
        allowClear: props.allowClear === true ? { clearIcon } : props.allowClear,
        clearIcon,
        suffixIcon: suffix,
        removeIcon: slots.removeIcon
          ? slots.removeIcon()
          : (props.removeIcon ?? context.removeIcon),
        maxTagCount: props.maxTagCount,
        maxTagTextLength: props.maxTagTextLength,
        maxTagPlaceholder,
        emptyOptions: !(search.value ? searchOptions.value : state.options.value).length,
        placement:
          props.placement ??
          ((mergedDirection.value === 'rtl'
            ? 'bottomRight'
            : 'bottomLeft') satisfies SelectCommonPlacement),
        direction: mergedDirection.value,
        popupMatchSelectWidth:
          props.popupMatchSelectWidth ??
          config.popupMatchSelectWidth ??
          (search.value ? (searchConfig.value[1].matchInputWidth ?? true) : false),
        getPopupContainer: props.getPopupContainer ?? config.getPopupContainer,
        transitionName: `${rootPrefix.value}-slide-up`,
        popupClassName: normalizeClass([
          props.popupClassName || props.dropdownClassName,
          mergedDirection.value === 'rtl' && `${prefix.value}-dropdown-rtl`,
          semantic.classNames.value.popup?.root,
        ]),
        popupStyle: {
          ...theme.style.value,
          zIndex: zIndex.value,
          ...semantic.styles.value.popup?.root,
          ...props.popupStyle,
        },
        popupRender: slots.popupRender
          ? (menu) => slots.popupRender?.({ menu: isVNode(menu) ? menu : h(Fragment, {}, [menu]) })
          : undefined,
        onSearch: (value: string, info: { source?: string }) => {
          setSearch(value);
          if (info.source !== 'blur') emit('search', value);
        },
        onOpenChange: setOpen,
        onDisplayValuesChange: (
          _values: DisplayValueType[],
          info: { type: 'add' | 'remove' | 'clear'; values: DisplayValueType[] },
        ) => {
          if (info.type === 'clear') state.change([]);
          else
            for (const item of info.values) {
              const value = displayValues.find((display) => display.value === item.value);
              if (value) state.select(value.valueCells);
            }
        },
        onInputKeyDown: (event: KeyboardEvent) => {
          if (rawTrigger) return handleKeydown(event);
          // Cascader owns multi-column navigation; BaseSelect retains native notification.
          if (
            open.value &&
            !event.isComposing &&
            navigationKeys.has(getNavigationKey(event)) &&
            !(event.key === 'Backspace' && (search.value || multiple.value)) &&
            !(event.key === ' ' && (!multiple.value || search.value))
          )
            event.preventDefault();
        },
        onKeydown: handleKeydown,
        onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        onMousedown: (event: MouseEvent) => emit('mousedown', event),
        onFocus: (event: FocusEvent) => emit('focus', event),
        onBlur: (event: FocusEvent) => emit('blur', event),
        onClear: () => emit('clear'),
        getRawInputElement: rawTrigger ? () => rawTrigger : undefined,
        optionListRenderer: () =>
          h(
            RawOptionList,
            {
              ref: list,
              prefixCls: prefix.value,
              multiple: multiple.value,
              searchValue: search.value,
              open: open.value,
              disabled: disabled.value,
              direction: mergedDirection.value,
              notFoundContent: notFound,
              toggleOpen: setOpen,
              onPopupScroll: (event: Event) => emit('popupScroll', event),
            },
            slots,
          ),
      });
    };
    return {
      nativeElement: computed(() => api.nativeElement),
      focus: api.focus,
      blur: api.blur,
      renderCascader,
    };
  },
  render() {
    return this.renderCascader();
  },
});
export default Cascader;
