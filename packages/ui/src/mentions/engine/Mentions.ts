/**
 * `@rc-component/mentions@1.12.0` 的 `es/Mentions.js`（296 行）—— 引擎本体。
 *
 * 上游是**两层**：
 *   - 外层（`Mentions`）：`suffix` / `allowClear` 存在时用 `BaseInput` 包一层 affix wrapper；
 *   - 内层（`InternalMentions`）：受控值、measure 状态机、键盘、focus/blur、候选归一。
 * 本文件保持同样的两层（与上游同构，便于逐条对拍）。
 *
 * ── 与上游的四处**必守**差异（照抄就错，见 docs/analysis/mentions.md §4）─────────
 *
 * 1. 🚨 **`onKeyUp` 必须由 `RcTextArea` 声明成 prop**（本文件传的是 prop 名 `onKeyUp`）。
 *    若 `RcTextArea` 没声明它，Vue 会把它放进 attrs 并 hyphenate 成 **`key-up`**
 *    ⇒ 监听器挂在一个永不触发的事件上 ⇒ **候选面板永远不出现，且没有任何报错**。
 * 2. **textarea 的 prefixCls 显式写 `'rc-textarea'`** —— 上游不传，走 rc-input 的默认值。
 *    逐字保留（D43 同判：固定常量，不随 prefixCls 变），否则 DOM 契约直接偏。
 * 3. `children` 的读取：React 的 `<Option>Afc163</Option>` 里 `Afc163` 是 **prop**
 *    （`props.children`），Vue 里它是**默认插槽** ⇒ 要读 `vnode.children`（含 `Comment` 归一，
 *    见 `readOptionLabel`）。
 * 4. `useEffectState` 的「下一次提交之后」用 `watch(..., {flush:'post'})` 实现
 *    （见 `./use-effect-state.ts`）。
 *
 * ── 状态机与判据**逐条**写在下面每个函数上方 ────────────────────────────────────
 * 完整版（含 `onKeyUp` 的分支表）见 `docs/analysis/mentions.md` §2。
 */

