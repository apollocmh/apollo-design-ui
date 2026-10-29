/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Collapse
 *
 * 基准：`tests/compat/baselines/collapse.dom.json`（机械 oracle，12 个用例，
 * 产出者 `tests/compat/baseline/collapse.mjs`）。`keepStyle: true`。
 *
 * ⚠️ SSR 路径：CSSMotion 的 motion 类不出现在 SSR（motion 在浏览器端跑），
 *    收起面板的 -panel-hidden 残骸依赖 removeOnLeave=false ⇒ antd SSR 里
 *    未渲染过的收起面板没有 panel 节点（PanelContent 惰性）。
 */

import { domContractTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import { defineComponent, h, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/collapse.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Collapse } from '../index';
import { collapseContractDifferences } from './contract-differences';

/** 在指定 ConfigProvider 上下文下渲染（empty semantic 同范式）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return h(
    defineComponent({
      name: 'ACollapseCompatConfigProbe',
      setup() {
        provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
        return () => children();
      },
    }),
  );
}

const ITEMS = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
];

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
export const specs: Record<string, { render: () => VNode }> = {
  'collapse:basic': { render: () => h(Collapse, { items: ITEMS }) },

  'collapse:items-default-active': {
    render: () => h(Collapse, { items: ITEMS, defaultActiveKey: '1' }),
  },

  'collapse:accordion': {
    render: () => h(Collapse, { items: ITEMS, accordion: true, defaultActiveKey: '1' }),
  },

  'collapse:borderless': {
    render: () => h(Collapse, { items: ITEMS, bordered: false }),
  },

  'collapse:ghost': {
    render: () => h(Collapse, { items: ITEMS, ghost: true }),
  },

  'collapse:size-small': {
    render: () => h(Collapse, { items: ITEMS, size: 'small' }),
  },

  'collapse:size-large': {
    render: () => h(Collapse, { items: ITEMS, size: 'large' }),
  },

  'collapse:icon-placement-end': {
    render: () => h(Collapse, { items: ITEMS, expandIconPlacement: 'end' }),
  },

  'collapse:rtl': {
    render: () =>
      withConfig({ direction: 'rtl' }, () =>
        h(Collapse, { items: ITEMS, defaultActiveKey: ['1'] }),
      ),
  },

  'collapse:semantic': {
    render: () =>
      h(Collapse, {
        items: ITEMS,
        classNames: { root: 'cls-root', header: 'cls-header', body: 'cls-body' },
        styles: { header: { padding: '9px' } },
      }),
  },

  'collapse:collapsible-disabled': {
    render: () =>
      h(Collapse, {
        items: ITEMS.map((it) => ({ ...it, collapsible: 'disabled' as const })),
        defaultActiveKey: '1',
      }),
  },

  'collapse:children-deprecated': {
    render: () =>
      h(Collapse, { defaultActiveKey: '1' }, () => [
        h(Collapse.Panel, { key: '1', header: 'Header 1' }, () => 'Content 1'),
        h(Collapse.Panel, { key: '2', header: 'Header 2' }, () => 'Content 2'),
      ]),
  },
};

domContractTest('Collapse', {
  baseline,
  keepStyle: true,
  allow: collapseContractDifferences,
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Collapse L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});

it('retains all twelve old reference cases and finite reviewed differences', () => {
  const ids = baseline.cases.map((item) => item.id).sort();
  expect(ids).toHaveLength(12);
  expect(Object.keys(specs).sort()).toEqual(ids);
  expect(Object.keys(collapseContractDifferences).sort()).toEqual(ids);
  expect(
    Object.values(collapseContractDifferences).reduce(
      (total, entry) => total + entry.diff.length,
      0,
    ),
  ).toBe(67);
  for (const entry of Object.values(collapseContractDifferences)) {
    expect(entry.deviationId).toBe('collapse-native-disclosure');
    expect(entry.diff.length).toBeGreaterThan(0);
    for (const difference of entry.diff) expect(difference).toMatch(/^\$\/div\[0\]/);
  }
});

for (const [id, spec] of Object.entries(specs))
  it(`${id}: native replacement covers the complete header and hidden region subtrees`, () => {
    const wrapper = mount(defineComponent({ setup: () => spec.render }));
    const root = wrapper.get('.apollo-collapse');
    expect(root.attributes('role')).toBeUndefined();
    const panels = root.findAll('.apollo-collapse-item');
    expect(panels).toHaveLength(2);
    const expectedOpen = [
      'collapse:items-default-active',
      'collapse:accordion',
      'collapse:rtl',
      'collapse:collapsible-disabled',
      'collapse:children-deprecated',
    ].includes(id);
    for (const [index, panel] of panels.entries()) {
      const header = panel.get('.apollo-collapse-header');
      const heading = header.get('h3');
      const button = heading.get<HTMLButtonElement>('button');
      expect(heading.element.children).toHaveLength(1);
      expect(header.attributes('role')).toBeUndefined();
      expect(button.element.type).toBe('button');
      expect(button.attributes('aria-expanded')).toBe(String(index === 0 && expectedOpen));
      expect(button.element.disabled).toBe(id === 'collapse:collapsible-disabled');
      const title = button.get('.apollo-collapse-title');
      expect(title.text()).toBe(`Header ${index + 1}`);
      expect(button.attributes('aria-labelledby')).toBe(title.attributes('id'));
      const icon = button.get('.apollo-collapse-expand-icon');
      expect(icon.attributes('aria-hidden')).toBe('true');
      expect(icon.find('svg').exists()).toBe(true);
      const region = panel.get('[role=region]');
      expect(region.attributes('id')).toBe(button.attributes('aria-controls'));
      expect(region.attributes('aria-labelledby')).toBe(button.attributes('id'));
      expect(region.attributes('aria-hidden')).toBe(String(!(index === 0 && expectedOpen)));
      if (index === 0 && expectedOpen)
        expect(region.get('.apollo-collapse-body').text()).toBe('Content 1');
      else {
        expect(region.find('.apollo-collapse-body').exists()).toBe(false);
        expect(region.attributes('inert')).toBeDefined();
        expect(region.attributes('hidden')).toBeDefined();
      }
    }
  });
