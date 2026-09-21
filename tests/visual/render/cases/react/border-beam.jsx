/**
 * React 侧（antd 6.6.4）的 BorderBeam 视觉用例。与 vue/border-beam.js 逐条对应。
 */

import { BorderBeam } from 'antd';

// ⚠️ 显式钉死字体与行高（checklist §四：继承字体差异是 L6 平台差异源；
// BorderBeam demo 的正文文字此前有半像素 ghost）
const CONTAINER = {
  position: 'relative',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '24px',
  fontFamily: "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: '14px',
  lineHeight: '22px',
};
const box = (text) => (
  <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {text}
  </div>
);

export default {
  basic: () => (
    <div style={CONTAINER}>
      <BorderBeam />
      {box('Beam')}
    </div>
  ),

  color: () => (
    <div style={CONTAINER}>
      <BorderBeam
        color={[
          { color: '#722ed1', percent: 20 },
          { color: '#2db7f5', percent: 60 },
        ]}
      />
      {box('Gradient')}
    </div>
  ),
};
