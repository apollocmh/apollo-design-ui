/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/divider.dom.json`，由 `tests/compat/baseline/divider.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Divider`** 产出。
 * 是机械 oracle，不是「我们读了源码之后写下的期望值」—— 后者的差分通过只能说明
 * 两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、类名按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 的
 * `css-dev-only-do-not-override-*` / `css-var-*` 类名（D5）。
 *
 * 这里用 **`keepStyle: true`**。理由：`style` 与 `styles.root` / `styles.rail` 的合并顺序
 * 是本组件最容易写错的地方（无 children 时根元素会额外吃到 `styles.rail`，
 * 且 `style` 覆盖 `styles.root`），只投影 class + aria-* 会让它完全测不到。
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
 *   - 没证明告警文案一致（那由 L1 的 `index.test.ts` 钉住）
 *   - 没证明 `size` 会读 ConfigProvider 的 `componentSize`：ConfigProvider 组件尚未落地，
 *     这条缺口登记在 README.md §7
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/divider.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Divider } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/divider.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/**
 * 在指定的 ConfigProvider 上下文下渲染。
 *
 * antd 侧用的是真的 `<ConfigProvider>`；Vue 侧对应物是 `provide(configContextKey, ...)`。
 * 两者指向同一份配置，所以是同一件事的两种写法，不是「为测试特制的一条路径」。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ADividerCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 有 children 时显式给默认插槽；没有时**不传第三个参数**（`slots.default` 才是 `undefined`）。 */
type Props = Record<string, unknown>;
//
// ⚠️ 返回类型是 `VNode` 而**不是** `DomRenderResult`：后者是
// `string | VNodeChild | Component` 的联合，而 `withConfig` 的 children 回调要的是
// `VNodeChild` —— 联合里的 `Component` 那一支不可赋值（vue-tsc 会报 TS2322）。
// `h()` 本来就返回 `VNode`，收紧到它既准确又让 ConfigProvider 用例能直接复用这两个工厂。
const withText = (props: Props, text: VNodeChild = 'Text'): VNode =>
  h(Divider, props, { default: () => text });
const noText = (props: Props): VNode => h(Divider, props);

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 ----
  plain: () => noText({ prefixCls: PREFIX }),
  'plain:with-text': () => withText({ prefixCls: PREFIX }),
  'prefix-cls:custom': () => noText({ prefixCls: 'custom' }),
  // 两侧都不传 prefixCls → antd 用 `ant-divider`、我们用 `apollo-divider`（有意差异 D6）
  'prefix-cls:no-props': () => h(Divider),

  // ---- 2. 方向：orientation > vertical > type ----
  'orientation:horizontal': () => noText({ prefixCls: PREFIX, orientation: 'horizontal' }),
  'orientation:vertical': () => noText({ prefixCls: PREFIX, orientation: 'vertical' }),
  'vertical:true': () => noText({ prefixCls: PREFIX, vertical: true }),
  'vertical:false': () => noText({ prefixCls: PREFIX, vertical: false }),
  'vertical:true+orientation:horizontal': () =>
    noText({ prefixCls: PREFIX, vertical: true, orientation: 'horizontal' }),
  'type:vertical': () => noText({ prefixCls: PREFIX, type: 'vertical' }),
  'type:horizontal': () => noText({ prefixCls: PREFIX, type: 'horizontal' }),
  'type:vertical+vertical:false': () =>
    noText({ prefixCls: PREFIX, type: 'vertical', vertical: false }),
  'orientation:vertical+type:horizontal': () =>
    noText({ prefixCls: PREFIX, orientation: 'vertical', type: 'horizontal' }),
  'orientation:unset': () => noText({ prefixCls: PREFIX }),
  'orientation:left': () => withText({ prefixCls: PREFIX, orientation: 'left' }),
  'vertical:true+with-text': () => withText({ prefixCls: PREFIX, vertical: true }),

  // ---- 3. titlePlacement ----
  'titlePlacement:center': () => withText({ prefixCls: PREFIX, titlePlacement: 'center' }),
  'titlePlacement:start': () => withText({ prefixCls: PREFIX, titlePlacement: 'start' }),
  'titlePlacement:end': () => withText({ prefixCls: PREFIX, titlePlacement: 'end' }),
  'titlePlacement:left': () => withText({ prefixCls: PREFIX, titlePlacement: 'left' }),
  'titlePlacement:right': () => withText({ prefixCls: PREFIX, titlePlacement: 'right' }),

  // ---- 4. orientationMargin ----
  'orientation-margin:number+start': () =>
    withText({ prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: 20 }),
  'orientation-margin:string+end': () =>
    withText({ prefixCls: PREFIX, titlePlacement: 'end', orientationMargin: '10' }),
  'orientation-margin:number+center': () =>
    withText({ prefixCls: PREFIX, titlePlacement: 'center', orientationMargin: 20 }),
  'orientation-margin:non-numeric+start': () =>
    withText({ prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: '2em' }),
  // 数值 0 是 px 补全规则的**边界**：React 的 `dangerousStyleValue` 对 0 不补 `px`
  // （输出 `0` 而非 `0px`），Vue 运行时 `setStyle` 同样会静默丢弃无单位的裸数字。
  'orientation-margin:zero+start': () =>
    withText({ prefixCls: PREFIX, titlePlacement: 'start', orientationMargin: 0 }),

  // ---- 5. dashed / variant ----
  dashed: () => noText({ prefixCls: PREFIX, dashed: true }),
  'dashed:with-text': () => withText({ prefixCls: PREFIX, dashed: true }),
  'variant:dashed': () => noText({ prefixCls: PREFIX, variant: 'dashed' }),
  'variant:dotted': () => noText({ prefixCls: PREFIX, variant: 'dotted' }),
  'variant:dotted:with-text': () => withText({ prefixCls: PREFIX, variant: 'dotted' }),
  'variant:solid': () => noText({ prefixCls: PREFIX, variant: 'solid' }),

  // ---- 6. plain ----
  'plain:true': () => withText({ prefixCls: PREFIX, plain: true }),

  // ---- 7. size ----
  'size:small': () => noText({ prefixCls: PREFIX, size: 'small' }),
  'size:medium': () => noText({ prefixCls: PREFIX, size: 'medium' }),
  'size:middle': () => noText({ prefixCls: PREFIX, size: 'middle' }),
  'size:large': () => noText({ prefixCls: PREFIX, size: 'large' }),

  // ---- 8. 根节点原生 attrs（React className/rootClassName 的 Vue 对应物是 class） ----
  'class:className': () => noText({ prefixCls: PREFIX, class: 'my-class' }),
  'class:rootClassName': () => noText({ prefixCls: PREFIX, class: 'root-class' }),
  'class:both': () => noText({ prefixCls: PREFIX, class: ['a', 'b'] }),
  'attrs:passthrough': () => noText({ prefixCls: PREFIX, 'data-testid': 'x', id: 'my-divider' }),

  // ---- 9. 语义化 ----
  'semantic:classNames-root': () =>
    withText({ prefixCls: PREFIX, classNames: { root: 'cn-root' } }),
  'semantic:classNames-all': () =>
    withText({
      prefixCls: PREFIX,
      classNames: { root: 'cn-root', rail: 'cn-rail', content: 'cn-content' },
    }),
  'semantic:classNames-rail-no-children': () =>
    noText({ prefixCls: PREFIX, classNames: { root: 'cn-root', rail: 'cn-rail' } }),
  // ★ 函数式：`info.props` 必须是**合并后**的 props（titlePlacement 从 left 折成 start）
  'semantic:classNames-fn': () =>
    withText({
      prefixCls: PREFIX,
      titlePlacement: 'left',
      classNames: (info: { props: { titlePlacement?: string; orientation?: string } }) => ({
        root: `fn-${String(info.props.titlePlacement)}-${String(info.props.orientation)}`,
      }),
    }),
  'semantic:styles-all': () =>
    withText({
      prefixCls: PREFIX,
      styles: { root: { color: 'red' }, rail: { opacity: '0.5' }, content: { padding: '2px' } },
    }),
  // 函数式 `styles` 只证明「函数形态被支持」：`info.props` 是合并后 props 这件事
  // 由上面的 `semantic:classNames-fn` 证明 —— 这里不能拿 `info.props.prefixCls`
  // 当颜色用（`color: apollo` 非法，jsdom 的 cssstyle 会静默丢弃，差异会来自夹具
  // 而不是组件）。与 empty 的同名用例同形态。
  'semantic:styles-fn': () =>
    withText({
      prefixCls: PREFIX,
      styles: () => ({ root: { color: 'blue' } }),
    }),

  // ---- 10. style 合并顺序 ----
  'style:style-over-root': () =>
    withText({ prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } }),
  'style:root-rail-merge': () => noText({ prefixCls: PREFIX, styles: { rail: { margin: '4px' } } }),
  'style:root-rail-merge-both': () =>
    noText({ prefixCls: PREFIX, styles: { root: { color: 'blue' }, rail: { margin: '4px' } } }),

  // ---- 11. ConfigProvider ----
  'config:className': () =>
    withConfig({ components: { divider: { className: 'cfg-class' } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:classNames': () =>
    withConfig({ components: { divider: { classNames: { root: 'cfg-root' } } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'direction:rtl+titlePlacement:left': () =>
    withConfig({ direction: 'rtl' }, () => withText({ prefixCls: PREFIX, titlePlacement: 'left' })),
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
      '注意差异落在**同一个节点的三个类名**上（根 + 方向 + rail 都由同一前缀派生）—— 只允许根那一处会掩盖「子结构类名没跟着前缀走」的 bug。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-divider ant-divider-horizontal ant-divider-rail] vs [apollo-divider apollo-divider-horizontal apollo-divider-rail]',
    ],
  },
  /**
   * `orientationMargin: 0` —— 数值 `0` 的 **px 补全边界**。
   *
   * React 的 `dangerousStyleValue` 对数值 `0` **不补**单位（输出 `0`）；
   * 我们的 `toCssLength()` 照做（`0` → `'0'`，非零数值 → `` `${v}px` ``），
   * 所以两侧的**声明值**是同一个。
   *
   * 但 Vue 侧的内联样式要经 jsdom 的 `CSSStyleDeclaration` 序列化，
   * 而 cssstyle 会把**无单位零**规范成 `0px`（实测 jsdom 30：
   * `el.style.marginInlineStart = '0'` → `margin-inline-start: 0px;`；
   * 同一实验里 `20` 与 `'20'` 反而被**静默丢弃** —— 即 PITFALLS 第 32 条）。
   * React 侧是 `renderToStaticMarkup` 直出字符串，不经过 CSSOM，因此保留 `0`。
   *
   * 两者 CSS 等价（`0` ≡ `0px`），差异来自夹具的两条通道不对称，不是组件行为。
   *
   * ⚠️ 这条豁免**没有**让用例失效：若哪天把 `hasMarginStart` 的判据从
   *    `!= null` 写成真值判断（`0` 会被判为假），该元素会整个丢掉 margin 声明，
   *    差异变成 `[...:0] vs []`，与这里登记的字符串不等 ⇒ 红灯。
   *    它对「声明值 `0` 还是 `0px`」是盲的，但「声明在不在」仍然被钉住。
   */
  'orientation-margin:zero+start': {
    reason:
      'React 的 `dangerousStyleValue` 对数值 0 不补单位（直出 `0`），Vue 侧内联样式经 jsdom 的 CSSOM 序列化把无单位零规范成 `0px`（cssstyle 行为，实测 jsdom 30）。' +
      '两侧 CSS 等价，差异来自比对夹具的两条通道不对称（React 直出字符串 vs CSSOM 序列化），不是组件行为差异，因此**不登记** COMPATIBILITY.md §9。',
    diff: ['$/div[0]/span[1]: style 不同 [margin-inline-start:0] vs [margin-inline-start:0px]'],
  },
} as const;

domContractTest('Divider', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Divider semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Divider · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
