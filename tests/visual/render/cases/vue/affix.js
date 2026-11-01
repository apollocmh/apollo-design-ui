/**
 * Vue 侧（@apollo-design/ui）的 Affix 视觉用例。
 *
 * 保留各偏移、attrs 与空内容场景。顶部偏移在初始位置已命中固定条件，
 * 所以容器留足高度，让 top:80px 的完整内容落在 #stage 截图内。
 * 底部偏移初始未命中；真实滚动切换由交互检查验证。
 */

import { Affix } from '@apollo-design/ui';
import { h } from 'vue';

/** 与 React 侧**逐字一致**的内容样式。 */
const CONTENT_STYLE = {
  width: '200px',
  height: '60px',
  background: '#1677ff',
  fontFamily: 'sans-serif',
  fontSize: '16px',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CONTENT = () => h('div', { style: CONTENT_STYLE }, 'AFFIX');
const box = (child) => h('div', { style: { minHeight: '180px' } }, [child]);

export default {
  basic: () => box(h(Affix, { offsetTop: 80 }, { default: CONTENT })),

  'offset-bottom': () => box(h(Affix, { offsetBottom: 80 }, { default: CONTENT })),

  class: () =>
    box(
      h(
        Affix,
        { offsetTop: 80, class: ['demo-affix-class', 'demo-affix-root'] },
        { default: CONTENT },
      ),
    ),

  style: () =>
    box(h(Affix, { offsetTop: 80, style: { background: '#fffbe6' } }, { default: CONTENT })),

  'no-children': () => h(Affix, { offsetTop: 80 }),
};
