/** Native Checkbox: accepted checked state, owned DOM notifications and explicit input/root attrs. */

import { isRenderable, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  type PropType,
  type SlotsType,
  shallowRef,
  watch,
  watchEffect,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useFormItemInputContext } from '../form/context';
import { useCheckboxGroup } from './context';
import type {
  CheckboxProps,
  CheckboxSemanticClassNames,
  CheckboxSemanticStyles,
  CheckboxSlots,
} from './interface';
import { useBubbleLock } from './use-bubble-lock';

/** antd Wave 的 TARGET_CLS 是固定常量（不随 prefixCls 变），SSR 产物里就有它。 */
export const WAVE_TARGET_CLS = 'ant-wave-target';

export const CheckboxComponent = defineComponent({
  name: 'ACheckbox',
  inheritAttrs: false,
  expose: ['focus', 'blur', 'input', 'nativeElement'],
  props: {
    prefixCls: { type: String, default: undefined },
    defaultChecked: { type: Boolean, default: false },
    checked: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    indeterminate: { type: Boolean, default: false },
    skipGroup: { type: Boolean, default: false },
    // Native option values and Group data share the same scalar contract.
    value: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      default: undefined,
    },
    name: { type: String, default: undefined },
    id: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    required: { type: Boolean, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<CheckboxProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<CheckboxProps['styles']>, default: undefined },
  },
  emits: {
    'update:checked': (_checked: boolean) => true,
    change: (_event: Event, _checked: boolean) => true,
    click: (_event: MouseEvent) => true,
    mouseenter: (_event: MouseEvent) => true,
    mouseleave: (_event: MouseEvent) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    keydown: (_event: KeyboardEvent) => true,
    keypress: (_event: KeyboardEvent) => true,
  },
  slots: Object as SlotsType<CheckboxSlots>,
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<{
      className?: string;
      style?: import('vue').CSSProperties;
      classNames?: CheckboxProps['classNames'];
      styles?: CheckboxProps['styles'];
    }>('checkbox');
    const checkboxGroup = useCheckboxGroup();
    const contextDisabled = useDisabled();
    const form = useFormItemInputContext();
    const devWarning = useDevWarning('Checkbox');
    watchEffect(() => {
      devWarning(
        props.checked !== undefined || !!checkboxGroup || props.value === undefined,
        '`value` is not a valid prop, do you mean `checked`?',
      );
    });
    const inGroup = computed(() => !!checkboxGroup && !props.skipGroup);
    const mergedDisabled = computed(
      () =>
        props.disabled ??
        (inGroup.value ? checkboxGroup?.disabled : undefined) ??
        contextDisabled.value,
    );
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked,
      getValue: () => props.checked,
    });
    const mergedChecked = computed(() =>
      inGroup.value && checkboxGroup
        ? props.value !== undefined && checkboxGroup.value.includes(props.value)
        : innerChecked.value,
    );
    const inputRef = shallowRef<HTMLInputElement | null>(null);
    const holderRef = shallowRef<HTMLElement | null>(null);
    const syncNativeState = () => {
      const input = inputRef.value;
      if (!input) return;
      input.checked = mergedChecked.value;
      input.indeterminate = props.indeterminate;
    };
    const onInternalChange = (event: Event) => {
      const input = inputRef.value;
      if (!input) return;
      if (!mergedDisabled.value) {
        const checked = input.checked;
        if (!inGroup.value) setInnerChecked(checked);
        emit('update:checked', checked);
        emit('change', event, checked);
        if (inGroup.value && checkboxGroup && props.value !== undefined)
          checkboxGroup.toggleOption(props.value);
      }
      void nextTick(syncNativeState);
    };
    if (checkboxGroup) {
      watch(
        () => [props.value, props.skipGroup] as const,
        ([value, skip], _previous, onCleanup) => {
          if (skip || value === undefined) return;
          checkboxGroup.registerValue(value);
          onCleanup(() => checkboxGroup.cancelValue(value));
        },
        { immediate: true },
      );
    }
    watchEffect(() => {
      if (inputRef.value) inputRef.value.indeterminate = props.indeterminate;
    });
    onMounted(() => {
      syncNativeState();
      if (props.autoFocus && !mergedDisabled.value) inputRef.value?.focus();
    });
    const semanticProps = computed<CheckboxProps>(() => ({
      ...props,
      disabled: mergedDisabled.value,
      checked: mergedChecked.value,
    }));
    const info = computed(() => ({ props: semanticProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<CheckboxSemanticClassNames>(
        resolveSemantic(context.classNames, info.value),
        resolveSemantic(props.classNames, info.value),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<CheckboxSemanticStyles>(
        resolveSemantic(context.styles, info.value),
        context.style ? { root: context.style } : undefined,
        resolveSemantic(props.styles, info.value),
      ),
    );
    const { onLabelClick, onInputClick } = useBubbleLock(
      () => (event: MouseEvent) => emit('click', event),
    );
    const focus = (options?: FocusOptions) => inputRef.value?.focus(options);
    const blur = () => inputRef.value?.blur();
    const prefixCls = computed(() => context.getPrefixCls('checkbox', props.prefixCls));
    const renderCheckbox = () => {
      const cls = prefixCls.value;
      const { class: _class, style: _style, ...inputAttrs } = attrs;
      const label = slots.default?.();
      return h(
        'label',
        {
          class: [
            `${cls}-wrapper`,
            {
              [`${cls}-rtl`]: context.direction === 'rtl',
              [`${cls}-wrapper-checked`]: mergedChecked.value,
              [`${cls}-wrapper-disabled`]: mergedDisabled.value,
              [`${cls}-wrapper-in-form-item`]: form.value.isFormItemInput,
            },
            context.className,
            attrs.class,
            mergedClassNames.value.root,
          ],
          style: [mergedStyles.value.root, attrs.style],
          onMouseenter: (event: MouseEvent) => emit('mouseenter', event),
          onMouseleave: (event: MouseEvent) => emit('mouseleave', event),
          onClick: onLabelClick,
        },
        [
          h(
            'span',
            {
              class: [
                cls,
                mergedClassNames.value.icon,
                { [`${cls}-indeterminate`]: props.indeterminate },
                WAVE_TARGET_CLS,
                {
                  [`${cls}-checked`]: mergedChecked.value,
                  [`${cls}-disabled`]: mergedDisabled.value,
                },
              ],
              title: props.title,
              style: mergedStyles.value.icon,
              ref: holderRef,
            },
            [
              h('input', {
                ...inputAttrs,
                id: props.id,
                required: props.required,
                tabIndex: props.tabIndex,
                autofocus: props.autoFocus,
                class: `${cls}-input`,
                type: 'checkbox',
                ref: inputRef,
                value: props.value,
                name: inGroup.value && checkboxGroup ? checkboxGroup.name : props.name,
                checked: mergedChecked.value,
                disabled: mergedDisabled.value,
                onClick: onInputClick,
                onChange: onInternalChange,
                onFocus: (event: FocusEvent) => emit('focus', event),
                onBlur: (event: FocusEvent) => emit('blur', event),
                onKeydown: (event: KeyboardEvent) => emit('keydown', event),
                onKeypress: (event: KeyboardEvent) => emit('keypress', event),
              }),
            ],
          ),
          isRenderable(label)
            ? h(
                'span',
                {
                  class: [`${cls}-label`, mergedClassNames.value.label],
                  style: mergedStyles.value.label,
                },
                [label],
              )
            : null,
        ],
      );
    };
    return { input: inputRef, nativeElement: holderRef, focus, blur, renderCheckbox };
  },
  render() {
    return this.renderCheckbox();
  },
});
export const Checkbox = CheckboxComponent;
export default Checkbox;
