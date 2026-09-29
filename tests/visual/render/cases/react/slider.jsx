/**
 * React 侧（antd 6.6.4）的 Slider 视觉用例。与 vue/slider.js 逐条对应。
 *
 * ⚠️ 覆盖的是**静态形态**：拖拽中/键盘交互中的帧不进像素比对（`run.mjs` 只截静态帧）。
 *    tooltip 只在受控 `open` 时才是确定形态 —— 这里不放进像素比对（浮层走 portal +
 *    定位依赖布局），它的语义由 L2/L5 钉住。
 */

import { Slider } from 'antd';

const box = (children) => (
  <div style={{ padding: 16, background: '#fff', width: 320 }}>{children}</div>
);

export default {
  basic: () => box(<Slider defaultValue={30} />),

  range: () => box(<Slider range defaultValue={[20, 60]} />),

  marks: () =>
    box(
      <Slider
        defaultValue={30}
        marks={{
          0: '0°C',
          26: '26°C',
          37: '37°C',
          100: { style: { color: '#f50' }, label: <b>100°C</b> },
        }}
      />,
    ),

  dots: () => box(<Slider defaultValue={30} step={10} dots />),

  vertical: () =>
    box(
      <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
        <Slider vertical defaultValue={40} marks={{ 0: '0', 50: '50', 100: '100' }} />
      </div>,
    ),

  reverse: () => box(<Slider reverse defaultValue={40} />),

  disabled: () => box(<Slider disabled defaultValue={30} />),

  includedOff: () => box(<Slider included={false} defaultValue={70} />),
};
