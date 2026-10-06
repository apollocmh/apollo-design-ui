/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Progress
 *
 * 基准：`tests/compat/baselines/progress.dom.json`（机械 oracle，
 * `tests/compat/baseline/progress.mjs`）。
 *
 * 前缀：基线侧 ConfigProvider prefixCls='apollo'（antd 全局 ant→apollo）；
 * Vue 侧默认前缀即 `apollo` —— 两侧类链天然一致，无需传 prefixCls。
 * SSR 安全形态（gradient circle 的 useId 形态必然不同 ⇒ 不入基线，
 * 结构由 L1 覆盖、外观由 L6 覆盖）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/progress.dom.json';
import { Progress } from '../index';

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const CASES: Record<string, () => DomRenderResult> = {
  plain: () => h(Progress, { percent: 30 }),
  'percent:100': () => h(Progress, { percent: 100 }),
  'status:active': () => h(Progress, { percent: 40, status: 'active' }),
  'status:exception': () => h(Progress, { percent: 70, status: 'exception' }),
  'show-info:false': () => h(Progress, { percent: 50, showInfo: false }),
  'size:small': () => h(Progress, { percent: 30, size: 'small' }),
  'size:array': () => h(Progress, { percent: 30, size: [300, 20] }),
  steps: () => h(Progress, { percent: 60, steps: 5 }),
  'stroke-color': () =>
    h(Progress, { percent: 30, strokeColor: { from: '#108ee9', to: '#87d068' } }),
  success: () => h(Progress, { percent: 60, success: { percent: 20 } }),
  'linecap:butt': () => h(Progress, { percent: 30, strokeLinecap: 'butt' }),
  'rail-color': () => h(Progress, { percent: 30, railColor: '#e6f4ff' }),
  'percent-position:inner': () =>
    h(Progress, {
      percent: 10,
      percentPosition: { align: 'center', type: 'inner' },
      size: [300, 20],
    }),
  'type:circle': () => h(Progress, { percent: 75, type: 'circle' }),
  'type:dashboard': () => h(Progress, { percent: 75, type: 'dashboard' }),
  'circle:small': () => h(Progress, { percent: 50, type: 'circle', size: 'small' }),
  'circle:stroke-width': () => h(Progress, { percent: 50, type: 'circle', strokeWidth: 12 }),
  'class-name': () => h(Progress, { percent: 30, class: 'extra' }),
  aria: () => h(Progress, { percent: 30, 'aria-label': 'uploading' }),
  'prefix-cls:custom': () => h(Progress, { percent: 30, prefixCls: 'custom' }),
};

const ALLOW = {};

domContractTest('Progress', {
  baseline,
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Progress semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: false,
  allow: ALLOW,
});

describe('Progress · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
