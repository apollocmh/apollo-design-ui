import { useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  onBeforeUnmount,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useAllowClear } from '../_internal/use-allow-clear';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { RcTextArea } from './engine/TextArea';
import { inputEmits } from './input-emits';
import type {
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './interface';
import { useInputTheme } from './use-input-theme';

function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

export const TextAreaComponent = defineComponent({
  name: 'ATextArea',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<TextAreaProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<TextAreaProps['styles']>, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    bordered: { type: Boolean, default: undefined },
    variant: { type: String as PropType<TextAreaProps['variant']>, default: undefined },
    status: { type: String as PropType<TextAreaProps['status']>, default: undefined },
    allowClear: {
      type: [Boolean, Object] as PropType<TextAreaProps['allowClear']>,
      default: undefined,
    },
    clearIcon: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
    showCount: {
      type: [Boolean, Object] as PropType<TextAreaProps['showCount']>,
      default: undefined,
    },
    count: { type: Object as PropType<TextAreaProps['count']>, default: undefined },
    maxLength: { type: Number, default: undefined },
    rows: { type: Number, default: undefined },
    autoSize: {
      type: [Boolean, Object] as PropType<boolean | { minRows?: number; maxRows?: number }>,
      default: undefined,
    },
    hidden: { type: Boolean, default: undefined },
    autoComplete: { type: String, default: undefined },
    placeholder: { type: String, default: undefined },
  },
  emits: { ...inputEmits, resize: (_size: { width: number; height: number }) => true },
  setup(props, { attrs, emit, expose }) {
    const devWarning = useDevWarning('TextArea');
    devWarning.deprecated(props.bordered === undefined, 'bordered', 'variant');

    const context = useComponentConfig<ComponentStyleConfig & Record<string, unknown>>('textArea');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const formItemContext = useFormItemInputContext();

    const prefixCls = computed(() => getPrefixCls('input', props.prefixCls));
    const themeStyle = useInputTheme(() => prefixCls.value);
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => direction.value,
    );
    const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const hasFeedback = computed(() => formItemContext.value.hasFeedback === true);
    const mergedStatus = computed(() =>
      getMergedStatus(formItemContext.value.status, props.status),
    );
    const { variant, enableVariantCls } = useVariant({
      component: 'textArea',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    const mergedProps = computed<TextAreaProps>(() => ({
      ...attrs,
      ...props,
      size: mergedSize.value,
      disabled: mergedDisabled.value,
      status: mergedStatus.value,
      variant: variant.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TextAreaProps,
      TextAreaSemanticClassNames,
      TextAreaSemanticStyles
    >(
      [() => context.classNames as TextAreaSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as TextAreaSemanticStyles | undefined,
        () => semanticRootStyle(context.style),
        () => props.styles,
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      // ⚠️ 传 getter（Issue #3.2）—— 见 Input.ts 同处注释。
      () => mergedProps.value,
    );

    // ⚠️ 全部传 getter（Issue #3.1）—— 见 Input.ts 同处注释。
    const mergedAllowClear = useAllowClear({
      allowClear: () => props.allowClear,
      clearIcon: () => asNode(props.clearIcon),
      contextAllowClear: () => (context as { allowClear?: TextAreaProps['allowClear'] }).allowClear,
      contextClearIcon: () => (context as { clearIcon?: VNodeChild }).clearIcon,
      componentName: 'TextArea',
    });

    // ============================ Resize =============================
    const isMouseDown = ref(false);
    const resizeDirty = ref(false);

    const innerRef = shallowRef<TextAreaRef | null>(null);
    let mouseDocument: Document | undefined;
    const onMouseUp = (): void => {
      isMouseDown.value = false;
      mouseDocument?.removeEventListener('mouseup', onMouseUp);
      mouseDocument = undefined;
    };
    const onInternalMouseDown = (): void => {
      onMouseUp();
      isMouseDown.value = true;
      mouseDocument = innerRef.value?.resizableTextArea?.textArea?.ownerDocument;
      mouseDocument?.addEventListener('mouseup', onMouseUp);
    };
    onBeforeUnmount(onMouseUp);
    const onInternalResize = (size: { width: number; height: number }): void => {
      emit('resize', size);
      const editor = innerRef.value?.resizableTextArea?.textArea;
      if (
        isMouseDown.value &&
        editor &&
        editor.ownerDocument.defaultView?.getComputedStyle(editor).resize === 'both'
      )
        resizeDirty.value = true;
    };

    expose({
      focus: (option?: { preventScroll?: boolean }) => {
        innerRef.value?.focus(option);
      },
      blur: () => {
        innerRef.value?.blur();
      },
      get resizableTextArea() {
        return innerRef.value?.resizableTextArea;
      },
      get nativeElement() {
        return innerRef.value?.nativeElement ?? null;
      },
    } satisfies TextAreaRef);

    return () => {
      const p = prefixCls.value;
      return h(
        RcTextArea,
        mergeProps(attrs, {
          ref: innerRef as never,
          prefixCls: p,
          autoComplete: props.autoComplete ?? (context as { autoComplete?: string }).autoComplete,
          value: props.value,
          defaultValue: props.defaultValue,
          disabled: mergedDisabled.value,
          readOnly: props.readOnly,
          rows: props.rows,
          maxLength: props.maxLength,
          hidden: props.hidden,
          placeholder: props.placeholder,
          autoSize: props.autoSize,
          allowClear: mergedAllowClear.value,
          showCount: props.showCount,
          count: props.count,
          suffix: hasFeedback.value
            ? h('span', { class: `${p}-textarea-suffix` }, [
                asNode(formItemContext.value.feedbackIcon as never),
              ])
            : undefined,
          className: [
            // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
            attrs.class,
            compactItemClassnames.value,
            (context as { className?: string }).className,
            mergedClassNames.value.root,
            { [`${p}-textarea-affix-wrapper-resize-dirty`]: resizeDirty.value },
          ],
          style: mergedStyles.value.root,
          themeStyle: themeStyle.value,
          styles: mergedStyles.value as never,
          classNames: {
            ...mergedClassNames.value,
            textarea: [
              {
                [`${p}-sm`]: mergedSize.value === 'small',
                [`${p}-lg`]: mergedSize.value === 'large',
                [`${p}-mouse-active`]: isMouseDown.value,
                [`${p}-rtl`]: direction.value === 'rtl',
              },
              mergedClassNames.value.textarea,
            ],
            variant: [
              { [`${p}-${variant.value}`]: enableVariantCls.value },
              getStatusClassNames(p, mergedStatus.value),
            ],
            affixWrapper: [
              `${p}-textarea-affix-wrapper`,
              {
                [`${p}-affix-wrapper-rtl`]: direction.value === 'rtl',
                [`${p}-affix-wrapper-sm`]: mergedSize.value === 'small',
                [`${p}-affix-wrapper-lg`]: mergedSize.value === 'large',
                [`${p}-textarea-show-count`]: !!(props.showCount || props.count?.show),
              },
            ],
          },
          onValueChange: (value: string) => emit('update:value', value),
          onChange: (event: Event) => emit('change', event),
          onClear: (event: MouseEvent) => emit('clear', event),
          onPressEnter: (event: KeyboardEvent) => emit('pressEnter', event),
          onMousedown: onInternalMouseDown,
          onResize: onInternalResize,
        }),
      );
    };
  },
});
