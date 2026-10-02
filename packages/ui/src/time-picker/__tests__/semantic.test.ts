/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— TimePicker
 *
 * 基准：`tests/compat/baselines/time-picker.dom.json`（机械 oracle，**21 用例**：
 * 16 单值 + 5 范围）。`keepStyle: false`。
 *
 * ── 覆盖范围：**只覆盖触发元素**（与 `date-picker.mjs` / `cascader.mjs` 同判）──────
 *
 * SSR 下浮层走 Portal ⇒ **不渲染** ⇒ 时间面板的 DOM 在静态渲染期不可达。
 * ⇒ **面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责**，本文件不重复钉。
 *
 * ── 🚨 这份契约的**特殊价值**：它证明「薄壳没有改变 DOM」───────────────────────
 *
 * `TimePicker` 是 `DatePicker` 的薄壳（`docs/analysis/time-picker.md` §0）⇒
 * 它的产物应当与 `date-picker.mjs` 里 `picker='time'` 的那份**同构**。
 * 差别只有一处、而且是**有意的**：
 *
 * | 处 | DatePicker | TimePicker |
 * |---|---|---|
 * | 后缀图标的 `aria-label` | `calendar` | **`clock-circle`** |
 *
 * ⇒ 所以本文件**不做**「与 date-picker 基线互比」的断言（那会把「两者本就该相同」
 * 写死成契约，日后任一侧合理改动都会红）；而是各自钉各自与 **antd** 的契约。
 * 「后缀图标按 `picker` 模式选」这条判据已经在 `a11y.test.ts` 里钉住了。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { config } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

// ⚠️ 禁 VTU teleport-stub（浮层若被渲染在原地，根节点数会与 SSR 基线不符）
config.global.stubs = { ...config.global.stubs, teleport: false };

import baseline from '../../../../../tests/compat/baselines/time-picker.dom.json';
import { TimePicker, TimeRangePicker } from '../index';

const T = (s: string) => dayjs(s, 'HH:mm:ss');

/** ⚠️ 与 baseline 的 `ConfigProvider prefixCls: 'apollo'` 对应 ⇒ 类名 `apollo-picker`。 */
const BP = {};

const CASES: Record<string, () => DomRenderResult> = {
  'time-picker:basic': () => h(TimePicker, BP),
  'time-picker:value': () => h(TimePicker, { ...BP, defaultValue: T('12:30:45') }),
  'time-picker:size-small': () => h(TimePicker, { ...BP, size: 'small' }),
  'time-picker:size-large': () => h(TimePicker, { ...BP, size: 'large' }),
  'time-picker:variant-filled': () => h(TimePicker, { ...BP, variant: 'filled' }),
  'time-picker:variant-borderless': () => h(TimePicker, { ...BP, variant: 'borderless' }),
  'time-picker:variant-underlined': () => h(TimePicker, { ...BP, variant: 'underlined' }),
  'time-picker:status-error': () => h(TimePicker, { ...BP, status: 'error' }),
  'time-picker:status-warning': () => h(TimePicker, { ...BP, status: 'warning' }),
  'time-picker:disabled': () => h(TimePicker, { ...BP, disabled: true }),
  'time-picker:allow-clear-false': () =>
    h(TimePicker, { ...BP, allowClear: false, defaultValue: T('12:30:45') }),
  'time-picker:prefix': () => h(TimePicker, { ...BP, prefix: 'P' }),
  'time-picker:no-suffix': () => h(TimePicker, { ...BP, suffixIcon: null }),
  'time-picker:placeholder': () => h(TimePicker, { ...BP, placeholder: '自定义' }),
  'time-picker:format': () =>
    h(TimePicker, { ...BP, format: 'HH:mm', defaultValue: T('12:30:45') }),
  'time-picker:clear': () => h(TimePicker, { ...BP, defaultValue: T('00:00:00') }),

  // ---------------------------------------------------------------- 范围
  'time-picker:range-basic': () => h(TimeRangePicker, BP),
  'time-picker:range-value': () =>
    h(TimeRangePicker, { ...BP, defaultValue: [T('09:00:00'), T('18:30:00')] }),
  /** 自定义分隔符 ⇒ 去掉 `aria-hidden`（默认图标那个 span 是带 `aria-hidden` 的）。 */
  'time-picker:range-separator': () => h(TimeRangePicker, { ...BP, separator: '→' }),
  /** 两端都禁用 ⇒ 根上**有** `-disabled`。 */
  'time-picker:range-disabled': () => h(TimeRangePicker, { ...BP, disabled: true }),
  /** 🚨 只禁用**一端** ⇒ 根上**不该**有 `-disabled`（判据是 `every`）。 */
  'time-picker:range-disabled-one': () =>
    h(TimeRangePicker, {
      ...BP,
      disabled: [true, false],
      defaultValue: [T('09:00:00'), T('18:30:00')],
    }),
};

domContractTest('TimePicker', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[TimePicker semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。` +
          `基线用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});

describe('TimePicker · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
