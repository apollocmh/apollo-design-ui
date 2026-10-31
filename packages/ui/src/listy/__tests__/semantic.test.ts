/** Historical seven-case reference retained, with exact current Vue DOM differences. */
import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/listy.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Listy } from '../index';
import currentDelta from './fixtures/current-dom-delta.json';

function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}
const ITEMS = Array.from({ length: 5 }, (_, key) => ({ key, content: `Item ${key}` }));
const GROUP_ITEMS = Array.from({ length: 6 }, (_, key) => ({
  key,
  group: `Group ${key % 2}`,
  content: `Item ${key}`,
}));
type Item = (typeof ITEMS)[number];
type GroupItem = (typeof GROUP_ITEMS)[number];
const GROUP = { key: (item: GroupItem) => item.group };
const content = { default: ({ item }: { item: Item }) => item.content };
const groupedContent = {
  ...content,
  groupHeader: ({ groupKey, items }: { groupKey: string; items: GroupItem[] }) =>
    `${groupKey} (${items.length})`,
};
const specs: Record<string, { render: () => DomRenderResult }> = {
  'listy:basic': { render: () => h(Listy<Item>, { items: ITEMS, rowKey: 'key' }, content) },
  'listy:empty-items': {
    render: () => h(Listy<Item>, { items: [], rowKey: 'key' }, { default: () => null }),
  },
  'listy:group': {
    render: () =>
      h(
        Listy<GroupItem, string>,
        { items: GROUP_ITEMS, rowKey: 'key', group: GROUP },
        groupedContent,
      ),
  },
  'listy:group-sticky': {
    render: () =>
      h(
        Listy<GroupItem, string>,
        { items: GROUP_ITEMS, rowKey: 'key', group: GROUP, sticky: true },
        groupedContent,
      ),
  },
  'listy:rtl': {
    render: () =>
      withConfig({ direction: 'rtl' }, () =>
        h(Listy<Item>, { items: ITEMS, rowKey: 'key' }, content),
      ),
  },
  'listy:height': {
    render: () => h(Listy<Item>, { items: ITEMS, rowKey: 'key', height: 120 }, content),
  },
  'listy:semantic': {
    render: () =>
      h(
        Listy<Item>,
        {
          items: ITEMS,
          rowKey: 'key',
          classNames: { root: 'cls-root', item: 'cls-item', groupHeader: 'cls-header' },
          styles: { item: { padding: '9px' } },
        },
        content,
      ),
  },
};

domContractTest('Listy', {
  baseline,
  keepStyle: true,
  allow: currentDelta,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`Missing Listy reference case: ${id}`);
    return spec.render();
  },
});

// Child-count differences stop the legacy projection descending into groups. Compare
// both complete group trees too, changing only the explicitly migrated wrapper/key/anchor contract.
function flatGroupReference(html: string): string {
  const documentRoot = document.createElement('div');
  documentRoot.innerHTML = html;
  for (const section of documentRoot.querySelectorAll('.apollo-listy-group-section')) {
    const groupTag = section.getAttribute('data-key');
    const header = section.querySelector<HTMLElement>('.apollo-listy-group-header');
    if (!header || !groupTag) throw new Error('Historical Listy group reference is incomplete');
    const anchor = document.createElement('span');
    anchor.setAttribute('aria-hidden', 'true');
    Object.assign(anchor.style, {
      display: 'block',
      height: '0px',
      padding: '0px',
      margin: '0px',
      border: '0px',
    });
    header.setAttribute('data-key', groupTag.replace('group:', 'group:string:'));
    if (header.classList.contains('apollo-listy-group-header-sticky')) header.style.top = '0px';
    section.replaceWith(anchor, ...section.children);
  }
  for (const row of documentRoot.querySelectorAll('[data-key^="item:"]')) {
    row.setAttribute(
      'data-key',
      row.getAttribute('data-key')?.replace('item:', 'item:number:') ?? '',
    );
  }
  return documentRoot.innerHTML;
}
domContractTest('Listy current complete grouped DOM', {
  baseline: {
    cases: baseline.cases
      .filter((item) => item.id === 'listy:group' || item.id === 'listy:group-sticky')
      .map((item) => ({ ...item, html: flatGroupReference(item.html) })),
  },
  keepStyle: true,
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`Missing Listy group reference: ${id}`);
    return spec.render();
  },
});
