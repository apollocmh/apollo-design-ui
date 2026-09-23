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

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/collapse.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Collapse } from '../index';

/** 在指定 ConfigProvider 上下文下渲染（empty semantic 同范式）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ACollapseCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const ITEMS = [
  { key: '1', label: 'Header 1', children: 'Content 1' },
  { key: '2', label: 'Header 2', children: 'Content 2' },
];

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
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
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Collapse L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
