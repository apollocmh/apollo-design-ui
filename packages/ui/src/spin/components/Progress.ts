/**
 * 环形进度（Spin 的内嵌 `Progress`）。
 *
 * 契约来源：antd 6.6.4 的 `components/spin/Indicator/Progress.tsx`。**逐条对齐**，
 * 包括四个几何常量与「首次渲染返回 null」这处看起来像 bug 的行为。
 *
 * ── 为什么它要「先返回 null 再渲染」─────────────────────────────────────────────
 *
 * antd 用 `useLayoutEffect` 在 `percent !== 0` 时把 `render` 置真，所以：
 *
 * | percent | React 的结果 |
 * |---|---|
 * | `0`（或 `undefined`，Indicator 侧兜底成 0） | **永不**渲染 —— 连 `<svg>` 都不出现 |
 * | 非 0（哪怕 `-50` / `150`） | 渲染，`safePtg` 被钳到 0~100 |
 *
 * 这是有意的：`percent: 0` 时只显示四点 Looper，不该有一个 `aria-valuenow="0"` 的
 * 进度环抢戏。所以**不能**「顺手改成 `render = percent !== undefined`」。
 *
 * Vue 侧用 `watchEffect(..., { flush: 'post' })` 替代 `useLayoutEffect`。
 *
 * ⚠️ `flush: 'post'` 是**必须的**，不是随手选的：`watchEffect` 默认（`pre`）会在
 *    setup 期**同步**求值，于是首帧就有 `<svg>`；而 React 的 `useLayoutEffect`
 *    在**首次 DOM 提交之后**才跑 —— 首帧没有。两者的差别在
 *    `renderToStaticMarkup`（SSR，effect 不跑）下会被放大成「一边有一边没有」。
 *    `flush: 'post'` 让 Vue 的第一帧也返回 `null`，**与 React 的首帧逐字一致**，
 *    挂载后（同一个 microtask 内、绘制之前）再补上 —— 与 React 的
 *    「layout effect → 同步重渲染」在用户视角上等价。
 *
 *    ⚠️ 反过来（改成默认 flush）会让 L4 的 `percent:*` 用例出现
 *    「子节点数不同 1 vs 2」，而那是一条**夹具通道**差异（React 基线是 SSR 首帧）
 *    而不是组件差异 —— 用 `flush: 'post'` 从根上消除它，比加豁免强。
 *
 * ── 几何常量 ────────────────────────────────────────────────────────────────
 *
 * `viewSize = 100` / `borderWidth = 20` / `radius = 40` / `position = 50` /
 * `circumference = radius * 2 * PI`（≈ 251.327）。全部是上游的字面量，**不是** token。
 */

import { defineComponent, h, ref, watchEffect } from 'vue';

/** 视口边长（SVG user unit）。 */
export const VIEW_SIZE = 100;
/** 环宽 = viewSize / 5。 */
export const BORDER_WIDTH = VIEW_SIZE / 5;
/** 半径 = viewSize / 2 - borderWidth / 2。 */
export const RADIUS = VIEW_SIZE / 2 - BORDER_WIDTH / 2;
/** 周长 = radius * 2 * PI。`stroke-dasharray` 用它对进度做归一化。 */
export const CIRCUMFERENCE = RADIUS * 2 * Math.PI;
/** 圆心坐标。 */
export const POSITION = 50;

export const Progress = defineComponent({
  name: 'ASpinProgress',
  props: {
    prefixCls: { type: String, required: true },
    percent: { type: Number, required: true },
  },
  setup(props) {
    /**
     * 是否曾见过非 0 的 percent。
     *
     * ⚠️ 只能单向翻转为 `true` —— 与 React 的 `useState(false)` 同语义：
     * 「出现过一次进度就永远保留这个环」（percent 回到 0 时靠 `-hidden` 类名隐藏）。
     */
    const render = ref(false);
    watchEffect(
      () => {
        if (props.percent !== 0) render.value = true;
      },
      { flush: 'post' },
    );

    return () => {
      if (!render.value) return null;

      const dotClassName = `${props.prefixCls}-dot`;
      const holderClassName = `${dotClassName}-holder`;
      const hideClassName = `${holderClassName}-hidden`;

      // 钳制：与 antd 的 `Math.max(Math.min(percent, 100), 0)` 逐字一致。
      const safePtg = Math.max(Math.min(props.percent, 100), 0);

      const circleStyle = {
        strokeDashoffset: `${CIRCUMFERENCE / 4}`,
        strokeDasharray: `${(CIRCUMFERENCE * safePtg) / 100} ${
          (CIRCUMFERENCE * (100 - safePtg)) / 100
        }`,
      };

      const circle = (hasCircleCls: boolean, style?: typeof circleStyle) =>
        h('circle', {
          class: [`${dotClassName}-circle`, hasCircleCls && `${dotClassName}-circle-bg`],
          r: RADIUS,
          cx: POSITION,
          cy: POSITION,
          'stroke-width': BORDER_WIDTH,
          ...(style ? { style } : {}),
        });

      return h(
        'span',
        {
          class: [holderClassName, `${dotClassName}-progress`, safePtg <= 0 && hideClassName],
        },
        [
          h(
            'svg',
            {
              viewBox: `0 0 ${VIEW_SIZE} ${VIEW_SIZE}`,
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': 100,
              'aria-valuenow': safePtg,
            },
            [circle(true), circle(false, circleStyle)],
          ),
        ],
      );
    };
  },
});
