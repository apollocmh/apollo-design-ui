/**
 * Vue 侧（@apollo-design/ui）的 Splitter 视觉用例。与 react/splitter.jsx 逐条对应。
 */

import { Splitter } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '260px', padding: '16px' } }, children);

const BOX = { height: '220px', boxShadow: '0 0 0 1px #d9d9d9' };

export default {
  basic: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Splitter, { style: BOX }, () => [
          h(Splitter.Panel, null, () => 'Left'),
          h(Splitter.Panel, null, () => 'Right'),
        ]),
      ]),
    ),

  vertical: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Splitter, { orientation: 'vertical', style: BOX }, () => [
          h(Splitter.Panel, null, () => 'Top'),
          h(Splitter.Panel, null, () => 'Bottom'),
        ]),
      ]),
    ),

  multiple: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Splitter, { style: BOX }, () => [
          h(Splitter.Panel, { collapsible: true, defaultSize: '20%', min: '10%' }, () => 'Left'),
          h(Splitter.Panel, { defaultSize: '40%' }, () => 'Center'),
          h(Splitter.Panel, { max: '60%', collapsible: true }, () => 'Right'),
        ]),
      ]),
    ),
};
