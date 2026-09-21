/**
 * React 侧（antd）的 Affix 视觉用例。
 *
 * 与 `render/cases/vue/affix.js` **逐条对应**。
 *
 * ── ⚠️ 只覆盖**未固钉**的静态形态 ─────────────────────────────────────────────
 *
 * 视觉页停在页面顶部，占位层的 `top` 远大于阈值 ⇒ 两侧都不固钉：
 * - 内层**没有** `apollo-affix` 类名（antd 的类名只在固钉时出现）
 * - 占位层不渲染
 * 固钉态需要真实滚动，不进视觉比对（`docs/analysis/affix.md` §8）。
 */

import { Affix } from 'antd';
import { createElement as h } from 'react';

/** 两侧**逐字一致**的内容样式（React 的数值会转 px，这里直接写字符串避免歧义）。 */
const CONTENT_STYLE = {
  width: '200px',
  height: '60px',
  background: '#1677ff',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const CONTENT = () => h('div', { style: CONTENT_STYLE }, 'AFFIX');

export default {
  basic: () => h(Affix, { offsetTop: 80 }, CONTENT()),

  'offset-bottom': () => h(Affix, { offsetBottom: 80 }, CONTENT()),

  class: () =>
    h(
      Affix,
      { offsetTop: 80, className: 'demo-affix-class', rootClassName: 'demo-affix-root' },
      CONTENT(),
    ),

  style: () => h(Affix, { offsetTop: 80, style: { padding: '8px' } }, CONTENT()),

  // ⚠️ antd 对空 children 会告警（ResizeObserver 空子）—— 这是上游行为，保留。
  'no-children': () => h(Affix, { offsetTop: 80 }),
};
