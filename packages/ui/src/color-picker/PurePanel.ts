/** The real picker panel in normal document flow, without measuring or polling a popup. */
import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import ColorPicker from './ColorPicker.vue';
import type { AggregationColor } from './color';
import type { ColorFormatType, ColorPickerProps, ColorPickerSlots } from './interface';

export const PurePanel = defineComponent({
  name: 'AColorPickerPurePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<Pick<ColorPickerSlots, 'panelRender'>>,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    colorPickerProps: { type: Object as PropType<Partial<ColorPickerProps>>, default: undefined },
  },
  emits: {
    'update:value': (_value: AggregationColor) => true,
    change: (_value: AggregationColor, _css: string) => true,
    changeComplete: (_value: AggregationColor) => true,
    clear: () => true,
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean) => true,
    'update:format': (_format: ColorFormatType | undefined) => true,
    formatChange: (_format: ColorFormatType | undefined) => true,
  },
  setup(props, { attrs, slots, emit }) {
    const { getPrefixCls } = useComponentConfig('color-picker');
    const prefixCls = computed(() =>
      getPrefixCls('color-picker', props.prefixCls ?? props.colorPickerProps?.prefixCls),
    );
    const holder = ref<HTMLDivElement | null>(null);
    const [open, setOpen] = useControlledValue<boolean>({
      defaultValue: () => false,
      getValue: () => props.open,
    });
    onMounted(() => setOpen(true));
    const staticStyles: NonNullable<ColorPickerProps['styles']> = (info) => {
      const configured = props.colorPickerProps?.styles;
      const styles = typeof configured === 'function' ? configured(info) : configured;
      return {
        ...styles,
        popup: {
          root: {
            ...styles?.popup?.root,
            position: 'relative',
            inset: 0,
            transform: 'none',
            opacity: 1,
            margin: 0,
          },
        },
      };
    };

    return () =>
      h(
        'div',
        mergeProps(attrs, {
          ref: holder,
          style: { position: 'relative' },
        }),
        [
          h(
            ColorPicker,
            mergeProps(props.colorPickerProps ?? {}, {
              prefixCls: prefixCls.value,
              open: open.value,
              getPopupContainer: (trigger: HTMLElement) => holder.value ?? trigger,
              placement: 'bottom',
              autoAdjustOverflow: false,
              arrow: false,
              styles: staticStyles,
              'onUpdate:value': (value: AggregationColor) => emit('update:value', value),
              onChange: (value: AggregationColor, css: string) => emit('change', value, css),
              onChangeComplete: (value: AggregationColor) => emit('changeComplete', value),
              onClear: () => emit('clear'),
              'onUpdate:open': (value: boolean) => emit('update:open', value),
              onOpenChange: (value: boolean) => emit('openChange', value),
              'onUpdate:format': (value: ColorFormatType | undefined) =>
                emit('update:format', value),
              onFormatChange: (value: ColorFormatType | undefined) => emit('formatChange', value),
            }),
            {
              default: () => h('span', { style: { display: 'none' }, 'aria-hidden': 'true' }),
              ...(slots.panelRender ? { panelRender: slots.panelRender } : {}),
            },
          ),
        ],
      );
  },
});

export default PurePanel;
