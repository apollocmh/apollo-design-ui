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
 * 6. **默认插槽始终下传**：Select 的 `parsed` 是 computed，只在「上次求值读到的
 *    reactive 依赖」变化时重算。某个渲染周期**不下传** default slot ⇒ 那次求值
 *    什么都不 track ⇒ 之后插槽再回来时 computed 是干净的 ⇒ 选项永远停在上一个
 *    周期（#14.3 实测：自定义输入结构切回 Option 列表后候选不恢复）。
 *    ⇒ 包装函数读 `optionInfo` / `hasVNodeItems` / `dataSource`（均 reactive）
 *    ⇒ `parsed` 间接跟踪分类态，任何插槽结构/内容变化都能穿透。
 */

import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  type ComponentPublicInstance,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  type VNode,
  watchEffect,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { SelectOption } from '../select';
import { OPTION_MARK } from '../select/engine/valueUtil';
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
    const optionInfo = computed(() => {
      const nodes = (slots.default?.() ?? []) as VNode[];
      const realNodes = nodes.filter((n) => n && n.type !== Comment);

      // 1) 首个 child 是 SelectOption/OptGroup ⇒ 透传 default slot
      // ⚠️ 先提成局部变量：`isVNode(realNodes[0])` 收窄不了索引访问
      const firstNode = realNodes[0];
      if (
        realNodes.length &&
        isVNode(firstNode) &&
        (firstNode.type as Record<string, unknown>)?.[OPTION_MARK]
      ) {
        return { kind: 'children' as const };
      }

      // 2) 单个非 Option 元素 ⇒ 自定义输入元素（v1 未实现）
      if (realNodes.length === 1 && isVNode(realNodes[0])) {
        return { kind: 'children' as const, dropCustomInput: true };
      }

      return { kind: 'none' as const };
    });

    // 「自定义输入元素」usage 告警（antd 逐字文案）。
    // ⚠️ 放在**渲染期**而不是 `optionInfo` computed 里：computed 惰性求值 ——
    // 仅传 `options` 时 `mergedOptions` 首行短路、default 包装也不会被 Select
    // 调用（`childrenAsData = !options` = false）⇒ optionInfo 永不求值 ⇒
    // 告警消失（#14 修复时的回归实测）。沿对比触发 ⇒ 与旧代码「每个求值
    // 周期一次」等价，不会每个渲染周期刷屏。
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
    const mergedOptions = computed<DefaultOptionType[] | undefined>(() => {
      if (props.options) return props.options;
      // antd：childNodes[0] 是 Option/OptGroup ⇒ dataSource 不再参与。否则
      // options 非空会把 Select 的 children-as-data 通道整条堵死（#14.1 实测：
      // Option children 与 dataSource 同传 ⇒ children 反被丢）。
      if (optionInfo.value.kind === 'children' && !optionInfo.value.dropCustomInput) {
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
    });

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
      // 渲染期读一次分类态：① 驱动 `warnCustomInputIfNeeded`（告警时机）；
      // ② 让本组件的渲染效应跟踪 `optionInfo` —— 插槽结构变化 ⇒ 重新渲染
      //    ⇒ 下传新的 default 包装（旧代码在这里做分支判断，天然每渲染期求值）。
      const info = optionInfo.value;
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

      // 默认插槽**始终**下传（内容按分类/数据源三分支，空内容也传一个返回 [] 的 fn）：
      // ① Option children（首项是 Option/OptGroup）⇒ 透传 slots.default；
      // ② dataSource 含 VNode 项 ⇒ 整条 dataSource 走 children-as-data 通道
      //    （antd 的 optionChildren = dataSource.map：string/object 转 Option
      //    vnode，VNode 项原样透传）；
      // ③ 其余（无 children / 自定义输入元素被丢弃）⇒ 空列表。
      // ⚠️ 为什么必须始终下传：Select 的 `parsed` 是 **computed**，只在「上次求值
      // 读到的 reactive 依赖」变化时重算。某个渲染周期不下传 default slot ⇒ 那次
      // 求值 `slots.default?.()` 为 undefined、什么都不 track ⇒ 之后插槽再回来时
      // computed 是干净的 ⇒ 选项永远停在上一个周期（#14.3 实测：从自定义输入结构
      // 切回 Option 列表后候选不恢复，即使 Select 重渲染了）。
      // ⇒ 包装函数显式读 `optionInfo` / `hasVNodeItems` / `dataSource`（均 reactive）
      //    ⇒ `parsed` 间接跟踪分类态，插槽结构/内容变化都能穿透到选项列表。
      selectSlots.default = () => {
        if (optionInfo.value.kind === 'children' && !optionInfo.value.dropCustomInput) {
          return (slots.default as () => unknown)();
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
          options: mergedOptions.value,
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
