/** Historical reference scenarios remain complete. Native Vue contracts own current behavior. */
import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, type PropType, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/spin.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Spin } from '../index';
import type { SpinIndicatorSlotProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/spin.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/**
 * 自定义指示器：**会把自己收到的 `percent` 渲染出来**。
 *
 * ⚠️ 两侧必须逐字同形（含 `String(percent)` —— `undefined` 会渲染成 `"undefined"`）。
 *    它是「`percent` 这个 prop 真的被 `cloneElement` / `cloneVNode` 注入了」的探针，
 *    也是唯一能观察「注入到了**组件**而不是 DOM 元素」的用例（组件会忽略 className，
 *    所以这条**看不出**克隆是否发生 —— 那由 `indicator:custom-element` 覆盖）。
 */
const MyIndicator = defineComponent({
  name: 'ACompatMyIndicator',
  props: {
    percent: { type: Number as PropType<number | undefined>, default: undefined },
  },
  setup(props) {
    return () => h('div', { class: 'custom-indicator' }, String(props.percent));
  },
});

/** 嵌套模式的 children。与 React 侧 `content` 的样式逐字相同。 */
const content = () => h('div', { style: { padding: '50px', background: 'rgba(0, 0, 0, 0.05)' } });

/**
 * 在指定的 ConfigProvider 上下文下渲染。
 *
 * antd 侧用的是真的 `<ConfigProvider>`；Vue 侧对应物是 `provide(configContextKey, ...)`。
 * 两者指向同一份配置，所以是同一件事的两种写法，不是「为测试特制的一条路径」。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ASpinCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 无 children 时不传第三个参数（`slots.default` 才是 `undefined`）。 */
type Props = Record<string, unknown>;
const noChildren = (props: Props): VNode => h(Spin, props);
const nested = (props: Props): VNode => h(Spin, props, { default: content });

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 ----
  plain: () => noChildren({ prefixCls: PREFIX }),
  'prefix-cls:custom': () => noChildren({ prefixCls: 'custom' }),
  // 两侧都不传 prefixCls → antd 用 `ant-spin`、我们用 `apollo-spin`（有意差异 D6）
  'prefix-cls:no-props': () => h(Spin),

  // ---- 2. spinning ----
  'spinning:false': () => noChildren({ prefixCls: PREFIX, spinning: false }),
  'spinning:true': () => noChildren({ prefixCls: PREFIX, spinning: true }),
  'spinning:true+delay': () => noChildren({ prefixCls: PREFIX, spinning: true, delay: 500 }),

  // ---- 3. size ----
  'size:small': () => noChildren({ prefixCls: PREFIX, size: 'small' }),
  'size:medium': () => noChildren({ prefixCls: PREFIX, size: 'medium' }),
  'size:middle': () => noChildren({ prefixCls: PREFIX, size: 'middle' }),
  'size:large': () => noChildren({ prefixCls: PREFIX, size: 'large' }),

  // ---- 4. 文案 ----
  description: () => noChildren({ prefixCls: PREFIX, description: 'Loading' }),
  'description:tip': () => noChildren({ prefixCls: PREFIX, tip: 'Loading' }),
  'description:both': () =>
    noChildren({ prefixCls: PREFIX, tip: 'from-tip', description: 'from-description' }),

  // ---- 5. 嵌套 ----
  nested: () => nested({ prefixCls: PREFIX }),
  'nested:spinning-false': () => nested({ prefixCls: PREFIX, spinning: false }),
  'nested:description': () => nested({ prefixCls: PREFIX, description: 'Loading' }),
  'nested:wrapper-class-name': () => nested({ prefixCls: PREFIX, wrapperClassName: 'my-wrapper' }),

  // ---- 6. fullscreen ----
  fullscreen: () => noChildren({ prefixCls: PREFIX, fullscreen: true }),
  'fullscreen:spinning-false': () =>
    noChildren({ prefixCls: PREFIX, fullscreen: true, spinning: false }),
  'fullscreen:children': () => nested({ prefixCls: PREFIX, fullscreen: true }),
  'fullscreen:description': () =>
    noChildren({ prefixCls: PREFIX, fullscreen: true, description: 'Loading' }),

  // ---- 7. percent ----
  'percent:30': () => noChildren({ prefixCls: PREFIX, percent: 30 }),
  'percent:auto': () => noChildren({ prefixCls: PREFIX, percent: 'auto' }),
  'percent:negative': () => noChildren({ prefixCls: PREFIX, percent: -50 }),
  'percent:over': () => noChildren({ prefixCls: PREFIX, percent: 150 }),

  // ---- 8. indicator ----
  // C8-R2：indicator 走 `#indicator` 插槽（DOM 与旧 prop 形态逐字节一致）
  'indicator:custom': () => h(Spin, { prefixCls: PREFIX }, { indicator: () => h(MyIndicator) }),
  'indicator:custom-element': () =>
    h(Spin, { prefixCls: PREFIX }, { indicator: () => h('div', { class: 'custom-indicator' }) }),
  'indicator:custom-element+semantic': () =>
    h(
      Spin,
      {
        prefixCls: PREFIX,
        classNames: { indicator: 'cn-indicator' },
        styles: { indicator: { color: 'red' } },
      },
      { indicator: () => h('div', { class: 'custom-indicator' }) },
    ),
  'indicator:custom+percent': () =>
    h(
      Spin,
      { prefixCls: PREFIX, percent: 23 },
      { indicator: ({ percent }: SpinIndicatorSlotProps) => h(MyIndicator, { percent }) },
    ),
  'indicator:custom+nested': () =>
    h(Spin, { prefixCls: PREFIX }, { default: content, indicator: () => h(MyIndicator) }),
  'indicator:null': () => h(Spin, { prefixCls: PREFIX }, { indicator: () => null }),

  // ---- 9. 语义化 ----
  'semantic:classNames-all': () =>
    nested({
      prefixCls: PREFIX,
      classNames: {
        root: 'cn-root',
        section: 'cn-section',
        indicator: 'cn-indicator',
        description: 'cn-description',
        container: 'cn-container',
      },
      description: 'Loading',
    }),
  'semantic:classNames-mask': () =>
    noChildren({ prefixCls: PREFIX, fullscreen: true, classNames: { mask: 'cn-mask' } }),
  'semantic:classNames-tip': () =>
    noChildren({ prefixCls: PREFIX, classNames: { tip: 'cn-tip' }, description: 'Loading' }),
  'semantic:styles-all': () =>
    nested({
      prefixCls: PREFIX,
      styles: {
        root: { color: 'red' },
        section: { margin: '4px' },
        indicator: { opacity: '0.5' },
        description: { padding: '2px' },
        container: { border: '1px solid blue' },
      },
      description: 'Loading',
    }),
  'semantic:styles-mask': () =>
    noChildren({ prefixCls: PREFIX, fullscreen: true, styles: { mask: { background: 'green' } } }),
  // ★ 函数式：`info.props` 必须是**合并后**的 props（`spinning` 是内部态、`size` 是合并尺寸）
  'semantic:classNames-fn': () =>
    noChildren({
      prefixCls: PREFIX,
      size: 'small',
      classNames: (info: { props: { size?: string; spinning?: boolean } }) => ({
        root: `fn-${String(info.props.size)}-${String(info.props.spinning)}`,
      }),
    }),

  // ---- 10. style / className / 属性透传 ----
  'class:className': () => noChildren({ prefixCls: PREFIX, class: 'my-class' }),
  'class:rootClassName': () => noChildren({ prefixCls: PREFIX, class: 'root-class' }),
  'class:both': () => noChildren({ prefixCls: PREFIX, class: ['a', 'b'] }),
  'attrs:passthrough': () => noChildren({ prefixCls: PREFIX, 'data-testid': 'x', id: 'my-spin' }),
  'style:style-over-root': () =>
    noChildren({
      prefixCls: PREFIX,
      style: { color: 'green' },
      styles: { root: { color: 'red' } },
    }),
  'style:section-on-root': () =>
    noChildren({ prefixCls: PREFIX, styles: { section: { margin: '4px' } } }),

  // ---- 11. ConfigProvider ----
  'config:indicator': () =>
    withConfig({ components: { spin: { indicator: h(MyIndicator) } } }, () =>
      noChildren({ prefixCls: PREFIX }),
    ),
  'config:className': () =>
    withConfig({ components: { spin: { className: 'cfg-class' } } }, () =>
      noChildren({ prefixCls: PREFIX }),
    ),
  'config:classNames': () =>
    withConfig({ components: { spin: { classNames: { root: 'cfg-root' } } } }, () =>
      noChildren({ prefixCls: PREFIX }),
    ),
  'direction:rtl': () => withConfig({ direction: 'rtl' }, () => noChildren({ prefixCls: PREFIX })),
};

