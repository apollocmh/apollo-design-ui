import { mount } from '@vue/test-utils';
import { mergeButtonContentReferenceAllowances } from '../../_internal/__tests__/button-content-reference';
import { inputContractReference } from '../../input/__tests__/contract-reference';
import buttonContentDifferences from './button-content-reference-diffs.json';
import inputReferences from './input-contract-reference.json';
/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Transfer
 *
 * 基准：`tests/compat/baselines/transfer.dom.json`（机械 oracle，32 用例），
 * 由 `tests/compat/baseline/transfer.mjs` 直接 `renderToStaticMarkup` 渲染 antd 产出。
 *
 * ⚠️ 两侧传**同一个** `prefixCls`（`apollo`），类名逐字比对；
 *    默认前缀差异由 `prefix-cls:no-props` 单独钉住（allow 登记为 D6 同族）。
 *
 * ⚠️ 已知不覆盖（登记 README §7）：
 *  - `classNames` / `styles` 的 `source` / `target` 方向子结构（合并语义较复杂，见 README）；
 *  - renderList（自定义列表面板 / Transfer.List 的 children 通道）—— React 侧函数
 *    render prop 的 DOM 依赖用户实现，机械对拍无 oracle 价值。
 */

import type { DomRenderResult } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, type SlotsType } from 'vue';
import baseline from '../../../../../tests/compat/baselines/transfer.dom.json';
import { ConfigProvider } from '../../config-provider';
import type { TransferItem, TransferItemSlotProps, TransferSlots } from '../interface';
import ApolloTransfer from '../Transfer';

// Historical reference fixtures intentionally omit labels when no renderer was supplied.
// Keep those exact DOM assertions with an explicit empty slot; slots.test.ts covers
// Apollo's default title labels and direct scoped-slot API. No baseline/threshold changes.
const Transfer = defineComponent({
  inheritAttrs: false,
  slots: Object as SlotsType<TransferSlots>,
  setup:
    (_, { attrs, slots }) =>
    () =>
      h(ApolloTransfer, attrs, { item: () => null, ...slots }),
});

