import { EyeInvisibleOutlined, EyeOutlined } from '@apollo-design/icons';
import { defaultLocale, useLocale } from '@apollo-design/locale';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { useRemovePasswordTimeout } from './hooks/use-remove-password-timeout';
import { InputComponent, inputProps } from './Input';
import { inputEmits } from './input-emits';
import type {
  InputPasswordProps,
  InputPasswordSlots,
  InputRef,
  InputSemanticStyles,
  PasswordSemanticClassNames,
} from './interface';

function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

const { type: _passwordType, ...passwordInputProps } = inputProps;

export const PasswordComponent = defineComponent({
  name: 'AInputPassword',
  inheritAttrs: false,
  slots: Object as SlotsType<InputPasswordSlots>,
  props: {
    ...passwordInputProps,
    inputPrefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<InputPasswordProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<InputPasswordProps['styles']>,
      default: undefined,
    },
    action: { type: String as PropType<'click' | 'hover'>, default: undefined },
    visibilityToggle: {
      type: [Boolean, Object] as PropType<InputPasswordProps['visibilityToggle']>,
      default: true,
    },
  },
  emits: inputEmits,
  setup(props, { attrs, emit, expose, slots }) {
    const context = useComponentConfig<ComponentStyleConfig & Record<string, unknown>>(
      'inputPassword',
    );
    const prefixCls = computed(() => context.getPrefixCls('input-password', props.prefixCls));
    const inputPrefixCls = computed(() => context.getPrefixCls('input', props.inputPrefixCls));
    const [globalLocale] = useLocale('global');
    const disabled = useDisabled();
    const direction = useDirection();
    const { compactSize } = useCompactItemContext(inputPrefixCls, () => direction.value);
    const size = useSize((provider) => props.size ?? compactSize.value ?? provider);
    const mergedDisabled = computed(() => props.disabled ?? disabled.value);
    const form = useFormItemInputContext();
    const status = computed(() => getMergedStatus(form.value.status, props.status));
    const { variant } = useVariant({
      component: 'inputPassword',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });
    const mergedProps = computed<InputPasswordProps>(() => ({
      ...attrs,
      ...props,
      size: size.value,
      disabled: mergedDisabled.value,
      status: status.value,
      variant: variant.value,
    }));
    const { classNames, styles } = useMergeSemantic<
      InputPasswordProps,
      PasswordSemanticClassNames,
      InputSemanticStyles
    >(
      [() => context.classNames as PasswordSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as InputSemanticStyles | undefined,
        () => semanticRootStyle(context.style),
        () => props.styles,
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      () => mergedProps.value,
    );
    const toggle = computed(() => props.visibilityToggle ?? true);
    const controlled = computed(
      () => typeof toggle.value === 'object' && toggle.value.visible !== undefined,
    );
    const innerVisible = ref(false);
    const visible = computed(() =>
      typeof toggle.value === 'object' && toggle.value.visible !== undefined
        ? toggle.value.visible
        : innerVisible.value,
    );
    watch(
      () => (typeof toggle.value === 'object' ? toggle.value.visible : undefined),
      (next) => {
        if (next !== undefined) innerVisible.value = next;
      },
    );
    const inputRef = shallowRef<InputRef | null>(null);
    const removePasswordTimeout = useRemovePasswordTimeout(() => inputRef.value, true);
    function onVisibleChange(): void {
      if (mergedDisabled.value) return;
      if (visible.value) removePasswordTimeout();
      const next = !visible.value;
      if (!controlled.value) innerVisible.value = next;
      if (typeof toggle.value === 'object') toggle.value.onVisibleChange?.(next);
    }
    expose({
      focus: (option) => inputRef.value?.focus(option),
      blur: () => inputRef.value?.blur(),
      setSelectionRange: (start, end, direction) =>
        inputRef.value?.setSelectionRange(start, end, direction),
      select: () => inputRef.value?.select(),
      get input() {
        return inputRef.value?.input ?? null;
      },
      get nativeElement() {
        return inputRef.value?.nativeElement ?? null;
      },
    } satisfies InputRef);
    return () => {
      const {
        inputPrefixCls: _inputPrefix,
        prefixCls: _prefix,
        action: _action,
        visibilityToggle: _toggle,
        classNames: _classNames,
        styles: _styles,
        suffix: _suffix,
        ...inputProps
      } = props;
      const { type: _type, ...inputAttrs } = attrs;
      const action =
        props.action ??
        (typeof toggle.value === 'object' ? toggle.value.action : undefined) ??
        'click';
      const icon =
        toggle.value === false
          ? null
          : h(
              'button',
              {
                type: 'button',
                class: [`${prefixCls.value}-icon`, classNames.value.icon],
                disabled: mergedDisabled.value,
                tabIndex: mergedDisabled.value
                  ? -1
                  : typeof toggle.value === 'object'
                    ? (toggle.value.tabIndex ?? 0)
                    : 0,
                'aria-pressed': visible.value,
                'aria-label': visible.value
                  ? globalLocale.value.hide?.trim() || defaultLocale.global?.hide
                  : globalLocale.value.show?.trim() || defaultLocale.global?.show,
                onMousedown: (event: MouseEvent) => event.preventDefault(),
                onMouseup: (event: MouseEvent) => event.preventDefault(),
                onMouseenter: () => {
                  if (action === 'hover') onVisibleChange();
                },
                onClick: (event: MouseEvent) => {
                  if (action === 'click' || event.detail === 0) onVisibleChange();
                },
              },
              [
                slots.icon
                  ? slots.icon({ visible: visible.value })
                  : visible.value
                    ? h(EyeOutlined)
                    : h(EyeInvisibleOutlined),
              ],
            );
      return h(
        InputComponent,
        {
          ...inputAttrs,
          ...inputProps,
          ref: inputRef,
          prefixCls: inputPrefixCls.value,
          type: visible.value ? 'text' : 'password',
          disabled: mergedDisabled.value,
          size: size.value,
          variant: variant.value,
          class: [prefixCls.value, context.className, attrs.class],
          classNames: classNames.value,
          styles: styles.value,
          'onUpdate:value': (value) => emit('update:value', value),
          onChange: (event) => emit('change', event),
          onClear: (event) => emit('clear', event),
          onPressEnter: (event) => emit('pressEnter', event),
        },
        {
          prefix: () => (slots.prefix ? slots.prefix() : asNode(props.prefix)),
          suffix: () => [icon, slots.suffix ? slots.suffix() : asNode(props.suffix)],
        },
      );
    };
  },
});
