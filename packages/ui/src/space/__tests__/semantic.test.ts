/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/space.dom.json`，由 `tests/compat/baseline/space.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的
 * `Space` / `Space.Compact` / `Space.Addon`** 产出（126 个用例）。
 * 是机械 oracle，不是「我们读了源码之后写下的期望值」—— 后者的差分通过只能说明
 * 两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、类名按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 的
 * `css-dev-only-do-not-override-*` / `css-var-*` 类名（D5）。
 *
 * 这里用 **`keepStyle: true`**。理由：`size` 的四条取值路径（预设串 → 类名、
 * 非零数字 → 内联 gap、元组 → 两向分别取、`0` → 取用但不产生 gap）里，
 * **只有内联那条**在 DOM 上留下痕迹，而且 `style` 覆盖 `styles.root` /
 * `styles.root` 覆盖 `gapStyle` 的优先级也全靠它。只投影 class 会让这几条完全测不到。
 * 这是对 T10 的**加强**，不是放宽。
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 三组用例各自传**同一个** `prefixCls`（`apollo-space` / `apollo-space-compact` /
 * `apollo-space-addon`），所以类名可以逐字比对。这比「渲染成 ant- 再替换成
 * apollo-」更强 —— 后者会把「我们根本没读 prefixCls」这个 bug 一起归一化掉。
 * 默认前缀由 `prefix-cls:no-props` 等三条用例覆盖（见 `ALLOW`）。
 *
 * ── 探针：为什么必须有一个「假的下游组件」──────────────────────────────────────
 *
 * `Space.Compact` 自己**不产生任何紧凑类名** —— 它只把
 * `compactSize` / `compactDirection` / `isFirstItem` / `isLastItem` 广播出去，
 * 真正拼 `-compact-item` / `-compact-first-item` 的是**下游组件自己**
 * （Button / Input / Select… 共 10 个）。
 *
 * 那些下游组件在本次交付里都还不存在。所以两侧各有一个 `Probe`：它**只用公开 API**
 * （`useCompactItemContext` —— 就是那 10 个下游组件用的同一个函数）把上下文渲染成
 * 可比的类名。两侧的探针**逐字对应**（同一套类名模板、同一个前缀 `probe`），
 * 所以它比对的是**协议本身**，而不是「两边的探针恰好写得一样」。
 * 没有它，`compact:nested-*` / `compact:no-compact-style` / `compact:size-*`
 * 这些用例会退化成「两个空 div 相等」。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明告警文案一致（那由 L1 的 `index.test.ts` 钉住）
 *   - 没证明 `Space.Compact` 能**驱动真实的** Button / Input —— 那要等它们落地，
 *     缺口登记在 `README.md` §7
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/space.dom.json';
import { ConfigProvider } from '../../config-provider';
import { NoCompactStyle, Space, SpaceAddon, SpaceCompact, useCompactItemContext } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/space.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/**
 * 在指定的 ConfigProvider 配置下渲染。
 *
 * 两侧都用**真的 `ConfigProvider`**（不是手写 `provide`）—— 这样顺带把
 * 「ConfigProvider 的合并逻辑能不能到达 Space」也钉住了：`prefixCls` 的派生、
 * `direction` 的透传、`componentSize` 走独立 context、以及 `components` 的合并。
 *
 * ⚠️ **唯一**的写法差异在「组件配置怎么传」（差异 D25）：
 *
 *   | 侧 | 写法 |
 *   |---|---|
 *   | React | `<ConfigProvider space={{ size: 'large' }}>` |
 *   | Vue | `<ConfigProvider :components="{ space: { size: 'large' } }">` |
 *
 * 两者落进的是**同一个** context 槽位（`context.space` vs
 * `context.components.space`，由 `useComponentConfig('space')` 读），
 * 所以这是「同一个契约的两种调用写法」，不是为测试特制的一条路径。
 * D25 的完整理由见 `docs/analysis/config-provider.md` §6.1。
 */
function withConfig(props: Record<string, unknown>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ASpaceCompatConfigProbe',
    setup() {
      return () => h(ConfigProvider, { prefixCls: PREFIX, ...props }, { default: children });
    },
  });
}

