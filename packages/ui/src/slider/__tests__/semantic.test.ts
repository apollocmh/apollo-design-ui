/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Slider
 *
 * 基准：`tests/compat/baselines/slider.dom.json`（机械 oracle，17 用例）。
 * `keepStyle: false`。
 *
 * ⚠️ 基线只钉**参数驱动的静态形态**（模式 / 装饰 / 方向 / 禁用 / a11y）——
 *    拖拽与键盘改值后的 DOM 是运行时状态，`renderToStaticMarkup` 取不到；
 *    那部分由 `index.test.ts`（L2）与 `a11y.test.ts`（L5）钉。
 *
 * ⚠️ `tooltip.open` 的浮层走 portal（SSR 不可达），不进本基线 —— 与 select/cascader 同判。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import baseline from '../../../../../tests/compat/baselines/slider.dom.json';
import Slider from '../Slider.vue';

/** 与基线脚本同构的构造表（不传 prefixCls ⇒ 兜底 `apollo-slider`）。 */
const CASES: Record<string, () => DomRenderResult> = {
  'slider:basic': () => h(Slider, { defaultValue: 30 }),
  'slider:min-max': () => h(Slider, { min: 10, max: 200, defaultValue: 100 }),
  'slider:step-null': () => h(Slider, { step: null, defaultValue: 30, marks: { 0: 'a', 50: 'b' } }),
  'slider:range': () => h(Slider, { range: true, defaultValue: [20, 60] }),
  'slider:range-editable': () =>
    h(Slider, { range: { editable: true }, defaultValue: [10, 50, 90] }),
  'slider:count': () => h(Slider, { range: true, count: 3, defaultValue: [10, 30] }),
  'slider:marks': () =>
    h(Slider, {
      defaultValue: 30,
      marks: {
        0: '0°C',
        26: '26°C',
        100: { style: { color: 'rgb(245, 34, 45)' }, label: '100°C' },
      },
    }),
  'slider:dots': () => h(Slider, { defaultValue: 30, step: 10, dots: true }),
  'slider:start-point': () => h(Slider, { defaultValue: 60, startPoint: 20 }),
  'slider:included-false': () => h(Slider, { included: false, defaultValue: 70 }),
  'slider:track-false': () => h(Slider, { track: false, defaultValue: 70 }),
  'slider:vertical': () => h(Slider, { vertical: true, defaultValue: 40 }),
  'slider:reverse': () => h(Slider, { reverse: true, defaultValue: 40 }),
  'slider:disabled': () => h(Slider, { disabled: true, defaultValue: 30 }),
  'slider:disabled-array': () =>
    h(Slider, { range: true, defaultValue: [20, 60], disabled: [true, false] }),
  'slider:aria': () =>
    h(Slider, {
      defaultValue: 30,
      ariaLabelForHandle: '音量',
      ariaRequired: true,
      ariaValueTextFormatterForHandle: (v: number) => `${v} 分`,
    }),
  'slider:aria-array': () =>
    h(Slider, {
      range: true,
      defaultValue: [20, 60],
      ariaLabelForHandle: ['起', '止'],
      tabIndex: [0, -1],
    }),
};

domContractTest('Slider', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Slider semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。基线用例：` +
          baseline.cases.map((c) => c.id).join(', '),
      );
    }
    return build();
  },
});

describe('Slider · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    expect(Object.keys(CASES).sort()).toEqual(baseline.cases.map((c) => c.id).sort());
  });
});
