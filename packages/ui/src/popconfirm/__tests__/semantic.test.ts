/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Popconfirm
 *
 * 基准：`tests/compat/baselines/popconfirm.dom.json`（机械 oracle，14 个用例），
 * 由 `tests/compat/baseline/popconfirm.mjs` 生成。
 * `keepStyle: false`（antd 的 inline style 混着 cssinjs 声明；语义化 styles 由 L1 钉）。
 *
 * ⚠️ 浮层内容只有 `PurePanel` 在静态渲染期可达（portal 在 SSR 不可达），
 *    所以 Overlay 的四层结构全部靠 pure-panel 系列用例钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（浮层会被渲染在原地 ⇒ 根节点数与 SSR 基线不符；
//    真实 Teleport 与 React 的 portal 同构：都是「不在触发元素旁边」）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/popconfirm.dom.json';
import { Popconfirm, PopconfirmPurePanel } from '../index';

/** 两侧共用的完整前缀。与 `tests/compat/baseline/popconfirm.mjs` 的 `BP` 必须一致。 */
const BP = { prefixCls: 'apollo-popconfirm' };

const trigger = () => h('button', { type: 'button' }, 'target');

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const CASES: Record<string, () => DomRenderResult> = {
  'popconfirm:basic': () => h(Popconfirm, BP, { default: trigger }),
  'popconfirm:open': () => h(Popconfirm, { ...BP, open: true, id: 'pc-1' }, { default: trigger }),
  'popconfirm:disabled': () =>
    h(Popconfirm, { ...BP, open: true, disabled: true, id: 'pc-2' }, { default: trigger }),

  'popconfirm:pure-panel': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', description: 'Description' }),
  'popconfirm:pure-panel-title-only': () => h(PopconfirmPurePanel, { ...BP, title: 'Title' }),
  'popconfirm:pure-panel-zero-title': () =>
    h(PopconfirmPurePanel, { ...BP, title: 0, description: 'Description' }),
  'popconfirm:pure-panel-no-cancel': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', showCancel: false }),
  'popconfirm:pure-panel-custom-text': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', okText: 'Yes', cancelText: 'No' }),
  'popconfirm:pure-panel-empty-text': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', okText: '', cancelText: '' }),
  'popconfirm:pure-panel-no-icon': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', icon: false }),
  'popconfirm:pure-panel-ok-type': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', okType: 'danger' }),
  'popconfirm:pure-panel-placement': () =>
    h(PopconfirmPurePanel, { ...BP, title: 'Title', placement: 'bottomLeft' }),
  'popconfirm:pure-panel-render-fn': () =>
    h(PopconfirmPurePanel, {
      ...BP,
      title: () => 'lazy-title',
      description: () => 'lazy-description',
    }),
  'popconfirm:pure-panel-class-name': () =>
    h(PopconfirmPurePanel, {
      ...BP,
      title: 'Title',
      description: 'Description',
      className: 'custom-root',
      style: { padding: 20 },
    }),
};

domContractTest('Popconfirm', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Popconfirm semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});

describe('Popconfirm · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