/**
 * 模拟一个下游紧凑组件（Button / Input / Select 的那一层）。
 *
 * ⚠️ 必须与 `tests/compat/baseline/space.mjs` 里的 `Probe` **逐字对应** ——
 *    同一套类名模板（`probe` / `probe-size-{size}` / `probe-dir-{dir}` /
 *    `{prefix}-compact-{item|first-item|last-item}[-rtl]`），同一个前缀 `probe`。
 *    两侧任何一处不等价，比对就不再是「协议一致」而是「巧合」。
 *
 * `useCompactItemContext` 在这里拿到的是 `ComputedRef`（D27）——
 * 所以 `.value` 是必须的，不是风格问题。
 */
const Probe = defineComponent({
  name: 'ASpaceCompatProbe',
  props: {
    dir: { type: String as () => 'ltr' | 'rtl', default: 'ltr' },
  },
  setup(props) {
    const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
      'probe',
      () => props.dir,
    );
    return () =>
      h('i', {
        class: [
          'probe',
          `probe-size-${String(compactSize.value)}`,
          `probe-dir-${String(compactDirection.value)}`,
          compactItemClassnames.value,
        ],
      });
  },
});

// ---------------------------------------------------------------------------
// 构造器
// ---------------------------------------------------------------------------

type Props = Record<string, unknown>;

const twoSpans = (): VNodeChild[] => [h('span', { key: 'a' }, '1'), h('span', { key: 'b' }, '2')];

/** 有 children 时显式给默认插槽；`children` 为 `undefined` 时给默认的两个 `<span>`。 */
const space = (props: Props, children?: VNodeChild[]): VNode =>
  h(
    Space,
    { prefixCls: PREFIX, ...props },
    { default: () => (children ?? twoSpans()) as VNodeChild },
  );

/** `Space.Compact` 的默认插槽固定是三个探针。 */
const probes = (): VNodeChild[] => [
  h(Probe, { key: 'p0' }),
  h(Probe, { key: 'p1' }),
  h(Probe, { key: 'p2' }),
];

const compact = (props: Props, children?: VNodeChild[]): VNode =>
  h(
    SpaceCompact,
    { prefixCls: `${PREFIX}-space-compact`, ...props },
    { default: () => (children ?? probes()) as VNodeChild },
  );

const addon = (props: Props, children: VNodeChild = 'Addon'): VNode =>
  h(SpaceAddon, { prefixCls: `${PREFIX}-space-addon`, ...props }, { default: () => children });

/** `<Space.Addon>` 的默认插槽（`Addon` 的 children 是纯文本）。 */
const addonNode = (key: string, text: string): VNode =>
  h(SpaceAddon, { key, prefixCls: `${PREFIX}-space-addon` }, { default: () => text });

