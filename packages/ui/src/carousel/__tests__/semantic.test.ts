/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Carousel
 *
 * 基准：`tests/compat/baselines/carousel.dom.json`（机械 oracle，19 个用例，
 * 产出者 `tests/compat/baseline/carousel.mjs`）。`keepStyle: true`。
 *
 * ⚠️ DOM 的真正生产者是 react-slick：`.slick-*` 类名、clone 节点、track/slide
 *    内联定位、dots/arrows 结构全部在契约里。翻页/拖拽/自动播放等运行时行为
 *    由 L1 钉（contract 档不投影事件语义）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/carousel.dom.json';
import { Carousel } from '../index';

/** 3 张标准 slide（与基线脚本同款）。 */
const kids = () =>
  [1, 2, 3].map((i) =>
    h(
      'div',
      { key: i },
      h(
        'h3',
        {
          style: {
            height: '160px',
            lineHeight: '160px',
            textAlign: 'center',
          },
        },
        `${i}`,
      ),
    ),
  );

/** 单张 slide。 */
const oneKid = () => h('div', { key: 1 }, h('h3', { style: { height: '160px' } }, '1'));

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'carousel:basic': { render: () => h(Carousel, null, () => kids()) },
  'carousel:dots-false': { render: () => h(Carousel, { dots: false }, () => kids()) },
  'carousel:dots-object': {
    render: () => h(Carousel, { dots: { className: 'custom-dots' } }, () => kids()),
  },

  'carousel:arrows': { render: () => h(Carousel, { arrows: true }, () => kids()) },
  'carousel:arrows-infinite-false': {
    render: () => h(Carousel, { arrows: true, infinite: false }, () => kids()),
  },

  'carousel:draggable': { render: () => h(Carousel, { draggable: true }, () => kids()) },

  'carousel:dot-placement-start': {
    render: () => h(Carousel, { dotPlacement: 'start' }, () => kids()),
  },
  'carousel:dot-placement-end': {
    render: () => h(Carousel, { dotPlacement: 'end' }, () => kids()),
  },
  'carousel:dot-placement-top': {
    render: () => h(Carousel, { dotPlacement: 'top' }, () => kids()),
  },
  'carousel:dot-position-left-deprecated': {
    render: () => h(Carousel, { dotPosition: 'left' }, () => kids()),
  },

  'carousel:fade': { render: () => h(Carousel, { effect: 'fade' }, () => kids()) },

  'carousel:autoplay-dot-duration': {
    render: () =>
      h(Carousel, { autoplay: { dotDuration: true }, autoplaySpeed: 4000 }, () => kids()),
  },

  'carousel:infinite-false': { render: () => h(Carousel, { infinite: false }, () => kids()) },

  'carousel:initial-slide': { render: () => h(Carousel, { initialSlide: 1 }, () => kids()) },
  'carousel:initial-slide-infinite-false': {
    render: () => h(Carousel, { initialSlide: 1, infinite: false }, () => kids()),
  },

  'carousel:rtl': { render: () => h(Carousel, { rtl: true }, () => kids()) },

  'carousel:single-child': { render: () => h(Carousel, null, () => [oneKid()]) },

  'carousel:fade-speed-css': {
    render: () => h(Carousel, { effect: 'fade', speed: 800, cssEase: 'linear' }, () => kids()),
  },

  'carousel:attrs': { render: () => h(Carousel, { id: 'x', 'data-x': '1' }, () => kids()) },
};

/**
 * fade 的 `left:0`：React SSR 把数字 0 渲染成 `left:0`，而本仓 L4 管线在 jsdom
 * 里挂载，style 经 CSSOM 规范化成 `left:0px`（真实浏览器同样如此 —— React 客户端
 * 渲染的 DOM 也是 `left:0px`）。计算值完全一致，差异只在原始属性字符串 ⇒ PLATFORM。
 */
const CSSOM_LEFT_ZERO = {
  reason:
    'fade 模式当前 slide 的内联 left:0 在 React SSR 是 "0"，本管线（jsdom mount）经 CSSOM 规范化为 "0px"。React 客户端渲染产物同为 "0px"，计算值一致 —— 渲染管线差异，非实现缺陷。登记 COMPATIBILITY §9.1（PLATFORM）。',
  diff: [
    '$/div[0]/div[0]/div[0]/div[0]/div[0]: style 不同 [left:0;opacity:1;outline:none;position:relative;transition:opacity500msease,visibility500msease;width:20%;z-index:999] vs [left:0px;opacity:1;outline:none;position:relative;transition:opacity500msease,visibility500msease;width:20%;z-index:999]',
  ],
} as const;
const CSSOM_LEFT_ZERO_800 = {
  reason: CSSOM_LEFT_ZERO.reason,
  diff: [
    '$/div[0]/div[0]/div[0]/div[0]/div[0]: style 不同 [left:0;opacity:1;outline:none;position:relative;transition:opacity800mslinear,visibility800mslinear;width:20%;z-index:999] vs [left:0px;opacity:1;outline:none;position:relative;transition:opacity800mslinear,visibility800mslinear;width:20%;z-index:999]',
  ],
} as const;

domContractTest('Carousel', {
  baseline,
  keepStyle: true,
  allow: {
    'carousel:fade': CSSOM_LEFT_ZERO,
    'carousel:fade-speed-css': CSSOM_LEFT_ZERO_800,
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Carousel L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