import nativeDiffs from './native-contract-reference-diffs.json';

function differenceReason(id: string): string {
  if (id.startsWith('percent:'))
    return 'Determinate progress is rendered immediately, including zero, with a name; stable section/indicator hosts own its styles. See docs/migrations/spin-contracts.md.';
  if (id.startsWith('indicator:') || id === 'config:indicator')
    return 'Complete native content replaces implicit child cloning; empty slots suppress defaults and percent is explicitly scoped. Stable semantic containers retain child attributes. See docs/migrations/spin-contracts.md.';
  if (id.startsWith('semantic:'))
    return 'Root, section, complete indicator and actual fullscreen mask have separate stable semantic ownership. See docs/migrations/spin-contracts.md.';
  return 'Stable content host and loading section preserve native nodes across modes, with decorative default artwork hidden from AT; the default-prefix case retains Apollo naming. See docs/migrations/spin-contracts.md.';
}
domContractTest('Spin', {
  baseline,
  render: (id) => {
    const build = CASES[id];
    if (!build) throw new Error(`Missing Spin reference case ${id}`);
    return build();
  },
  keepStyle: true,
  allow: Object.fromEntries(
    Object.entries(nativeDiffs).map(([id, diff]) => [id, { reason: differenceReason(id), diff }]),
  ),
});
describe('Spin reference coverage', () => {
  it('preserves every original reference scenario without adding or dropping ids', () => {
    expect(Object.keys(CASES).sort()).toEqual(baseline.cases.map((row) => row.id).sort());
  });
});