const DATA_SOURCE: TransferItem[] = Array.from({ length: 8 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

const base = { dataSource: DATA_SOURCE };

const CASES: Record<string, () => DomRenderResult> = {
  'prefix-cls:custom': () => h(Transfer as never, { ...base, prefixCls: 'custom' } as never),
  basic: () => h(Transfer as never, { ...base, prefixCls: 'apollo' } as never),
  'empty:data-source': () => h(Transfer as never, { prefixCls: 'apollo', dataSource: [] } as never),
  'target-keys': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', targetKeys: ['5', '1'] } as never),
  'target-keys+selected': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        targetKeys: ['5', '1'],
        selectedKeys: ['0', '5'],
      } as never,
    ),
  'row-key': () =>
    h(
      Transfer as never,
      {
        prefixCls: 'apollo',
        dataSource: [
          { id: 'a', title: 'Alpha' },
          { id: 'b', title: 'Beta' },
        ],
        rowKey: (record: TransferItem) => String(record.id),
        targetKeys: ['b'],
      } as never,
    ),
  titles: () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', titles: ['Source', 'Target'] } as never),
  locale: () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        locale: { itemUnit: '条', itemsUnit: '条目', searchPlaceholder: '请输入' },
      } as never,
    ),
  'select-all-labels': () =>
    h(
      Transfer as never,
      { ...base, prefixCls: 'apollo', selectAllLabels: ['左全选', '右全选'] } as never,
    ),
  'show-select-all:false': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', showSelectAll: false } as never),
  'show-search': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', showSearch: true } as never),
  'show-search:object': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        showSearch: { defaultValue: 'content2', placeholder: '搜一下' },
      } as never,
    ),
  'one-way': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        oneWay: true,
        targetKeys: ['5', '1'],
        selectedKeys: ['0'],
      } as never,
    ),
  'pagination:true': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', pagination: true } as never),
  'pagination:object': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', pagination: { pageSize: 3 } } as never),
  'pagination:object+size-changer': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        pagination: { pageSize: 3, showSizeChanger: true, simple: false },
      } as never,
    ),
  'status:error': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', status: 'error' } as never),
  'status:warning': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', status: 'warning' } as never),
  disabled: () => h(Transfer as never, { ...base, prefixCls: 'apollo', disabled: true } as never),
  actions: () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', actions: ['去右边', '去左边'] } as never),
  operations: () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', operations: ['R', 'L'] } as never),
  'selections-icon': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        selectionsIcon: h('span', { class: 'custom-selections' }, 'S'),
      } as never,
    ),
  'render:object': () =>
    h(
      Transfer,
      {
        ...base,
        prefixCls: 'apollo',
        dataSource: DATA_SOURCE.map((item) => ({
          ...item,
          displayTitle: item.title,
          title: `value-${item.title}`,
        })),
      },
      { item: ({ item }: TransferItemSlotProps) => `${item.displayTitle}（label）` },
    ),
  'render:string': () =>
    h(
      Transfer,
      {
        ...base,
        prefixCls: 'apollo',
        dataSource: DATA_SOURCE.map((item) => ({ ...item, title: `r-${item.title}` })),
      },
      { item: ({ item }: TransferItemSlotProps) => String(item.title) },
    ),
  footer: () =>
    h(
      Transfer,
      { ...base, prefixCls: 'apollo' },
      {
        footer: () => h('div', { class: 'my-footer' }, 'footer-content'),
      },
    ),
  'class:both': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', class: ['a', 'b'] } as never),
  'attrs:passthrough': () =>
    h(
      Transfer as never,
      { ...base, prefixCls: 'apollo', 'data-testid': 'x', id: 'my-transfer' } as never,
    ),
  'style:style-over-root': () =>
    h(Transfer as never, { ...base, prefixCls: 'apollo', style: { color: 'green' } } as never),
  'semantic:classNames': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        classNames: {
          root: 'cn-root',
          section: 'cn-section',
          header: 'cn-header',
          title: 'cn-title',
          body: 'cn-body',
          list: 'cn-list',
          item: 'cn-item',
          itemIcon: 'cn-item-icon',
          itemContent: 'cn-item-content',
          footer: 'cn-footer',
          actions: 'cn-actions',
        },
      } as never,
      { footer: () => h('div', { class: 'my-footer' }, 'footer') },
    ),
  'semantic:styles': () =>
    h(
      Transfer as never,
      {
        ...base,
        prefixCls: 'apollo',
        styles: {
          root: { color: 'red' },
          section: { margin: '4px' },
          header: { padding: '2px' },
          title: { fontWeight: 700 },
          body: { minHeight: '10px' },
          list: { outline: '1px solid blue' },
          item: { lineHeight: '2' },
          itemIcon: { opacity: '0.5' },
          itemContent: { letterSpacing: '1px' },
          footer: { borderTopWidth: '2px' },
          actions: { gap: '2px' },
        },
      } as never,
      { footer: () => h('div', { class: 'my-footer' }, 'footer') },
    ),
  // rtl 由 ConfigProvider 注入（与基线的 withProvider 同构）
  'config:direction-rtl': () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { prefixCls: 'apollo', direction: 'rtl' }, () =>
            h(Transfer, { ...base, prefixCls: 'apollo' }),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    try {
      return wrapper.html();
    } finally {
      wrapper.unmount();
    }
  },
};

/**
 * 允许的差异（**逐条列出**，`toEqual` 语义 ⇒ 任何额外漂移都会红）。
 * 生成方式：`packages/ui/src/transfer/__tests__/zz-dump.test.ts`（一次性脚本）。
 */

