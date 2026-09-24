/**
 * MiniProgress —— antd `<Progress type="line" size="small" showInfo={false}>`
 * 的**固定 DOM 子集**复刻（P1：progress 组件未落地，analysis §4）。
 *
 * DOM 判据（antd 6.6.4 实测渲染）：
 * `<div class="ant-progress -status-normal -line -line-align-end
 *  -line-position-outer -small" role="progressbar" aria-valuenow/min/max>`
 *   `<div class="-progress-body" style="width:100%">`
 *     `<div class="-progress-rail" style="height:6px">`
 *       `<div class="-progress-track" style="width:50%;height:6px">`
 *
 * 差异（D 登记）：track 背景色内联 `var(--apollo-color-primary)`
 * （antd 走 progress 自己的 CSS，本仓无该样式段）；strokeColor 覆盖为内联色。
 * progress 组件落地后整体替换为真组件。
 */

import { defineComponent, h, type PropType } from 'vue';

type CSSStyleLike = Record<string, string | number>;

export const MiniProgress = defineComponent({
  name: 'AUploadMiniProgress',
  props: {
    percent: { type: Number, default: 0 },
    /** error 时的轨道色（antd 传 strokeColor=colorError）；默认走主题主色 */
    strokeColor: { type: String as PropType<string | undefined>, default: undefined },
    strokeWidth: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: undefined,
    },
    showInfo: { type: Boolean, default: false },
    size: {
      type: [Number, Array, String] as PropType<number | [number, number] | string>,
      default: undefined,
    },
    'aria-label': { type: String, default: undefined },
    'aria-labelledby': { type: String, default: undefined },
  },
  setup(props) {
    return () => {
      // antd：size 数组第二位 = strokeWidth（[-1, 2] ⇒ 2px）；默认 small 6px
      let railHeight: CSSStyleLike[string] = 6;
      if (Array.isArray(props.size)) {
        railHeight = props.size[1] ?? 6;
      } else if (typeof props.size === 'number') {
        railHeight = props.size;
      } else if (typeof props.strokeWidth !== 'undefined') {
        railHeight = props.strokeWidth;
      }
      const trackColor = props.strokeColor ?? 'var(--apollo-color-primary)';
      return h(
        'div',
        {
          class:
            'apollo-progress apollo-progress-status-normal apollo-progress-line apollo-progress-line-align-end apollo-progress-line-position-outer apollo-progress-small',
          role: 'progressbar',
          'aria-valuenow': props.percent,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-label': props['aria-label'],
          'aria-labelledby': props['aria-labelledby'],
        },
        [
          h('div', { class: 'apollo-progress-body', style: { width: '100%' } }, [
            h('div', { class: 'apollo-progress-rail', style: { height: railHeight } }, [
              h('div', {
                class: 'apollo-progress-track',
                style: {
                  width: `${props.percent}%`,
                  height: railHeight,
                  background: trackColor,
                },
              }),
            ]),
          ]),
        ],
      );
    };
  },
});
