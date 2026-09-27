/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Result
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/result.dom.json`，由 `tests/compat/baseline/result.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Result 产出。
 * 机械 oracle。`keepStyle: true`：语义槽位 styles 的内联合并顺序（style prop 覆盖
 * styles.root）是本组件最容易写错的地方。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明插画像素级形态（L6 负责）
 *   - 没证明 ConfigProvider 级语义配置（L1 provide 用例覆盖）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/result.dom.json';
import { Button } from '../../button';
import { Result } from '../index';

// 与基线一致：antd Button（prefixCls apollo-btn）的 SSR 产物
const Btn = () => h(Button, { prefixCls: 'apollo-btn' }, () => 'Go Console');

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'result:prefix-cls:no-props': { render: () => h(Result) },
  'result:info-default': {
    render: () =>
      h(Result, { title: 'Your operation has been executed' }, () => h('p', null, 'body')),
  },
  'result:success': {
    render: () =>
      h(Result, { status: 'success', title: 'Success', subTitle: 'Sub' }, { extra: Btn }),
  },
  'result:error': {
    render: () =>
      h(Result, { status: 'error', title: 'Failed', subTitle: 'Check it' }, () =>
        h('div', { class: 'desc' }, 'details'),
      ),
  },
  'result:warning': {
    render: () => h(Result, { status: 'warning', title: 'Warning', subTitle: 'Be careful' }),
  },
  'result:info-explicit': { render: () => h(Result, { status: 'info', title: 'Info' }) },
  'result:404': {
    render: () => h(Result, { status: '404', title: '404', subTitle: 'Not Found' }, { extra: Btn }),
  },
  'result:500': {
    render: () => h(Result, { status: '500', title: '500', subTitle: 'Server Error' }),
  },
  'result:403': { render: () => h(Result, { status: 403, title: '403', subTitle: 'Forbidden' }) },
  'result:icon-null': { render: () => h(Result, { title: 'No icon', icon: null }) },
  'result:icon-false': { render: () => h(Result, { title: 'No icon', icon: false }) },
  'result:icon-custom': {
    render: () =>
      h(Result, { title: 'Custom' }, { icon: () => h('span', { class: 'my-icon' }, 'i') }),
  },
  'result:guard-empty-strings': {
    render: () => h(Result, { title: '', subTitle: '' }, { extra: () => '' }),
  },
  'result:body-renders': { render: () => h(Result, { title: 'T' }, () => h('p', null, 'body')) },
  'result:semantic': {
    render: () =>
      h(
        Result,
        {
          status: 'success',
          title: 'T',
          subTitle: 'S',
          classNames: {
            root: 'demo-root',
            title: 'demo-title',
            subTitle: 'demo-sub',
            icon: 'demo-icon',
            extra: 'demo-extra',
          },
          styles: { root: { padding: '16px' }, title: { color: 'red' }, icon: { opacity: 0.8 } },
        },
        { extra: Btn },
      ),
  },
};

domContractTest('Result', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Result L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
