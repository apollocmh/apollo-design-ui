/**
 * Input.Search —— antd 6.6.4 `components/input/Search.tsx` 的 Vue 实现。
 *
 * 判据（es/input/Search.js，逐条对齐）：
 *  1. 根是 `Space.Compact`（紧凑组），类名 `input-search`；`enterButton` 为真时额外
 *     `-with-button`，尺寸为 `-small` / `-large`，RTL 为 `-rtl`。
 *  2. 内部 Input 的 `type="search"`；`onPressEnter` 受 IME 组合态与 `loading` 闸门，
 *     通过后先调用户 `onPressEnter`，再触发 `onSearch(value, e, { source: 'input' })`。
 *  3. 清空按钮触发 `onChange` 时，事件 `type === 'click'` ⇒ 额外触发
 *     `onSearch(value, e, { source: 'clear' })`。
 *  4. `enterButton`：`false` ⇒ 图标按钮（default）；`true` ⇒ 主按钮 + 搜索图标；
 *     字符串 / 数字 ⇒ 主按钮 + 文本；VNode / 组件 ⇒ 直接渲染并合并点击与禁用。
 *  5. 按钮 `onMousedown` 在输入框已聚焦时 `preventDefault`，避免抢走焦点。
 *  6. 语义合并顺序与 antd 相同：`[contextClassNames, classNames]` /
 *     `[contextStyles, contextStyleRoot, styles, styleRoot]`；`button` 槽用
 *     `_default: 'root'` schema（字符串形态落到 `button.root`）。
 */

import { SearchOutlined } from '@apollo-design/icons';
import {
  type Component,
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Button } from '../button';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { useVariant } from '../form/hooks/useVariants';
import { SpaceCompact, useCompactItemContext } from '../space';
import { InputComponent } from './Input';
import type {
  InputRef,
  InputSearchProps,
  InputSearchSemanticClassNames,
  InputSearchSemanticStyles,
} from './interface';

function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

