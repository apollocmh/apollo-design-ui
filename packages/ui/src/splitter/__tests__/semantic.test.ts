/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Splitter
 *
 * 基准：`tests/compat/baselines/splitter.dom.json`（机械 oracle，9 个用例，
 * 产出者 `tests/compat/baseline/splitter.mjs`）。`keepStyle: true`。
 *
 * ⚠️ 只覆盖 SSR 路径（容器未测量 ⇒ panelSizes 落开发者原值、pxSizes 全 0 ⇒
 *    dragger disabled / 无折叠按钮）。拖拽/折叠行为由 L1 覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/splitter.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Splitter } from '../index';

/** 在指定 ConfigProvider 上下文下渲染（empty semantic 同范式）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ASplitterCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const PANELS_BASIC = () => [
  h(Splitter.Panel, null, () => 'Left'),
  h(Splitter.Panel, null, () => 'Right'),
];

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
export const specs: Record<string, { render: () => DomRenderResult }> = {
  'splitter:basic': {
    render: () => h(Splitter, { style: { height: '200px' } }, () => PANELS_BASIC()),
  },
  'splitter:vertical': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, orientation: 'vertical' }, () => PANELS_BASIC()),
  },
  'splitter:layout-deprecated': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, layout: 'vertical' }, () => PANELS_BASIC()),
  },
  'splitter:collapsible': {
    render: () =>
      h(Splitter, { style: { height: '200px' } }, () => [
        h(Splitter.Panel, { collapsible: true, min: '20%', defaultSize: '40%' }, () => 'Left'),
        h(Splitter.Panel, { collapsible: true }, () => 'Right'),
      ]),
  },
  'splitter:collapsible-icon-custom': {
    render: () =>
      h(
        Splitter,
        { style: { height: '200px' }, collapsible: { icon: { start: 'S', end: 'E' } } },
        () => [
          h(Splitter.Panel, { collapsible: true }, () => 'Left'),
          h(Splitter.Panel, { collapsible: true }, () => 'Right'),
        ],
      ),
  },
  'splitter:multiple': {
    render: () =>
      h(Splitter, { style: { height: '200px' } }, () => [
        h(Splitter.Panel, { collapsible: true, defaultSize: '20%', min: '10%' }, () => 'Left'),
        h(Splitter.Panel, { defaultSize: '40%' }, () => 'Center'),
        h(Splitter.Panel, { max: '60%', collapsible: true }, () => 'Right'),
      ]),
  },
  'splitter:size-px': {
    render: () =>
      h(Splitter, { style: { height: '200px' }, onResize: () => {} }, () => [
        h(Splitter.Panel, { size: 100 }, () => 'Left'),
        h(Splitter.Panel, null, () => 'Right'),
      ]),
  },
  'splitter:rtl': {
    render: () =>
      withConfig({ direction: 'rtl' }, () =>
        h(Splitter, { style: { height: '200px' } }, () => [
          h(Splitter.Panel, null, () => 'Left'),
          h(Splitter.Panel, { collapsible: true }, () => 'Right'),
        ]),
      ),
  },
  'splitter:semantic': {
    render: () =>
      h(
        Splitter,
        {
          style: { height: '200px' },
          classNames: { root: 'cls-root', panel: 'cls-panel', dragger: 'cls-dragger' },
          styles: { panel: { padding: '4px' }, dragger: { default: { color: 'red' } } },
        },
        () => PANELS_BASIC(),
      ),
  },
};

/**
 * 与 antd SSR 产物的**已知差异**（登记：COMPATIBILITY.md §9 `D131`）。
 *
 * 全部集中在 `aria-valuemin` / `aria-valuemax`：上游在容器未测量时算出 `NaN`
 * （归一成 `0`，导致 `valuemin=0 / valuemax=0` 而 `valuenow` 却是 50），本仓收口为
 * 「有限且 `min ≤ now ≤ max`」—— 见 Issue #51 与 `hooks/ariaBounds.ts` 的说明。
 *
 * ⚠️ `toEqual` 要求 diff **恰好**命中，多一条/少一条都会红；所以这里是逐条而不是通配。
 */
const ARIA_MAX_FULL_RANGE = '$/div[0]/div[1]/div[0]: 属性 aria-valuemax 不同 "0" vs "100"';

const allow: Record<string, { reason: string; deviationId: string; diff: string[] }> = {
  'splitter:basic': {
    reason:
      'Issue #51：容器未测量时上游 aria-valuemax 是 NaN ⇒ 归一成 0（与 valuenow=50 自相矛盾）；本仓退化为全区间 0–100。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:vertical': {
    reason: 'Issue #51：同 `splitter:basic` —— 未测量容器的 aria-valuemax 收口为 100。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:layout-deprecated': {
    reason: 'Issue #51：同 `splitter:basic` —— 未测量容器的 aria-valuemax 收口为 100。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:collapsible': {
    reason:
      'Issue #51：左侧面板 `min: "20%"` 是百分比 ⇒ 上下界本就可解析；上游因 ptgMax=NaN 把两端都压成 0，本仓给出 [20, 100]。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE, '$/div[0]/div[1]/div[0]: 属性 aria-valuemin 不同 "0" vs "20"'],
  },
  'splitter:collapsible-icon-custom': {
    reason: 'Issue #51：同 `splitter:basic` —— 未测量容器的 aria-valuemax 收口为 100。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:multiple': {
    reason:
      'Issue #51：三面板用例暴露真实约束 —— bar0 受左侧 `min:"10%"` 与中 panel 上界影响应为 [10, 60]，bar1 受右侧 `max:"60%"` 影响应为 [40, 100]；上游两组都因 NaN 退化成 [0, 0]。',
    deviationId: 'D131',
    diff: [
      '$/div[0]/div[1]/div[0]: 属性 aria-valuemax 不同 "0" vs "60"',
      '$/div[0]/div[1]/div[0]: 属性 aria-valuemin 不同 "0" vs "10"',
      '$/div[0]/div[3]/div[0]: 属性 aria-valuemax 不同 "0" vs "100"',
      '$/div[0]/div[3]/div[0]: 属性 aria-valuemin 不同 "0" vs "40"',
    ],
  },
  'splitter:size-px': {
    reason: 'Issue #51：px 尺寸在未测量容器下同样让上游 ptgMax 变 NaN；本仓收口为有限区间。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:rtl': {
    reason: 'Issue #51：RTL 只影响视觉/键盘轴向，ARIA 数值与 LTR 一致 —— 收口同 `splitter:basic`。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
  'splitter:semantic': {
    reason: 'Issue #51：同 `splitter:basic` —— 未测量容器的 aria-valuemax 收口为 100。',
    deviationId: 'D131',
    diff: [ARIA_MAX_FULL_RANGE],
  },
};

domContractTest('Splitter', {
  baseline,
  keepStyle: true,
  allow,
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Splitter L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
