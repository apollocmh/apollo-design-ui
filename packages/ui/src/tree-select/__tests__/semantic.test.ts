/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— TreeSelect
 *
 * 基准：`tests/compat/baselines/tree-select.dom.json`（机械 oracle，13 用例）。
 * `keepStyle: false`。
 *
 * ⚠️ 浮层内容 portal 在 SSR 不可达（rc BaseSelect 同 Cascader）—— 基线钉触发器
 *    DOM；浮层树结构由 `tree-select.test.ts` 的结构断言钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（浮层渲染在原地 ⇒ 根节点数与 SSR 基线不符）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/tree-select.dom.json';
import { TreeSelect } from '../index';

const BP = { prefixCls: 'apollo-tree-select' };

const TREE_DATA = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1' },
    ],
  },
  { title: 'parent 2', value: '0-1' },
];

const CASES: Record<string, () => DomRenderResult> = {
  'tsel:basic': () => h(TreeSelect, { ...BP, treeData: TREE_DATA }),
  'tsel:placeholder': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, placeholder: '请选择' }),
  'tsel:value-single': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, defaultValue: '0-0-0' }),
  'tsel:value-multiple': () =>
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      defaultValue: ['0-0-0', '0-1'],
    }),
  'tsel:label-in-value': () =>
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      labelInValue: true,
      defaultValue: [{ value: '0-0-0', label: 'leaf 1' }],
    }),
  'tsel:max-tag': () =>
    h(TreeSelect, {
      ...BP,
      treeData: TREE_DATA,
      multiple: true,
      maxTagCount: 1,
      defaultValue: ['0-0-0', '0-0-1', '0-1'],
    }),
  'tsel:open': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, open: true, id: 'ts-1' }),
  'tsel:disabled': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, disabled: true }),
  'tsel:status-error': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, status: 'error' }),
  'tsel:variant-filled': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, variant: 'filled' }),
  'tsel:allow-clear': () =>
    h(TreeSelect, { ...BP, treeData: TREE_DATA, allowClear: true, defaultValue: '0-1' }),
  'tsel:show-search': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, showSearch: true }),
  'tsel:size-large': () => h(TreeSelect, { ...BP, treeData: TREE_DATA, size: 'large' }),
};

domContractTest('TreeSelect', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        '[TreeSelect semantic.test] 基线里有用例 "' +
          id +
          '"，但 CASES 里没有对应构造。基线用例：' +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('TreeSelect · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