import { KeyCode, toArray, useControlledValue } from '@apollo-design/utils';
import {
  Comment,
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  type PropType,
  provide,
  ref,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';
import { BaseInput } from '../../input/engine/BaseInput';
import { RcTextArea } from '../../input/engine/TextArea';
import type { MentionsOptionProps } from '../interface';
import {
  type MentionsContextValue,
  mentionsContextKey,
  type UnstableContextProps,
  unstableContextKey,
} from './context';
import type { NormalizedOption } from './DropdownMenu';
import { KeywordTrigger } from './KeywordTrigger';
import { useEffectState } from './use-effect-state';
import {
  filterOption as defaultFilterOption,
  validateSearch as defaultValidateSearch,
  getBeforeSelectionText,
  getLastMeasureIndex,
  replaceWithMeasure,
  setInputSelection,
} from './util';

/** `Mentions.Option` —— **不产任何 DOM**（上游 `const Option = () => null`）。 */
export const MentionsOption = defineComponent({
  name: 'AMentionsOption',
  inheritAttrs: false,
  props: {
    value: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  },
  setup() {
    return () => null;
  },
});

/** 默认的「找不到候选」文案（上游 `notFoundContent = 'Not Found'`）。 */
const DEFAULT_NOT_FOUND = 'Not Found';

/** 全局计数器：`data-menu-id` 的 uuid 段（上游是 `useId(props.id)`）。 */
let mentionsUid = 0;

/** 下一个实例 id（`props.id` 优先）。 */
function nextMentionsId(): string {
  mentionsUid += 1;
  return `apollo-mentions-${mentionsUid}`;
}

/**
 * 读一个 `Option` vnode 的展示内容。
 *
 * ⚠️ Vue 的坑（PITFALLS 同族）：**插槽把 `null` 归一成 `Comment` vnode**
 *    ⇒ `vnode.children` 永远非空，必须显式过滤 `Comment`；
 *    但 `Text('')`（空字符串）要**保留**（上游的 `''` 是**有值**的）。
 */
function readOptionLabel(vnode: VNode): unknown {
  const children = vnode.children;
  if (children === null || children === undefined) {
    return undefined;
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return children;
  }
  if (Array.isArray(children)) {
    const filtered = children.filter((child) => !(isVNode(child) && child.type === Comment));
    if (filtered.length === 0) {
      return undefined;
    }
    return filtered.length === 1 ? filtered[0] : filtered;
  }
  if (typeof children === 'object' && 'default' in children) {
    return (children as { default?: () => VNodeChild }).default?.();
  }
  return undefined;
}

/**
 * 把 `<Mentions.Option>` 的 vnode 列表归一成 `options` 数组。
 *
 * 🚨 **必须在 render 函数里调用**（`RcMentions` 的渲染期）：
 *    Vue 的插槽函数只能在渲染期求值，在 `computed` / `watch` 里调用会打
 *    `Slot "default" invoked outside of the render function`
 *    （实测：4 个 demo 的冒烟全红，且那条告警会**盖掉**真正的告警）。
 *    React 侧没有这条约束（`children` 就是普通 prop）⇒ 本仓用「外层 render 里
 *    先把 children 归一成数据，再作为 `options` 往下传」来消除这个差异。
 */
export function mentionsChildrenToOptions(nodes: readonly unknown[]): MentionsOptionProps[] {
  return nodes
    .filter((node): node is VNode => isVNode(node))
    .map((node) => {
      const optionProps = (node.props ?? {}) as Record<string, unknown>;
      const key = node.key;
      return {
        ...(optionProps as unknown as MentionsOptionProps),
        label: readOptionLabel(node) as VNodeChild,
        ...(typeof key === 'string' || typeof key === 'number' ? { key } : {}),
      };
    });
}

// ---------------------------------------------------------------------------
// 内层：InternalMentions
// ---------------------------------------------------------------------------

export const InternalMentions = defineComponent({
  name: 'AMentionsInternal',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    /**
     * ⚠️ 上游**不**解构 `id`（它留在 `restProps` 里透传给 `textarea`），
     *    但又用 `useId(props.id)` 读它。本仓声明成 prop（Vue 需要显式声明才能读）
     *    并**显式转发**给 `RcTextArea` ⇒ 落点与上游一致（`<textarea id>`）。
     */
    id: { type: String, default: undefined },
    className: { type: [String, Array, Object] as PropType<unknown>, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    // ---- Misc ----
    prefix: { type: [String, Array] as PropType<string | string[]>, default: '@' },
    split: { type: String, default: ' ' },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: DEFAULT_NOT_FOUND },
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    options: { type: Array as PropType<MentionsOptionProps[]>, default: undefined },
    allowClear: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    /** 外层是否套了 `BaseInput`（有 suffix/allowClear）⇒ 内层不再渲染自己的根 div。 */
    hasWrapper: { type: Boolean, default: undefined },
    silent: { type: Boolean, default: undefined },
    // ---- Events ----
    validateSearch: {
      type: Function as PropType<(text: string, split: string) => boolean>,
      default: undefined,
    },
    filterOption: {
      type: [Boolean, Function] as PropType<
        false | ((input: string, option: MentionsOptionProps) => boolean)
      >,
      default: undefined,
    },
    onChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onKeyUp: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onPressEnter: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onSearch: {
      type: Function as PropType<(text: string, prefix: string) => void>,
      default: undefined,
    },
    onSelect: {
      type: Function as PropType<(option: MentionsOptionProps, prefix: string) => void>,
      default: undefined,
    },
    onFocus: { type: Function as PropType<(e?: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(e?: FocusEvent) => void>, default: undefined },
    // ---- Dropdown ----
    transitionName: { type: String, default: undefined },
    placement: { type: String as PropType<'top' | 'bottom' | undefined>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl' | undefined>, default: undefined },
    getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
    popupClassName: { type: String, default: undefined },
    rows: { type: Number, default: 1 },
    onPopupScroll: { type: Function as PropType<(e: Event) => void>, default: undefined },
    popupRender: {
      type: Function as PropType<(menu: VNodeChild) => VNodeChild>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose }) {
    // =============================== Refs ===============================
    const containerRef = ref<HTMLElement | null>(null);
    const measureRef = ref<HTMLElement | null>(null);
    const textareaRef = shallowRef<{
      focus?: (option?: { preventScroll?: boolean }) => void;
      blur?: () => void;
      resizableTextArea?: { textArea: HTMLTextAreaElement | null };
      nativeElement?: HTMLElement | null;
    } | null>(null);

    const getTextArea = (): HTMLTextAreaElement | null =>
      textareaRef.value?.resizableTextArea?.textArea ?? null;

    expose({
      focus: () => textareaRef.value?.focus?.(),
      blur: () => textareaRef.value?.blur?.(),
      get textarea() {
        return getTextArea();
      },
      get nativeElement() {
        return containerRef.value;
      },
    });

    // ============================== State ===============================
    const measuring = ref(false);
    const measureText = ref('');
    const measurePrefix = ref('');
    const measureLocation = ref(0);
    const activeIndex = ref(0);
    const isFocus = ref(false);

    // =============================== Id =================================
    const uniqueKey = props.id ?? nextMentionsId();

    // ============================== Value ===============================
    const [mergedValue, setMergedValue] = useControlledValue<string>({
      defaultValue: () => props.defaultValue ?? '',
      getValue: () => props.value,
    });

    // =============================== Open ===============================
    // UnstableContext（语义预览的强制展开）—— 见 engine/context.ts
    const unstable = inject<UnstableContextProps | undefined>(unstableContextKey, undefined);
    const unstableOpen = computed(() => unstable?.open === true);

    const mergedPrefix = computed<string[]>(() =>
      Array.isArray(props.prefix) ? props.prefix : [props.prefix],
    );

    // 测量层的滚动位置跟随 textarea（rc 的 useEffect([measuring])）
    watch(
      measuring,
      () => {
        const el = measureRef.value;
        const textarea = getTextArea();
        if (measuring.value && el && textarea) {
          el.scrollTop = textarea.scrollTop;
        }
      },
      { flush: 'post' },
    );

    const mergedMeasure = computed<[boolean, string, string, number]>(() => {
      if (unstableOpen.value) {
        const value = mergedValue.value ?? '';
        for (let i = 0; i < mergedPrefix.value.length; i += 1) {
          const curPrefix = mergedPrefix.value[i] as string;
          const index = value.lastIndexOf(curPrefix);
          if (index >= 0) {
            return [true, '', curPrefix, index];
          }
        }
      }
      return [measuring.value, measureText.value, measurePrefix.value, measureLocation.value];
    });
    const mergedMeasuring = computed(() => mergedMeasure.value[0]);
    const mergedMeasureText = computed(() => mergedMeasure.value[1]);
    const mergedMeasurePrefix = computed(() => mergedMeasure.value[2]);
    const mergedMeasureLocation = computed(() => mergedMeasure.value[3]);

    // ============================== Option ==============================
    const optionFilter = computed(() => props.filterOption);

    const getOptions = (targetMeasureText: string): NormalizedOption[] => {
      const list: NormalizedOption[] = (props.options ?? []).map((item) => ({
        ...item,
        key: `${item.key ?? item.value}-${uniqueKey}`,
      }));
      const filter = optionFilter.value;
      return list.filter((option) => {
        /** `filterOption === false` ⇒ 全保留。 */
        if (filter === false) {
          return true;
        }
        return (filter ?? defaultFilterOption)(targetMeasureText, option);
      });
    };

    const mergedOptions = computed<NormalizedOption[]>(() => getOptions(mergedMeasureText.value));

    const getEnabledActiveIndex = (index: number, offset = 1): number => {
      const len = mergedOptions.value.length;
      if (!len) {
        return -1;
      }
      for (let i = 0; i < len; i += 1) {
        const current = (index + i * offset + len) % len;
        const option = mergedOptions.value[current];
        if (!option?.disabled) {
          return current;
        }
      }
      return -1;
    };

    const setActiveIndex = (index: number): void => {
      activeIndex.value = index;
    };

    // 候选变化后修正高亮（上游 useEffect）
    watch([mergedMeasuring, mergedOptions, activeIndex], () => {
      if (!mergedMeasuring.value) {
        return;
      }
      const currentOption = mergedOptions.value[activeIndex.value];
      if (!currentOption || currentOption.disabled) {
        setActiveIndex(getEnabledActiveIndex(0));
      }
    });

    // ============================= Measure ==============================
    const onSelectionEffect = useEffectState();

    const startMeasure = (
      nextMeasureText: string,
      nextMeasurePrefix: string,
      nextMeasureLocation: number,
    ): void => {
      measuring.value = true;
      measureText.value = nextMeasureText;
      measurePrefix.value = nextMeasurePrefix;
      measureLocation.value = nextMeasureLocation;
      activeIndex.value = getEnabledActiveIndex(0);
    };

    const stopMeasure = (callback?: () => void): void => {
      measuring.value = false;
      measureLocation.value = 0;
      measureText.value = '';
      onSelectionEffect(() => callback?.());
    };

    // ============================== Change ==============================
    const triggerChange = (nextValue: string): void => {
      setMergedValue(nextValue);
      props.onChange?.(nextValue);
    };

    const onInternalChange = (e: unknown): void => {
      const nextValue = (e as { target?: { value?: string } })?.target?.value ?? '';
      triggerChange(nextValue);
    };

    const selectOption = (option: MentionsOptionProps | undefined): void => {
      if (!option || option.disabled) {
        return;
      }
      const mentionValue = option.value ?? '';
      const { text, selectionLocation } = replaceWithMeasure(mergedValue.value ?? '', {
        measureLocation: mergedMeasureLocation.value,
        targetText: mentionValue,
        prefix: mergedMeasurePrefix.value,
        selectionStart: getTextArea()?.selectionStart ?? 0,
        split: props.split,
      });
      triggerChange(text);
      stopMeasure(() => {
        const textarea = getTextArea();
        if (textarea) {
          setInputSelection(textarea, selectionLocation);
        }
      });
      props.onSelect?.(option, mergedMeasurePrefix.value);
    };

    // ============================= KeyEvent =============================
    const onInternalKeyDown = (event: KeyboardEvent): void => {
      const { which } = event;
      props.onKeyDown?.(event);

      if (!mergedMeasuring.value) {
        return;
      }
      if (which === KeyCode.UP || which === KeyCode.DOWN) {
        const optionLen = mergedOptions.value.length;
        if (!optionLen) {
          return;
        }
        const offset = which === KeyCode.UP ? -1 : 1;
        const newActiveIndex = getEnabledActiveIndex(activeIndex.value + offset, offset);
        if (newActiveIndex !== -1) {
          activeIndex.value = newActiveIndex;
        }
        event.preventDefault();
      } else if (which === KeyCode.ESC) {
        stopMeasure();
      } else if (which === KeyCode.ENTER) {
        event.preventDefault();
        // loading 时跳过（`silent`）
        if (props.silent) {
          return;
        }
        if (!mergedOptions.value.length) {
          stopMeasure();
          return;
        }
        let targetIndex = activeIndex.value;
        const active = mergedOptions.value[targetIndex];
        if (!active || active.disabled) {
          targetIndex = getEnabledActiveIndex(0);
        }
        if (targetIndex === -1) {
          stopMeasure();
          return;
        }
        activeIndex.value = targetIndex;
        selectOption(mergedOptions.value[targetIndex]);
      }
    };

    /**
     * 开始 / 停止测量的**唯一入口**（判据逐条见 analysis §2.2）。
     *
     * ⚠️ `onKeyUp?.(event)` 在**白名单 return 之前** —— 上游如此，逐字保留。
     */
    const onInternalKeyUp = (event: KeyboardEvent): void => {
      const { key, which } = event;
      const target = event.target as HTMLTextAreaElement;
      const selectionStartText = getBeforeSelectionText(target);
      const { location: measureIndex, prefix: nextMeasurePrefix } = getLastMeasureIndex(
        selectionStartText,
        mergedPrefix.value,
      );

      props.onKeyUp?.(event);

      if ([KeyCode.ESC, KeyCode.UP, KeyCode.DOWN, KeyCode.ENTER].indexOf(which) !== -1) {
        return;
      }
      if (measureIndex !== -1) {
        const nextMeasureText = selectionStartText.slice(measureIndex + nextMeasurePrefix.length);
        const validateMeasure = (props.validateSearch ?? defaultValidateSearch)(
          nextMeasureText,
          props.split,
        );
        const matchOption = !!getOptions(nextMeasureText).length;
        if (validateMeasure) {
          if (
            key === nextMeasurePrefix ||
            key === 'Shift' ||
            which === KeyCode.ALT ||
            key === 'AltGraph' ||
            mergedMeasuring.value ||
            (nextMeasureText !== mergedMeasureText.value && matchOption)
          ) {
            startMeasure(nextMeasureText, nextMeasurePrefix, measureIndex);
          }
        } else if (mergedMeasuring.value) {
          stopMeasure();
        }

        if (props.onSearch && validateMeasure) {
          props.onSearch(nextMeasureText, nextMeasurePrefix);
        }
      } else if (mergedMeasuring.value) {
        stopMeasure();
      }
    };

    const onInternalPressEnter = (event: KeyboardEvent): void => {
      if (!mergedMeasuring.value && props.onPressEnter) {
        props.onPressEnter(event);
      }
    };

    // ============================ Focus Blur ============================
    const focusRef = ref<ReturnType<typeof setTimeout> | undefined>(undefined);

    const onInternalFocus = (event?: FocusEvent): void => {
      if (focusRef.value !== undefined) {
        clearTimeout(focusRef.value);
      }
      if (!isFocus.value && event && props.onFocus) {
        props.onFocus(event);
      }
      isFocus.value = true;
    };

    const onInternalBlur = (event?: FocusEvent): void => {
      focusRef.value = setTimeout(() => {
        isFocus.value = false;
        stopMeasure();
        props.onBlur?.(event);
      }, 0);
    };

    const onDropdownFocus = (): void => {
      onInternalFocus();
    };
    const onDropdownBlur = (): void => {
      onInternalBlur();
    };

    // ============================== Scroll ==============================
    const onInternalPopupScroll = (event: Event): void => {
      props.onPopupScroll?.(event);
    };

    // ============================ Context ===============================
    // provide 只能在 setup 里调用 ⇒ 用 computed 承载（语义等价于 React 的 value={{...}}）
    provide(
      mentionsContextKey,
      computed<MentionsContextValue>(() => ({
        notFoundContent: props.notFoundContent,
        activeIndex: activeIndex.value,
        setActiveIndex,
        selectOption,
        onFocus: onDropdownFocus,
        onBlur: onDropdownBlur,
        onScroll: onInternalPopupScroll,
      })),
    );

    // ============================== Styles ==============================
    const mergedStyles = computed(() => {
      const style = props.style;
      const styles = props.styles;
      const resizeStyle = styles?.textarea?.resize ?? style?.resize;
      const mergedTextareaStyle: Record<string, string | number> = {
        ...(styles?.textarea ?? {}),
      };
      if (resizeStyle !== undefined) {
        mergedTextareaStyle.resize = resizeStyle;
      }
      return { ...(styles ?? {}), textarea: mergedTextareaStyle };
    });

    /**
     * 根元素要额外挂的类（由**外层 `BaseInput` 的 clone** 传进来）。
     *
     * 🚨 这里踩过一个坑（PITFALLS 同族）：`BaseInput` 合并根类名用的是
     * `h(child.type, { ..., class: [...] })` —— 对**原生元素**子节点没问题，
     * 但 `InternalMentions` 是**组件** ⇒ `class` 落进它的 `attrs`（`inheritAttrs: false`
     * 不会自动挂上）⇒ **整批根类名静默丢失**（`-outlined` / `-sm` / `-lg` /
     * 用户的 `className` / `rootClassName` / `-css-var`）。
     *
     * 上游是 React 的 `cloneElement(child, {className})` —— 对组件子节点会把
     * `className` 合并进它的 **props**（而 InternalMentions 正好读 `className`）。
     * Vue 的等价物就是「显式读 `attrs.class` 并挂到根上」。
     */
    const rootExtraClass = computed(() => (attrs as { class?: unknown }).class);

    /** 转发给 `<textarea>` 的 attrs —— **剥掉 `class`**（它归根元素，不能落到 textarea 上）。 */
    const textareaAttrs = computed<Record<string, unknown>>(() => {
      const rest: Record<string, unknown> = { ...(attrs as Record<string, unknown>) };
      delete rest.class;
      return rest;
    });

    // ============================== Render ==============================
    return () => {
      const p = props.prefixCls;

      const textareaNode = h(RcTextArea, {
        ...textareaAttrs.value,
        ref: textareaRef,
        // 🚨 逐字保留 rc-input 的默认前缀（上游不给 TextArea 传 prefixCls）
        prefixCls: 'rc-textarea',
        classNames: { textarea: props.classNames?.textarea },
        styles: mergedStyles.value as never,
        value: mergedValue.value,
        rows: props.rows,
        id: props.id,
        onChange: onInternalChange,
        /**
         * 🚨 **本仓必须显式处理 `onChange`**（`docs/foundation/rc-util-contract.md` §6.1）：
         * React 的 `onChange` 在文本输入上等价于原生 **`input`**（每次击键），
         * 而 Vue 的 `onChange` 监听的是原生 **`change`**（失焦才触发）。
         *
         * 上游只写 `onChange`（React 语义）⇒ 本仓若只照抄，`mergedValue` 会**停在失焦前的旧值**，
         * 而 `selectOption` 用 `mergedValue` 调 `replaceWithMeasure`
         * ⇒ **回填会基于旧文本**（jsdom 测得出、类型与结构断言都抓不到）。
         *
         * `onInput` 不在 `RcTextArea` 的 props 里 ⇒ 落进它的 `attrs` 并被摊到 `<textarea>` 上
         * （单段名不会被 hyphenate，实测 `input` 事件正常）。保留 `onChange` 是因为
         * 它同时覆盖「失焦提交」这条路径（值相同时幂等）。
         */
        onInput: onInternalChange,
        onKeyDown: onInternalKeyDown,
        onKeyUp: onInternalKeyUp,
        onPressEnter: onInternalPressEnter,
        onFocus: onInternalFocus,
        onBlur: onInternalBlur,
      } as never);

      const measureNode = mergedMeasuring.value
        ? h('div', { ref: measureRef, class: `${p}-measure` }, [
            (mergedValue.value ?? '').slice(0, mergedMeasureLocation.value),
            h(
              KeywordTrigger,
              {
                prefixCls: `${p}-dropdown`,
                options: mergedOptions.value,
                // ⚠️ 上游恒传 `visible: true`（组件只在 measuring 时渲染）
                visible: true,
                transitionName: props.transitionName,
                placement: props.placement,
                direction: props.direction,
                getPopupContainer: props.getPopupContainer,
                // ⚠️ 上游是 `clsx(popupClassName, mentionClassNames?.popup)` ——
                //    `classNames.popup` 里带着 `{p}-css-var`（组件 token 的声明块挂在那上面，
                //    而**浮层不在 `.mentions` 的子树里**）⇒ 漏了它，浮层里的
                //    `var(--{p}-mentions-*)` 全部失效（padding 回退 0，L6 实测红）。
                popupClassName: [props.popupClassName, props.classNames?.popup] as never,
                popupStyle: props.styles?.popup,
                popupRender: props.popupRender,
              },
              { default: () => [h('span', null, mergedMeasurePrefix.value)] },
            ),
            (mergedValue.value ?? '').slice(
              mergedMeasureLocation.value + mergedMeasurePrefix.value.length,
            ),
          ])
        : null;

      const mentionNode = [textareaNode, measureNode];

      if (!props.hasWrapper) {
        return h(
          'div',
          {
            class: [p, props.className, rootExtraClass.value],
            style: props.style,
            ref: containerRef,
          },
          mentionNode,
        );
      }
      return mentionNode;
    };
  },
});

// ---------------------------------------------------------------------------
// 外层：RcMentions（suffix / allowClear 时套 BaseInput）
// ---------------------------------------------------------------------------

export const RcMentions = defineComponent({
  name: 'AMentionsRc',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'rc-mentions' },
    className: { type: [String, Array, Object] as PropType<unknown>, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
    id: { type: String, default: undefined },
    allowClear: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    /**
     * ⚠️ 上游靠 `...rest` 把 `options` 透传给内层；本仓外层要在 **render 期**
     * 把 `<Mentions.Option>` 的插槽归一成 `options`（见 `mentionsChildrenToOptions`）
     * ⇒ **必须声明它**，否则 `props.options` 恒 `undefined`，数据驱动的候选项会全部丢失。
     */
    options: { type: Array as PropType<MentionsOptionProps[]>, default: undefined },
    onChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const hasSuffix = computed(() => !!(props.suffix || props.allowClear));

    const holderEl = shallowRef<HTMLElement | null>(null);
    const innerRef = shallowRef<{
      focus?: () => void;
      blur?: () => void;
      textarea?: HTMLTextAreaElement | null;
      nativeElement?: HTMLElement | null;
    } | null>(null);

    const [mergedValue, setMergedValue] = useControlledValue<string>({
      defaultValue: () => props.defaultValue ?? '',
      getValue: () => props.value,
    });

    const triggerChange = (currentValue: string): void => {
      setMergedValue(currentValue);
      props.onChange?.(currentValue);
    };
    const handleReset = (): void => {
      triggerChange('');
    };

    expose({
      focus: () => innerRef.value?.focus?.(),
      blur: () => innerRef.value?.blur?.(),
      get textarea() {
        return innerRef.value?.textarea ?? null;
      },
      get nativeElement() {
        return holderEl.value ?? innerRef.value?.nativeElement ?? null;
      },
    });

    return () => {
      /**
       * 🚨 **在这里（render 期）读子插槽**，把 `<Mentions.Option>` 归一成 `options`
       *    —— 见 `mentionsChildrenToOptions` 的注释（在 `computed` 里读会打
       *    `Slot "default" invoked outside of the render function`）。
       */
      const childNodes = toArray(slots.default?.() ?? []);
      const normalizedOptions: MentionsOptionProps[] =
        props.options && props.options.length > 0
          ? props.options
          : mentionsChildrenToOptions(childNodes);

      return h(
        BaseInput,
        {
          prefixCls: props.prefixCls,
          suffix: props.suffix,
          value: mergedValue.value,
          allowClear: props.allowClear,
          className: [
            props.prefixCls,
            props.className,
            { [`${props.prefixCls}-has-suffix`]: hasSuffix.value },
          ],
          classNames: props.classNames,
          disabled: props.disabled,
          onReset: handleReset,
          onClear: props.onClear,
          onExposeElement: (el: HTMLElement | null) => {
            holderEl.value = el;
          },
        } as never,
        {
          default: () => [
            h(InternalMentions, {
              ...attrs,
              ref: innerRef,
              className: props.classNames?.mentions,
              styles: props.styles,
              classNames: props.classNames,
              prefixCls: props.prefixCls,
              id: props.id,
              onChange: triggerChange,
              disabled: props.disabled,
              hasWrapper: hasSuffix.value,
              options: normalizedOptions,
              /**
               * ⚠️ **必须显式传 `value`**：上游靠 `BaseInput` 的
               * `cloneElement(inputElement, { value, className })` 把值注入内层；
               * 本仓 `input/engine/BaseInput.ts` 只对**原生元素**子节点做类名/样式合并，
               * 不传 `value`（它的既有消费者都是原生 `<input>` / `<textarea>`，各自带值）
               * ⇒ 组件子节点拿不到值，textarea 会**恒空**。
               */
              value: mergedValue.value,
            } as never),
          ],
        },
      );
    };
  },
});

export default RcMentions;
