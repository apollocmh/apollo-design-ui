/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— AutoComplete
 *
 * 基准：`tests/compat/baselines/auto-complete.dom.json`（机械 oracle，
 * `tests/compat/baseline/auto-complete.mjs`）。
 *
 * ⚠️ prefixCls 传完整前缀 `'apollo-select'`（类链 `${prefixCls}-auto-complete`，
 * rate 期坑 79 同族）。SSR 安全形态（浮层在 SSR 不可达，open 用例由 L1 覆盖）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/auto-complete.dom.json';
import { AutoComplete } from '../index';

/** 两侧共用的完整前缀。与 `tests/compat/baseline/auto-complete.mjs` 的 PREFIX 一致。 */
const PREFIX = 'apollo-select';

const CASES: Record<string, () => DomRenderResult> = {
  plain: () => h(AutoComplete, { prefixCls: PREFIX }),
  value: () => h(AutoComplete, { prefixCls: PREFIX, value: 'abc' }),
  placeholder: () => h(AutoComplete, { prefixCls: PREFIX, placeholder: 'input here' }),
  disabled: () => h(AutoComplete, { prefixCls: PREFIX, disabled: true }),
  'size:large': () => h(AutoComplete, { prefixCls: PREFIX, size: 'large' }),
  'status:error': () => h(AutoComplete, { prefixCls: PREFIX, status: 'error' }),
  'class-name': () => h(AutoComplete, { prefixCls: PREFIX, className: 'extra' }),
  'prefix-cls:custom': () => h(AutoComplete, { prefixCls: 'custom' }),
  'prefix-cls:no-props': () => h(AutoComplete),
};

const ALLOW = {
  'prefix-cls:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。' +
      'rate 期坑 79 同族：类链含 `-select` 后缀，差异落在全部由前缀派生的节点上。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-select ant-select-auto-complete ant-select-outlined ant-select-show-search ant-select-single] vs [apollo-select apollo-select-auto-complete apollo-select-outlined apollo-select-show-search apollo-select-single]',
      '$/div[0]/div[0]: 类名不同 [ant-select-content] vs [apollo-select-content]',
      '$/div[0]/div[0]/div[0]: 类名不同 [ant-select-placeholder] vs [apollo-select-placeholder]',
      '$/div[0]/div[0]/input[1]: 类名不同 [ant-select-input] vs [apollo-select-input]',
    ],
  },
};

domContractTest('AutoComplete', {
  baseline,
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        '[AutoComplete semantic.test] 基线里有用例 "' +
          id +
          '"，但 CASES 里没有对应构造。基线里的用例：' +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
  keepStyle: false,
  allow: ALLOW,
});

describe('AutoComplete · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
