/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Segmented
 *
 * 基准：`tests/compat/baselines/segmented.dom.json`（机械 oracle，23 个用例），
 * 由 `tests/compat/baseline/segmented.mjs` 生成。
 * `keepStyle: false`（antd 的 inline style 混着 cssinjs 声明，合同档不比 style；
 * 语义化 styles 由 L1 的 semantic 用例钉）。
 * `checked` / `disabled` / `name` 这些 input 属性不进 contract 档（T10 只保留
 * tag / class / role / aria-* / data-*）—— 由 L1（index.test.ts）钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/segmented.dom.json';
import { ConfigProvider } from '../../config-provider';
import { Segmented } from '../index';

/** 两侧共用的完整前缀。与 `tests/compat/baseline/segmented.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo-segmented';

const OPTIONS = ['Daily', 'Weekly', 'Monthly'];
const OBJECT_OPTIONS = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
];

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const CASES: Record<string, () => DomRenderResult> = {
  basic: () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, value: 'Weekly' }),
  'options:primitive': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS }),
  'options:object': () => h(Segmented, { prefixCls: PREFIX, options: OBJECT_OPTIONS, value: 'b' }),
  'options:empty': () => h(Segmented, { prefixCls: PREFIX, options: [] }),
  'prefix-cls:no-props': () => h(Segmented, { options: OPTIONS }),
  'prefix-cls:custom': () => h(Segmented, { prefixCls: 'custom', options: OPTIONS }),
  'value:first': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, value: 'Daily' }),
  'value:last': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, value: 'Monthly' }),
  'value:not-in-options': () =>
    h(Segmented, { prefixCls: PREFIX, options: OPTIONS, value: 'Missing' }),
  'disabled:group': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, disabled: true }),
  'disabled:option': () =>
    h(Segmented, {
      prefixCls: PREFIX,
      options: [
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b', disabled: true },
        { label: 'C', value: 'c' },
      ],
    }),
  'size:small': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, size: 'small' }),
  'size:large': () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, size: 'large' }),
  block: () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, block: true }),
  vertical: () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, vertical: true }),
  'orientation:vertical': () =>
    h(Segmented, { prefixCls: PREFIX, options: OPTIONS, orientation: 'vertical' }),
  'shape:round': () =>
    h(Segmented, { prefixCls: PREFIX, options: OPTIONS, shape: 'round', value: 'Weekly' }),
  name: () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS, name: 'seg' }),
  title: () =>
    h(Segmented, {
      prefixCls: PREFIX,
      options: [
        { label: 'A', value: 'a', title: 'Option A' },
        { label: 'B', value: 'b', title: 'Option B' },
      ],
    }),
  'icon:string': () =>
    h(Segmented, {
      prefixCls: PREFIX,
      options: [{ label: 'A', value: 'a', icon: '★' }, 'B'],
    }),
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      () => h(Segmented, { prefixCls: PREFIX, options: OPTIONS }) as never,
    ) as never,
  'semantic:classNames': () =>
    h(Segmented, {
      prefixCls: PREFIX,
      options: OBJECT_OPTIONS,
      classNames: { root: 'seg-root', item: 'seg-item', label: 'seg-label' },
    }),
  'semantic:styles': () =>
    h(Segmented, {
      prefixCls: PREFIX,
      options: OBJECT_OPTIONS,
      styles: { root: { color: 'red' }, item: { fontWeight: 600 } },
    }),
};

/** 先跑空豁免，用真实 diff 填充（与 rate 的 ALLOW 同流程）。 */
const ALLOW: Record<string, { reason: string; deviationId: string; diff: string[] }> = {
  'prefix-cls:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。' +
      '这条用例两边都不传 prefixCls，把「默认值不同」钉成断言（D6）。' +
      '差异落在每一个由前缀派生的节点上（根 / group / 每个 item / input / label）。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-segmented] vs [apollo-segmented]',
      '$/div[0]/div[0]: 类名不同 [ant-segmented-group] vs [apollo-segmented-group]',
      '$/div[0]/div[0]/label[0]: 类名不同 [ant-segmented-item ant-segmented-item-selected ant-segmented-item-selected-text] vs [apollo-segmented-item apollo-segmented-item-selected apollo-segmented-item-selected-text]',
      '$/div[0]/div[0]/label[0]/input[0]: 类名不同 [ant-segmented-item-input] vs [apollo-segmented-item-input]',
      '$/div[0]/div[0]/label[0]/div[1]: 类名不同 [ant-segmented-item-label] vs [apollo-segmented-item-label]',
      '$/div[0]/div[0]/label[1]: 类名不同 [ant-segmented-item] vs [apollo-segmented-item]',
      '$/div[0]/div[0]/label[1]/input[0]: 类名不同 [ant-segmented-item-input] vs [apollo-segmented-item-input]',
      '$/div[0]/div[0]/label[1]/div[1]: 类名不同 [ant-segmented-item-label] vs [apollo-segmented-item-label]',
      '$/div[0]/div[0]/label[2]: 类名不同 [ant-segmented-item] vs [apollo-segmented-item]',
      '$/div[0]/div[0]/label[2]/input[0]: 类名不同 [ant-segmented-item-input] vs [apollo-segmented-item-input]',
      '$/div[0]/div[0]/label[2]/div[1]: 类名不同 [ant-segmented-item-label] vs [apollo-segmented-item-label]',
    ],
  },
};

domContractTest('Segmented', {
  baseline,
  keepStyle: false,
  allow: ALLOW,
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Segmented semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});

/** CASES 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Segmented · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
