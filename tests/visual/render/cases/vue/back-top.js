/**
 * Vue 侧（@apollo-design/ui）的 BackTop 视觉用例。与 react/back-top.jsx 逐条对应。
 * ⚠️ visibilityHeight=0 恒显（fixed 定位，比的是 content/icon 静态形态）。
 */

import { BackTop } from '@apollo-design/ui';
import { h } from 'vue';

export default {
  basic: () =>
    h('div', { style: { height: '2000px' } }, [
      h(BackTop, { visibilityHeight: 0 }),
      // ⚠️ 正文显式钉 sans-serif：React 基线页的 body 继承字体取决于该页组件是否
      //    带 cssinjs 的 body 注入（BackTop 不带 → sans-serif）；我们 BASE_CSS 给
      //    body 钉 token 栈。字形差异是逐字符的，用例内钉平（不动全局，见 checklist）。
      h('p', { style: { fontFamily: 'sans-serif' } }, 'Scroll down to see the bottom-right.'),
    ]),
};
