/**
 * Vue 侧（@apollo-design/ui）的 BorderBeam 视觉用例。与 react/border-beam.jsx 逐条对应。
 * ⚠️ 流光动画不在比对面（L6 截图时动画帧不固定）；比的是容器、遮罩与流光头的静态形态。
 */

import { BorderBeam } from '@apollo-design/ui';
import { h } from 'vue';

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
const box = (text) =>
  h(
    'div',
    { style: { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
    text,
  );

export default {
  basic: () => h('div', { style: CONTAINER }, [h(BorderBeam), box('Beam')]),

  color: () =>
    h('div', { style: CONTAINER }, [
      h(BorderBeam, {
        color: [
          { color: '#722ed1', percent: 20 },
          { color: '#2db7f5', percent: 60 },
        ],
      }),
      box('Gradient'),
    ]),
};
