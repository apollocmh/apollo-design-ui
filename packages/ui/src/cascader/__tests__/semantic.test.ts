/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Cascader
 *
 * 基准：`tests/compat/baselines/cascader.dom.json`（机械 oracle，9 用例）。
 * `keepStyle: false`。
 *
 * ⚠️ 浮层内容只有 Panel 在静态渲染期可达（portal 在 SSR 不可达）——
 *    列结构 / menu-item 类 / data-path-key 靠 pure-panel 系列用例钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（浮层会被渲染在原地 ⇒ 根节点数与 SSR 基线不符）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/cascader.dom.json';
import { Cascader } from '../index';

const BP = { prefixCls: 'apollo-cascader' };

const trigger = () => h('button', { type: 'button' }, 'target');

const CASES: Record<string, () => DomRenderResult> = {
  'cascader:basic': () => h(Cascader, BP, { default: trigger }),
  'cascader:open': () => h(Cascader, { ...BP, open: true, id: 'cs-1' }, { default: trigger }),
  'cascader:disabled': () =>
    h(Cascader, { ...BP, open: true, disabled: true, id: 'cs-2' }, { default: trigger }),
};

domContractTest('Cascader', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        '[Cascader semantic.test] 基线里有用例 "' +
          id +
          '"，但 CASES 里没有对应构造。基线用例：' +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Cascader · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
