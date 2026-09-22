/**
 * Vue 侧（@apollo-design/ui）的 Tag 视觉用例。与 react/tag.jsx 逐条对应。
 * ⚠️ 固件色值直接内联（H9 不适用于测试固件）。
 */

import { Tag } from '@apollo-design/ui';
import { h } from 'vue';

export default {
  basic: () => [
    h(Tag, null, { default: () => 'Tag 1' }),
    h(Tag, { closable: true }, { default: () => 'Closable' }),
    h(Tag, { color: 'blue' }, { default: () => 'blue' }),
    h(Tag, { color: 'blue', variant: 'solid' }, { default: () => 'blue solid' }),
    h(Tag, { color: 'success', variant: 'outlined' }, { default: () => 'success' }),
    h(Tag, { color: '#2db7f5' }, { default: () => '#2db7f5' }),
  ],

  checkable: () => [
    h(CheckableTag2, { checked: true }, { default: () => 'Checked' }),
    h(CheckableTag2, { checked: false }, { default: () => 'Unchecked' }),
    h(CheckableTagGroup2, { options: ['Movies', 'Books', 'Music'], value: 'Books' }),
  ],

  semantic: () =>
    h(
      Tag,
      {
        closable: true,
        color: 'green',
        classNames: { root: 'demo-tag-root', close: 'demo-tag-close' },
        styles: { root: { borderRadius: '8px' } },
      },
      { default: () => 'Semantic slots' },
    ),
};

import {
  CheckableTag as CheckableTag2,
  CheckableTagGroup as CheckableTagGroup2,
} from '@apollo-design/ui';
