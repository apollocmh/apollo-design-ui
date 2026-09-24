/**
 * TextArea —— antd 6.6.4 `components/input/TextArea.tsx` 的 Vue 实现。
 *
 * 与 Input 的差异判据（es/input/TextArea.js + 源码 253 行）：
 *  1. prefixCls 同样是 `input`（`getPrefixCls('input')`），但语义键是 `textArea`
 *     （`useComponentConfig('textArea')`、`useVariant('textArea', …)`）。
 *  2. affixWrapper 恒带 `${p}-textarea-affix-wrapper`，另加
 *     `-textarea-show-count`（showCount 或 count.show）、尺寸/rtl 派生。
 *  3. **resize 脏标记**：鼠标按下期间发生 resize 且 computed `resize === 'both'`
 *     ⇒ 加 `-textarea-affix-wrapper-resize-dirty`（issue 51594）。
 *  4. mousedown 期间给 textarea 加 `${p}-mouse-active`。
 *  5. suffix 仅来自 `hasFeedback`（feedbackIcon），count 节点由引擎渲染。
 */

import { useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useAllowClear } from '../_internal/use-allow-clear';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { RcTextArea } from './engine/TextArea';
import type {
  TextAreaProps,
  TextAreaRef,
  TextAreaSemanticClassNames,
  TextAreaSemanticStyles,
} from './interface';

function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return undefined;
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
    rootClassName: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<TextAreaProps['style']>, default: undefined },
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
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const devWarning = useDevWarning('TextArea');
    devWarning.deprecated(props.bordered === undefined, 'bordered', 'variant');

    const context = useComponentConfig('textArea');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const formItemContext = useFormItemInputContext();

    const prefixCls = computed(() => getPrefixCls('input', props.prefixCls));
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

    const mergedProps = computed<TextAreaProps>(
      () => ({ ...props, size: mergedSize.value, disabled: mergedDisabled.value }) as TextAreaProps,
    );
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TextAreaProps,
      TextAreaSemanticClassNames,
      TextAreaSemanticStyles
    >(
      [() => context.classNames as TextAreaSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as TextAreaSemanticStyles | undefined,
        () => semanticRootStyle(undefined),
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      mergedProps.value,
    );

    const mergedAllowClear = useAllowClear({
      allowClear: props.allowClear,
      clearIcon: asNode(props.clearIcon),
      contextAllowClear: (context as { allowClear?: TextAreaProps['allowClear'] }).allowClear,
      contextClearIcon: asNode((context as { clearIcon?: VNodeChild }).clearIcon as never),
      componentName: 'TextArea',
    });

    // ============================ Resize =============================
    const isMouseDown = ref(false);
    const resizeDirty = ref(false);

    const onInternalMouseDown = (e: MouseEvent): void => {
      isMouseDown.value = true;
      (attrs as { onMouseDown?: (e: MouseEvent) => void }).onMouseDown?.(e);
      const onMouseUp = (): void => {
        isMouseDown.value = false;
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mouseup', onMouseUp);
    };
    const onInternalResize = (size: { width: number; height: number }): void => {
      (attrs as { onResize?: (size: { width: number; height: number }) => void }).onResize?.(size);
      if (isMouseDown.value && typeof getComputedStyle === 'function') {
        const inner = innerRef.value as unknown as { nativeElement?: HTMLElement | null } | null;
        const ele = inner?.nativeElement?.querySelector('textarea');
        if (ele && getComputedStyle(ele).resize === 'both') {
          resizeDirty.value = true;
        }
      }
    };

    const innerRef = shallowRef<TextAreaRef | null>(null);

    const handleChange = (e: unknown): void => {
      const value = (e as { target?: { value?: string } })?.target?.value;
      emit('update:value', value);
      (attrs as { onChange?: (e: unknown) => void }).onChange?.(e);
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
      return h(RcTextArea, {
        ...attrs,
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
          props.className,
          props.rootClassName,
          compactItemClassnames.value,
          (context as { className?: string }).className,
          mergedClassNames.value.root,
          { [`${p}-textarea-affix-wrapper-resize-dirty`]: resizeDirty.value },
        ],
        style: mergedStyles.value.root,
        styles: mergedStyles.value as never,
        classNames: {
          ...mergedClassNames.value,
          textarea: [
            {
              [`${p}-sm`]: mergedSize.value === 'small',
              [`${p}-lg`]: mergedSize.value === 'large',
              [`${p}-mouse-active`]: isMouseDown.value,
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
        onChange: handleChange,
        onMousedown: onInternalMouseDown,
        onResize: onInternalResize,
      } as never);
    };
  },
});
