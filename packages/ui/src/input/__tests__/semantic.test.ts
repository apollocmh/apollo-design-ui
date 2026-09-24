/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Input 家族
 *
 * 基准：`tests/compat/baselines/input.dom.json`（机械 oracle，34 个用例，
 * 产出者 `tests/compat/baseline/input.mjs`）。`keepStyle: true`。
 *
 * ⚠️ antd 的 `css-var-root` / `*-css-var` / hash 类由 dom-contract 的统一过滤器
 *    剥除（D1/D5）。`type` / `placeholder` / `maxLength` 等**原生属性**不进
 *    `contract` 档（T10：只保留 tag / class / role / aria-* / data-*）——
 *    `data-count` 进契约（showCount 的计数文本）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide } from 'vue';
import baseline from '../../../../../tests/compat/baselines/input.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Input, InputGroup, InputPassword, TextArea } from '../index';

const BP = { prefixCls: 'apollo-input' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'input:basic': { render: () => h(Input, { ...BP, placeholder: 'basic' } as never) },
  'input:value': { render: () => h(Input, { ...BP, defaultValue: 'hello' } as never) },
  'input:disabled': { render: () => h(Input, { ...BP, disabled: true } as never) },
  'input:readonly': { render: () => h(Input, { ...BP, readOnly: true } as never) },

  'input:small': { render: () => h(Input, { ...BP, size: 'small' } as never) },
  'input:large': { render: () => h(Input, { ...BP, size: 'large' } as never) },
  'input:filled': { render: () => h(Input, { ...BP, variant: 'filled' } as never) },
  'input:borderless': { render: () => h(Input, { ...BP, variant: 'borderless' } as never) },
  'input:underlined': { render: () => h(Input, { ...BP, variant: 'underlined' } as never) },
  'input:bordered-false': { render: () => h(Input, { ...BP, bordered: false } as never) },
  'input:status-error': { render: () => h(Input, { ...BP, status: 'error' } as never) },
  'input:status-warning': { render: () => h(Input, { ...BP, status: 'warning' } as never) },

  'input:prefix': { render: () => h(Input, { ...BP, prefix: 'P' } as never) },
  'input:suffix': { render: () => h(Input, { ...BP, suffix: 'S' } as never) },
  'input:presuffix': { render: () => h(Input, { ...BP, prefix: '¥', suffix: 'RMB' } as never) },
  'input:allow-clear': {
    render: () => h(Input, { ...BP, allowClear: true, defaultValue: 'clear me' } as never),
  },
  'input:allow-clear-empty': {
    render: () => h(Input, { ...BP, allowClear: true } as never),
  },
  'input:allow-clear-disabled': {
    render: () => h(Input, { ...BP, allowClear: true, disabled: true, defaultValue: 'x' } as never),
  },

  'input:addon': {
    render: () => h(Input, { ...BP, addonBefore: 'http://', addonAfter: '.com' } as never),
  },
  'input:addon-before': { render: () => h(Input, { ...BP, addonBefore: 'B' } as never) },

  'input:show-count': {
    render: () => h(Input, { ...BP, showCount: true, maxLength: 20, defaultValue: 'abc' } as never),
  },
  'input:count-max': {
    render: () => h(Input, { ...BP, count: { max: 10 }, defaultValue: 'abcd' } as never),
  },

  'input:textarea': { render: () => h(TextArea, { ...BP, placeholder: 'ta' } as never) },
  'input:textarea-rows': {
    render: () => h(TextArea, { ...BP, rows: 4, defaultValue: 'hello' } as never),
  },
  'input:textarea-show-count': {
    render: () => h(TextArea, { ...BP, showCount: true, maxLength: 50 } as never),
  },
  'input:textarea-allow-clear': {
    render: () => h(TextArea, { ...BP, allowClear: true, defaultValue: 'x' } as never),
  },
  'input:textarea-status': {
    render: () => h(TextArea, { ...BP, status: 'error' } as never),
  },

  'input:password': { render: () => h(InputPassword, { ...BP, placeholder: 'pw' } as never) },
  'input:password-visible-toggle': {
    render: () => h(InputPassword, { ...BP, visibilityToggle: false } as never),
  },
  'input:password-value': {
    render: () => h(InputPassword, { ...BP, defaultValue: 'secret' } as never),
  },

  'input:group': {
    render: () =>
      h(InputGroup, { ...BP } as never, {
        default: () => [h(Input, { ...BP, style: { width: '50%' } } as never)],
      }),
  },

  'input:semantic': {
    render: () =>
      h(Input, {
        ...BP,
        classNames: { root: 'cls-root', prefix: 'cls-prefix', suffix: 'cls-suffix' },
        styles: { root: { width: '120px' } },
        prefix: 'P',
      } as never),
  },
};

domContractTest('Input', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    if (id === 'input:rtl' || id === 'input:rtl-affix') {
      // 方向由 ConfigProvider 注入（input-number 同范式：SSR 探针注入方向）
      const extra = id === 'input:rtl-affix' ? { prefix: 'P' } : {};
      return defineComponent({
        name: 'AInputRtlProbe',
        setup() {
          provide(configContextKey, {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          } as ConfigContextValue);
          return () => h(Input, { ...BP, ...extra } as never);
        },
      });
    }
    const spec = specs[id];
    if (!spec) throw new Error(`[Input L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
