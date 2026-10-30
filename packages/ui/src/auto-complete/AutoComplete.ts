/** AutoComplete owns its Vue API and option classification; SelectEngine owns interaction. */

import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  type SlotsType,
  shallowRef,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { SelectOption } from '../select';
import {
  collectSelectChildren,
  convertChildrenToData,
  isSelectOptionNode,
} from '../select/engine/valueUtil';
import type {
  DefaultOptionType,
  LabeledValue,
  RawValueType,
  SelectRef,
  SelectValue,
} from '../select/interface';
import { SelectEngine, type SelectEngineComponentConfig, selectEmits } from '../select/Select';
import type {
  AutoCompleteProps,
  AutoCompleteScrollToArg,
  AutoCompleteSemanticClassNames,
  AutoCompleteSemanticStyles,
  AutoCompleteSlots,
  DataSourceItemType,
} from './interface';

type AutoCompleteConfig = Pick<
  AutoCompleteProps,
  'classNames' | 'styles' | 'showSearch' | 'allowClear'
> & {
  className?: string;
  style?: import('vue').CSSProperties;
};

const autoCompleteEmits = {
  ...selectEmits,
  select: (_value: RawValueType, _option: DefaultOptionType) => true,
  deselect: (_value: RawValueType, _option: DefaultOptionType) => true,
};

