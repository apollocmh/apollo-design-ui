/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/empty.dom.json`，由 `tests/compat/baseline/empty.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Empty`** 产出。
 * 是机械 oracle，不是「我们读了源码之后写下的期望值」—— 后者的差分通过只能说明
 * 两边都想通了，连上游的缺陷都会被一起写进断言。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 哈希类名
 * （`tests/compat/README.md` §4 的标准步骤，对应差异 D1）。
 *
 * 这里用 **`keepStyle: true`** 而不是 `contract` 档的默认值。理由：Empty 的
 * `styles` / `imageStyle` 合并顺序是本组件最容易写错的地方（`style` 覆盖 `styles.root`
 * 这条尤其反直觉），只投影 class + aria-* 会让它完全测不到。
 * 这是对 T10 的**加强**，不是放宽。
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 两侧传**同一个** `prefixCls`（`apollo`），所以类名可以逐字比对。
 * 这比「渲染成 ant- 再替换成 apollo-」更强 —— 后者会把「我们根本没读 prefixCls」
 * 这个 bug 一起归一化掉。默认前缀单独由 `plain:no-props` 用例覆盖（见下面的 `allow`）。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明插画的**颜色**与 antd 相同：我们输出 `var(--apollo-*)`，antd 输出合成后的
 *     实色 hex。这是架构差异 D6，两侧都不进契约（`fill` 不在 `contract` 档的投影里，
 *     本文件也没有开 `full` 档 —— Empty 的 `fill` 不是「交付物本身」，与图标不同）
 *   - 没证明 locale 生效：所有用例都是 `en_US`
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/empty.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Empty, PRESENTED_IMAGE_DEFAULT, PRESENTED_IMAGE_SIMPLE } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/empty.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/**
 * 在指定的 ConfigProvider 上下文下渲染。
 *
 * antd 侧用的是真的 `<ConfigProvider>`；Vue 侧对应物是 `provide(configContextKey, ...)`。
 * 两者指向同一份配置，所以是同一件事的两种写法，不是「为测试特制的一条路径」。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AEmptyCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 *
 * 返回类型是 `DomRenderResult`（字符串 / VNode / **组件**）而不是 `VNodeChild` ——
 * `withConfig(...)` 造出来的是组件（`DefineComponent`），它不在 `VNodeChild` 里。
 * 与 `domContractTest` 的 `render` 签名一致，所以这里不该自己收窄。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 ----
  plain: () => h(Empty, { prefixCls: PREFIX }),
  // antd 侧不传 prefixCls → 用它的默认 `ant`；我们侧也不传 → 用 `apollo`。
  // 这是**有意差异**（裁决 prefix-cls-default = A），见下方 allow。
  'plain:no-props': () => h(Empty),
  'prefix-cls:custom': () => h(Empty, { prefixCls: 'custom' }),

  // ---- 2. description ----
  'description:string': () => h(Empty, { prefixCls: PREFIX, description: 'Nothing here' }),
  'description:false': () => h(Empty, { prefixCls: PREFIX, description: false }),
  'description:empty-string': () => h(Empty, { prefixCls: PREFIX, description: '' }),
  'description:zero': () => h(Empty, { prefixCls: PREFIX, description: 0 }),
  'description:node': () =>
    h(Empty, {
      prefixCls: PREFIX,
      description: h('span', { class: 'desc-node' }, 'node'),
    }),

  // ---- 3. image ----
  'image:simple': () => h(Empty, { prefixCls: PREFIX, image: PRESENTED_IMAGE_SIMPLE }),
  'image:default-explicit': () => h(Empty, { prefixCls: PREFIX, image: PRESENTED_IMAGE_DEFAULT }),
  'image:string': () => h(Empty, { prefixCls: PREFIX, image: 'https://example.com/empty.png' }),
  'image:node': () =>
    h(Empty, {
      prefixCls: PREFIX,
      image: h('div', { class: 'my-image' }, 'img'),
    }),

  // ---- 4. footer ----
  'children:present': () => h(Empty, { prefixCls: PREFIX }),
  'children:button': () =>
    h(Empty, { prefixCls: PREFIX, description: 'Nothing' }, () => h('button', null, 'Create')),
  // 空数组插槽 → `slots.default()` 返回 `[]` → `isRenderable([])` 为真 → 渲染空 footer。
  // 与 React 侧 `children = []` 的结果逐条对应。
  'children:empty-array': () => h(Empty, { prefixCls: PREFIX }, () => []),

  // ---- 5. className / rootClassName / 属性透传 ----
  'class:className': () => h(Empty, { prefixCls: PREFIX, class: 'my-class' }),
  'class:rootClassName': () => h(Empty, { prefixCls: PREFIX, class: 'root-class' }),
  'class:both': () => h(Empty, { prefixCls: PREFIX, class: ['a', 'b'] }),
  'attrs:passthrough': () => h(Empty, { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-empty' }),

  // ---- 6. 语义化 ----
  'semantic:classNames-root': () =>
    h(Empty, { prefixCls: PREFIX, classNames: { root: 'cn-root' } }),
  'semantic:classNames-all': () =>
    h(Empty, {
      prefixCls: PREFIX,
      classNames: {
        root: 'cn-root',
        image: 'cn-image',
        description: 'cn-description',
        footer: 'cn-footer',
      },
    }),
  'semantic:classNames-all-with-footer': () =>
    h(
      Empty,
      {
        prefixCls: PREFIX,
        classNames: {
          root: 'cn-root',
          image: 'cn-image',
          description: 'cn-description',
          footer: 'cn-footer',
        },
      },
      () => h('button', null, 'Create'),
    ),
  'semantic:styles-all': () =>
    h(Empty, {
      prefixCls: PREFIX,
      styles: {
        root: { color: 'red' },
        image: { margin: '1px' },
        description: { padding: '2px' },
      },
    }),
  'semantic:classNames-fn': () =>
    h(Empty, { prefixCls: PREFIX, classNames: () => ({ root: 'fn-root' }) }),
  'semantic:styles-fn': () =>
    h(Empty, {
      prefixCls: PREFIX,
      styles: () => ({ root: { color: 'blue' } }),
    }),

  // ---- 7. imageStyle 与合并顺序 ----
  'style:imageStyle-only': () => h(Empty, { prefixCls: PREFIX, imageStyle: { margin: '3px' } }),
  'style:imageStyle-merged': () =>
    h(Empty, {
      prefixCls: PREFIX,
      imageStyle: { margin: '3px', color: 'red' },
      styles: { image: { color: 'blue' } },
    }),
  'style:style-over-root': () =>
    h(Empty, {
      prefixCls: PREFIX,
      style: { color: 'green' },
      styles: { root: { color: 'red' } },
    }),

  // ---- 8. ConfigProvider ----
  'config:image': () =>
    withConfig({ components: { empty: { image: 'https://example.com/cfg.png' } } }, () =>
      h(Empty, { prefixCls: PREFIX }),
    ),
  'config:className': () =>
    withConfig({ components: { empty: { className: 'cfg-class' } } }, () =>
      h(Empty, { prefixCls: PREFIX }),
    ),
  'config:classNames': () =>
    withConfig({ components: { empty: { classNames: { root: 'cfg-root' } } } }, () =>
      h(Empty, { prefixCls: PREFIX }),
    ),

  // ---- 9. RTL ----
  'direction:rtl': () => withConfig({ direction: 'rtl' }, () => h(Empty, { prefixCls: PREFIX })),
};

/**
 * 允许的差异，**逐条列出**且断言「恰好等于这些」。
 *
 * 这是 `domContractTest` 的 `allow` 契约：`expect(actualDiff).toEqual(allowed)`。
 * 所以「这是唯一差异」本身是可证伪的 —— 任何**额外**漂移都会让用例红。
 */
const ALLOW = {
  'plain:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A：默认 apollo，允许 ConfigProvider 覆盖为 ant）。' +
      '这条用例刻意两边都不传 prefixCls，用来把「默认值不同」这件事**钉成断言**，而不是靠所有用例都显式传前缀来回避它。' +
      '注意差异落在**三处**：根元素与两个子结构类名都由同一个前缀派生 —— 只允许根那一处会掩盖「子结构类名没跟着前缀走」的 bug。',
    deviationId: 'D6',
    diff: [
      '$/div[0]: 类名不同 [ant-empty] vs [apollo-empty]',
      '$/div[0]/div[0]: 类名不同 [ant-empty-image] vs [apollo-empty-image]',
      '$/div[0]/div[1]: 类名不同 [ant-empty-description] vs [apollo-empty-description]',
    ],
  },
  'image:string': {
    reason:
      'React 19 的 float 机制会把字符串图片 URL 提升成一个 `<link rel="preload" as="image">` 并渲染在组件之前；' +
      'Vue 没有对应机制。这是 PLATFORM 差异，不是 DOM 契约差异 —— 组件自身的根元素结构仍然逐字一致。',
    deviationId: 'D20',
    diff: ['$: 根节点数不同 2 vs 1'],
  },
  'config:image': {
    reason: '同上（`image` 来自 ConfigProvider 的 `empty.image`，走的仍是字符串图片那条分支）。',
    deviationId: 'D20',
    diff: ['$: 根节点数不同 2 vs 1'],
  },
} as const;

domContractTest('Empty', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Empty semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Empty · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
