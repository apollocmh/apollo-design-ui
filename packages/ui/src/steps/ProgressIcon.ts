/**
 * ProgressIcon —— process 步的百分比进度环（antd `ProgressIcon.tsx` 47 行的 Vue 自建）。
 *
 * antd 原文用 genCssVar(rootPrefixCls, 'cmp-steps') 取 `progress-radius` —— 本仓的
 * 组件变量按 D69 落 `--apollo-steps-*`（样式提取产物），直接消费。
 */

import { defineComponent, h, type VNodeChild } from 'vue';

const ProgressIcon = defineComponent({
  name: 'AStepsProgressIcon',
  props: {
    prefixCls: { type: String, required: true },
    /** 百分比 0~100。 */
    percent: { type: Number, required: true },
  },
  setup(props, { slots }) {
    return () => {
      const progressCls = `${props.prefixCls}-item-progress-icon`;
      const circleCls = `${progressCls}-circle`;
      // antd：dashArray = calc(progress-radius * 2 * (PI * percent / 100)) 9999
      const dashArray = `calc(var(--apollo-steps-progress-radius, 28) * 2 * ${(
        (Math.PI * props.percent) / 100
      ).toFixed(4)}) 9999`;

      const children: VNodeChild = slots.default?.();

      return [
        h(
          'svg',
          {
            class: `${progressCls}-svg`,
            viewBox: '0 0 100 100',
            width: '100%',
            height: '100%',
            xmlns: 'http://www.w3.org/2000/svg',
            role: 'progressbar',
            'aria-valuemax': 100,
            'aria-valuemin': 0,
            'aria-valuenow': props.percent,
          },
          [
            h('circle', { class: `${circleCls} ${circleCls}-rail` }),
            h('circle', {
              class: `${circleCls} ${circleCls}-ptg`,
              'stroke-dasharray': dashArray,
              transform: 'rotate(-90 50 50)',
            }),
          ],
        ),
        children,
      ];
    };
  },
});

export default ProgressIcon;
