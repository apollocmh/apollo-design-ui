/** Capture Vue descendant errors without imposing a wrapper on healthy content. */
import { mergeDomAttrs } from '@apollo-design/utils';
import {
  defineComponent,
  h,
  onErrorCaptured,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import Alert from './Alert';
import type { ErrorBoundarySlots } from './interface';

export default defineComponent({
  name: 'AAlertErrorBoundary',
  inheritAttrs: false,
  slots: Object as SlotsType<ErrorBoundarySlots>,
  props: {
    title: {
      type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
    message: {
      type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
    description: {
      type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
    id: { type: String, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const captured = ref(false);
    const error = shallowRef<unknown>();
    const info = ref('');
    onErrorCaptured((value, _instance, phase) => {
      captured.value = true;
      error.value = value;
      info.value = phase;
      return false;
    });
    return () => {
      if (!captured.value) return slots.default?.();
      const title = props.title ?? props.message ?? String(error.value);
      const description =
        props.description !== undefined
          ? props.description
          : h(
              'pre',
              {
                tabindex: 0,
                role: 'region',
                'aria-label': 'Error details',
                style: { fontSize: '0.9em', overflowX: 'auto' },
              },
              info.value,
            );
      return h(
        Alert,
        { ...mergeDomAttrs({ id: props.id }, attrs), type: 'error' },
        {
          title: () => title,
          description: () => description,
        },
      );
    };
  },
});
