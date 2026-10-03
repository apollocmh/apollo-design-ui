/**
 * L4 · DOM 契约（与 antd 6.6.4 的 SSR 产物逐节点比对）—— Mentions
 *
 * 基准：`tests/compat/baselines/mentions.dom.json`（20 个用例，机械 oracle，
 * 产出者 `tests/compat/baseline/mentions.mjs`）。
 *
 * ⚠️ 基线是**闭态**（SSR 不跑 effect ⇒ 没有 measure 层与候选面板）。
 *    开态（面板）由 L1（`index.test.ts` 的测量态用例）与 L6 覆盖。
 *
 * ⚠️ 两侧的 `css-dev-only-*` / `*-css-var` 由 dom-contract 的统一过滤器剥除（D1/D5）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide } from 'vue';
import baseline from '../../../../../tests/compat/baselines/mentions.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import type { MentionsProps } from '../interface';
import Mentions from '../Mentions';

const BP = { prefixCls: 'apollo-mentions' };

const OPTIONS = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

const specs: Record<string, { render: () => DomRenderResult }> = {
  'mentions:plain': { render: () => h(Mentions, { ...BP } as never) },
  'mentions:value': { render: () => h(Mentions, { ...BP, defaultValue: '@afc163' } as never) },
  'mentions:placeholder': { render: () => h(Mentions, { ...BP, placeholder: 'hi' } as never) },
  'mentions:disabled': {
    render: () => h(Mentions, { ...BP, disabled: true, defaultValue: 'a' } as never),
  },
  'mentions:readonly': {
    render: () => h(Mentions, { ...BP, readOnly: true, defaultValue: 'a' } as never),
  },

  'mentions:small': { render: () => h(Mentions, { ...BP, size: 'small' } as never) },
  'mentions:large': { render: () => h(Mentions, { ...BP, size: 'large' } as never) },
  'mentions:filled': { render: () => h(Mentions, { ...BP, variant: 'filled' } as never) },
  'mentions:borderless': { render: () => h(Mentions, { ...BP, variant: 'borderless' } as never) },
  'mentions:underlined': { render: () => h(Mentions, { ...BP, variant: 'underlined' } as never) },
  'mentions:status-error': { render: () => h(Mentions, { ...BP, status: 'error' } as never) },
  'mentions:status-warning': { render: () => h(Mentions, { ...BP, status: 'warning' } as never) },

  'mentions:allow-clear': {
    render: () => h(Mentions, { ...BP, allowClear: true, defaultValue: 'a' } as never),
  },
  'mentions:allow-clear-disabled': {
    render: () =>
      h(Mentions, { ...BP, allowClear: true, disabled: true, defaultValue: 'a' } as never),
  },
  'mentions:allow-clear-empty': {
    render: () => h(Mentions, { ...BP, allowClear: true } as never),
  },

  'mentions:class-name': {
    render: () => h(Mentions, { ...BP, className: 'extra', rootClassName: 'rootx' } as never),
  },
  'mentions:rows': { render: () => h(Mentions, { ...BP, rows: 3 } as never) },
  'mentions:options': { render: () => h(Mentions, { ...BP, options: OPTIONS } as never) },

  'mentions:semantic': {
    render: () =>
      h(Mentions, {
        ...BP,
        classNames: { root: 'cls-root', textarea: 'cls-textarea', suffix: 'cls-suffix' },
        styles: { root: { width: '120px' } },
        allowClear: true,
        defaultValue: 'x',
      } as unknown as MentionsProps as never),
  },
};

domContractTest('Mentions', {
  baseline,
  allow: {},
  render: (id) => {
    if (id === 'mentions:rtl') {
      // 方向由 ConfigProvider 注入（input / input-number 同范式）
      return defineComponent({
        name: 'AMentionsRtlProbe',
        setup() {
          provide(configContextKey, {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          } as ConfigContextValue);
          return () => h(Mentions, { ...BP } as never);
        },
      });
    }
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Mentions L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    return spec.render();
  },
});
