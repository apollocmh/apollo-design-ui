/** Upload's presentation options, normalized for the shared Progress component. */
import { computed, defineComponent, h, type PropType } from 'vue';
import { Progress } from '../../progress';
import type { ProgressProps, ProgressSemanticStyles } from '../../progress/interface';
import type { UploadListProgressProps } from '../interface';

export const UploadProgress = defineComponent({
  name: 'AUploadProgress',
  inheritAttrs: false,
  props: {
    percent: { type: Number, default: 0 },
    strokeColor: {
      type: [String, Object] as PropType<UploadListProgressProps['strokeColor']>,
      default: undefined,
    },
    strokeWidth: {
      type: [Number, String] as PropType<UploadListProgressProps['strokeWidth']>,
      default: undefined,
    },
    showInfo: { type: Boolean, default: false },
    size: {
      type: [Number, Array, String] as PropType<UploadListProgressProps['size']>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const size = computed<ProgressProps['size']>(() => {
      if (typeof props.size === 'number' || Array.isArray(props.size)) return props.size;
      if (typeof props.strokeWidth === 'number') return [-1, props.strokeWidth];
      if (props.size === 'small') return 'small';
      return [-1, props.size === 'default' ? 8 : 2];
    });
    const styles = computed<ProgressSemanticStyles | undefined>(() => {
      if (
        typeof props.strokeWidth !== 'string' ||
        typeof props.size === 'number' ||
        Array.isArray(props.size)
      ) {
        return undefined;
      }
      return {
        rail: { height: props.strokeWidth },
        track: { height: props.strokeWidth },
      };
    });
    const percent = computed(() =>
      Number.isFinite(props.percent) ? Math.min(100, Math.max(0, props.percent)) : 0,
    );

    return () =>
      h(Progress, {
        ...attrs,
        type: 'line',
        status: 'normal',
        percent: percent.value,
        size: size.value,
        strokeWidth: typeof props.strokeWidth === 'number' ? props.strokeWidth : undefined,
        strokeColor: props.strokeColor,
        showInfo: props.showInfo,
        styles: styles.value,
      });
  },
});
