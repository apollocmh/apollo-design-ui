/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Descriptions
 *
 * 基准：`tests/compat/baselines/descriptions.dom.json`（机械 oracle，18 个用例，
 * 产出者 `tests/compat/baseline/descriptions.mjs`）。`keepStyle: true`。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/descriptions.dom.json';
import { Descriptions } from '../index';

const ITEMS = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
];
const items = () => ITEMS.map((i) => ({ ...i }));
const P = (extra: Record<string, unknown>) => ({ items: items(), ...extra });

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'descriptions:basic': { render: () => h(Descriptions, P({})) },
  'descriptions:empty-items': { render: () => h(Descriptions, { items: [] }) },

  'descriptions:bordered': { render: () => h(Descriptions, P({ bordered: true })) },
  'descriptions:vertical': { render: () => h(Descriptions, P({ layout: 'vertical' })) },
  'descriptions:vertical-bordered': {
    render: () => h(Descriptions, P({ layout: 'vertical', bordered: true })),
  },

  'descriptions:size-small': { render: () => h(Descriptions, P({ size: 'small' })) },
  'descriptions:size-medium': { render: () => h(Descriptions, P({ size: 'medium' })) },
  'descriptions:colon-false': { render: () => h(Descriptions, P({ colon: false })) },

  'descriptions:title-extra': {
    render: () => h(Descriptions, P({ title: 'Title', extra: 'Extra' })),
  },
  'descriptions:title-only': { render: () => h(Descriptions, P({ title: 'Title' })) },

  'descriptions:column-2': { render: () => h(Descriptions, P({ column: 2 })) },
  'descriptions:span-2': {
    render: () =>
      h(Descriptions, {
        items: [
          { key: '1', label: 'L1', children: 'C1', span: 2 },
          { key: '2', label: 'L2', children: 'C2' },
        ],
      }),
  },
  'descriptions:filled': {
    render: () =>
      h(Descriptions, {
        items: [
          { key: '1', label: 'L1', children: 'C1' },
          { key: '2', label: 'L2', children: 'C2', span: 'filled' },
        ],
      }),
  },
  'descriptions:bordered-span': {
    render: () =>
      h(Descriptions, {
        bordered: true,
        items: [
          { key: '1', label: 'L1', children: 'C1', span: 2 },
          { key: '2', label: 'L2', children: 'C2' },
        ],
      }),
  },

  'descriptions:semantic': {
    render: () =>
      h(
        Descriptions,
        P({
          classNames: { root: 'my-root', label: 'my-label', content: 'my-content' },
          styles: { label: { padding: '4px' } },
        }),
      ),
  },
  'descriptions:label-style': {
    render: () => h(Descriptions, P({ labelStyle: { padding: '4px' } })),
  },
  'descriptions:bordered-semantic': {
    render: () =>
      h(
        Descriptions,
        P({
          bordered: true,
          classNames: { label: 'my-label' },
          styles: { label: { padding: '4px' } },
        }),
      ),
  },

  'descriptions:attrs': { render: () => h(Descriptions, P({ id: 'x', 'data-x': '1' })) },
};

domContractTest('Descriptions', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Descriptions L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
