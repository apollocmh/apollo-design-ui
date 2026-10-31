import {
  type CSSProperties,
  defineComponent,
  h,
  type InjectionKey,
  inject,
  onBeforeUnmount,
  type PropType,
  provide,
  ref,
  type SlotsType,
  watch,
} from 'vue';
import type { PanelKey } from './hooks/useItems';
import type { SplitterPanelProps, SplitterPanelSlots } from './interface';

interface PanelLayout {
  prefixCls: string;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  size?: number | string | undefined;
  destroyOnHidden: boolean;
  supportMotion: boolean;
  rememberAccepted: () => void;
}
const panelLayoutKey: InjectionKey<PanelLayout> = Symbol('splitter-panel-layout');

/** The public Panel remains the actual Vue owner of its attrs, slots and ref. */
export const SplitterPanel = defineComponent({
  name: 'ASplitterPanel',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<SplitterPanelSlots>,
  props: {
    className: { type: String, default: undefined },
    min: { type: [Number, String], default: undefined },
    max: { type: [Number, String], default: undefined },
    size: { type: [Number, String], default: undefined },
    collapsible: {
      type: [Boolean, Object] as PropType<SplitterPanelProps['collapsible']>,
      default: undefined,
    },
    resizable: { type: Boolean, default: undefined },
    defaultSize: { type: [Number, String], default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const layout = inject(panelLayoutKey, undefined);
    const nativeElement = ref<HTMLDivElement | null>(null);
    watch(
      () => props.size,
      (size) => {
        if (size !== undefined) layout?.rememberAccepted();
      },
      { immediate: true, flush: 'sync' },
    );
    const renderPanel = () => {
      if (!layout) return null;
      const size = layout.size;
      const collapsed = size === 0 || (typeof size === 'string' && Number.parseFloat(size) === 0);
      return h(
        'div',
        {
          ...attrs,
          ref: nativeElement,
          class: [
            `${layout.prefixCls}-panel`,
            {
              [`${layout.prefixCls}-panel-hidden`]: collapsed,
              [`${layout.prefixCls}-panel-transition`]: layout.supportMotion,
            },
            layout.className,
            props.className,
            attrs.class,
          ],
          style: [
            layout.style,
            attrs.style,
            {
              flexBasis:
                size === undefined ? 'auto' : typeof size === 'number' ? `${size}px` : size,
              flexGrow: size === undefined ? 1 : 0,
            },
          ],
        },
        [!(layout.destroyOnHidden && collapsed) ? slots.default?.() : null],
      );
    };
    return { nativeElement, renderPanel };
  },
  render() {
    return this.renderPanel();
  },
});

/** A DOM-free layout boundary around each real keyed Panel. */
export const InternalPanel = defineComponent({
  name: 'ASplitterInternalPanel',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    size: { type: [Number, String], default: undefined },
    destroyOnHidden: { type: Boolean, default: false },
    supportMotion: { type: Boolean, default: false },
    rememberAccepted: { type: Function as PropType<() => void>, required: true },
    rememberInitial: { type: Function as PropType<() => void>, required: true },
    itemKey: { type: [String, Number, Symbol] as PropType<PanelKey>, required: true },
    forget: { type: Function as PropType<(key: PanelKey) => void>, required: true },
  },
  setup(props, { slots }) {
    props.rememberInitial();
    provide(panelLayoutKey, props);
    onBeforeUnmount(() => props.forget(props.itemKey));
    return () => slots.default?.();
  },
});
