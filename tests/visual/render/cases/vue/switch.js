/**
 * Vue 侧（@apollo-design/ui）的 Switch 视觉用例。与 react/switch.jsx 逐条对应。
 *
 * ⚠️ `text` 用例**不用真图标**：视觉侧的 vue 渲染入口只链接了 `@apollo-design/theme`
 * 与 `@apollo-design/ui` 两个 workspace 包，拿不到 `@apollo-design/icons`
 * ⇒ 两侧用**同一份内联结构**当替身（与 space 的 native button / input 替身同思路）。
 * 图标形态的 children 由 demo 与 L1 覆盖，见 LIMITATIONS `switch·icon-children`。
 */

import { Flex, Switch } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '160px', padding: '16px' } }, children);

const br = () => h('br');

/** 复杂节点替身（两侧逐字相同）：Flex 里放一个 `<b>` 与一个文本节点。 */
const complexNode = (text) =>
  h(
    Flex,
    { gap: 4, justify: 'flex-start', align: 'center' },
    {
      default: () => [h('b', '#'), text],
    },
  );

export default {
  basic: () =>
    box([
      h(Switch, { key: 'a', 'aria-label': 'a' }),
      br(),
      h(Switch, { key: 'b', defaultChecked: true, 'aria-label': 'b' }),
      br(),
      h(Switch, { key: 'c', disabled: true, 'aria-label': 'c' }),
      br(),
      h(Switch, { key: 'd', defaultChecked: true, disabled: true, 'aria-label': 'd' }),
    ]),

  loading: () =>
    box([
      h(Switch, { key: 'a', loading: true, defaultChecked: true, 'aria-label': 'a' }),
      br(),
      h(Switch, { key: 'b', size: 'small', loading: true, 'aria-label': 'b' }),
    ]),

  size: () =>
    box([
      h(Switch, { key: 'a', defaultChecked: true, 'aria-label': 'a' }),
      br(),
      h(Switch, { key: 'b', size: 'small', defaultChecked: true, 'aria-label': 'b' }),
    ]),

  text: () =>
    box([
      h(Switch, {
        key: 'a',
        checkedChildren: 'On',
        unCheckedChildren: 'Off',
        defaultChecked: true,
      }),
      br(),
      h(Switch, { key: 'b', checkedChildren: 1, unCheckedChildren: 0, defaultChecked: true }),
      br(),
      h(Switch, {
        key: 'c',
        defaultChecked: true,
        checkedChildren: complexNode('Happy'),
        unCheckedChildren: complexNode('Sad'),
      }),
    ]),

  semantic: () =>
    box([
      h(Switch, {
        key: 'a',
        defaultChecked: true,
        checkedChildren: 'On',
        unCheckedChildren: 'Off',
        classNames: { root: 'demo-switch-root', content: 'demo-switch-content' },
        styles: { root: { backgroundColor: 'rgb(245, 210, 210)' }, indicator: { top: '1px' } },
      }),
    ]),
};
