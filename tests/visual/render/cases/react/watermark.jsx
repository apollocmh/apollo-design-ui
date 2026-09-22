/**
 * React 侧（antd 6.6.4）的 Watermark 视觉用例。与 vue/watermark.js 逐条对应。
 * ⚠️ 图片用内联 SVG data URL —— 外链图片会让两侧加载时序不同，截图必然漂移。
 */

import { Watermark } from 'antd';

const SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="64"><rect width="120" height="64" fill="#1677ff"/><circle cx="60" cy="32" r="20" fill="#fff"/></svg>',
  );

const box = (style) => <div style={{ height: 260, ...style }} />;

export default {
  basic: () => <Watermark content="Ant Design">{box()}</Watermark>,

  'multi-line': () => (
    <Watermark content={['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }]}>
      {box()}
    </Watermark>
  ),

  image: () => (
    <Watermark image={SVG} width={130} height={30}>
      {box()}
    </Watermark>
  ),

  'gap-offset': () => (
    <Watermark content="Ant Design" gap={[40, 60]} offset={[20, 20]} rotate={-15}>
      {box({ background: 'rgb(250, 250, 250)' })}
    </Watermark>
  ),
};
