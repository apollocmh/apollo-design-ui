/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Listy
 *
 * 基准：`tests/compat/baselines/listy.dom.json`（机械 oracle，7 个用例，
 * 产出者 `tests/compat/baseline/listy.mjs`）。`keepStyle: true`。
 *
 * ⚠️ 只覆盖 **Raw 路径**（antd 默认 virtual=false）。虚拟模式的 DOM 由
 *    @apollo-design/virtual-list 决定，与 rc-virtual-list 必然不同（foundation
 *    契约 §5.1 的 PLATFORM）—— 由 L1 行为测试覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/listy.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Listy } from '../index';

/** 在指定 ConfigProvider 上下文下渲染（empty semantic 同范式：provide 而非真挂 CP）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AListyCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const ITEMS = Array.from({ length: 5 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const GROUP_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  key: i,
  group: `Group ${i % 2}`,
  content: `Item ${i}`,
}));
const GROUP = {
  key: (item: Record<string, unknown>) => item.group as string,
  title: (key: unknown, groupItemsOfKey: Record<string, unknown>[]) =>
    `${key} (${groupItemsOfKey.length})`,
};

/** 项内容：props 面的 item 是 Record ⇒ 取 content（String 收敛 VNodeChild） */
const renderContent = (item: unknown) => String((item as Record<string, unknown>).content);

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'listy:basic': {
    render: () => h(Listy, { items: ITEMS, rowKey: 'key', itemRender: renderContent }),
  },
  'listy:empty-items': {
    render: () => h(Listy, { items: [], rowKey: 'key', itemRender: () => null }),
  },

  'listy:group': {
    render: () =>
      h(Listy, {
        items: GROUP_ITEMS,
        rowKey: 'key',
        group: GROUP,
        itemRender: renderContent,
      }),
  },
  'listy:group-sticky': {
    render: () =>
      h(Listy, {
        items: GROUP_ITEMS,
        rowKey: 'key',
        group: GROUP,
        sticky: true,
        itemRender: renderContent,
      }),
  },

  'listy:rtl': {
    render: () =>
      withConfig({ direction: 'rtl' }, () =>
        h(Listy, { items: ITEMS, rowKey: 'key', itemRender: renderContent }),
      ),
  },

  'listy:height': {
    render: () => h(Listy, { items: ITEMS, rowKey: 'key', height: 120, itemRender: renderContent }),
  },

  'listy:semantic': {
    render: () =>
      h(Listy, {
        items: ITEMS,
        rowKey: 'key',
        itemRender: renderContent,
        classNames: { root: 'cls-root', item: 'cls-item', groupHeader: 'cls-header' },
        styles: { item: { padding: '9px' } },
      }),
  },
};

domContractTest('Listy', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Listy L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
