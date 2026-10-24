/**
 * AutoComplete —— antd `AutoComplete.tsx`（245 行）的 Vue 版：**Select 的薄包装**。
 *
 * 契约：prefixCls 复用 select；mode 走内核 combobox 分支（公开类型不含，边界 cast）；
 * suffixIcon={null}（无箭头）；children 三分支（Option 列表 / 自定义输入元素 / dataSource）。
 *
 * ## 文件头判据
 *
 * 1. **回调全 prop 形态**（与本仓 Select 同判，PITFALLS 35）：声明同名 emits 会被
 *    Vue 从 attrs 摘掉造成双通道；`v-model:value` 走 `update:value`（C11 双发）。
 * 2. **`#suffixIcon` 空 slot 实现 suffixIcon={null}**：Select 的
 *    `getSuffixIconNode(null)` ⇒ 不渲染箭头；用户自己的 `#suffixIcon` 插槽优先
 *    （antd 的 `{...rest}` spread 在 suffixIcon={null} 之后，语义一致）。
 * 3. **自定义输入元素（getInputElement）v1 未实现**：SearchInput 承载 ARIA/IME/
 *    宽度同步全套，替换需深度改造 select engine —— usage 告警 + 缺口登记（README §5）。
 * 4. **deprecated ×7** 全部落 usage 告警（antd 逐字文案）。
 * 5. **dataSource 映射**（antd 的 `optionChildren` 分支逐字）：
 *    - children 首项是 Option/OptGroup ⇒ `optionChildren = children`，dataSource **整条忽略**；
 *    - 否则 `dataSource.map`：string ⇒ `{value, label: value}`；`{value,text}` ⇒
 *      `{value, label: text}`；**VNode 项原样作为 option children**。
 *    ⚠️ 混有 VNode 项时整条 dataSource 走 children-as-data 通道（结构化项转成
 *    Option vnode）—— Select 的 `childrenAsData = !options` 是全有全无开关，
 *    `options=[]` 会把默认插槽整条堵死（#14.1：仅 VNode dataSource ⇒ 零选项）。
 * 6. F02：默认插槽在 render 读取并分类；Select 的公开 render 边界将 VNode
 *    转为选项数据，再经 Vue props 更新内层 computed 与缓存，不能缓存 slot 身份。
 */

