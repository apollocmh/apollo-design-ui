/** Native Radio: one accepted checked state, owned DOM events and explicit input/root attrs. */
import { isEmptyVNode, useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onScopeDispose,
  type PropType,
  type SlotsType,
  shallowRef,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { useBubbleLock } from '../checkbox/use-bubble-lock';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useFormItemInputContext } from '../form/context';
import { useRadioGroup, useRadioOptionType } from './context';
import type {
  RadioProps,
  RadioSemanticClassNames,
  RadioSemanticStyles,
  RadioSlots,
} from './interface';
import { useRadioTheme } from './use-radio-theme';

export const WAVE_TARGET_CLS = 'ant-wave-target';

/** Shared by RadioButton so both public constructors retain the same actual props. */
export const radioPropDefs = {
  prefixCls: { type: String, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  checked: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  title: { type: String, default: undefined },
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
    type: [Object, Function] as PropType<RadioProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<RadioProps['styles']>, default: undefined },
};
export const radioEmits = {
  'update:checked': (_checked: boolean) => true,
  change: (_event: Event, _checked: boolean) => true,
  click: (_event: MouseEvent) => true,
  mouseenter: (_event: MouseEvent) => true,
  mouseleave: (_event: MouseEvent) => true,
  focus: (_event: FocusEvent) => true,
  blur: (_event: FocusEvent) => true,
  keydown: (_event: KeyboardEvent) => true,
  keypress: (_event: KeyboardEvent) => true,
};
interface RadioConfig {
  className?: string;
  style?: import('vue').CSSProperties;
  classNames?: RadioProps['classNames'];
  styles?: RadioProps['styles'];
}

export const RadioComponent = defineComponent({
  name: 'ARadio',
  inheritAttrs: false,
  expose: ['focus', 'blur', 'input', 'nativeElement'],
  props: radioPropDefs,
  emits: radioEmits,
  slots: Object as SlotsType<RadioSlots>,
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<RadioConfig>('radio');
    const group = useRadioGroup();
    const optionType = useRadioOptionType();
    const contextDisabled = useDisabled();
    const form = useFormItemInputContext();
    const radioPrefix = computed(() => context.getPrefixCls('radio', props.prefixCls));
    const isButton = computed(() => (optionType ?? group?.optionType) === 'button');
    const prefix = computed(() =>
      isButton.value ? `${radioPrefix.value}-button` : radioPrefix.value,
    );
    const themeStyle = useRadioTheme(() => radioPrefix.value);
    const disabled = computed(() => props.disabled ?? group?.disabled ?? contextDisabled.value);
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked,
      getValue: () => props.checked,
    });
    const checked = computed(() =>
      group ? props.value !== undefined && props.value === group.value : innerChecked.value,
    );
    const input = shallowRef<HTMLInputElement | null>(null);
    const nativeElement = shallowRef<HTMLElement | null>(null);
    const syncChecked = () => {
      if (input.value) input.value.checked = checked.value;
    };
    if (group) onScopeDispose(group.registerChecked(syncChecked));
    const onChange = (event: Event) => {
      if (!input.value) return;
      if (!disabled.value) {
        const requested = input.value.checked;
        if (!group) setInnerChecked(requested);
        emit('update:checked', requested);
        emit('change', event, requested);
        if (group && requested && props.value !== undefined) group.onChange(props.value, event);
      }
      // Native same-name activation also unchecks the accepted sibling; restore the entire owner.
      void nextTick(() => (group ? group.syncChecked() : syncChecked()));
    };
    onMounted(() => {
      syncChecked();
      if (props.autoFocus && !disabled.value) input.value?.focus();
    });
    const semanticProps = computed<RadioProps>(() => ({
      ...props,
      checked: checked.value,
      disabled: disabled.value,
    }));
    const info = computed(() => ({ props: semanticProps.value }));
    const classNames = computed(() =>
      mergeClassNames<RadioSemanticClassNames>(
        resolveSemantic(context.classNames, info.value),
        resolveSemantic(props.classNames, info.value),
      ),
    );
    const styles = computed(() =>
      mergeStyles<RadioSemanticStyles>(
        resolveSemantic(context.styles, info.value),
        context.style ? { root: context.style } : undefined,
        resolveSemantic(props.styles, info.value),
      ),
    );
    const { onLabelClick, onInputClick } = useBubbleLock(
      () => (event: MouseEvent) => emit('click', event),
    );
    const focus = (options?: FocusOptions): void => {
      input.value?.focus(options);
    };
    const blur = (): void => {
      input.value?.blur();
    };
    const renderRadio = () => {
      const cls = prefix.value;
      const { class: _class, style: _style, ...inputAttrs } = attrs;
      const label = slots.default?.();
      return h(
        'label',
        {
          class: [
            `${cls}-wrapper`,
            {
              [`${cls}-wrapper-checked`]: checked.value,
              [`${cls}-wrapper-disabled`]: disabled.value,
              [`${cls}-wrapper-rtl`]: context.direction === 'rtl',
              [`${cls}-wrapper-in-form-item`]: form.value.isFormItemInput,
              [`${cls}-wrapper-block`]: group?.block,
            },
            context.className,
            attrs.class,
            classNames.value.root,
          ],
          style: [themeStyle.value, styles.value.root, attrs.style],
          title: props.title,
          onMouseenter: (event: MouseEvent) => emit('mouseenter', event),
          onMouseleave: (event: MouseEvent) => emit('mouseleave', event),
          onClick: onLabelClick,
        },
        [
          h(
            'span',
            {
              ref: nativeElement,
              class: [
                cls,
                classNames.value.icon,
                {
                  [WAVE_TARGET_CLS]: !isButton.value,
                  [`${cls}-checked`]: checked.value,
                  [`${cls}-disabled`]: disabled.value,
                },
              ],
              style: styles.value.icon,
            },
            [
              h('input', {
                ...inputAttrs,
                class: `${cls}-input`,
                type: 'radio',
                ref: input,
                name: group ? group.name : props.name,
                value: props.value,
                checked: checked.value,
                disabled: disabled.value,
                id: props.id,
                required: props.required,
                tabIndex: props.tabIndex,
                autofocus: props.autoFocus,
                onChange,
                onClick: onInputClick,
                onFocus: (event: FocusEvent) => emit('focus', event),
                onBlur: (event: FocusEvent) => emit('blur', event),
                onKeydown: (event: KeyboardEvent) => emit('keydown', event),
                onKeypress: (event: KeyboardEvent) => emit('keypress', event),
              }),
            ],
          ),
          !isEmptyVNode(label)
            ? h(
                'span',
                { class: [`${cls}-label`, classNames.value.label], style: styles.value.label },
                [label],
              )
            : null,
        ],
      );
    };
    return { input, nativeElement, focus, blur, renderRadio };
  },
  render() {
    return this.renderRadio();
  },
});
export const Radio = RadioComponent;
export default Radio;