const ALLOW = {
  // rtl 用例（2026-10-04 加回）：diff 仍只有图标命名 + aria-label 增强两类已登记差异
  'config:direction-rtl': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-rtl apollo-dropdown-trigger] vs [apollo-dropdown-rtl apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-rtl apollo-dropdown-trigger] vs [apollo-dropdown-rtl apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'prefix-cls:custom': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  basic: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'empty:data-source': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'target-keys': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[2]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
    ],
  },
  'target-keys+selected': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[2]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
    ],
  },
  'row-key': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Alpha"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Beta"',
    ],
  },
  titles: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  locale: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'select-all-labels': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'show-select-all:false': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
    ],
  },
  'show-search': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/div[0]/span[0]/span[0]/span[0]: 类名不同 [anticon anticon-search] vs [apollo-icon apollo-icon-search]',
      '$/div[0]/div[0]/div[1]/div[0]/span[0]/span[2]/button[0]/span[0]: 类名不同 [anticon anticon-close-circle] vs [apollo-icon apollo-icon-close-circle]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/div[0]/span[0]/span[0]/span[0]: 类名不同 [anticon anticon-search] vs [apollo-icon apollo-icon-search]',
      '$/div[0]/div[2]/div[1]/div[0]/span[0]/span[2]/button[0]/span[0]: 类名不同 [anticon anticon-close-circle] vs [apollo-icon apollo-icon-close-circle]',
    ],
  },
  'show-search:object': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/div[0]/span[0]/span[0]/span[0]: 类名不同 [anticon anticon-search] vs [apollo-icon apollo-icon-search]',
      '$/div[0]/div[0]/div[1]/div[0]/span[0]/span[2]/button[0]/span[0]: 类名不同 [anticon anticon-close-circle] vs [apollo-icon apollo-icon-close-circle]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/div[0]/span[0]/span[0]/span[0]: 类名不同 [anticon anticon-search] vs [apollo-icon apollo-icon-search]',
      '$/div[0]/div[2]/div[1]/div[0]/span[0]/span[2]/button[0]/span[0]: 类名不同 [anticon anticon-close-circle] vs [apollo-icon apollo-icon-close-circle]',
    ],
  },
  'one-way': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[2]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[2]/div[1]/ul[0]/li[0]/button[1]/span[0]: 类名不同 [anticon anticon-delete] vs [apollo-icon apollo-icon-delete]',
      '$/div[0]/div[2]/div[1]/ul[0]/li[1]/button[1]/span[0]: 类名不同 [anticon anticon-delete] vs [apollo-icon apollo-icon-delete]',
    ],
  },
  'pagination:true': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[0]/button[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[2]/button[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'pagination:object': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[0]/button[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[2]/button[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'pagination:object+size-changer': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[1]/li[0]/button[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[4]/button[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[0]/div[1]/ul[1]/li[5]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-down] vs [apollo-icon apollo-icon-down]',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/span[0]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'status:error': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'status:warning': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  disabled: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  actions: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  operations: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'selections-icon': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
    ],
  },
  'render:object': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="value-content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'render:string': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="r-content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  footer: {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'class:both': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'attrs:passthrough': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'style:style-over-root': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'semantic:classNames': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
  'semantic:styles': {
    reason: '两类已登记差异：① 图标类名命名（ICON）；② 有意增强的 aria-label（ARIA_LABEL）。',
    deviationId: 'D23',
    diff: [
      '$/div[0]/div[0]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[0]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
      '$/div[0]/div[0]/div[1]/ul[0]/li[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content1"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[1]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content2"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[2]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content3"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[3]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content4"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[4]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content5"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[5]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content6"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[6]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content7"',
      '$/div[0]/div[0]/div[1]/ul[0]/li[7]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="content8"',
      '$/div[0]/div[1]/button[0]/span[0]/span[0]: 类名不同 [anticon anticon-right] vs [apollo-icon apollo-icon-right]',
      '$/div[0]/div[1]/button[1]/span[0]/span[0]: 类名不同 [anticon anticon-left] vs [apollo-icon apollo-icon-left]',
      '$/div[0]/div[2]/div[0]/label[0]/span[0]/input[0]: 我们多出属性 aria-label="Select all data"',
      '$/div[0]/div[2]/div[0]/span[1]: 类名不同 [anticon anticon-down apollo-dropdown-trigger] vs [apollo-dropdown-trigger apollo-icon apollo-icon-down]',
    ],
  },
} as const;

inputContractReference(
  'Transfer',
  {
    baseline,
    // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
    render: (id) => {
      const build = CASES[id];
      if (!build) {
        throw new Error(
          `[Transfer semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
            `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
        );
      }
      return build();
    },
    keepStyle: true,
    allow: mergeButtonContentReferenceAllowances(buttonContentDifferences, ALLOW),
  },
  inputReferences,
);

/** CASES 与基线一一对应（不多不少）—— 防「少测一条」。 */
describe('Transfer · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
