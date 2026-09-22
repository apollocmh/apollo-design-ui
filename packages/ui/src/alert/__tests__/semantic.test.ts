/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Alert
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/alert.dom.json`，由 `tests/compat/baseline/alert.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Alert 产出。
 * 机械 oracle。`keepStyle: true`：语义化 styles 的内联合并顺序是易错点。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明收起动画时序（L1 fake timers 钉 motion 类名）
 *   - 没证明 ErrorBoundary 的错误切换（L1 用真实抛错组件钉）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/alert.dom.json';
import type { ConfigContextValue } from '../../config-provider/context';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Alert } from '../index';

/**
 * 在指定的 ConfigProvider 上下文下渲染（button/semantic 同范式）。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AAlertCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const noop = () => {};

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'alert:no-props': { render: () => h(Alert) },
  'alert:basic': { render: () => h(Alert, { title: 'Success Text', type: 'success' }) },
  'alert:description': {
    render: () => h(Alert, { title: 'Info Text', description: 'Info Description', type: 'info' }),
  },
  'alert:description-only': { render: () => h(Alert, { description: 'd' }) },
  'alert:zero-title-description-action': {
    render: () => h(Alert, { title: 0, description: 0, action: 0 }),
  },
  'alert:type-defaults': { render: () => h(Alert, { title: 'x' }) },
  'alert:type-warning': { render: () => h(Alert, { title: 'x', type: 'warning' }) },
  'alert:variant-outlined': { render: () => h(Alert, { title: 'Info', variant: 'outlined' }) },
  'alert:variant-filled': { render: () => h(Alert, { title: 'Info', variant: 'filled' }) },
  'alert:banner': { render: () => h(Alert, { title: 'Warning text', banner: true }) },
  'alert:banner-error': {
    render: () => h(Alert, { title: 'Error text', type: 'error', banner: true }),
  },
  'alert:banner-no-icon': {
    render: () => h(Alert, { title: 'x', banner: true, showIcon: false }),
  },
  'alert:show-icon': { render: () => h(Alert, { title: 'x', showIcon: true }) },
  'alert:no-icon': { render: () => h(Alert, { title: 'x', showIcon: false }) },
  'alert:custom-icon': { render: () => h(Alert, { title: 'x', showIcon: true, icon: 'i' }) },
  'alert:closable': { render: () => h(Alert, { title: 'x', closable: true }) },
  'alert:closable-object': {
    render: () =>
      h(Alert, {
        title: 'x',
        closable: { closeIcon: true, onClose: noop, 'aria-label': 'close' },
      }),
  },
  'alert:closable-object-closeIcon': {
    render: () => h(Alert, { title: 'x', closable: { closeIcon: 'C' } }),
  },
  'alert:close-text': { render: () => h(Alert, { title: 'x', closeText: 'close' }) },
  'alert:close-icon-string': { render: () => h(Alert, { title: 'x', closeIcon: 'X' }) },
  'alert:close-icon-false': { render: () => h(Alert, { title: 'x', closeIcon: false }) },
  'alert:close-icon-null': { render: () => h(Alert, { title: 'x', closeIcon: null }) },
  'alert:action': {
    render: () =>
      h(Alert, { title: 'x', showIcon: true, action: h('button', { type: 'button' }, 'A') }),
  },
  'alert:aria-data': {
    render: () => h(Alert, { 'data-test': 'test-id', 'aria-describedby': 'some-label' } as never),
  },
  'alert:role-override': { render: () => h(Alert, { role: 'status' } as never) },
  'alert:id': { render: () => h(Alert, { id: 'test-id' }) },
  'alert:semantic': {
    render: () =>
      h(Alert, {
        title: 'Info Text',
        description: 'Info Description',
        showIcon: true,
        closable: true,
        type: 'info',
        action: h('div', null, 'A'),
        classNames: {
          root: 'demo-root',
          icon: 'demo-icon',
          section: 'demo-section',
          title: 'demo-title',
          description: 'demo-description',
          actions: 'demo-actions',
          close: 'demo-close',
        },
        styles: {
          root: { color: 'rgb(255, 0, 0)' },
          icon: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
          section: { padding: '20px' },
          title: { backgroundColor: 'rgb(0, 0, 255)' },
          description: { fontSize: '20px' },
          actions: { color: 'rgb(0, 128, 0)' },
          close: { color: 'rgb(128, 0, 128)' },
        },
      }),
  },
  'alert:rtl': {
    render: () => withConfig({ direction: 'rtl' }, () => h(Alert)),
  },
};

domContractTest('Alert', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Alert L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
