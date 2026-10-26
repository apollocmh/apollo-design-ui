/** Determinate SVG progress is available in the first client and server render. */
import { defineComponent, h } from 'vue';

export const VIEW_SIZE = 100;
export const BORDER_WIDTH = VIEW_SIZE / 5;
export const RADIUS = VIEW_SIZE / 2 - BORDER_WIDTH / 2;
export const CIRCUMFERENCE = RADIUS * 2 * Math.PI;
export const POSITION = 50;

export const Progress = defineComponent({
  name: 'ASpinProgress',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    percent: { type: Number, default: undefined },
  },
  setup(props) {
    return () => {
      if (typeof props.percent !== 'number' || !Number.isFinite(props.percent)) return null;
      const dot = `${props.prefixCls}-dot`;
      const safe = Math.max(0, Math.min(props.percent, 100));
      const circleStyle = {
        strokeDashoffset: `${CIRCUMFERENCE / 4}`,
        strokeDasharray: `${(CIRCUMFERENCE * safe) / 100} ${(CIRCUMFERENCE * (100 - safe)) / 100}`,
      };
      return h('span', { class: [`${dot}-holder`, `${dot}-progress`] }, [
        h(
          'svg',
          {
            viewBox: `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`,
            role: 'progressbar',
            'aria-label': 'Loading progress',
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': safe,
          },
          [
            h('circle', {
              class: [`${dot}-circle`, `${dot}-circle-bg`],
              r: RADIUS,
              cx: POSITION,
              cy: POSITION,
              'stroke-width': BORDER_WIDTH,
            }),
            h('circle', {
              class: `${dot}-circle`,
              r: RADIUS,
              cx: POSITION,
              cy: POSITION,
              'stroke-width': BORDER_WIDTH,
              style: circleStyle,
            }),
          ],
        ),
      ]);
    };
  },
});