export const SearchComponent = defineComponent({
  name: 'AInputSearch',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    inputPrefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<InputSearchProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<InputSearchProps['styles']>,
      default: undefined,
    },
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    variant: { type: String as PropType<InputSearchProps['variant']>, default: undefined },
    bordered: { type: Boolean, default: undefined },
    enterButton: {
      type: [Boolean, String, Number, Object, Function, Array] as PropType<
        InputSearchProps['enterButton']
      >,
      default: false,
    },
    searchIcon: {
      type: null as unknown as PropType<VNodeChild | Component>,
      default: undefined,
    },
    loading: { type: Boolean, default: false },
    addonAfter: {
      type: null as unknown as PropType<VNodeChild | Component>,
      default: undefined,
    },
    hidden: { type: Boolean, default: undefined },
    onSearch: {
      type: Function as PropType<InputSearchProps['onSearch']>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(e: unknown) => void>,
      default: undefined,
    },
    onPressEnter: {
      type: Function as PropType<(e: KeyboardEvent) => void>,
      default: undefined,
    },
    onCompositionStart: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
    onCompositionEnd: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const context = useComponentConfig('inputSearch');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();

    const prefixCls = computed(() => getPrefixCls('input-search', props.prefixCls));
    const inputPrefixCls = computed(() => getPrefixCls('input', props.inputPrefixCls));
    const { compactSize } = useCompactItemContext(prefixCls, () => direction.value);
    const size = useSize((ctx) => props.size ?? compactSize.value ?? ctx);
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const { variant } = useVariant({
      component: 'inputSearch',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    const inputRef = shallowRef<InputRef | null>(null);
    const composed = ref(false);

    const mergedProps = computed<InputSearchProps>(
      () =>
        ({
          ...props,
          size: size.value,
          disabled: mergedDisabled.value,
          variant: variant.value,
        }) as InputSearchProps,
    );

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      InputSearchProps,
      InputSearchSemanticClassNames,
      InputSearchSemanticStyles
    >(
      [
        () => (context as { classNames?: InputSearchSemanticClassNames }).classNames,
        () => props.classNames,
      ],
      [
        () => (context as { styles?: InputSearchSemanticStyles }).styles,
        () => semanticRootStyle((context as { style?: CSSProperties }).style),
        () => props.styles,
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      () => mergedProps.value,
      { button: { _default: 'root' } },
    );

    const searchIconNode = computed<VNodeChild>(() => {
      if (props.searchIcon !== undefined) return asNode(props.searchIcon);
      const contextIcon = (context as { searchIcon?: VNodeChild }).searchIcon;
      return contextIcon !== undefined ? asNode(contextIcon) : h(SearchOutlined);
    });

    function emitSearch(value: string, e: Event | undefined, source: 'clear' | 'input'): void {
      props.onSearch?.(value, e, { source });
    }

    function onSearch(e?: Event, source: 'clear' | 'input' = 'input'): void {
      emitSearch(inputRef.value?.input?.value ?? '', e, source);
    }

    function onMouseDown(e: MouseEvent): void {
      if (document.activeElement === inputRef.value?.input) {
        e.preventDefault();
      }
    }

    function handleChange(e: unknown): void {
      const event = e as { type?: string; target?: { value?: string } };
      // antd 用 **事件上的新值**（清空时是 ''），而不是 inputRef 的旧 DOM 值。
      if (event?.type === 'click' && props.onSearch) {
        emitSearch(event.target?.value ?? '', e as Event, 'clear');
      }
      emit('update:value', event?.target?.value);
      props.onChange?.(e);
    }

    function handlePressEnter(e: KeyboardEvent): void {
      if (composed.value || props.loading) return;
      props.onPressEnter?.(e);
      onSearch(e, 'input');
    }

    function handleCompositionStart(e: CompositionEvent): void {
      composed.value = true;
      props.onCompositionStart?.(e);
    }

    function handleCompositionEnd(e: CompositionEvent): void {
      composed.value = false;
      props.onCompositionEnd?.(e);
    }

    const btnPrefixCls = computed(() => `${prefixCls.value}-btn`);
    const btnClass = computed(() => [
      btnPrefixCls.value,
      { [`${btnPrefixCls.value}-${variant.value}`]: variant.value !== 'outlined' },
    ]);
    const btnVariant = computed<'text' | 'solid' | undefined>(() => {
      if (
        variant.value === 'borderless' ||
        variant.value === 'filled' ||
        variant.value === 'underlined'
      ) {
        return 'text';
      }
      return props.enterButton ? 'solid' : undefined;
    });

    function enterButtonNode(): VNodeChild {
      const enterButton = props.enterButton;
      const common = {
        class: btnClass.value,
        size: size.value,
        disabled: mergedDisabled.value,
        onMousedown: onMouseDown,
        onClick: (e: MouseEvent) => onSearch(e, 'input'),
      };

      if (enterButton && (isVNode(enterButton) || typeof enterButton === 'object')) {
        if (isVNode(enterButton)) {
          return cloneVNode(enterButton, {
            ...common,
            ...(enterButton.type === Button ? { loading: props.loading } : {}),
          } as never);
        }
        return h(enterButton as Component, common as never);
      }

      if (typeof enterButton === 'function') {
        return h(enterButton as Component, common as never);
      }

      const text =
        typeof enterButton === 'string' || typeof enterButton === 'number'
          ? String(enterButton)
          : undefined;

      // antd 的 Button 收到 `children=true`：不渲染内容，但让 `-icon-only` 为假。
      // 本仓 Button 已把「raw children 含 true」纳入 icon-only 判据（Button.vue）。
      const children =
        text !== undefined ? () => text : enterButton === true ? () => true : undefined;

      return h(
        Button,
        {
          ...common,
          classNames: mergedClassNames.value.button,
          styles: mergedStyles.value.button,
          color: enterButton ? 'primary' : 'default',
          variant: btnVariant.value,
          loading: props.loading,
          // antd 只在 enterButton 为 boolean 时使用 searchIcon；文本 / 自定义节点
          // 的按钮不渲染搜索图标（Search.js:105）。
          icon: typeof enterButton === 'boolean' ? searchIconNode.value : undefined,
        } as never,
        children === undefined ? undefined : { default: children },
      );
    }

    expose({
      focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => {
        inputRef.value?.focus(option);
      },
      blur: () => {
        inputRef.value?.blur();
      },
      setSelectionRange: (
        start: number,
        end: number,
        directionValue?: 'forward' | 'backward' | 'none',
      ) => {
        inputRef.value?.setSelectionRange(start, end, directionValue);
      },
      select: () => {
        inputRef.value?.select();
      },
      get input() {
        return inputRef.value?.input ?? null;
      },
      get nativeElement() {
        return inputRef.value?.nativeElement ?? null;
      },
    } satisfies InputRef);

    return () => {
      const p = prefixCls.value;
      const rootClass = [
        attrs.class,
        p,
        {
          [`${p}-rtl`]: direction.value === 'rtl',
          [`${p}-${size.value}`]: !!size.value,
          [`${p}-with-button`]: !!props.enterButton,
        },
        (context as { className?: string }).className,
        mergedClassNames.value.root,
      ];

      const rootDataAttrs: Record<string, unknown> = {};
      const inputAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class' || key === 'style') continue;
        if (key.startsWith('data-')) rootDataAttrs[key] = value;
        else inputAttrs[key] = value;
      }

      const { root: _root, button: _button, ...inputClassNames } = mergedClassNames.value;
      const { root: _rootStyle, button: _buttonStyle, ...inputStyles } = mergedStyles.value;
      void _root;
      void _button;
      void _rootStyle;
      void _buttonStyle;

      const inputNode = h(InputComponent, {
        ...inputAttrs,
        ref: inputRef as never,
        prefixCls: inputPrefixCls.value,
        type: 'search',
        size: size.value,
        variant: variant.value,
        disabled: mergedDisabled.value,
        value: props.value,
        defaultValue: props.defaultValue,
        classNames: inputClassNames,
        styles: inputStyles,
        onChange: handleChange,
        onPressEnter: handlePressEnter,
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
      } as never);

      const children: VNodeChild[] = [inputNode, enterButtonNode()];
      if (props.addonAfter !== undefined) children.push(asNode(props.addonAfter));

      return h(
        SpaceCompact,
        {
          class: rootClass,
          style: mergedStyles.value.root,
          hidden: props.hidden,
          ...rootDataAttrs,
        } as never,
        { default: () => children },
      );
    };
  },
});
