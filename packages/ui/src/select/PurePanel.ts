import { computed, defineComponent, h, ref, type SlotsType, shallowRef } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import type {
  DefaultOptionType,
  LabeledValue,
  RawValueType,
  ScrollToArg,
  SelectRef,
  SelectSlots,
  SelectValue,
} from './interface';
import Select, { selectEmits, selectProps } from './Select';

/** Static preview renders its open popup in the same layout container. */
export const PurePanel = defineComponent({
  name: 'ASelectPurePanel',
  inheritAttrs: false,
  props: selectProps,
  slots: Object as SlotsType<SelectSlots>,
  emits: selectEmits,
  expose: ['focus', 'blur', 'scrollTo', 'nativeElement'],
  setup(props, { slots, attrs, emit }) {
    const config = useComponentConfig('select');
    const host = ref<HTMLElement | null>(null);
    const select = shallowRef<SelectRef | null>(null);
    const getPopupContainer = (trigger: HTMLElement) => host.value ?? trigger;
    const renderPanel = () =>
      h(
        'div',
        {
          ref: host,
          class: `${props.prefixCls ?? config.getPrefixCls('select')}-dropdown-wrapper`,
          style: { position: 'relative' },
        },
        [
          h(
            Select,
            {
              ...attrs,
              ...props,
              ref: select,
              open: true,
              getPopupContainer,
              popupStyle: {
                ...props.popupStyle,
                position: 'relative',
                top: 0,
                left: 0,
                right: 'auto',
                bottom: 'auto',
              },
              onChange: (
                value: SelectValue,
                option: DefaultOptionType | DefaultOptionType[] | undefined,
              ) => emit('change', value, option),
              'onUpdate:value': (value: SelectValue) => emit('update:value', value),
              onSelect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
                emit('select', value, option),
              onDeselect: (value: RawValueType | LabeledValue, option: DefaultOptionType) =>
                emit('deselect', value, option),
              onSearch: (value: string) => emit('search', value),
              'onUpdate:searchValue': (value: string) => emit('update:searchValue', value),
              onOpenChange: (open: boolean) => emit('openChange', open),
              'onUpdate:open': (open: boolean) => emit('update:open', open),
              onFocus: (event: FocusEvent) => emit('focus', event),
              onBlur: (event: FocusEvent) => emit('blur', event),
              onClear: () => emit('clear'),
              onPopupScroll: (event: Event) => emit('popupScroll', event),
              onInputKeyDown: (event: KeyboardEvent) => emit('inputKeyDown', event),
            },
            slots,
          ),
        ],
      );
    return {
      focus: (options?: FocusOptions) => select.value?.focus(options),
      blur: () => select.value?.blur(),
      scrollTo: (arg?: ScrollToArg) => select.value?.scrollTo(arg),
      nativeElement: computed(() => select.value?.nativeElement ?? null),
      renderPanel,
    };
  },
  render() {
    return this.renderPanel();
  },
});
export default PurePanel;
