/** Button presentation only; props, owned events, models, slots and real refs belong to Radio. */
import { computed, defineComponent, h, type SlotsType, shallowRef } from 'vue';
import { provideRadioOptionTypeContext } from './context';
import type { RadioRef, RadioSlots } from './interface';
import { RadioComponent, radioEmits, radioPropDefs } from './Radio';

export const ButtonComponent = defineComponent({
  name: 'ARadioButton',
  inheritAttrs: false,
  expose: ['focus', 'blur', 'input', 'nativeElement'],
  props: radioPropDefs,
  emits: radioEmits,
  slots: Object as SlotsType<RadioSlots>,
  setup(props, { attrs, emit, slots }) {
    provideRadioOptionTypeContext('button');
    const inner = shallowRef<RadioRef | null>(null);
    const input = () => inner.value?.input ?? null;
    const nativeElement = () => inner.value?.nativeElement ?? null;
    const focus = (options?: FocusOptions): void => {
      inner.value?.focus(options);
    };
    const blur = (): void => {
      inner.value?.blur();
    };
    const renderButton = () =>
      h(
        RadioComponent,
        {
          ...attrs,
          ...props,
          ref: inner,
          'onUpdate:checked': (checked) => emit('update:checked', checked),
          onChange: (event, checked) => emit('change', event, checked),
          onClick: (event) => emit('click', event),
          onMouseenter: (event) => emit('mouseenter', event),
          onMouseleave: (event) => emit('mouseleave', event),
          onFocus: (event) => emit('focus', event),
          onBlur: (event) => emit('blur', event),
          onKeydown: (event) => emit('keydown', event),
          onKeypress: (event) => emit('keypress', event),
        },
        { ...slots },
      );
    return {
      input: computed(input),
      nativeElement: computed(nativeElement),
      focus,
      blur,
      renderButton,
    };
  },
  render() {
    return this.renderButton();
  },
});
export type { RadioProps } from './interface';
export const Button = ButtonComponent;
export default Button;
