/**
 * rc-select `BaseSelect/index.js`（539 行）的 Vue 版 —— 交互外壳层。
 *
 * 它负责**一切与「操作」有关、与「值语义」无关**的事：
 *
 *   - open 状态机（含「关闭是延迟的」这条最容易踩的判据）
 *   - 键盘（Enter/Space 打开、Backspace 删末个 tag、↑↓/Enter/Tab/Esc 交给列表）
 *   - 焦点与「点外部关闭」
 *   - 清除、tokenSeparators 批量粘贴
 *   - 光标所在的 `aria-live` 播报（Polite）
 *
 * 值的语义（受控/非受控、labelInValue、过滤、tags 补 option）在 `Select.ts`。
 *
 * ⚠️ **`activeIndex` 在这里而不在 OptionList**（见 `OptionList.ts` 文件头）：
 * 键盘因此不需要跨组件命令式转发。
 */

import { getPlacements } from '@apollo-design/position';
import { KeyCode } from '@apollo-design/utils';
import type { ComponentPublicInstance, CSSProperties, PropType } from 'vue';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  type VNode,
  watch,
} from 'vue';
import { Trigger } from '../../_internal/trigger';
import type {
  CustomTagProps,
  DisplayValueType,
  InternalSelectMode,
  LabelInValueType,
  RawValueType,
  SelectCommonPlacement,
  SelectDirection,
  SelectSemanticClassNames,
  SelectSemanticStyles,
} from '../interface';
import { type BaseSelectContextValue, baseSelectContextKey, selectContextKey } from './context';
import OptionList from './OptionList';
import Selector from './Selector';
import { useLock, useOpen } from './useOpen';
import { resolveAllowClear } from './useOptions';
import { getSeparatedContent, isValidCount } from './valueUtil';

export interface SearchSource {
  source: 'typing' | 'effect' | 'submit' | 'blur';
}

const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');

