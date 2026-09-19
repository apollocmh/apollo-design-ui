/**
 * 默认的四点旋转指示器（`Looper`）。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/Indicator/Looper.tsx`。**逐条对齐**，
 * 包括「`percent > 0` 时 holder 带 `-hidden`」这条反直觉的判据
 * （有进度时四点缩到 0.3 倍并淡出，让位给进度环）。
 *
 * ── 为什么它是 `.ts` 而不是 `.vue` ────────────────────────────────────────────
 *
 * `COMPONENT-RULES.md` §2 允许非 SFC 的第一种情形就是「纯渲染函数型内部件」。
 * 本组件有两个根节点（holder + Progress）且没有自己的状态，用 SFC 反而要写
 * 一个什么都不做的 `<template>`。与 `empty/components/NodeRenderer.ts` 同一形态
 * （那里也记录了「为什么不用 `<component :is>`」）。
 */

import { type CSSProperties, type PropType, defineComponent, h } from 'vue';
import { Progress } from './Progress';

export const Looper = defineComponent({
  name: 'ASpinLooper',
  props: {
    prefixCls: { type: String, required: true },
    /** Indicator 传下来的合并进度；`undefined` 由默认值兜成 0。 */
    percent: { type: Number, default: 0 },
    className: { type: String, default: undefined },
    style: { type: null as unknown as PropType<CSSProperties | undefined>, default: undefined },
  },
  setup(props) {
    return () => {
      const dotClassName = `${props.prefixCls}-dot`;
      const holderClassName = `${dotClassName}-holder`;
      const hideClassName = `${holderClassName}-hidden`;

      return [
        h(
          'span',
          {
            class: [holderClassName, props.className, props.percent > 0 && hideClassName],
            style: props.style,
          },
          [
            h('span', { class: [dotClassName, `${dotClassName}-spin`] }, [
              h('i', { class: `${dotClassName}-item` }),
              h('i', { class: `${dotClassName}-item` }),
              h('i', { class: `${dotClassName}-item` }),
              h('i', { class: `${dotClassName}-item` }),
            ]),
          ],
        ),
        h(Progress, { prefixCls: props.prefixCls, percent: props.percent }),
      ];
    };
  },
});
