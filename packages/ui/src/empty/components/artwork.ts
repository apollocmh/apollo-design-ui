// 自动生成，请勿手改。
// 生成器：registry/tools/gen-empty-artwork.mjs
// 数据源：antd 6.6.4 的 Empty.PRESENTED_IMAGE_DEFAULT / PRESENTED_IMAGE_SIMPLE 的**渲染产物**
// 重新生成：node registry/tools/gen-empty-artwork.mjs
//
// 这是**数据**，不是 antd 的实现代码：只有标签、几何属性与路径，没有一行逻辑。
//
// 关于颜色（2026-09-18 由 L6 视觉回归修正）：
//   SVG 里的 fill / stroke 是 **hex 字面量**，不是 CSS 变量。原因：antd 在 SSR 阶段用
//   getAsSolidColor(token, colorBgContainer) 把半透明 token 在白底上合成为实色再写进
//   SVG；我们的 token 是 rgba 透明色，直接用 var() 会得到 `rgba(0,0,0,0.06)` ——
//   视觉回归里立刻表现为色块差异。
//
//   主题切换**会**改变插画颜色（2026-09-22 修正 2026-09-18 的结论）：antd 的
//   empty.js 在运行时用 getDesignToken(theme) 解析 token 再合成实色 —— dark 下
//   fill 是 #3e3e3e 等。我们的对齐方式：fill 引用 ctx.colors.<role>，由
//   Images.ts 从 useToken() 实时计算（onBackground 合成，同 antd 的 getAsSolidColor）。
//
//   反查表 ROLE_TOKENS 仍保留作自检用 —— 任何 antd 渲染产物里出现新颜色都会让生成器
//   抛错，逼着维护者先在表里补上对应 token，再重跑生成。
//
// 为什么是 .ts 而不是 .vue：这是 COMPONENT-RULES.md §2 允许的「纯渲染函数型内部件」
// —— 它没有状态、没有事件、没有插槽，且**必须由脚本生成**（手写等于重画一遍矢量图，
// 必然与上游产生像素差异）。理由记录在 packages/ui/src/empty/README.md。

import { h, type VNode } from 'vue';

export interface EmptyArtworkColors {
  /** 槽位色（运行时由 useToken() 的 token 经 onBackground 合成，随主题变化）。 */
  [role: string]: string;
}

export interface EmptyArtworkContext {
  /** `<title>` 的文本 —— 插画的可访问名，来自 locale。 */
  title: string;
  /** 颜色槽位（键 = ROLE_TOKENS 的角色名）。 */
  colors: EmptyArtworkColors;
}

/** 默认插画（184×152）。antd 的 `PRESENTED_IMAGE_DEFAULT`。 */
export function renderDefaultEmptyImage(ctx: EmptyArtworkContext): VNode {
  return h(
    'svg',
    { width: '184', height: '152', viewBox: '0 0 184 152', xmlns: 'http://www.w3.org/2000/svg' },
    [
      h('title', null, ctx.title),
      h('g', { fill: 'none', 'fill-rule': 'evenodd' }, [
        h('g', { transform: 'translate(24 31.7)' }, [
          h('ellipse', {
            'fill-opacity': '.8',
            fill: ctx.colors.shadowColor,
            cx: '67.8',
            cy: '106.9',
            rx: '67.8',
            ry: '12.7',
          }),
          h('path', {
            fill: ctx.colors.borderColor,
            d: 'M122 69.7 98.1 40.2a6 6 0 0 0-4.6-2.2H42.1a6 6 0 0 0-4.6 2.2l-24 29.5V85H122z',
          }),
          h('path', {
            fill: ctx.colors.panelBgColor,
            d: 'M33.8 0h68a4 4 0 0 1 4 4v93.3a4 4 0 0 1-4 4h-68a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4',
          }),
          h('path', {
            fill: ctx.colors.detailColor,
            d: 'M42.7 10h50.2a2 2 0 0 1 2 2v25a2 2 0 0 1-2 2H42.7a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2m.2 39.8h49.8a2.3 2.3 0 1 1 0 4.5H42.9a2.3 2.3 0 0 1 0-4.5m0 11.7h49.8a2.3 2.3 0 1 1 0 4.6H42.9a2.3 2.3 0 0 1 0-4.6m79 43.5a7 7 0 0 1-6.8 5.4H20.5a7 7 0 0 1-6.7-5.4l-.2-1.8V69.7h26.3c2.9 0 5.2 2.4 5.2 5.4s2.4 5.4 5.3 5.4h34.8c2.9 0 5.3-2.4 5.3-5.4s2.3-5.4 5.2-5.4H122v33.5q0 1-.2 1.8',
          }),
        ]),
        h('path', {
          fill: ctx.colors.detailColor,
          d: 'm149.1 33.3-6.8 2.6a1 1 0 0 1-1.3-1.2l2-6.2q-4.1-4.5-4.2-10.4c0-10 10.1-18.1 22.6-18.1S184 8.1 184 18.1s-10.1 18-22.6 18q-6.8 0-12.3-2.8',
        }),
        h('g', { fill: ctx.colors.iconColor, transform: 'translate(149.7 15.4)' }, [
          h('circle', { cx: '20.7', cy: '3.2', r: '2.8' }),
          h('path', { d: 'M5.7 5.6H0L2.9.7zM9.3.7h5v5h-5z' }),
        ]),
      ]),
    ],
  );
}

/** 简洁插画（64×41）。antd 的 `PRESENTED_IMAGE_SIMPLE`。 */
export function renderSimpleEmptyImage(ctx: EmptyArtworkContext): VNode {
  return h(
    'svg',
    { width: '64', height: '41', viewBox: '0 0 64 41', xmlns: 'http://www.w3.org/2000/svg' },
    [
      h('title', null, ctx.title),
      h('g', { transform: 'translate(0 1)', fill: 'none', 'fill-rule': 'evenodd' }, [
        h('ellipse', { fill: ctx.colors.shadowColor, cx: '32', cy: '33', rx: '32', ry: '7' }),
        h('g', { 'fill-rule': 'nonzero', stroke: ctx.colors.borderColor }, [
          h('path', { d: 'M55 12.8 44.9 1.3Q44 0 42.9 0H21.1q-1.2 0-2 1.3L9 12.8V22h46z' }),
          h('path', {
            d: 'M41.6 16c0-1.7 1-3 2.2-3H55v18.1c0 2.2-1.3 3.9-3 3.9H12c-1.7 0-3-1.7-3-3.9V13h11.2c1.2 0 2.2 1.3 2.2 3s1 2.9 2.2 2.9h14.8c1.2 0 2.2-1.4 2.2-3',
            fill: ctx.colors.contentColor,
          }),
        ]),
      ]),
    ],
  );
}
