/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— DatePicker
 *
 * 基准：`tests/compat/baselines/date-picker.dom.json`（机械 oracle，**16 用例**，单值）。
 * `keepStyle: false`。
 *
 * ── 覆盖范围：**只覆盖触发元素**（与 `cascader.mjs` 同判）──────────────────────
 *
 * SSR 下浮层走 Portal ⇒ **不渲染**（实测 `open: true` 的 SSR 只有 889 B，与不传 `open`
 * **字节相同**）⇒ 面板 DOM 在静态渲染期不可达。
 * ⇒ **面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责**（它自己的 rc 基线与用例），
 * 本文件不重复钉 —— 避免同一件事在两层各钉一份、日后漂移。
 *
 * ── 范围版留到 S5 ─────────────────────────────────────────────────────────────
 *
 * `RangePicker.vue` 与「范围两端切换」同批落地（S5）。届时 baseline 补 5 个 range 用例，
 * 这里同步补 `CASES`。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（浮层若被渲染在原地，根节点数会与 SSR 基线不符）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/date-picker.dom.json';
import { DatePicker } from '../index';

const D = (s: string) => dayjs(s);

/** ⚠️ 与 baseline 的 `ConfigProvider prefixCls: 'apollo'` 对应 ⇒ 类名 `apollo-picker`。 */
const BP = {};

const CASES: Record<string, () => DomRenderResult> = {
  'date-picker:basic': () => h(DatePicker, BP),
  'date-picker:value': () => h(DatePicker, { ...BP, defaultValue: D('2026-09-30') }),
  'date-picker:size-small': () => h(DatePicker, { ...BP, size: 'small' }),
  'date-picker:size-large': () => h(DatePicker, { ...BP, size: 'large' }),
  'date-picker:variant-filled': () => h(DatePicker, { ...BP, variant: 'filled' }),
  'date-picker:variant-borderless': () => h(DatePicker, { ...BP, variant: 'borderless' }),
  'date-picker:variant-underlined': () => h(DatePicker, { ...BP, variant: 'underlined' }),
  'date-picker:status-error': () => h(DatePicker, { ...BP, status: 'error' }),
  'date-picker:status-warning': () => h(DatePicker, { ...BP, status: 'warning' }),
  'date-picker:disabled': () => h(DatePicker, { ...BP, disabled: true }),
  'date-picker:allow-clear-false': () =>
    h(DatePicker, { ...BP, allowClear: false, defaultValue: D('2026-09-30') }),
  'date-picker:prefix': () => h(DatePicker, { ...BP, prefix: 'P' }),
  'date-picker:show-time': () => h(DatePicker, { ...BP, showTime: true }),
  'date-picker:no-suffix': () => h(DatePicker, { ...BP, suffixIcon: null }),
  'date-picker:picker-month': () => h(DatePicker, { ...BP, picker: 'month' }),
  'date-picker:placeholder': () => h(DatePicker, { ...BP, placeholder: '自定义' }),
};

domContractTest('DatePicker', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[DatePicker semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。` +
          `基线用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});

describe('DatePicker · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
