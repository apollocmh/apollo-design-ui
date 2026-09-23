/**
 * React 侧（antd 6.6.4）的 Carousel 视觉用例。与 vue/carousel.js 逐条对应。
 *
 * ⚠️ slide 内容用两侧逐字相同的内联样式（含颜色 —— 视觉是像素比对，颜色必须一致，
 *    与 L4 的「几何样式」取舍不同）。autoplay 不进静态帧（时刻不确定）。
 */

import { Carousel } from 'antd';

const box = (children) => <div style={{ minHeight: 240, padding: 16 }}>{children}</div>;

const slide = (n, bg) => (
  <div key={n}>
    <h3
      style={{
        height: '160px',
        color: '#fff',
        lineHeight: '160px',
        textAlign: 'center',
        background: bg,
      }}
    >
      {n}
    </h3>
  </div>
);

const slides = () => [slide(1, '#364d79'), slide(2, '#626c91'), slide(3, '#1677ff')];

export default {
  basic: () =>
    box(
      <div style={{ width: 480 }}>
        <Carousel>{slides()}</Carousel>
      </div>,
    ),

  fade: () =>
    box(
      <div style={{ width: 480 }}>
        <Carousel effect="fade">{slides()}</Carousel>
      </div>,
    ),

  arrows: () =>
    box(
      <div style={{ width: 480 }}>
        <Carousel arrows>{slides()}</Carousel>
      </div>,
    ),

  vertical: () =>
    box(
      <div style={{ width: 480 }}>
        <Carousel dotPlacement="start">{slides()}</Carousel>
      </div>,
    ),
};
