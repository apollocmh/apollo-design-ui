/** The existing four-dot artwork and current determinate progress. */
import { defineComponent, h } from 'vue';
import { Progress } from './Progress';

export const Looper = defineComponent({
  name: 'ASpinLooper',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    percent: { type: Number, default: undefined },
  },
  setup(props) {
    return () => {
      const dot = `${props.prefixCls}-dot`;
      const determinate = typeof props.percent === 'number' && Number.isFinite(props.percent);
      return [
        h(
          'span',
          { class: [`${dot}-holder`, determinate && `${dot}-holder-hidden`], 'aria-hidden': true },
          [
            h(
              'span',
              { class: [dot, `${dot}-spin`] },
              [0, 1, 2, 3].map((index) => h('i', { key: index, class: `${dot}-item` })),
            ),
          ],
        ),
        determinate ? h(Progress, { prefixCls: props.prefixCls, percent: props.percent }) : null,
      ];
    };
  },
});
