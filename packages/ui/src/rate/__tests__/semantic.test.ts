/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Rate
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/rate.dom.json`，由 `tests/compat/baseline/rate.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 Rate 产出。
 * 机械 oracle。SSR 安全形态（tooltips / characterRender 的包装在 hover 期才挂
 * popup，SSR 与静态挂载不可比 —— 由 L1 覆盖）。
 *
 * ── prefixCls 陷阱 ───────────────────────────────────────────────────────────
 *
 * 两侧传**完整前缀** `apollo-rate`（不是 `'apollo'`）：`getPrefixCls('rate',
 * 'apollo')` 会**直接返回** `'apollo'`（丢 `-rate` 后缀，divider 的 `'apollo'`
 * 技巧在这里不成立 —— 它的类链只有 `${prefixCls}`）。基线脚本同款注释。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明像素一致（L6）
 *   - 没证明键盘 / hover 行为（L1 的 fake 事件钉住）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/rate.dom.json';
import type { ConfigContextValue } from '../../config-provider/context';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Rate } from '../index';

/** 两侧共用的完整前缀。与 `tests/compat/baseline/rate.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo-rate';

function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ARateCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 ----
  plain: () => h(Rate, { prefixCls: PREFIX }),
  'value:3': () => h(Rate, { prefixCls: PREFIX, value: 3 }),
  'value:0': () => h(Rate, { prefixCls: PREFIX, value: 0 }),
  'prefix-cls:custom': () => h(Rate, { prefixCls: 'custom' }),
  'prefix-cls:no-props': () => h(Rate),

  // ---- 2. 半星 ----
  'half:value:2.5': () => h(Rate, { prefixCls: PREFIX, allowHalf: true, value: 2.5 }),
  'half:value:0.5': () => h(Rate, { prefixCls: PREFIX, allowHalf: true, value: 0.5 }),

  // ---- 3. 数量 ----
  'count:10+value:8': () => h(Rate, { prefixCls: PREFIX, count: 10, value: 8 }),

  // ---- 4. disabled / allowClear ----
  'disabled:value:2': () => h(Rate, { prefixCls: PREFIX, disabled: true, value: 2 }),
  'allow-clear:false': () => h(Rate, { prefixCls: PREFIX, allowClear: false, value: 3 }),

  // ---- 5. 字符（C8-R2：#character 插槽）----
  'character:text': () => h(Rate, { prefixCls: PREFIX, value: 1 }, { character: () => 'A' }),

  // ---- 6. 尺寸 ----
  'size:large': () => h(Rate, { prefixCls: PREFIX, size: 'large' }),
  'size:small': () => h(Rate, { prefixCls: PREFIX, size: 'small' }),

  // ---- 7. RTL（antd 是真 ConfigProvider；Vue 侧 provide 同一份上下文）----
  rtl: () =>
    withConfig({ direction: 'rtl' }, () => h(Rate, { prefixCls: PREFIX, value: 3 })) as never,
};

const ALLOW = {
  'prefix-cls:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A）。' +
      '这条用例两边都不传 prefixCls，把「默认值不同」钉成断言。' +
      '⚠️ 与 divider 不同：rate 的类链是 `${prefixCls}-star / -first / -second`，' +
      '所以差异落在**每一个**由前缀派生的节点上（26 条）—— 少一条都可能掩盖「子结构没跟前缀走」的 bug。',
    deviationId: 'D6',
    diff: [
      '$/ul[0]: 类名不同 [ant-rate] vs [apollo-rate]',
      '$/ul[0]/li[0]: 类名不同 [ant-rate-star ant-rate-star-zero] vs [apollo-rate-star apollo-rate-star-zero]',
      '$/ul[0]/li[0]/div[0]/div[0]: 类名不同 [ant-rate-star-first] vs [apollo-rate-star-first]',
      '$/ul[0]/li[0]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[0]/div[0]/div[1]: 类名不同 [ant-rate-star-second] vs [apollo-rate-star-second]',
      '$/ul[0]/li[0]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[1]: 类名不同 [ant-rate-star ant-rate-star-zero] vs [apollo-rate-star apollo-rate-star-zero]',
      '$/ul[0]/li[1]/div[0]/div[0]: 类名不同 [ant-rate-star-first] vs [apollo-rate-star-first]',
      '$/ul[0]/li[1]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[1]/div[0]/div[1]: 类名不同 [ant-rate-star-second] vs [apollo-rate-star-second]',
      '$/ul[0]/li[1]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[2]: 类名不同 [ant-rate-star ant-rate-star-zero] vs [apollo-rate-star apollo-rate-star-zero]',
      '$/ul[0]/li[2]/div[0]/div[0]: 类名不同 [ant-rate-star-first] vs [apollo-rate-star-first]',
      '$/ul[0]/li[2]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[2]/div[0]/div[1]: 类名不同 [ant-rate-star-second] vs [apollo-rate-star-second]',
      '$/ul[0]/li[2]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[3]: 类名不同 [ant-rate-star ant-rate-star-zero] vs [apollo-rate-star apollo-rate-star-zero]',
      '$/ul[0]/li[3]/div[0]/div[0]: 类名不同 [ant-rate-star-first] vs [apollo-rate-star-first]',
      '$/ul[0]/li[3]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[3]/div[0]/div[1]: 类名不同 [ant-rate-star-second] vs [apollo-rate-star-second]',
      '$/ul[0]/li[3]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[4]: 类名不同 [ant-rate-star ant-rate-star-zero] vs [apollo-rate-star apollo-rate-star-zero]',
      '$/ul[0]/li[4]/div[0]/div[0]: 类名不同 [ant-rate-star-first] vs [apollo-rate-star-first]',
      '$/ul[0]/li[4]/div[0]/div[0]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
      '$/ul[0]/li[4]/div[0]/div[1]: 类名不同 [ant-rate-star-second] vs [apollo-rate-star-second]',
      '$/ul[0]/li[4]/div[0]/div[1]/span[0]: 类名不同 [anticon anticon-star] vs [apollo-icon apollo-icon-star]',
    ],
  },
};

domContractTest('Rate', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Rate semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: false,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Rate · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
