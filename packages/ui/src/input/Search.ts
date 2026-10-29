import { SearchOutlined } from '@apollo-design/icons';
import {
  type Component,
  type ComponentPublicInstance,
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { Button } from '../button';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { SpaceCompact, useCompactItemContext } from '../space';
import { InputComponent, inputProps } from './Input';
import { inputEmits } from './input-emits';
import type {
  InputRef,
  InputSearchProps,
  InputSearchSemanticClassNames,
  InputSearchSemanticStyles,
  InputSlots,
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
  slots: Object as SlotsType<InputSlots>,
  props: {
    ...inputProps,
    type: { type: String, default: 'search' },
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
  },
  emits: {
    ...inputEmits,
    search: (_value: string, _event?: Event, _info?: { source?: 'clear' | 'input' }) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
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
    const rootRef = shallowRef<ComponentPublicInstance | null>(null);
    const form = useFormItemInputContext();

    const mergedProps = computed<InputSearchProps>(() => ({
      ...attrs,
      ...props,
      size: size.value,
      disabled: mergedDisabled.value,
      variant: variant.value,
      status: getMergedStatus(form.value.status, props.status),
    }));

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
      emit('search', value, e, { source });
    }

    function onSearch(e?: Event, source: 'clear' | 'input' = 'input'): void {
      if (mergedDisabled.value || props.loading || composed.value) return;
      emitSearch(inputRef.value?.input?.value ?? '', e, source);
    }

    function onMouseDown(e: MouseEvent): void {
      if (document.activeElement === inputRef.value?.input) {
        e.preventDefault();
      }
    }

    function handlePressEnter(event: KeyboardEvent): void {
      if (composed.value || props.loading || mergedDisabled.value) return;
      emit('pressEnter', event);
      onSearch(event, 'input');
    }

    const btnPrefixCls = computed(() => `${prefixCls.value}-btn`);
    const btnClass = computed(() => [
      btnPrefixCls.value,
      { [`${btnPrefixCls.value}-${variant.value}`]: variant.value !== 'outlined' },
    ]);
    const hasEnterButton = computed(
      () =>
        props.enterButton !== false &&
        props.enterButton !== null &&
        props.enterButton !== undefined,
    );
    const btnVariant = computed<'text' | 'solid' | undefined>(() => {
      if (
        variant.value === 'borderless' ||
        variant.value === 'filled' ||
        variant.value === 'underlined'
      ) {
        return 'text';
      }
      return hasEnterButton.value ? 'solid' : undefined;
    });

    function enterButtonNode(): VNodeChild {
      const enterButton = props.enterButton;
      const common = {
        class: [btnClass.value, mergedClassNames.value.button?.root],
        style: mergedStyles.value.button?.root,
        size: size.value,
        disabled: mergedDisabled.value || props.loading,
        onMousedown: onMouseDown,
        onClick: (e: MouseEvent) => onSearch(e, 'input'),
      };

      const customVNode =
        isVNode(enterButton) &&
        (enterButton.type === 'button' ||
          enterButton.type === 'a' ||
          typeof enterButton.type === 'object' ||
          typeof enterButton.type === 'function');
      if (
        customVNode ||
        (enterButton &&
          typeof enterButton === 'object' &&
          !isVNode(enterButton) &&
          !Array.isArray(enterButton))
      ) {
        if (isVNode(enterButton)) {
          return cloneVNode(enterButton, {
            ...common,
            disabled:
              common.disabled ||
              enterButton.props?.disabled === '' ||
              !!enterButton.props?.disabled,
            ...(typeof enterButton.type !== 'string' ? { loading: props.loading } : {}),
            ...(enterButton.type === Button
              ? { classNames: mergedClassNames.value.button, styles: mergedStyles.value.button }
              : {}),
          } as never);
        }
        return h(enterButton as Component, { ...common, loading: props.loading });
      }

      if (typeof enterButton === 'function') {
        return h(enterButton as Component, { ...common, loading: props.loading });
      }

      const text =
        typeof enterButton === 'string' || typeof enterButton === 'number'
          ? String(enterButton)
          : undefined;

      const children =
        text !== undefined
          ? () => text
          : isVNode(enterButton) || Array.isArray(enterButton)
            ? () => enterButton
            : undefined;

      return h(
        Button,
        {
          ...common,
          classNames: mergedClassNames.value.button,
          styles: mergedStyles.value.button,
          color: hasEnterButton.value ? 'primary' : 'default',
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
        const root = rootRef.value?.$el;
        return root instanceof HTMLElement ? root : null;
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
          [`${p}-with-button`]: hasEnterButton.value,
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

      const {
        prefixCls: _prefix,
        inputPrefixCls: _inputPrefix,
        classNames: _classNames,
        styles: _styles,
        enterButton: _enter,
        searchIcon: _searchIcon,
        loading: _loading,
        addonAfter: _addonAfter,
        hidden: _hidden,
        ...inputProps
      } = props;
      const inputNode = h(
        InputComponent,
        mergeProps(
          {
            ...inputProps,
            ref: inputRef as never,
            prefixCls: inputPrefixCls.value,
            type: props.type,
            size: size.value,
            variant: variant.value,
            disabled: mergedDisabled.value,
            value: props.value,
            defaultValue: props.defaultValue,
            classNames: inputClassNames,
            styles: inputStyles,
            'onUpdate:value': (value: string) => emit('update:value', value),
            onChange: (event: Event) => emit('change', event),
            onClear: (event: MouseEvent) => {
              emit('clear', event);
              emitSearch('', event, 'clear');
            },
            onPressEnter: handlePressEnter,
            onCompositionstart: () => {
              composed.value = true;
            },
            onCompositionend: () => {
              composed.value = false;
            },
          },
          inputAttrs,
        ),
        slots,
      );

      const children: VNodeChild[] = [inputNode, enterButtonNode()];
      if (props.addonAfter !== undefined) children.push(asNode(props.addonAfter));

      return h(
        SpaceCompact,
        {
          ref: rootRef,
          class: rootClass,
          style: [mergedStyles.value.root, props.hidden ? { display: 'none' } : undefined],
          hidden: props.hidden,
          ...rootDataAttrs,
        } as never,
        { default: () => children },
      );
    };
  },
});
