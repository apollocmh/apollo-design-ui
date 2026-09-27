/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/spin.dom.json`，由 `tests/compat/baseline/spin.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Spin`** 产出。
 * 是机械 oracle，不是「我们读了源码之后写下的期望值」—— 后者的差分通过只能说明
 * 两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、类名按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 的
 * `css-dev-only-do-not-override-*` / `css-var-root` 类名（D5）。
 *
 * 这里用 **`keepStyle: true`**。理由：`style` 与 `styles.root` / `styles.section` /
 * `styles.mask` 的合并顺序是本组件最容易写错的地方（`isNested` 会让 `styles.section`
 * 在「合并进根」与「落到内层 div」之间切换），只投影 class + aria-* 会让它完全测不到。
 * 这是对 T10 的**加强**，不是放宽。
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 两侧传**同一个** `prefixCls`（`apollo`），所以类名可以逐字比对。
 * 这比「渲染成 ant- 再替换成 apollo-」更强 —— 后者会把「我们根本没读 prefixCls」
 * 这个 bug 一起归一化掉。默认前缀单独由 `prefix-cls:no-props` 用例覆盖（见 `allow`）。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明 `delay` 推进后的 DOM（基线是 SSR 首帧，effect 不跑）—— 那由
 *     `__tests__/index.test.ts` 的 L2 用 fake timers 覆盖
 *   - 没证明 `size` 会读 ConfigProvider 的 `componentSize`：该叶子模块尚未落地，
 *     这条缺口登记在 README.md §7
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, type PropType, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/spin.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Spin } from '../index';

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
    h(Spin, { prefixCls: PREFIX, percent: 23 }, { indicator: () => h(MyIndicator) }),
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
  'class:className': () => noChildren({ prefixCls: PREFIX, className: 'my-class' }),
  'class:rootClassName': () => noChildren({ prefixCls: PREFIX, rootClassName: 'root-class' }),
  'class:both': () => noChildren({ prefixCls: PREFIX, className: 'a', rootClassName: 'b' }),
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

/**
 * 自定义指示器是**组件**（而不是原生元素）时的一条平台差异。
 *
 * antd 用 `cloneElement(indicator, () => ({ className, style, percent }))`：
 * `className` 只是**一个普通 prop**，用户组件不消费它就什么都不发生
 * （本夹具的 `MyIndicator` 刻意只消费 `percent`）。
 *
 * Vue 的 `cloneVNode(indicator, { class })` 里 `class` 是**特殊**的：它会被
 * 属性继承落到自定义组件的**根元素**上 —— 于是 `apollo-dot` 真的生效了。
 *
 * ⇒ 两侧 DOM 不同，但**我们的结果更接近 antd 的意图**（`${prefixCls}-dot`
 *   本来就是为了让自定义指示器拿到 dot 的样式）。分类为 **PLATFORM**，
 *   登记在 `COMPATIBILITY.md` §9 与 `README.md` §7。
 *
 * ⚠️ 传**原生元素**时的行为两侧一致（`-dot` 都追加到 class 上），
 *    由 `indicator:custom-element` / `indicator:custom-element+semantic` 两个
 *    用例钉住 —— 它们**没有**豁免，所以这条豁免不会掩盖「克隆根本没发生」。
 */
const CUSTOM_INDICATOR_REASON = {
  reason:
    '自定义指示器是**组件**时，React 的 `className` 只是 prop（组件不用就不生效），' +
    '而 Vue 的 `class` 会经属性继承落到该组件的根元素上（于是 `prefixCls + "-dot"` 真的生效）。' +
    '这是 Vue / React 对 `class` 的固有语义差异（PLATFORM），不是我们实现错了；' +
    '且我们的结果更接近 antd 加这个 class 的意图。传原生元素时两侧一致，由同族的两个未豁免用例覆盖。',
  deviationId: 'D22',
} as const;

/**
 * 允许的差异，**逐条列出**且断言「恰好等于这些」。
 *
 * 这是 `domContractTest` 的 `allow` 契约：`expect(actualDiff).toEqual(allowed)`。
 * 所以「这是唯一差异」本身是可证伪的 —— 任何**额外**漂移都会让用例红。
 */
const ALLOW = {
  'prefix-cls:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A：默认 apollo，允许 ConfigProvider 覆盖为 ant）。' +
      '这条用例刻意两边都不传 prefixCls，用来把「默认值不同」这件事**钉成断言**，而不是靠所有用例都显式传前缀来回避它。' +
      '差异落在**根元素与全部后代**（根 / spinning / section / dot-holder / dot / dot-item 都由同一前缀派生），' +
      '因此也顺带证明了「子结构类名跟着前缀走」。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-spin ant-spin-section ant-spin-spinning] vs [apollo-spin apollo-spin-section apollo-spin-spinning]',
      '$/div[0]/span[0]: 类名不同 [ant-spin-dot-holder] vs [apollo-spin-dot-holder]',
      '$/div[0]/span[0]/span[0]: 类名不同 [ant-spin-dot ant-spin-dot-spin] vs [apollo-spin-dot apollo-spin-dot-spin]',
      '$/div[0]/span[0]/span[0]/i[0]: 类名不同 [ant-spin-dot-item] vs [apollo-spin-dot-item]',
      '$/div[0]/span[0]/span[0]/i[1]: 类名不同 [ant-spin-dot-item] vs [apollo-spin-dot-item]',
      '$/div[0]/span[0]/span[0]/i[2]: 类名不同 [ant-spin-dot-item] vs [apollo-spin-dot-item]',
      '$/div[0]/span[0]/span[0]/i[3]: 类名不同 [ant-spin-dot-item] vs [apollo-spin-dot-item]',
    ],
  },

  // -------------------------------------------------------------------------
  // 自定义指示器是**组件**时，两侧对「注入的 class」的处理不同（PLATFORM）
  // -------------------------------------------------------------------------
  'indicator:custom': {
    ...CUSTOM_INDICATOR_REASON,
    diff: ['$/div[0]/div[0]: 类名不同 [custom-indicator] vs [apollo-dot custom-indicator]'],
  },
  'indicator:custom+percent': {
    ...CUSTOM_INDICATOR_REASON,
    diff: ['$/div[0]/div[0]: 类名不同 [custom-indicator] vs [apollo-dot custom-indicator]'],
  },
  'indicator:custom+nested': {
    ...CUSTOM_INDICATOR_REASON,
    diff: ['$/div[0]/div[0]/div[0]: 类名不同 [custom-indicator] vs [apollo-dot custom-indicator]'],
  },
  'config:indicator': {
    ...CUSTOM_INDICATOR_REASON,
    diff: ['$/div[0]/div[0]: 类名不同 [custom-indicator] vs [apollo-dot custom-indicator]'],
  },
} as const;

domContractTest('Spin', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Spin semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Spin · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