import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { SelectOption } from '../select';
import { collectSelectChildren, isSelectOptionNode } from '../select/engine/valueUtil';
import type { DefaultOptionType } from '../select/interface';
import Select from '../select/Select';
import type {
  AutoCompleteProps,
  AutoCompleteSemanticClassNames,
  AutoCompleteSemanticStyles,
  DataSourceItemType,
} from './interface';

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
    placement: { type: String, default: undefined },
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
    // ---- 回调（prop 形态；Select 同名同形，1:1 转发）----
    onChange: {
      type: Function as PropType<AutoCompleteProps['onChange']>,
      default: undefined,
    },
    onSelect: {
      type: Function as PropType<AutoCompleteProps['onSelect']>,
      default: undefined,
    },
    onDeselect: {
      type: Function as PropType<AutoCompleteProps['onDeselect']>,
      default: undefined,
    },
    onSearch: { type: Function as PropType<AutoCompleteProps['onSearch']>, default: undefined },
    onOpenChange: {
      type: Function as PropType<AutoCompleteProps['onOpenChange']>,
      default: undefined,
    },
    onDropdownVisibleChange: {
      type: Function as PropType<AutoCompleteProps['onDropdownVisibleChange']>,
      default: undefined,
    },
    onFocus: { type: Function as PropType<AutoCompleteProps['onFocus']>, default: undefined },
    onBlur: { type: Function as PropType<AutoCompleteProps['onBlur']>, default: undefined },
    onClear: { type: Function as PropType<AutoCompleteProps['onClear']>, default: undefined },
    onPopupScroll: {
      type: Function as PropType<AutoCompleteProps['onPopupScroll']>,
      default: undefined,
    },
    onInputKeyDown: {
      type: Function as PropType<AutoCompleteProps['onInputKeyDown']>,
      default: undefined,
    },
  },
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`）——其余回调是 props 形态
   * （PITFALLS 35：声明 emits 会把 onXxx 从 attrs 摘掉，形成双通道）。
   */
  emits: ['update:value'],
  setup(props, { slots, emit, expose, attrs }) {
    const devWarning = useDevWarning('AutoComplete');
    const { getPrefixCls } = useConfigContext();

    // ============================ Prefix ==============================
    // antd：getPrefixCls('select', custom) —— **复用 select 前缀**
    const prefixCls = computed(() => getPrefixCls('select', props.prefixCls));

    // ============================ Warning ==============================
    watchEffect(() => {
      // deprecated ×6（antd 逐字；dropdownRender/popupRender fn 形态已随 C8-R2
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
      devWarning.deprecated(
        props.onDropdownVisibleChange === undefined,
        'onDropdownVisibleChange',
        'onOpenChange',
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
          const obj = item as { value: string; text: string };
          return [{ value: obj.value, label: obj.text }];
        }
        return [];
      });
    };

    // ====================== Merged props（antd 逐字）===================
    const mergedPopupMatchSelectWidth = computed(
      () => props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth,
    );
    const mergedOnOpenChange = computed(() => props.onOpenChange ?? props.onDropdownVisibleChange);

    // ========================= Semantic ================================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      AutoCompleteProps,
      AutoCompleteSemanticClassNames,
      AutoCompleteSemanticStyles
    >([() => props.classNames], [() => props.styles], props);

    const finalClassNames = computed<AutoCompleteSemanticClassNames>(() => ({
      root: [
        `${prefixCls.value}-auto-complete`,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class as string | undefined,
        mergedClassNames.value.root,
      ]
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
      root: { ...mergedStyles.value.root, ...((attrs.style as Record<string, unknown>) ?? {}) },
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
    const selectRef = ref<ComponentPublicInstance | null>(null);
    expose({
      focus: (options?: FocusOptions) =>
        (selectRef.value as unknown as { focus: (o?: FocusOptions) => void } | null)?.focus(
          options,
        ),
      blur: () => (selectRef.value as unknown as { blur: () => void } | null)?.blur(),
      scrollTo: (arg?: number | { top: number }) =>
        (selectRef.value as unknown as { scrollTo: (a?: never) => void } | null)?.scrollTo(
          arg as never,
        ),
    });

    // ============================ Render ===============================
    return () => {
      // F02: classify this render’s slot, including conditional slot functions.
      const children = collectSelectChildren(slots.default?.());
      const info = classifyChildren(children);
      warnCustomInputIfNeeded(info);

      // 透传给 Select 的插槽：default（Option 列表 / dataSource 派生）+ 其余具名插槽；
      // suffixIcon：用户插槽优先，否则空渲染（antd 的 suffixIcon={null}）。
      const selectSlots: Record<string, () => unknown> = {};
      const passThrough = [
        'popupRender',
        'placeholder',
        'notFoundContent',
        'optionRender',
        'tagRender',
        'labelRender',
        'clearIcon',
        'removeIcon',
        'menuItemSelectedIcon',
        'loadingIcon',
        'prefix',
      ];
      for (const name of passThrough) {
        const fn = slots[name];
        if (typeof fn === 'function') selectSlots[name] = fn as () => unknown;
      }
      if (slots.suffixIcon) {
        selectSlots.suffixIcon = slots.suffixIcon as () => unknown;
      } else {
        // antd 的 suffixIcon={null}：空渲染 ⇒ getSuffixIconNode(null) ⇒ 无箭头
        selectSlots.suffixIcon = () => null;
      }

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
              const obj = item as { value: string; text: string };
              return h(SelectOption, { key: obj.value, value: obj.value }, () => obj.text);
            }
            return null;
          });
        }
        return [];
      };

      // ⚠️ `as never`：Select 的 props 表是运行时宽（PropType 推断带 undefined 交集），
      // vue-tsc 对跨组件 h() 的 props 重载解析过严（PITFALLS 137 同族）——
      // 两张 props 表逐字同形，边界 cast 不掩盖真实类型问题。
      return h(
        Select,
        {
          ref: selectRef,
          // ---- 全量转发（antd 的 {...omit(props, [...])}；omit 的五个键已并入
          //      merged 类名/回调，不在此列）----
          id: props.id,
          // antd：类名同时进 classNames.root 与 Select 根 —— 上游产物里
          // root 类名出现两次（L4 基线逐字，勿「顺手修复」）。
          // ✅ Select 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`。
          class: attrs.class as string | undefined,
          prefixCls: prefixCls.value,
          value: props.value,
          defaultValue: props.defaultValue,
          options: getOptions(info),
          placeholder: props.placeholder,
          disabled: props.disabled,
          size: props.size,
          variant: props.variant,
          status: props.status,
          allowClear: props.allowClear,
          autoFocus: props.autoFocus,
          defaultActiveFirstOption: props.defaultActiveFirstOption,
          backfill: props.backfill,
          open: props.open,
          defaultOpen: props.defaultOpen,
          tabIndex: props.tabIndex,
          listHeight: props.listHeight,
          listItemHeight: props.listItemHeight,
          virtual: props.virtual,
          placement: props.placement,
          maxLength: props.maxLength,
          showSearch: props.showSearch,
          searchValue: props.searchValue,
          filterOption: props.filterOption,
          popupMatchSelectWidth: mergedPopupMatchSelectWidth.value,
          classNames: finalClassNames.value,
          styles: finalStyles.value,
          // ---- 回调 1:1 转发（Select 同名 prop）----
          onChange: props.onChange,
          onSelect: props.onSelect,
          onDeselect: props.onDeselect,
          onSearch: props.onSearch,
          onOpenChange: mergedOnOpenChange.value,
          onFocus: props.onFocus,
          onBlur: props.onBlur,
          onClear: props.onClear,
          onPopupScroll: props.onPopupScroll,
          onInputKeyDown: props.onInputKeyDown,
          // ---- mode：内核 combobox 分支（公开类型不含，边界 cast）----
          mode: 'combobox' as never,
          // ---- v-model:value 中继（C11：Select 的 update:value → 本组件 emit）----
          'onUpdate:value': (v: unknown) => emit('update:value', v),
          ...attrs,
        } as never,
        selectSlots,
      );
    };
  },
});

export default AutoCompleteComponent;