const AutoCompleteComponent = defineComponent({
  name: 'AAutoComplete',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    value: { type: null as unknown as PropType<AutoCompleteProps['value']>, default: undefined },
    defaultValue: {
      type: null as unknown as PropType<AutoCompleteProps['defaultValue']>,
      default: undefined,
    },
    options: {
      type: Array as PropType<DefaultOptionType[]>,
      default: undefined,
    },
    dataSource: { type: Array as PropType<DataSourceItemType[]>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    size: { type: String as PropType<AutoCompleteProps['size']>, default: undefined },
    variant: { type: String as PropType<AutoCompleteProps['variant']>, default: undefined },
    status: { type: String as PropType<AutoCompleteProps['status']>, default: undefined },
    allowClear: {
      type: [Boolean, Object] as PropType<AutoCompleteProps['allowClear']>,
      default: undefined,
    },
    autoFocus: { type: Boolean, default: undefined },
    defaultActiveFirstOption: { type: Boolean, default: undefined },
    backfill: { type: Boolean, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    id: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    listHeight: { type: Number, default: undefined },
    listItemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    placement: { type: String as PropType<AutoCompleteProps['placement']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<AutoCompleteProps['getPopupContainer']>,
      default: undefined,
    },
    popupMatchSelectWidth: {
      type: [Boolean, Number] as PropType<AutoCompleteProps['popupMatchSelectWidth']>,
      default: undefined,
    },
    dropdownMatchSelectWidth: {
      type: [Boolean, Number] as PropType<AutoCompleteProps['dropdownMatchSelectWidth']>,
      default: undefined,
    },
    popupClassName: { type: String, default: undefined },
    dropdownClassName: { type: String, default: undefined },
    dropdownStyle: {
      type: Object as PropType<AutoCompleteProps['dropdownStyle']>,
      default: undefined,
    },
    maxLength: { type: Number, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<AutoCompleteProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<AutoCompleteProps['styles']>,
      default: undefined,
    },
    showSearch: {
      type: [Boolean, Object] as PropType<AutoCompleteProps['showSearch']>,
      default: undefined,
    },
    searchValue: { type: String, default: undefined },
    filterOption: {
      type: [Boolean, Function] as PropType<AutoCompleteProps['filterOption']>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<AutoCompleteSlots>,
  emits: autoCompleteEmits,
  expose: ['focus', 'blur', 'scrollTo', 'nativeElement'],
  setup(props, { slots, emit, attrs }) {
    const devWarning = useDevWarning('AutoComplete');
    const componentConfig = useComponentConfig<AutoCompleteConfig>('autoComplete');

    // ============================ Prefix ==============================
    // antd：getPrefixCls('select', custom) —— **复用 select 前缀**
    const prefixCls = computed(() => componentConfig.getPrefixCls('select', props.prefixCls));

    // ============================ Warning ==============================
    watchEffect(() => {
      // deprecated style/data aliases（antd 逐字；dropdownRender/popupRender fn 形态已随 C8-R2
      // 删除，不在此列——传了只会落进 attrs 不生效）
      devWarning.deprecated(
        props.dropdownMatchSelectWidth === undefined,
        'dropdownMatchSelectWidth',
        'popupMatchSelectWidth',
      );
      devWarning.deprecated(
        props.dropdownStyle === undefined,
        'dropdownStyle',
        'styles.popup.root',
      );
      devWarning.deprecated(
        props.dropdownClassName === undefined,
        'dropdownClassName',
        'classNames.popup.root',
      );
      devWarning.deprecated(
        props.popupClassName === undefined,
        'popupClassName',
        'classNames.popup.root',
      );
      devWarning.deprecated(props.dataSource === undefined, 'dataSource', 'options');
    });

    // =========================== Options ===============================
    // antd 的 children 三分支。本仓 v1：自定义输入元素未实现（usage 告警，
    // 见渲染期的 `warnCustomInputIfNeeded`）。
    const classifyChildren = (nodes: ReturnType<typeof collectSelectChildren>) => {
      const firstNode = nodes[0];
      if (firstNode && isSelectOptionNode(firstNode)) return { kind: 'children' as const };
      if (nodes.length === 1) return { kind: 'children' as const, dropCustomInput: true };
      return { kind: 'none' as const };
    };

    // Custom inputs remain unsupported; warn once per active unsupported state.
    let warnedCustomInput = false;
    const warnCustomInputIfNeeded = (info: { dropCustomInput?: boolean }): void => {
      if (info.dropCustomInput) {
        if (!warnedCustomInput) {
          devWarning(
            false,
            'Custom input element is not supported yet in this Vue implementation. It will be ignored.',
          );
          warnedCustomInput = true;
        }
      } else {
        warnedCustomInput = false;
      }
    };

    const hasVNodeItems = computed(() => Boolean(props.dataSource?.some((item) => isVNode(item))));

    // dataSource → options（antd 的 `optionChildren` 分支逐字，AutoComplete.js:49-76）：
    // ① children 首项是 Option/OptGroup ⇒ optionChildren = children，dataSource 整条忽略；
    // ② 否则 dataSource.map：string ⇒ Option{value,label}；{value,text} ⇒ Option{value,label:text}；
    //    VNode 项原样作为 option children（走默认插槽通道）。
    const getOptions = (
      info: ReturnType<typeof classifyChildren>,
    ): DefaultOptionType[] | undefined => {
      if (props.options) return props.options;
      // antd：childNodes[0] 是 Option/OptGroup ⇒ dataSource 不再参与。否则
      // options 非空会把 Select 的 children-as-data 通道整条堵死（#14.1 实测：
      // Option children 与 dataSource 同传 ⇒ children 反被丢）。
      if (info.kind === 'children' && !info.dropCustomInput) {
        return undefined;
      }
      const ds = props.dataSource;
      if (!ds) return undefined;
      // ⚠️ 混有 VNode 项 ⇒ 整条 dataSource 走默认插槽（渲染期把结构化项转成
      // Option vnode）：Select 的 `childrenAsData = !options` 是全有全无开关，
      // `options=[]`（仅 VNode 时 flatMap 的产物）会把插槽里的选项整条丢掉。
      if (hasVNodeItems.value) return undefined;
      return ds.flatMap((item) => {
        if (isVNode(item)) return [];
        if (typeof item === 'string') return [{ value: item, label: item }];
        if (isPlainObject(item)) {
          return [{ value: item.value, label: item.text }];
        }
        return [];
      });
    };

    // ====================== Merged props（antd 逐字）===================
    const mergedPopupMatchSelectWidth = computed(
      () => props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth,
    );

    // ========================= Semantic ================================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      AutoCompleteProps,
      AutoCompleteSemanticClassNames,
      AutoCompleteSemanticStyles
    >(
      [() => componentConfig.classNames, () => props.classNames],
      [() => componentConfig.styles, () => props.styles],
      props,
      { popup: { _default: 'root' } },
    );

    const finalClassNames = computed<AutoCompleteSemanticClassNames>(() => ({
      root: [`${prefixCls.value}-auto-complete`, mergedClassNames.value.root]
        .filter(Boolean)
        .join(' '),
      prefix: mergedClassNames.value.prefix,
      input: mergedClassNames.value.input,
      placeholder: mergedClassNames.value.placeholder,
      content: mergedClassNames.value.content,
      clear: mergedClassNames.value.clear,
      popup: {
        root: [props.popupClassName, props.dropdownClassName, mergedClassNames.value.popup?.root]
          .filter(Boolean)
          .join(' '),
        list: mergedClassNames.value.popup?.list,
        listItem: mergedClassNames.value.popup?.listItem,
      },
    }));

    const finalStyles = computed<AutoCompleteSemanticStyles>(() => ({
      // 根 style 是 Vue 原生 attrs（位置与原先的 props.style 一致：最后胜出）
      root: mergedStyles.value.root,
      input: mergedStyles.value.input,
      prefix: mergedStyles.value.prefix,
      placeholder: mergedStyles.value.placeholder,
      content: mergedStyles.value.content,
      clear: mergedStyles.value.clear,
      popup: {
        root: { ...props.dropdownStyle, ...mergedStyles.value.popup?.root },
        list: mergedStyles.value.popup?.list,
        listItem: mergedStyles.value.popup?.listItem,
      },
    }));

    // ============================ Expose ===============================
    const selectRef = shallowRef<SelectRef | null>(null);
    const notifySelect = (
      name: 'select' | 'deselect',
      value: RawValueType | LabeledValue,
      option: DefaultOptionType,
    ) => {
      const raw = typeof value === 'object' ? value.value : value;
      if (name === 'select') emit('select', raw, option);
      else emit('deselect', raw, option);
    };

    // ============================ Render ===============================
    const renderAutoComplete = () => {
      // F02: classify this render’s slot, including conditional slot functions.
      const children = collectSelectChildren(slots.default?.());
      const info = classifyChildren(children);
      warnCustomInputIfNeeded(info);

      // 透传给 Select 的插槽：default（Option 列表 / dataSource 派生）+ 其余具名插槽；
      // suffixIcon：用户插槽优先，否则空渲染（antd 的 suffixIcon={null}）。
      const selectSlots: AutoCompleteSlots = {
        ...slots,
        suffixIcon: slots.suffixIcon ?? (() => null),
      };

      // The current render owns the slot snapshot. Forward its VNodes as data;
      // never classify slot identity or content inside a computed.
      selectSlots.default = () => {
        if (info.kind === 'children' && !info.dropCustomInput) {
          return children;
        }
        if (hasVNodeItems.value) {
          return (props.dataSource ?? []).map((item) => {
            if (isVNode(item)) return item;
            if (typeof item === 'string') {
              return h(SelectOption, { key: item, value: item }, () => item);
            }
            if (isPlainObject(item)) {
              return h(SelectOption, { key: item.value, value: item.value }, () => item.text);
            }
            return null;
          });
        }
        return [];
      };

      const optionData = getOptions(info);
      const { class: nativeClass, style: nativeStyle, ...restAttrs } = attrs;
      return h(
        SelectEngine,
        {
          ...restAttrs,
          ref: selectRef,
          // ---- 全量转发（antd 的 {...omit(props, [...])}；omit 的五个键已并入
          //      merged 类名/回调，不在此列）----
          id: props.id,
          // Native class/style are read during render and reach the selector once.
          class: nativeClass,
          style: nativeStyle,
          prefixCls: prefixCls.value,
          componentConfig: {
            componentName: 'autoComplete',
            className: componentConfig.className,
            style: componentConfig.style,
            showSearch: componentConfig.showSearch,
            allowClear: componentConfig.allowClear,
          } satisfies SelectEngineComponentConfig,
          value: props.value,
          defaultValue: props.defaultValue,
          options: optionData,
          optionChildren:
            optionData === undefined ? convertChildrenToData(selectSlots.default?.()) : [],
          placeholder: props.placeholder,
          disabled: props.disabled,
          size: props.size,
          variant: props.variant,
          status: props.status,
          allowClear: props.allowClear ?? componentConfig.allowClear,
          autoFocus: props.autoFocus,
          defaultActiveFirstOption: props.defaultActiveFirstOption ?? true,
          backfill: props.backfill,
          open: props.open,
          defaultOpen: props.defaultOpen,
          tabIndex: props.tabIndex,
          listHeight: props.listHeight,
          listItemHeight: props.listItemHeight,
          virtual: props.virtual,
          placement: props.placement,
          maxLength: props.maxLength,
          getPopupContainer: props.getPopupContainer,
          showSearch: props.showSearch ?? componentConfig.showSearch,
          searchValue: props.searchValue,
          filterOption: props.filterOption,
          popupMatchSelectWidth: mergedPopupMatchSelectWidth.value,
          classNames: finalClassNames.value,
          styles: finalStyles.value,
          // The combobox owns its mode and raw-value notifications.
          mode: 'combobox',
          labelInValue: false,
          onChange: (
            value: SelectValue,
            option: DefaultOptionType | DefaultOptionType[] | undefined,
          ) => emit('change', value, option),
          onSelect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
            notifySelect('select', value, option),
          onDeselect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
            notifySelect('deselect', value, option),
          onSearch: (value: string) => emit('search', value),
          onOpenChange: (value: boolean) => emit('openChange', value),
          onFocus: (event: FocusEvent) => emit('focus', event),
          onBlur: (event: FocusEvent) => emit('blur', event),
          onClear: () => emit('clear'),
          onPopupScroll: (event: Event) => emit('popupScroll', event),
          onInputKeyDown: (event: KeyboardEvent) => emit('inputKeyDown', event),
          'onUpdate:value': (value: SelectValue) => emit('update:value', value),
          'onUpdate:searchValue': (value: string) => emit('update:searchValue', value),
          'onUpdate:open': (value: boolean) => emit('update:open', value),
        },
        selectSlots,
      );
    };
    return {
      focus: (options?: FocusOptions) => selectRef.value?.focus(options),
      blur: () => selectRef.value?.blur(),
      scrollTo: (arg?: AutoCompleteScrollToArg) =>
        selectRef.value?.scrollTo(typeof arg === 'object' && 'top' in arg ? arg.top : arg),
      nativeElement: computed(() => selectRef.value?.nativeElement ?? null),
      renderAutoComplete,
    };
  },
  render() {
    return this.renderAutoComplete();
  },
});

export default AutoCompleteComponent;