export const BaseSelect = defineComponent({
  name: 'ABaseSelect',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, required: true },
    /**
     * 可访问名（2026-09-29 补）。必须在这里**声明**：Vue 只把已声明的键放进 `props`，
     * 未声明的会落进 `attrs`（`props.ariaLabel` 恒为 `undefined`，链就断了 —— 第一版实测）。
     */
    ariaLabel: { type: String, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    mode: { type: String as PropType<InternalSelectMode | undefined>, default: undefined },
    multiple: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
    searchValue: { type: String, default: '' },
    autoClearSearchValue: { type: Boolean, default: undefined },
    displayValues: { type: Array as PropType<DisplayValueType[]>, default: () => [] },
    activeValue: { type: String, default: undefined },
    activeDescendantId: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    notFoundContent: { type: null as unknown as PropType<unknown>, default: undefined },
    placeholder: { type: null as unknown as PropType<unknown>, default: undefined },
    maxLength: { type: Number, default: undefined },
    tabIndex: { type: Number, default: undefined },
    title: { type: String, default: undefined },
    allowClear: {
      type: [Boolean, Object] as PropType<boolean | { clearIcon?: unknown; label?: string }>,
      default: undefined,
    },
    clearIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    prefix: { type: null as unknown as PropType<unknown>, default: undefined },
    suffixIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    removeIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    tokenSeparators: {
      type: [Array, Function] as PropType<string[] | ((input: string) => string[])>,
      default: undefined,
    },
    tagRender: {
      type: Function as PropType<((props: CustomTagProps) => unknown) | undefined>,
      default: undefined,
    },
    maxTagCount: { type: Number, default: undefined },
    maxTagTextLength: { type: Number, default: undefined },
    maxTagPlaceholder: { type: null as unknown as PropType<unknown>, default: undefined },
    maxCount: { type: Number, default: undefined },
    emptyOptions: { type: Boolean, default: false },
    zIndex: { type: Number, default: undefined },
    placement: { type: String as PropType<SelectCommonPlacement>, default: undefined },
    direction: { type: String as PropType<SelectDirection>, default: 'ltr' },
    popupMatchSelectWidth: { type: [Boolean, Number], default: true },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    transitionName: { type: String, default: undefined },
    popupClassName: { type: String, default: undefined },
    popupStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    popupRender: {
      type: Function as PropType<((node: unknown) => unknown) | undefined>,
      default: undefined,
    },
    /**
     * 下拉列表渲染器（rc 的 `OptionList` prop）—— BaseSelect 只负责外壳协议
     * （开合 / 输入 / 展示值 / tag / 清除），列表本体由调用方注入。
     * Cascader 用它注入自己的多列面板。⚠️ 返回值必须是 VNode（不是数组）。
     */
    optionListRenderer: {
      type: Function as PropType<(() => unknown) | undefined>,
      default: undefined,
    },
    /**
     * raw trigger 协议（rc 的 `getRawInputElement` 同构）：提供时**不渲染**内建
     * Selector，改为渲染该函数返回的元素并注入开合/键盘/焦点事件与 aria-*。
     * React SSR 时 Cascader 只输出裸 children —— DOM 基线依赖此协议。
     * ⚠️ 必须与 `openOnTriggerClick` 配合使用（注入 onClick 的开关）。
     */
    getRawInputElement: {
      type: Function as PropType<(() => unknown) | undefined>,
      default: undefined,
    },
    /**
     * ⚠️ 实验开关（2026-09-28，Cascader 期）：点击 selector 切换开合。
     * rc 的 BaseSelect 有内建的点击开合，本仓 select 收口时**只测了受控 open**
     * （点击开合交互从未落地）。为不动 select 的既有行为，默认 false，
     * 由 Cascader 显式开启；select 补全交互时再翻默认值。
     */
    openOnTriggerClick: { type: Boolean, default: false },
    classNames: {
      type: Object as PropType<SelectSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<SelectSemanticStyles | undefined>, default: undefined },
    // ---- 回调（纯 prop，见 CHECKLIST #78）----
    onSearch: {
      type: Function as PropType<(text: string, info: SearchSource) => void>,
      default: undefined,
    },
    onSearchSplit: { type: Function as PropType<(words: string[]) => void>, default: undefined },
    onDisplayValuesChange: {
      type: Function as PropType<
        (
          values: DisplayValueType[],
          info: { type: 'add' | 'remove' | 'clear'; values: DisplayValueType[] },
        ) => void
      >,
      default: undefined,
    },
    onActiveValueChange: {
      type: Function as PropType<
        (
          value: RawValueType | null,
          index: number,
          info?: { source?: 'keyboard' | 'mouse' },
        ) => void
      >,
      default: undefined,
    },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onFocus: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(event: FocusEvent) => void>, default: undefined },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onPopupScroll: { type: Function as PropType<(event: Event) => void>, default: undefined },
    onInputKeyDown: {
      type: Function as PropType<(event: KeyboardEvent) => void>,
      default: undefined,
    },
    onKeyDown: { type: Function as PropType<(event: KeyboardEvent) => void>, default: undefined },
    onKeyUp: { type: Function as PropType<(event: KeyboardEvent) => void>, default: undefined },
  },
  emits: { 'update:open': (_open: boolean) => true },
  setup(props, { emit, expose, attrs }) {
    const selectCtx = inject(selectContextKey, null);

    const selectorRef = shallowRef<ComponentPublicInstance | null>(null);
    const optionListRef = shallowRef<{
      scrollTo: (arg?: number | { index?: number }) => void;
    } | null>(null);
    const triggerRef = shallowRef<{ popupElement: () => HTMLElement | null } | null>(null);

    const focused = ref(false);
    const multiple = computed(() => props.multiple);

    // ------------------------------ open ------------------------------
    // `notFoundContent` 为空且选项为空 ⇒ 不允许打开（rc 的 emptyListContent）
    const emptyListContent = computed(() => !props.notFoundContent && props.emptyOptions);

    const { rawOpen, mergedOpen, toggleOpen, lock } = useOpen({
      defaultOpen: () => props.defaultOpen,
      getOpen: () => props.open,
      onOpen: (next: boolean) => {
        props.onOpenChange?.(next);
        emit('update:open', next);
      },
      postOpen: (next: boolean) => (props.disabled || emptyListContent.value ? false : next),
    });

    // --------------------------- search value ---------------------------
    const mergedSearchValue = computed(() => {
      if (props.mode !== 'combobox') return props.searchValue;
      const val = props.displayValues[0]?.value;
      return typeof val === 'string' || typeof val === 'number' ? String(val) : '';
    });

    const tokenWithEnter = computed(() => {
      const sep = props.tokenSeparators;
      return (
        typeof sep === 'function' ||
        (Array.isArray(sep) ? sep : []).some((s) => ['\n', '\r\n'].includes(s))
      );
    });

    const splitByTokenSeparators = (input: string, end?: number): string[] | null => {
      const sep = props.tokenSeparators;
      if (typeof sep === 'function') {
        const tokens = sep(input);
        const isUnchanged = Array.isArray(tokens) && tokens.length === 1 && tokens[0] === input;
        if (!Array.isArray(tokens) || !tokens.length || isUnchanged) return null;
        return typeof end !== 'undefined' ? tokens.slice(0, end) : tokens;
      }
      return getSeparatedContent(input, sep, end);
    };

    const onInternalSearch = (
      searchText: string,
      fromTyping: boolean,
      isCompositing: boolean,
    ): boolean => {
      if (
        multiple.value &&
        isValidCount(props.maxCount) &&
        props.displayValues.length >= (props.maxCount as number)
      ) {
        return true;
      }
      let ret = true;
      let newSearchText = searchText;
      props.onActiveValueChange?.(null, -1, { source: 'keyboard' });
      const cap = isValidCount(props.maxCount)
        ? (props.maxCount as number) - props.displayValues.length
        : undefined;
      const patchLabels = isCompositing ? null : splitByTokenSeparators(searchText, cap);

      if (props.mode !== 'combobox' && patchLabels) {
        newSearchText = '';
        props.onSearchSplit?.(patchLabels);
        toggleOpen(false);
        ret = false;
      }
      if (props.onSearch && mergedSearchValue.value !== newSearchText) {
        props.onSearch(newSearchText, { source: fromTyping ? 'typing' : 'effect' });
      }
      if (searchText && fromTyping && ret) {
        toggleOpen(true);
      }
      return ret;
    };

    const onInternalSearchSubmit = (searchText: string): void => {
      if (!searchText?.trim()) return;
      props.onSearch?.(searchText, { source: 'submit' });
    };

    // 关闭时清搜索（非多选、非 combobox）—— 用 rawOpen 判据
    watch(rawOpen, () => {
      if (!rawOpen.value && !multiple.value && props.mode !== 'combobox') {
        onInternalSearch('', false, false);
      }
    });

    // disabled 时关闭 + 去焦点
    watch(
      [() => props.disabled, mergedOpen],
      () => {
        if (props.disabled) {
          toggleOpen(false);
          focused.value = false;
        }
      },
      { immediate: true },
    );

    // ------------------------------ 清除 ------------------------------
    const onClearMouseDown = (): void => {
      props.onClear?.();
      (selectorRef.value as { focus?: () => void } | null)?.focus?.();
      props.onDisplayValuesChange?.([], { type: 'clear', values: props.displayValues });
      onInternalSearch('', false, false);
    };

    const allowClearResult = computed(() =>
      resolveAllowClear({
        displayValues: props.displayValues as unknown as LabelInValueType[],
        allowClear: props.allowClear,
        clearIcon: props.clearIcon,
        disabled: props.disabled,
        searchValue: mergedSearchValue.value,
        mode: props.mode,
      }),
    );

    // -------------------------- activeIndex --------------------------
    const activeIndex = ref(-1);
    const flatten = computed(() => selectCtx?.value.flattenOptions ?? []);
    const rawValues = computed(() => selectCtx?.value.rawValues ?? new Set<RawValueType>());
    const overMaxCount = computed(
      () =>
        multiple.value &&
        isValidCount(props.maxCount) &&
        rawValues.value.size >= (props.maxCount as number),
    );

    const getEnabledActiveIndex = (index: number, offset = 1): number => {
      const len = flatten.value.length;
      for (let i = 0; i < len; i += 1) {
        const current = (index + i * offset + len) % len;
        const item = flatten.value[current];
        if (!item) continue;
        const { group, data } = item;
        if (
          !group &&
          !data?.disabled &&
          (rawValues.value.has(item.value as RawValueType) || !overMaxCount.value)
        ) {
          return current;
        }
      }
      return -1;
    };

    const setActive = (index: number, fromKeyboard = false): void => {
      activeIndex.value = index;
      const info = { source: (fromKeyboard ? 'keyboard' : 'mouse') as 'keyboard' | 'mouse' };
      const item = flatten.value[index];
      if (!item) {
        props.onActiveValueChange?.(null, -1, info);
        return;
      }
      props.onActiveValueChange?.((item.value ?? null) as RawValueType | null, index, info);
    };

    // 选项数量或搜索词变化 ⇒ 重新激活首项（rc OptionList 的 useEffect）
    watch(
      [() => flatten.value.length, () => props.searchValue],
      () => {
        if (!selectCtx) return;
        setActive(
          selectCtx.value.defaultActiveFirstOption !== false ? getEnabledActiveIndex(0) : -1,
        );
      },
      { immediate: true },
    );

    // 单选打开时滚到已选项（rc 的同名 effect）
    watch([mergedOpen, () => props.searchValue], () => {
      if (!multiple.value && mergedOpen.value && rawValues.value.size === 1) {
        const value = Array.from(rawValues.value)[0];
        const index = flatten.value.findIndex(({ data }) =>
          props.searchValue
            ? String(data.value).startsWith(props.searchValue)
            : data.value === value,
        );
        if (index !== -1) {
          setActive(index);
          setTimeout(() => optionListRef.value?.scrollTo(index));
        }
      }
    });

    // ------------------------------ 键盘 ------------------------------
    const [getClearLock, setClearLock] = useLock();
    const keyLock = ref(false);

    const onSelectValue = (value: RawValueType | undefined): void => {
      if (value !== undefined && selectCtx) {
        selectCtx.value.onSelect(value, { selected: !rawValues.value.has(value) });
      }
      if (!multiple.value) {
        toggleOpen(false);
      }
    };

    const listKeyDown = (event: KeyboardEvent): void => {
      const code = (event as unknown as { keyCode?: number; which?: number }).keyCode;
      const ctrlKey = event.ctrlKey;
      const up = code === KeyCode.UP;
      const down = code === KeyCode.DOWN;
      const nNext = isMac() && ctrlKey && code === KeyCode.N;
      const pPrev = isMac() && ctrlKey && code === KeyCode.P;
      const tab = code === KeyCode.TAB;
      const enter = code === KeyCode.ENTER;
      const esc = code === KeyCode.ESC;

      if (up || down || nNext || pPrev) {
        const offset = up || pPrev ? -1 : 1;
        const next = getEnabledActiveIndex(activeIndex.value + offset, offset);
        optionListRef.value?.scrollTo(next);
        setActive(next, true);
        return;
      }
      if (tab || enter) {
        const item = flatten.value[activeIndex.value];
        if (!item || item.data?.disabled) {
          onSelectValue(undefined);
        } else if (!overMaxCount.value || rawValues.value.has(item.value as RawValueType)) {
          onSelectValue(item.value);
        } else {
          onSelectValue(undefined);
        }
        if (mergedOpen.value) event.preventDefault();
        return;
      }
      if (esc) {
        toggleOpen(false);
        if (mergedOpen.value) event.stopPropagation();
      }
    };

    const onInternalKeyDown = (event: KeyboardEvent): void => {
      const clearLock = getClearLock();
      const key = event.key;
      const code = (event as unknown as { keyCode?: number }).keyCode;
      const isEnterKey = key === 'Enter' || code === KeyCode.ENTER;
      const isSpaceKey = key === ' ' || code === KeyCode.SPACE;

      if (isEnterKey || isSpaceKey) {
        const isCombobox = props.mode === 'combobox';
        const isEditable = isCombobox || props.showSearch;
        if ((isSpaceKey && !isEditable) || (isEnterKey && !isCombobox)) {
          event.preventDefault();
        }
        if (!mergedOpen.value) {
          toggleOpen(true);
        }
      }
      setClearLock(Boolean(mergedSearchValue.value));

      if (
        key === 'Backspace' &&
        !clearLock &&
        multiple.value &&
        !mergedSearchValue.value &&
        props.displayValues.length
      ) {
        const clone = [...props.displayValues];
        let removed: DisplayValueType | null = null;
        for (let i = clone.length - 1; i >= 0; i -= 1) {
          if (!clone[i]?.disabled) {
            removed = clone[i] ?? null;
            clone.splice(i, 1);
            break;
          }
        }
        if (removed) {
          props.onDisplayValuesChange?.(clone, { type: 'remove', values: [removed] });
        }
      }

      if (mergedOpen.value && (!isEnterKey || !keyLock.value) && !isSpaceKey) {
        if (isEnterKey) keyLock.value = true;
        listKeyDown(event);
      }
      props.onKeyDown?.(event);
    };

    const onInternalKeyUp = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') keyLock.value = false;
      props.onKeyUp?.(event);
    };

    // --------------------------- 焦点 / 失焦 ---------------------------
    let internalMouseDown = false;
    const selectorEl = (): HTMLElement | null =>
      ((
        selectorRef.value as { nativeElement?: () => HTMLElement | null } | null
      )?.nativeElement?.() ?? null) as HTMLElement | null;
    const getSelectElements = (): (HTMLElement | null)[] => [
      selectorEl(),
      triggerRef.value?.popupElement() ?? null,
    ];

    const onInternalFocus = (event: FocusEvent): void => {
      focused.value = true;
      if (!props.disabled) props.onFocus?.(event);
    };

    const onRootBlur = (): void => {
      if (mergedOpen.value && !internalMouseDown) {
        toggleOpen(false, {
          cancelFun: () =>
            getSelectElements().some(
              (el) => !!el && el.contains(document.activeElement as Node | null),
            ),
        });
      }
    };

    const onInternalBlur = (event: FocusEvent): void => {
      focused.value = false;
      if (mergedSearchValue.value) {
        if (props.mode === 'tags') {
          props.onSearch?.(mergedSearchValue.value, { source: 'submit' });
        } else if (props.mode === 'multiple') {
          props.onSearch?.('', { source: 'blur' });
        }
      }
      onRootBlur();
      if (!props.disabled) props.onBlur?.(event);
    };

    // 点外部关闭（rc 的 useSelectTriggerControl）
    const onDocumentMouseDown = (event: MouseEvent): void => {
      if (!mergedOpen.value) return;
      const target = event.target as Node | null;
      if (!target) return;
      const inside = getSelectElements().some((el) => !!el && el.contains(target));
      if (!inside) toggleOpen(false);
    };
    onMounted(() => document.addEventListener('mousedown', onDocumentMouseDown, true));
    onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentMouseDown, true));

    const onRootMouseDown = (event: MouseEvent): void => {
      const popupElement = triggerRef.value?.popupElement();
      if (popupElement?.contains(event.target as Node) && toggleOpen) {
        // 点浮层内部 ⇒ 告诉 open 别关
        toggleOpen(true);
      }
      internalMouseDown = true;
      setTimeout(() => {
        internalMouseDown = false;
      }, 0);
    };

    // --------------------------- context ---------------------------
    provide(
      baseSelectContextKey,
      computed<BaseSelectContextValue>(() => ({
        prefixCls: props.prefixCls,
        id: props.id,
        open: mergedOpen.value,
        triggerOpen: mergedOpen.value,
        rawOpen: rawOpen.value,
        showSearch: props.showSearch,
        multiple: multiple.value,
        mode: props.mode,
        disabled: props.disabled,
        loading: props.loading,
        searchValue: mergedSearchValue.value,
        activeValue: props.activeValue,
        activeDescendantId: props.activeDescendantId,
        showScrollBar: 'optional',
        lockOptions: lock.value,
        notFoundContent: props.notFoundContent,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        tabIndex: props.tabIndex,
        title: props.title,
        removeIcon: props.removeIcon,
        autoClearSearchValue: props.autoClearSearchValue,
        maxTagTextLength: props.maxTagTextLength,
        maxTagCount: props.maxTagCount,
        maxTagPlaceholder: props.maxTagPlaceholder,
        tagRender: props.tagRender,
        displayValues: props.displayValues,
        classNames: props.classNames,
        styles: props.styles,
        toggleOpen: (next?: boolean) => toggleOpen(next),
        onSearch: (text, fromTyping, isCompositing) =>
          onInternalSearch(text, fromTyping, isCompositing),
        onSearchSubmit: onInternalSearchSubmit,
        onSelectorRemove: (value: DisplayValueType) =>
          props.onDisplayValuesChange?.(
            props.displayValues.filter((i) => i !== value),
            { type: 'remove', values: [value] },
          ),
        onInputBlur: () => {
          keyLock.value = false;
        },
        onClear: onClearMouseDown,
        tokenWithEnter: tokenWithEnter.value,
      })),
    );

    expose({
      focus: () => (selectorRef.value as { focus?: () => void } | null)?.focus?.(),
      blur: () => (selectorRef.value as { blur?: () => void } | null)?.blur?.(),
      scrollTo: (arg?: number | { index?: number }) => optionListRef.value?.scrollTo(arg),
      nativeElement: (): HTMLElement | null => selectorEl(),
    });

    // ----------------------------- render -----------------------------
    const mergedSuffixIcon = computed(() => {
      const next = props.suffixIcon;
      if (typeof next === 'function') {
        return (next as (p: Record<string, unknown>) => unknown)({
          searchValue: mergedSearchValue.value,
          open: mergedOpen.value,
          focused: focused.value,
          showSearch: props.showSearch,
          loading: props.loading,
        });
      }
      return next;
    });

    const builtinPlacements = computed(() =>
      getPlacements({ arrowWidth: 0, offset: 4, borderRadius: 6, autoAdjustOverflow: true }),
    );

    const mergedClassName = computed(
      () =>
        [
          props.prefixCls,
          focused.value ? `${props.prefixCls}-focused` : '',
          multiple.value ? `${props.prefixCls}-multiple` : `${props.prefixCls}-single`,
          allowClearResult.value.allowClear ? `${props.prefixCls}-allow-clear` : '',
          mergedSuffixIcon.value !== undefined && mergedSuffixIcon.value !== null
            ? `${props.prefixCls}-show-arrow`
            : '',
          props.disabled ? `${props.prefixCls}-disabled` : '',
          props.loading ? `${props.prefixCls}-loading` : '',
          mergedOpen.value ? `${props.prefixCls}-open` : '',
          props.showSearch ? `${props.prefixCls}-show-search` : '',
          props.className,
          props.classNames?.root,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
    );

    const popupElement = () => {
      // 调用方注入了列表渲染器 ⇒ 由它接管（Cascader 等「BaseSelect + 自定义列表」形态）
      if (props.optionListRenderer) {
        return props.optionListRenderer() as unknown;
      }
      return h(OptionList, {
        ref: optionListRef,
        activeIndex: activeIndex.value,
        onActiveIndexChange: setActive,
        onSelectValue,
        onPopupScroll: props.onPopupScroll,
      });
    };

    // ====================== raw trigger（getRawInputElement）======================
    // rc 同构：提供时 Selector 不渲染，raw 元素作为 Trigger 的触发器；
    // 事件/aria 经 cloneVNode 注入（React 用 cloneElement）。
    const rawAriaAttrs = computed<Record<string, unknown>>(() => {
      const out: Record<string, unknown> = {};
      Object.keys(attrs).forEach((key) => {
        if (key.startsWith('aria-') || key.startsWith('data-')) {
          out[key] = (attrs as Record<string, unknown>)[key];
        }
      });
      return out;
    });
    const renderRawTrigger = (): unknown => {
      const raw = props.getRawInputElement?.();
      if (raw === undefined || raw === null) return null;
      const node = raw as VNode;
      return cloneVNode(node, {
        onClick: props.openOnTriggerClick
          ? () => {
              if (props.disabled) return;
              toggleOpen(!mergedOpen.value);
            }
          : (node.props as Record<string, unknown> | undefined)?.onClick,
        onKeydown: (event: KeyboardEvent) => props.onInputKeyDown?.(event),
        onFocus: (event: FocusEvent) => props.onFocus?.(event),
        onBlur: (event: FocusEvent) => props.onBlur?.(event),
        onMousedown: (event: MouseEvent) => {
          // 防止 selector 失焦（Selector 内 onInternalMouseDown 的同款判据）
          event.preventDefault();
        },
        tabindex: props.disabled ? undefined : (props.tabIndex ?? 0),
        ...rawAriaAttrs.value,
      } as never);
    };

    return () => {
      const popupPrefixCls = `${props.prefixCls}-dropdown`;
      let popupNode: unknown = popupElement();
      if (props.popupRender) popupNode = props.popupRender(popupNode);

      // ---- raw 模式：Trigger child = 注入后的 raw 元素（无 Selector 结构）----
      if (props.getRawInputElement) {
        const rawNode = renderRawTrigger();
        if (rawNode !== null) {
          return [
            focused.value && !mergedOpen.value
              ? h(
                  'span',
                  {
                    'aria-live': 'polite',
                    style: {
                      width: '0px',
                      height: '0px',
                      position: 'absolute',
                      overflow: 'hidden',
                      opacity: '0',
                    },
                  },
                  props.displayValues
                    .slice(0, 50)
                    .map(({ label, value }) =>
                      ['number', 'string'].includes(typeof label) ? String(label) : String(value),
                    )
                    .join(', '),
                )
              : null,
            h(
              Trigger,
              {
                ref: triggerRef as never,
                prefixCls: popupPrefixCls,
                popup: h('div', { class: popupPrefixCls }, [popupNode as never]),
                open: mergedOpen.value,
                onOpenChange: (next: boolean) => toggleOpen(next),
                disabled: props.disabled ?? false,
                placement: props.placement ?? 'bottomLeft',
                builtinPlacements: builtinPlacements.value,
                getPopupContainer: props.getPopupContainer as never,
                motion: {
                  motionName: props.transitionName ?? 'apollo-slide-up',
                  motionDeadline: 500,
                },
                ...attrs,
              } as never,
              { default: () => rawNode as never },
            ),
          ];
        }
      }

      // ⚠️ 不能包一层 `<div>`：antd 的 Select 根元素**就是** `.ant-select` 那个 div，
      //    多一层会破坏 DOM 契约（规则 R10）。这里返回多根（Polite + Trigger）。
      return [
        // aria-live 播报（rc 的 Polite）：只在「聚焦且未展开」时出现
        focused.value && !mergedOpen.value
          ? h(
              'span',
              {
                'aria-live': 'polite',
                style: {
                  width: '0px',
                  height: '0px',
                  position: 'absolute',
                  overflow: 'hidden',
                  opacity: '0',
                },
              },
              [
                props.displayValues
                  .slice(0, 50)
                  .map(({ label, value }) =>
                    ['number', 'string'].includes(typeof label) ? String(label) : String(value),
                  )
                  .join(', '),
                props.displayValues.length > 50 ? ', ...' : null,
              ],
            )
          : null,
        h(
          Trigger,
          {
            ref: triggerRef as never,
            prefixCls: popupPrefixCls,
            popup: h(
              'div',
              {
                onMouseenter: () => undefined,
                onMousedown: onRootMouseDown,
                onBlur: onRootBlur,
              },
              [popupNode as never],
            ),
            open: mergedOpen.value,
            onOpenChange: (next: boolean) => toggleOpen(next),
            disabled: props.disabled ?? false,
            placement: props.placement ?? 'bottomLeft',
            builtinPlacements: builtinPlacements.value,
            getPopupContainer: props.getPopupContainer as never,
            motion: {
              motionName: props.transitionName ?? 'apollo-slide-up',
              motionDeadline: 500,
            },
            // ⚠️ rc：popupMatchSelectWidth=true ⇒ stretch='width'（钳制最大宽）。
            //    本仓 Trigger 的 stretch 协议只实现了 'minWidth'（trigger.ts §3），
            //    视觉主契约「浮层不窄于触发器」等价；「内容更宽时收窄」的差异
            //    登记 COMPATIBILITY（待 Trigger 补 'width' 后切回）。
            // 🚨 `popupMatchSelectWidth === false` ⇒ **不拉伸**（浮层宽度由内容决定）。
            //    此前这里是无条件 `'minWidth'` —— 对 select 恰好等价（它默认 true），
            //    但 cascader 的 `popupMatchSelectWidth` 默认 false ⇒ 浮层被硬撑到触发器
            //    宽度。L6 实测（multiple 形态）：浮层 184 vs antd 111；
            //    basic 形态因内容 333 > 184 被掩盖，所以一直没暴露。
            stretch: props.popupMatchSelectWidth === false ? undefined : 'minWidth',
            popupClassName: [
              props.popupClassName,
              props.emptyOptions ? `${popupPrefixCls}-empty` : '',
            ]
              .filter(Boolean)
              .join(' '),
            popupStyle: {
              ...(props.popupStyle ?? {}),
              ...(typeof props.popupMatchSelectWidth === 'number'
                ? { width: `${props.popupMatchSelectWidth}px` }
                : {}),
              ...(props.zIndex !== undefined ? { zIndex: props.zIndex } : {}),
            } as never,
            ...attrs,
          },
          {
            default: () =>
              h(Selector, {
                ref: selectorRef,
                // 可访问名（转发到 combobox input；见 Select 的 attrs 处理）
                ariaLabel: props.ariaLabel,
                ariaLabelledby: props.ariaLabelledby,
                onClick: props.openOnTriggerClick
                  ? () => {
                      if (props.disabled) return;
                      toggleOpen(!mergedOpen.value);
                    }
                  : undefined,
                prefixCls: props.prefixCls,
                id: props.id,
                className: mergedClassName.value,
                // antd：用户 `style` 经 useSemanticRootStyle 并入 styles.root
                //（本仓在壳层合并：用户 style 优先级低于 styles.root）
                style: { ...(props.style ?? {}), ...(props.styles?.root ?? {}) },
                focused: focused.value,
                multiple: multiple.value,
                mode: props.mode,
                displayValues: props.displayValues as unknown as LabelInValueType[],
                placeholder: props.placeholder,
                // ⚠️ merged：combobox 的搜索值来自**回填的选中值**（value ⇒ 输入框
                //    显示 + -content-has-search-value 类，AutoComplete 期抓出）
                searchValue: mergedSearchValue.value,
                activeValue: props.activeValue,
                activeDescendantId: props.activeDescendantId,
                prefix: props.prefix,
                suffix: mergedSuffixIcon.value,
                clearIcon: allowClearResult.value.clearIcon,
                clearLabel: allowClearResult.value.label,
                disabled: props.disabled ?? false,
                loading: props.loading,
                showSearch: props.showSearch,
                open: mergedOpen.value,
                rawOpen: rawOpen.value,
                tabIndex: props.tabIndex,
                title: props.title,
                maxLength: props.maxLength,
                maxTagCount: props.maxTagCount,
                maxTagTextLength: props.maxTagTextLength,
                maxTagPlaceholder: props.maxTagPlaceholder,
                tagRender: props.tagRender,
                removeIcon: props.removeIcon,
                tokenWithEnter: tokenWithEnter.value,
                autoClearSearchValue: props.autoClearSearchValue,
                classNames: props.classNames,
                styles: props.styles,
                onToggleOpen: (next?: boolean) => toggleOpen(next),
                onMousedown: onRootMouseDown,
                onKeydown: onInternalKeyDown,
                onKeyup: onInternalKeyUp,
                onFocus: onInternalFocus,
                onBlur: onInternalBlur,
                onSearch: (text: string, fromTyping: boolean, isCompositing: boolean) => {
                  onInternalSearch(text, fromTyping, isCompositing);
                },
                onSearchSubmit: onInternalSearchSubmit,
                onInputBlur: () => {
                  keyLock.value = false;
                },
                onInputKeyDown: props.onInputKeyDown,
                onClear: onClearMouseDown,
                onSelectorRemove: (value: DisplayValueType) =>
                  props.onDisplayValuesChange?.(
                    props.displayValues.filter((i) => i !== value),
                    { type: 'remove', values: [value] },
                  ),
              } as never),
          },
        ),
      ];
    };
  },
});

export default BaseSelect;
