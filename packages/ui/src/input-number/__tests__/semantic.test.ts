/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— InputNumber
 *
 * 基准：`tests/compat/baselines/input-number.dom.json`（机械 oracle，24 个用例，
 * 产出者 `tests/compat/baseline/input-number.mjs`）。`keepStyle: true`。
 *
 * ⚠️ antd 的 `css-var-root` / `*-css-var` / hash 类由 dom-contract 的统一过滤器
 *    剥除（D1/D5）。`autoComplete` / `disabled` / `readOnly` / `value` 等**原生
 *    属性**不进 `contract` 档（T10：只保留 tag / class / role / aria-* / data-*）
 *    —— `aria-valuenow` / `aria-valuemin` / `aria-valuemax` 进契约。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide } from 'vue';
import baseline from '../../../../../tests/compat/baselines/input-number.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { InputNumber } from '../index';

const BP = { prefixCls: 'apollo-input-number' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'input-number:basic': { render: () => h(InputNumber, { ...BP, defaultValue: 3 } as never) },
  'input-number:value-controlled': {
    render: () => h(InputNumber, { ...BP, value: 5, min: 1, max: 10 } as never),
  },
  'input-number:empty': { render: () => h(InputNumber, BP as never) },
  'input-number:placeholder': {
    render: () => h(InputNumber, { ...BP, placeholder: '请输入' } as never),
  },

  'input-number:controls-false': {
    render: () => h(InputNumber, { ...BP, controls: false } as never),
  },
  'input-number:controls-object': {
    render: () => h(InputNumber, { ...BP, controls: {} } as never),
  },
  'input-number:disabled': { render: () => h(InputNumber, { ...BP, disabled: true } as never) },
  'input-number:readonly': { render: () => h(InputNumber, { ...BP, readOnly: true } as never) },

  'input-number:spinner': {
    render: () => h(InputNumber, { ...BP, mode: 'spinner', defaultValue: 1 } as never),
  },

  'input-number:small': { render: () => h(InputNumber, { ...BP, size: 'small' } as never) },
  'input-number:large': { render: () => h(InputNumber, { ...BP, size: 'large' } as never) },
  'input-number:borderless': {
    render: () => h(InputNumber, { ...BP, variant: 'borderless' } as never),
  },
  'input-number:filled': { render: () => h(InputNumber, { ...BP, variant: 'filled' } as never) },
  'input-number:underlined': {
    render: () => h(InputNumber, { ...BP, variant: 'underlined' } as never),
  },
  'input-number:bordered-false': {
    render: () => h(InputNumber, { ...BP, bordered: false } as never),
  },
  'input-number:status-error': {
    render: () => h(InputNumber, { ...BP, status: 'error' } as never),
  },
  'input-number:status-warning': {
    render: () => h(InputNumber, { ...BP, status: 'warning' } as never),
  },

  'input-number:presuffix': {
    render: () => h(InputNumber, { ...BP, prefix: '$', suffix: 'kg' } as never),
  },

  'input-number:precision': {
    render: () => h(InputNumber, { ...BP, defaultValue: '1.234', precision: 2 } as never),
  },
  'input-number:formatter': {
    render: () =>
      h(InputNumber, {
        ...BP,
        defaultValue: 12345,
        formatter: (v: unknown) => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      } as never),
  },

  'input-number:out-of-range': {
    render: () => h(InputNumber, { ...BP, value: 99, min: 1, max: 10 } as never),
  },

  'input-number:semantic': {
    render: () =>
      h(InputNumber, {
        ...BP,
        classNames: { root: 'cls-root', input: 'cls-input', actions: 'cls-actions' },
        styles: { root: { width: '120px' }, input: { color: 'rgb(1, 2, 3)' } },
        defaultValue: 1,
      } as never),
  },

  'input-number:addon': {
    render: () =>
      h(InputNumber, {
        ...BP,
        addonBefore: 'http://',
        addonAfter: '.com',
        defaultValue: 1,
      } as never),
  },
};

domContractTest('InputNumber', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    if (id === 'input-number:rtl') {
      // 方向由 ConfigProvider 注入（listy 同范式：SSR 探针用 ConfigProvider 注入方向）
      return defineComponent({
        name: 'AInputNumberRtlProbe',
        setup() {
          provide(configContextKey, {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          } as ConfigContextValue);
          return () => h(InputNumber, BP as never);
        },
      });
    }
    const spec = specs[id];
    if (!spec)
      throw new Error(`[InputNumber L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
