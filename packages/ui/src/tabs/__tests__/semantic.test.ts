/** Historical raw DOM cases remain intact; derive only the reviewed Vue ownership changes before complete comparison. */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import baseline from '../../../../../tests/compat/baselines/tabs.dom.json';
import Tabs from '../Tabs.vue';

/** 与基线生成器一致的固定 id。 */
const ID = 'tabs-test';

const items = () => [
  { key: '1', label: 'Tab 1', children: 'Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Pane 3', disabled: true },
];

const cmp = (props: Record<string, unknown>) => h(Tabs as never, { id: ID, ...props } as never);

const CASES: Record<string, () => DomRenderResult> = {
  'tabs:basic': () => cmp({ defaultActiveKey: '1', items: items() }),
  'tabs:active-second': () => cmp({ defaultActiveKey: '2', items: items() }),
  'tabs:no-items': () => cmp({ items: [] }),
  'tabs:no-children': () => cmp({ items: [{ key: '1', label: 'Only' }] }),
  'tabs:card': () => cmp({ defaultActiveKey: '1', type: 'card', items: items() }),
  'tabs:editable-card': () =>
    cmp({ defaultActiveKey: '1', type: 'editable-card', items: items(), onEdit: () => {} }),
  'tabs:editable-hide-add': () =>
    cmp({
      defaultActiveKey: '1',
      type: 'editable-card',
      hideAdd: true,
      items: items(),
      onEdit: () => {},
    }),
  'tabs:editable-closable-false': () =>
    cmp({
      defaultActiveKey: '1',
      type: 'editable-card',
      items: [
        { key: '1', label: 'A', children: 'a', closable: false },
        { key: '2', label: 'B', children: 'b' },
      ],
      onEdit: () => {},
    }),
  'tabs:centered-card': () =>
    cmp({ defaultActiveKey: '1', type: 'card', centered: true, items: items() }),
  // ⚠️ 只认 `top` / `bottom` / `start` / `end` —— 上游
  //    `TabPlacement = 'top' | 'end' | 'bottom' | 'start'`；`left` / `right` 是
  //    deprecated 的 `tabPosition` 的值域，**不是** `tabPlacement` 的。
  //    本轮修正：原先这四条是 `bottom`/`left`/`right`/`start`/`end` 五条（多了一条
  //    且 `left`/`right` 名不副实）⇒ 现与基线一致的四条。
  'tabs:bottom': () => cmp({ defaultActiveKey: '1', tabPlacement: 'bottom', items: items() }),
  'tabs:start': () => cmp({ defaultActiveKey: '1', tabPlacement: 'start', items: items() }),
  'tabs:end': () => cmp({ defaultActiveKey: '1', tabPlacement: 'end', items: items() }),
  'tabs:small': () => cmp({ defaultActiveKey: '1', size: 'small', items: items() }),
  'tabs:large': () => cmp({ defaultActiveKey: '1', size: 'large', items: items() }),
  'tabs:gutter': () => cmp({ defaultActiveKey: '1', tabBarGutter: 24, items: items() }),
  'tabs:animated-true': () => cmp({ defaultActiveKey: '1', animated: true, items: items() }),
  'tabs:animated-false': () => cmp({ defaultActiveKey: '1', animated: false, items: items() }),
  'tabs:extra-right': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      tabBarExtraContent: h('span', { class: 'extra-node' }, 'extra'),
    }),
  'tabs:extra-both': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      tabBarExtraContent: {
        left: h('span', { class: 'extra-left-node' }, 'L'),
        right: h('span', { class: 'extra-right-node' }, 'R'),
      },
    }),
  'tabs:indicator-start': () =>
    cmp({ defaultActiveKey: '1', items: items(), indicator: { align: 'start' } }),
  'tabs:indicator-size': () =>
    cmp({ defaultActiveKey: '1', items: items(), indicator: { size: 20 } }),
  'tabs:force-render': () =>
    cmp({
      defaultActiveKey: '1',
      items: [
        { key: '1', label: 'Tab 1', children: 'Pane 1' },
        { key: '2', label: 'Tab 2', children: 'Pane 2', forceRender: true },
      ],
    }),
  'tabs:destroy-on-hidden': () =>
    cmp({ defaultActiveKey: '1', destroyOnHidden: true, items: items() }),
  'tabs:semantic': () =>
    cmp({
      defaultActiveKey: '1',
      items: items(),
      classNames: { root: 'c-root', item: 'c-item', indicator: 'c-indicator' },
    }),
};

/**
 * Keep the historical reference intact. Derive only the reviewed ownership and
 * accessible trigger changes, then compare every remaining node and attribute.
 */
const nativeBaseline = {
  ...baseline,
  cases: baseline.cases.map((reference) => {
    const document = new DOMParser().parseFromString(reference.html, 'text/html');
    const nav = document.querySelector('.apollo-tabs-nav[role="tablist"]');
    const wrap = nav?.querySelector('.apollo-tabs-nav-wrap');
    const list = wrap?.querySelector('.apollo-tabs-nav-list');
    const more = nav?.querySelector('.apollo-tabs-nav-more');
    const orientation = nav?.getAttribute('aria-orientation');
    if (!nav || !wrap || !list || !more || !orientation) {
      throw new Error(`Tabs reference shape changed before reviewed migration: ${reference.id}`);
    }
    nav.removeAttribute('role');
    nav.removeAttribute('aria-orientation');
    const owner = document.createElement('div');
    owner.setAttribute('role', 'tablist');
    owner.setAttribute('aria-orientation', orientation);
    owner.style.display = 'contents';
    const ids = Array.from(list.querySelectorAll('[role="tab"]'), (node) => node.id);
    if (ids.length) owner.setAttribute('aria-owns', ids.join(' '));
    wrap.insertBefore(owner, list);
    more.classList.add('apollo-tabs-dropdown-trigger');
    more.setAttribute('aria-label', 'expanded dropdown');
    return { ...reference, html: document.body.innerHTML };
  }),
};

domContractTest('Tabs', {
  baseline: nativeBaseline,
  keepStyle: false,
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Tabs semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。基线用例：` +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Tabs · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    expect(Object.keys(CASES).sort()).toEqual(baseline.cases.map((c) => c.id).sort());
  });
});
