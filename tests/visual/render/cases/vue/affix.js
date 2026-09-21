/**
 * Vue 侧（@apollo-design/ui）的 Affix 视觉用例。
 *
 * 与 `render/cases/react/affix.jsx` **逐条对应**（内容样式逐字一致）。
 *
 * ── ⚠️ 只覆盖**未固钉**的静态形态 ─────────────────────────────────────────────
 * 视觉页停在顶部 ⇒ 不固钉 ⇒ 内层没有 `apollo-affix` 类名、占位层不渲染。
 * 固钉态需要真实滚动，不进视觉比对（`docs/analysis/affix.md` §8）。
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

export default {
  basic: () => h(Affix, { offsetTop: 80 }, { default: CONTENT }),

  'offset-bottom': () => h(Affix, { offsetBottom: 80 }, { default: CONTENT }),

  class: () =>
    h(
      Affix,
      { offsetTop: 80, className: 'demo-affix-class', rootClassName: 'demo-affix-root' },
      { default: CONTENT },
    ),

  style: () => h(Affix, { offsetTop: 80, style: { background: '#fffbe6' } }, { default: CONTENT }),

  'no-children': () => h(Affix, { offsetTop: 80 }),
};