// ---------------------------------------------------------------------------
// 用例表
// ---------------------------------------------------------------------------

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 *
 * ⚠️ 与 `tests/compat/baseline/space.mjs` 的 `push(...)` 顺序、参数逐条对应。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 / 空 children ----
  plain: () => space({}),
  'empty:no-children': () => h(Space, { prefixCls: PREFIX }),
  'empty:false-child': () => space({}, [false as unknown as VNodeChild]),
  'empty:null-child': () => space({}, [null]),
  'children:text': () => space({}, ['text']),
  'children:text+element': () => space({}, ['text1', h('span', { key: 's' }, 'text2')]),
  'children:adjacent-text': () => space({}, ['a', 'b']),
  // `<Null/>`（组件本身渲染 null）**是**可渲染的 ⇒ 渲染出空的 `-item`
  'children:null-component': () =>
    space({}, [h(defineComponent({ name: 'ANullProbe', setup: () => () => null }))]),
  'children:fragment': () =>
    space({}, [h('span', { key: 's' }, 'text1'), h('span', { key: 't' }, 'text3')]),

  'prefix-cls:custom': () => space({ prefixCls: 'custom' }),
  // 两侧都不传 prefixCls → antd 用 `ant-space`、我们用 `apollo-space`（有意差异 D6）
  'prefix-cls:no-props': () => h(Space, null, { default: () => twoSpans() }),

  // ---- 2. 方向：orientation > vertical > direction ----
  'orientation:unset-unset': () => space({ orientation: undefined, direction: undefined }),
  'orientation:unset-vertical': () => space({ orientation: undefined, direction: 'vertical' }),
  'orientation:vertical-horizontal': () =>
    space({ orientation: 'vertical', direction: 'horizontal' }),
  'orientation:vertical-unset': () => space({ orientation: 'vertical', direction: undefined }),
  'orientation:horizontal-vertical': () =>
    space({ orientation: 'horizontal', direction: 'vertical' }),
  'vertical:true': () => space({ vertical: true }),
  'vertical:false': () => space({ vertical: false }),
  'direction:vertical+vertical:false': () => space({ direction: 'vertical', vertical: false }),
  'orientation:vertical+vertical:false': () => space({ orientation: 'vertical', vertical: false }),
  'orientation:unset+vertical:unset': () => space({}),

  // ---- 3. align ----
  'align:start': () => space({ align: 'start' }),
  'align:end': () => space({ align: 'end' }),
  'align:center': () => space({ align: 'center' }),
  'align:baseline': () => space({ align: 'baseline' }),
  'align:unset-horizontal': () => space({}),
  'align:unset-vertical': () => space({ orientation: 'vertical' }),
  'align:unset-vertical-legacy': () => space({ vertical: true }),
  'align:center-vertical': () => space({ orientation: 'vertical', align: 'center' }),

  // ---- 4. size ----
  'size:small': () => space({ size: 'small' }),
  'size:medium': () => space({ size: 'medium' }),
  'size:middle': () => space({ size: 'middle' }),
  'size:large': () => space({ size: 'large' }),
  'size:number': () => space({ size: 10 }),
  'size:zero': () => space({ size: 0 }),
  'size:nan': () => space({ size: [Number.NaN, Number.NaN] }),
  'size:tuple-numbers': () => space({ size: [10, 20] }),
  'size:tuple-preset': () => space({ size: ['small', 'large'] }),
  'size:tuple-mixed': () => space({ size: [10, 'large'] }),
  'size:tuple-reversed': () => space({ size: ['large', 'small'] }),
  'size:negative': () => space({ size: -5 }),
  'size:numeric-string': () => space({ size: '10' }),

  // ---- 5. wrap ----
  'wrap:true': () => space({ wrap: true }),
  'wrap:false': () => space({ wrap: false }),
  'wrap:true+size-number': () => space({ wrap: true, size: 10 }),

  // ---- 6. separator / split ----
  'separator:string': () => space({ separator: '-' }, ['a', 'b', 'c']),
  'separator:empty-string': () => space({ separator: '' }, ['a', 'b']),
  // ⚠️ `separator={0}`：我们**有意不复刻**上游漏出来的裸文本节点 `0`（差异 D40 / DEFECT）。
  //
  // 上游的 `Item.tsx` 写的是 `{index < latestIndex && separator && <span>…</span>}` ——
  // React 的 JSX 会把 `0 && …` 的求值结果 `0` **当作文本渲染出来**，于是机械基线里
  // 两个 `-item` 之间多了一个裸文本节点 `0`（实测基线
  // `separator:zero` 的 html：`<div …-item>a</div>0<div …-item>b</div>`）。
  // 我们用的是真 `if`，`0` 走假值分支 ⇒ 不产生任何节点。
  //
  // ⚠️ 这条差异**进不了 L4 的断言**：`dom-contract.ts:204` 的投影只用
  // `template.content.children`（**只含元素节点**，注释与文本都不进契约）⇒
  // 两侧投影完全相同。所以它**没有** `ALLOW` 条目 —— 不是因为差异不存在，
  // 而是因为这条通道看不见它。钉住它的判据是 L1 的
  // `index.test.ts`「`separator` 传 `0` 不渲染分隔符」那条（断言**无** span、
  // 且 `textContent` 不含 `0`）。
  'separator:zero': () => space({ separator: 0 }, ['a', 'b']),
  'separator:element': () => space({ separator: h('b', null, '|') }, ['a', 'b']),
  'separator:three-items': () => space({ separator: '-' }, ['a', 'b', 'c']),
  'separator:with-null-child': () => space({ separator: '-' }, ['a', null, 'c']),
  'separator:empty+split': () => space({ separator: '', split: '-' }, ['a', 'b']),
  'split:legacy': () => space({ split: '-' }, ['a', 'b']),
  'split:legacy+separator': () => space({ split: '|', separator: '-' }, ['a', 'b']),

  // ---- 7. className / rootClassName / 属性透传 ----
  'class:className': () => space({ className: 'my-class' }),
  'class:rootClassName': () => space({ rootClassName: 'root-class' }),
  'class:both': () => space({ className: 'a', rootClassName: 'b' }),
  'attrs:passthrough': () => space({ 'data-testid': 'x', id: 'my-space', title: 'tip' }),

  // ---- 8. 语义化 ----
  'semantic:classNames-all': () =>
    space({
      classNames: { root: 'cn-root', item: 'cn-item', separator: 'cn-sep' },
      separator: '-',
    }),
  'semantic:classNames-root': () => space({ classNames: { root: 'cn-root' } }),
  // ★ 函数式：`info.props` 必须是**合并后**的 props（orientation / align / size）
  'semantic:classNames-fn': () =>
    space({
      orientation: 'vertical',
      classNames: (info: { props: { orientation?: string; align?: string; size?: unknown } }) => ({
        root: `fn-${String(info.props.orientation)}-${String(info.props.align)}-${String(info.props.size)}`,
      }),
    }),
  'semantic:styles-all': () =>
    space({
      styles: { root: { color: 'red' }, item: { color: 'green' }, separator: { color: 'blue' } },
      separator: '-',
    }),
  // 函数式 `styles` 只证明「函数形态被支持」：`info.props` 是合并后 props 这件事
  // 由上面的 `semantic:classNames-fn` 证明 —— 这里不能拿 `info.props.prefixCls`
  // 当颜色用（`color: apollo` 非法，jsdom 的 cssstyle 会静默丢弃，差异会来自夹具
  // 而不是组件）。与 divider / empty 的同名用例同形态。
  'semantic:styles-fn': () => space({ styles: () => ({ root: { color: 'blue' } }) }),

  // ---- 9. style 合并顺序 ----
  'style:style-over-root': () =>
    space({ style: { color: 'green' }, styles: { root: { color: 'red' } } }),
  'style:style-over-gap': () => space({ size: 10, style: { columnGap: '3px' } }),
  'style:gap-only': () => space({ size: 10 }),

  // ---- 10. ConfigProvider ----
  // ⚠️ Vue 侧的组件配置走 `components.space`（D25），React 侧走 `space`。
  'config:size': () => withConfig({ components: { space: { size: 'large' } } }, () => space({})),
  'config:size-zero': () => withConfig({ components: { space: { size: 0 } } }, () => space({})),
  'config:size+prop-size': () =>
    withConfig({ components: { space: { size: 'large' } } }, () => space({ size: 'medium' })),
  'config:className': () =>
    withConfig({ components: { space: { className: 'cfg-class' } } }, () => space({})),
  'config:classNames': () =>
    withConfig({ components: { space: { classNames: { root: 'cfg-root' } } } }, () => space({})),
  'config:styles': () =>
    withConfig({ components: { space: { styles: { root: { color: 'red' } } } } }, () => space({})),
  'config:style+prop-style': () =>
    withConfig({ components: { space: { style: { color: 'red' } } } }, () =>
      space({ style: { color: 'green' } }),
    ),
  'direction:rtl': () => withConfig({ direction: 'rtl' }, () => space({})),

  // ---- 11. Space.Compact ----
  'compact:plain': () => compact({}),
  'compact:empty': () => compact({}, []),
  'compact:prefix-custom': () =>
    h(SpaceCompact, { prefixCls: 'custom-compact' }, { default: () => probes() }),
  // 不传 prefixCls ⇒ `ant-space-compact`（D6）
  'compact:no-props': () => h(SpaceCompact, null, { default: () => probes() }),
  'compact:block': () => compact({ block: true }),
  'compact:orientation-vertical': () => compact({ orientation: 'vertical' }),
  'compact:direction-vertical': () => compact({ direction: 'vertical' }),
  'compact:vertical-false': () => compact({ vertical: false }),
  'compact:vertical-true': () => compact({ vertical: true }),
  'compact:orientation+vertical': () => compact({ orientation: 'vertical', vertical: false }),
  'compact:class:className': () => compact({ className: 'cc' }),
  'compact:class:rootClassName': () => compact({ rootClassName: 'cc-root' }),
  'compact:style': () => compact({ style: { color: 'red' } }),
  'compact:attrs': () => compact({ 'data-testid': 'c', id: 'my-compact' }),
  'compact:size-small': () => compact({ size: 'small' }),
  'compact:size-large': () => compact({ size: 'large' }),
  'compact:direction-rtl': () => withConfig({ direction: 'rtl' }, () => compact({})),
  'compact:config-component-size': () => withConfig({ componentSize: 'large' }, () => compact({})),
  'compact:config-component-size+size': () =>
    withConfig({ componentSize: 'large' }, () => compact({ size: 'small' })),
  'compact:single-item': () => compact({}, [h(Probe, { key: 'p0' })]),
  'compact:probe-rtl': () => compact({}, [h(Probe, { key: 'p0', dir: 'rtl' })]),
  'compact:probe-rtl-vertical': () =>
    compact({ orientation: 'vertical' }, [h(Probe, { key: 'p0', dir: 'rtl' })]),
  // ⚠️ `toArray(children)` **不带** `keepEmpty`（与 `Space` 相反）
  'compact:false-child': () =>
    compact({}, [h(Probe, { key: 'p0' }), false as unknown as VNodeChild]),
  'compact:null-child': () => compact({}, [h(Probe, { key: 'p0' }), null]),
  'compact:only-false-child': () => compact({}, [false as unknown as VNodeChild]),
  // 嵌套：内层的首项只有在**外层也是首项**时才算首项
  'compact:nested-not-first': () =>
    compact({}, [h(Probe, { key: 'p0' }), compact({}, undefined) as unknown as VNodeChild]),
  'compact:nested-is-first': () =>
    compact({}, [compact({}, undefined) as unknown as VNodeChild, h(Probe, { key: 'p0' })]),
  'compact:nested-vertical': () =>
    compact({}, [
      h(Probe, { key: 'p0' }),
      compact({ orientation: 'vertical' }, undefined) as unknown as VNodeChild,
    ]),
  // `NoCompactStyle` 把上下文重置为 `null` ⇒ 探针一个紧凑类名都不带
  'compact:no-compact-style': () =>
    compact({}, [
      h(Probe, { key: 'p0' }),
      h(NoCompactStyle, { key: 'n' }, { default: () => h(Probe) }),
    ]),
  // 探针在 Compact **外面** ⇒ 同样没有紧凑类名
  'compact:probe-outside': () => h(Probe),

  // ---- 12. Space.Addon ----
  'addon:plain': () => addon({}),
  'addon:prefix-custom': () =>
    h(SpaceAddon, { prefixCls: 'custom-addon' }, { default: () => 'Addon' }),
  // 不传 prefixCls ⇒ `ant-space-addon`（D6）
  'addon:no-props': () => h(SpaceAddon, null, { default: () => 'Addon' }),
  'addon:variant-outlined': () => addon({ variant: 'outlined' }),
  'addon:variant-borderless': () => addon({ variant: 'borderless' }),
  'addon:variant-filled': () => addon({ variant: 'filled' }),
  'addon:variant-underlined': () => addon({ variant: 'underlined' }),
  'addon:status-success': () => addon({ status: 'success' }),
  'addon:status-warning': () => addon({ status: 'warning' }),
  'addon:status-error': () => addon({ status: 'error' }),
  'addon:status-validating': () => addon({ status: 'validating' }),
  'addon:status-empty': () => addon({ status: '' }),
  'addon:disabled': () => addon({ disabled: true }),
  'addon:disabled+status-error': () => addon({ disabled: true, status: 'error' }),
  'addon:class:className': () => addon({ className: 'my-addon' }),
  'addon:style': () => addon({ style: { color: 'red' } }),
  'addon:attrs': () => addon({ 'data-testid': 'a', id: 'my-addon' }),
  'addon:children-element': () => addon({}, h('span', null, 'Addon')),
  // ⚠️ 紧凑类名长在 **Addon 自己的前缀** 上：`apollo-space-addon-compact-item`
  'addon:inside-compact': () => compact({}, [addonNode('a0', 'A0'), addonNode('a1', 'A1')]),
  'addon:inside-compact-vertical': () =>
    compact({ orientation: 'vertical' }, [addonNode('a0', 'A0'), addonNode('a1', 'A1')]),
  'addon:inside-compact-size': () =>
    compact({ size: 'small' }, [addonNode('a0', 'A0'), addonNode('a1', 'A1')]),
  'addon:outside-compact': () => addon({}),
};

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
      '差异落在根与每个 `-item` 上（都由同一前缀派生）—— 只允许根那一处会掩盖「子结构类名没跟着前缀走」的 bug。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-space ant-space-align-center ant-space-gap-col-small ant-space-gap-row-small ant-space-horizontal] vs [apollo-space apollo-space-align-center apollo-space-gap-col-small apollo-space-gap-row-small apollo-space-horizontal]',
      '$/div[0]/div[0]: 类名不同 [ant-space-item] vs [apollo-space-item]',
      '$/div[0]/div[1]: 类名不同 [ant-space-item] vs [apollo-space-item]',
    ],
  },
  'compact:no-props': {
    reason:
      '同 `prefix-cls:no-props`（D6）：Compact 不传 prefixCls 时 antd 是 `ant-space-compact`，我们是 `apollo-space-compact`。' +
      '注意探针的类名**不**参与这条差异（它用自己的 `probe` 前缀）—— 这恰好把「Compact 不把前缀透传给子项」这条协议钉住了。',
    deviationId: 'D6',
    diff: ['$/div[0]: 类名不同 [ant-space-compact] vs [apollo-space-compact]'],
  },
  'addon:no-props': {
    reason:
      '同 `prefix-cls:no-props`（D6）：Addon 不传 prefixCls 时 antd 是 `ant-space-addon`，我们是 `apollo-space-addon`。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-space-addon ant-space-addon-variant-outlined] vs [apollo-space-addon apollo-space-addon-variant-outlined]',
    ],
  },
  /**
   * `size: -5` —— **负数是合法的 gap 数字**（`isValidGapNumber` 只判
   * `typeof === 'number' && !Number.isNaN`，没有 `> 0` 这一条）。
   *
   * React 的 `renderToStaticMarkup` 直出字符串，所以基线里看得到
   * `column-gap:-5px;row-gap:-5px`；Vue 侧的内联样式要经 jsdom 的
   * `CSSStyleDeclaration`，而 cssstyle 按 CSS 规范校验后把**负 gap** 整个丢掉
   * （实测：`el.style.columnGap = '-5px'` → `getAttribute('style') === null`；
   * 同一实验里 `'10px'` 正常保留）。两者 CSS 等价（浏览器同样忽略负 gap），
   * 差异来自夹具的两条通道不对称，不是组件行为。
   *
   * ⚠️ 这条豁免**会**掩盖一类回归（若把判据改成 `size > 0`，我们同样产出空 style，
   *    差异字符串不变）—— 所以它**不能**单独存在。判据本身由 L1 的
   *    `index.test.ts` 直接断言 `isValidGapNumber(-5) === true` 钉住；
   *    「数字补 px」这条由 `size:number` 用例钉住（`10px` 在 jsdom 里是合法值，
   *    少了补 px 的步骤该用例会红）。两者合起来覆盖了这条豁免让出的观测面。
   */
  'size:negative': {
    reason:
      'React 直出字符串保留 `column-gap:-5px`，Vue 侧内联样式经 jsdom 的 CSSOM 校验把负 gap 丢弃（cssstyle 行为，实测 jsdom 30）。两侧 CSS 等价（负 gap 在浏览器里同样被忽略），差异来自夹具的两条通道不对称，不是组件行为差异。判据本身由 L1 的 `isValidGapNumber(-5) === true` 与 `size:number` 的 `10px` 共同钉住。',
    diff: ['$/div[0]: style 不同 [column-gap:-5px;row-gap:-5px] vs []'],
  },
} as const;

domContractTest('Space', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Space semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Space · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
