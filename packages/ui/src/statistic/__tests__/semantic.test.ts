/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Statistic
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/statistic.dom.json`，由 `tests/compat/baseline/statistic.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Statistic 产出。
 * 机械 oracle。`keepStyle: true`：valueStyle 与语义化 content 的合并顺序
 * （valueStyle 在前 ⇒ 被覆盖）是本组件最容易写错的地方。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明计时行为（Timer 的 interval / onFinish 由 L1 fake timers 钉住）
 *   - 没证明 Skeleton 的内部几何（loading 用例只覆盖「骨架出现、content 消失」）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/statistic.dom.json';
import type { ConfigContextValue } from '../../config-provider/context';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Statistic, StatisticTimer } from '../index';

/**
 * 在指定的 ConfigProvider 上下文下渲染（button/semantic 同范式）：
 * antd 侧是真的 `<ConfigProvider direction="rtl">`，Vue 侧对应物是
 * `provide(configContextKey, ...)` —— 同一件事的两种写法。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AStatisticCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'statistic:no-props': { render: () => h(Statistic) },
  'statistic:basic': {
    render: () => h(Statistic, { title: 'Active Users', value: 112893, precision: 2 }),
  },
  'statistic:prefix-suffix': {
    // C8-R2：富前缀走 `#prefix` 插槽
    render: () =>
      h(
        Statistic,
        { title: 'Feedback', value: 1128, suffix: '/ 100' },
        { prefix: () => h('i', { class: 'my-icon' }) },
      ),
  },
  'statistic:group-separator': {
    render: () => h(Statistic, { value: 112893, groupSeparator: '__TEST__' }),
  },
  'statistic:decimal-separator': {
    render: () => h(Statistic, { value: 112893.12345, precision: 3, decimalSeparator: ',' }),
  },
  'statistic:precision-negative': {
    render: () => h(Statistic, { value: -112893.1212, precision: -2 }),
  },
  'statistic:illegal-value': { render: () => h(Statistic, { value: 'bamboo' }) },
  'statistic:dash-value': { render: () => h(Statistic, { value: '-' }) },
  // C8-R2：0 不是 string —— 经 slot 传入（isRenderable(0) ⇒ 渲染）
  'statistic:zero-title-prefix-suffix': {
    render: () => h(Statistic, {}, { title: () => 0, prefix: () => 0, suffix: () => 0 }),
  },
  'statistic:formatter-fn': {
    render: () => h(Statistic, { value: 1128, formatter: (v: number | string) => `*${v}*` }),
  },
  'statistic:aria-data': {
    render: () => h(Statistic, { 'data-abc': '1', 'aria-label': 'label', role: 'status' }),
  },
  'statistic:semantic': {
    // C8-R2：富前缀走 `#prefix` 插槽
    render: () =>
      h(
        Statistic,
        {
          title: 'T',
          value: 11.28,
          precision: 2,
          suffix: '%',
          classNames: {
            root: 'demo-root',
            header: 'demo-header',
            title: 'demo-title',
            content: 'demo-content',
            value: 'demo-value',
            prefix: 'demo-prefix',
            suffix: 'demo-suffix',
          },
          styles: {
            root: { padding: '8px' },
            content: { color: 'red' },
            value: { opacity: 0.8 },
          },
        },
        { prefix: () => h('i', { class: 'my-icon' }) },
      ),
  },
  'statistic:value-style': {
    render: () => h(Statistic, { title: 'T', value: 5, valueStyle: { color: 'red' } }),
  },
  'statistic:loading': {
    render: () => h(Statistic, { title: 'Active Users', value: 112112, loading: true }),
  },
  'statistic:rtl': {
    render: () => withConfig({ direction: 'rtl' }, () => h(Statistic)),
  },
  'statistic:timer-ssr': {
    render: () => h(StatisticTimer, { type: 'countdown', value: Date.now() + 1000 * 60 * 2 }),
  },
  'statistic:timer-title': {
    render: () =>
      h(StatisticTimer, { type: 'countdown', title: 'Deadline', value: Date.now() + 1000 }),
  },
};

domContractTest('Statistic', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Statistic L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
