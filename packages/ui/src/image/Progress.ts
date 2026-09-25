/**
 * Progress —— antd `components/image/Progress.tsx`（147 行）的 Vue 版。
 *
 * 占位进度层：水彩墨（ink-1/ink-2 + 伪元素共 5 层）+ rail/indicator；
 * 有 percent ⇒ `role=progressbar` + aria-valuenow（clamp 0–100 四舍五入）；
 * 无 percent ⇒ `aria-busy=true` + `role=status` 的 "Loading"（视觉隐藏）。
 */
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import type { ImageProgressConfig, ProgressClassNames, ProgressStyles } from './interface';
import { toCssSize } from './util';

/** antd 的视觉隐藏样式（screen-reader only）。 */
const VISUALLY_HIDDEN_STYLE: Record<string, string | number> = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const Progress = defineComponent({
  name: 'AImageProgress',
  props: {
    prefixCls: { type: String, required: true },
    percent: { type: Number, default: undefined },
    render: {
      type: Function as PropType<ImageProgressConfig['render']>,
      default: undefined,
    },
    classNames: { type: Object as PropType<ProgressClassNames>, default: undefined },
    styles: { type: Object as PropType<ProgressStyles>, default: undefined },
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    width: { type: [Number, String] as PropType<number | string>, default: undefined },
    height: { type: [Number, String] as PropType<number | string>, default: undefined },
  },
  setup(props) {
    const hasPercent = computed(() => isNumber(props.percent));
    const percentValue = computed(() =>
      hasPercent.value ? Math.max(0, Math.min(100, Math.round(props.percent as number))) : 0,
    );

    return () => {
      const percentCls = `${props.prefixCls}-progress`;

      const progressBar = hasPercent.value
        ? h('div', {
            class: [`${percentCls}-rail`, props.classNames?.rail],
            style: {
              ...(props.styles?.rail ?? {}),
              '--progress-percent': `${percentValue.value}%`,
            },
          })
        : null;

      const progressContent: VNodeChild = props.render
        ? props.render(progressBar, percentValue.value)
        : [
            progressBar,
            hasPercent.value
              ? h(
                  'div',
                  {
                    class: [`${percentCls}-indicator`, props.classNames?.indicator],
                    style: props.styles?.indicator,
                  },
                  `${percentValue.value}%`,
                )
              : null,
          ];

      const ariaProps = hasPercent.value
        ? {
            role: 'progressbar',
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': percentValue.value,
            'aria-label': `${percentValue.value}%`,
          }
        : { 'aria-busy': true };

      return h(
        'div',
        {
          class: [
            props.prefixCls,
            `${props.prefixCls}-progress-wrapper`,
            props.classNames?.root,
            props.rootClassName,
          ],
          style: {
            width: toCssSize(props.width),
            height: toCssSize(props.height),
            ...(props.rootStyle ?? {}),
            ...(props.styles?.root ?? {}),
          },
          ...ariaProps,
        },
        [
          !hasPercent.value
            ? h(
                'span',
                { role: 'status', 'aria-live': 'polite', style: VISUALLY_HIDDEN_STYLE },
                'Loading',
              )
            : null,
          // 水彩墨层（2 个元素 + 伪元素 = 5 层）
          h('div', { class: `${percentCls}-ink-1` }),
          h('div', { class: `${percentCls}-ink-2` }),
          h(
            'div',
            {
              class: [`${percentCls}-content`, props.classNames?.content],
              style: props.styles?.content,
            },
            [progressContent].filter((c) => c !== null && c !== undefined),
          ),
        ].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default Progress;
