/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/button.dom.json`，由 `tests/compat/baseline/button.mjs`
 * **直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Button`** 产出。
 * 是机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、类名按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 的
 * `css-dev-only-do-not-override-*` / `css-var-*` 类名（H6）。
 *
 * 这里用 **`keepStyle: true`**。理由：`styles.root` / `styles.icon` / `styles.content`
 * 三个槽位的落点与 `style` 覆盖 `styles.root` 的合并顺序是本组件最容易写错的地方，
 * 只投影 class + aria-* 会让它完全测不到。这是对 T10 的**加强**，不是放宽。
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 两侧传**同一个** `prefixCls`（`apollo`），所以类名可以逐字比对。
 * 默认前缀（`apollo` vs antd 的 `ant`）由 `prefix-cls:no-props` 单独立一条并登记为 D6。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual/`）
 *   - 没证明**两个中文字**的类名：它由上游 `useEffect` 置位，而 SSR 基线不跑 effect
 *     ⇒ 该行为由 L1（`index.test.ts`）与 L6 判定（生成脚本文件头有完整说明）
 *   - 没证明布尔 `loading` 的**内置加载图标本体**：图标自带的 DOM 由
 *     `tests/compat/baselines/icons.dom.json` 的 848 个用例逐属性钉住，这里不重复
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { computed, defineComponent, h, provide, type VNode, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/button.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { disabledContextKey } from '../../config-provider/disabled-context';
import { sizeContextKey } from '../../config-provider/size-context';
import { Button } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/button.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 两侧共用的自定义图标：`<i class="my-icon" />`。 */
const ICON = () => h('i', { class: 'my-icon' });
/** 两侧共用的自定义加载图标：`<i class="my-loading-icon" />`。 */
const LOADING_ICON = () => h('i', { class: 'my-loading-icon' });

/**
 * 在指定的 ConfigProvider 上下文下渲染。
 *
 * antd 侧用的是真的 `<ConfigProvider>`；Vue 侧对应物是 `provide(configContextKey, ...)`。
 * 两者指向同一份配置，所以是同一件事的两种写法，不是「为测试特制的一条路径」。
 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AButtonCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/**
 * 只提供 `SizeContext` / `DisabledContext`
 * （antd 侧是 ConfigProvider 的 `componentSize` / `componentDisabled`）。
 *
 * ⚠️ 注入的是 `computed` 而不是裸值：那两个 context 的键类型就是 `ComputedRef`
 *    （见 `size-context.ts` / `disabled-context.ts` 的文件头说明），
 *    传裸值会让 `useSize` / `useDisabled` 读不到 `.value`。
 */
function withSizeContext(size: 'small' | 'middle' | 'large', children: () => VNodeChild) {
  return defineComponent({
    name: 'AButtonCompatSizeProbe',
    setup() {
      provide(
        sizeContextKey,
        computed(() => size),
      );
      return () => children();
    },
  });
}

function withDisabledContext(disabled: boolean, children: () => VNodeChild) {
  return defineComponent({
    name: 'AButtonCompatDisabledProbe',
    setup() {
      provide(
        disabledContextKey,
        computed(() => disabled),
      );
      return () => children();
    },
  });
}

type Props = Record<string, unknown>;

const withText = (props: Props, text: VNodeChild = 'Text'): VNode =>
  h(Button, props, { default: () => text });
const noText = (props: Props): VNode => h(Button, props);

/**
 * 用例 id → Vue 侧构造。**必须覆盖基线里的每一个 id**（少渲染一条会失败）。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基本形态 ----
  plain: () => noText({ prefixCls: PREFIX }),
  'plain:with-text': () => withText({ prefixCls: PREFIX }),
  'prefix-cls:custom': () => withText({ prefixCls: 'custom' }),
  // 两侧都不传 prefixCls → antd 用 `ant-btn`、我们用 `apollo-btn`（有意差异 D6）
  'prefix-cls:no-props': () => h(Button, {}, { default: () => 'Text' }),
  'html-type:default': () => withText({ prefixCls: PREFIX }),
  'html-type:submit': () => withText({ prefixCls: PREFIX, htmlType: 'submit' }),
  'html-type:reset': () => withText({ prefixCls: PREFIX, htmlType: 'reset' }),

  // ---- 2. type 糖 ----
  'type:primary': () => withText({ prefixCls: PREFIX, type: 'primary' }),
  'type:default': () => withText({ prefixCls: PREFIX, type: 'default' }),
  'type:dashed': () => withText({ prefixCls: PREFIX, type: 'dashed' }),
  'type:text': () => withText({ prefixCls: PREFIX, type: 'text' }),
  'type:link': () => withText({ prefixCls: PREFIX, type: 'link' }),

  // ---- 3. danger ----
  'danger:alone': () => withText({ prefixCls: PREFIX, danger: true }),
  'danger:primary': () => withText({ prefixCls: PREFIX, type: 'primary', danger: true }),
  'danger:dashed': () => withText({ prefixCls: PREFIX, type: 'dashed', danger: true }),
  'danger:text': () => withText({ prefixCls: PREFIX, type: 'text', danger: true }),
  'danger:false': () => withText({ prefixCls: PREFIX, danger: false }),
  'color:danger-only': () => withText({ prefixCls: PREFIX, color: 'danger', variant: 'solid' }),

  // ---- 4. color / variant ----
  'color-variant:blue-solid': () =>
    withText({ prefixCls: PREFIX, color: 'blue', variant: 'solid' }),
  'color-variant:cyan-filled': () =>
    withText({ prefixCls: PREFIX, color: 'cyan', variant: 'filled' }),
  'color-variant:green-dashed': () =>
    withText({ prefixCls: PREFIX, color: 'green', variant: 'dashed' }),
  'color-variant:gold-link': () => withText({ prefixCls: PREFIX, color: 'gold', variant: 'link' }),
  'variant:solid-only': () => withText({ prefixCls: PREFIX, variant: 'solid' }),
  'variant:filled-only': () => withText({ prefixCls: PREFIX, variant: 'filled' }),
  'color-variant:over-type': () =>
    withText({ prefixCls: PREFIX, type: 'primary', danger: true, color: 'blue', variant: 'solid' }),

  // ---- 5. ghost ----
  'ghost:primary': () => withText({ prefixCls: PREFIX, type: 'primary', ghost: true }),
  'ghost:default': () => withText({ prefixCls: PREFIX, ghost: true }),
  'ghost:dashed': () => withText({ prefixCls: PREFIX, type: 'dashed', ghost: true }),
  'ghost:link': () => withText({ prefixCls: PREFIX, type: 'link', ghost: true }),
  'ghost:false': () => withText({ prefixCls: PREFIX, type: 'primary', ghost: false }),

  // ---- 6. size / shape / block ----
  'size:small': () => withText({ prefixCls: PREFIX, size: 'small' }),
  'size:middle': () => withText({ prefixCls: PREFIX, size: 'middle' }),
  'size:large': () => withText({ prefixCls: PREFIX, size: 'large' }),
  'shape:circle': () => withText({ prefixCls: PREFIX, shape: 'circle', icon: ICON() }),
  'shape:round': () => withText({ prefixCls: PREFIX, shape: 'round' }),
  'shape:square': () => withText({ prefixCls: PREFIX, shape: 'square' }),
  block: () => withText({ prefixCls: PREFIX, block: true }),

  // ---- 7. icon ----
  'icon:with-text': () => withText({ prefixCls: PREFIX, icon: ICON() }),
  'icon:only': () => noText({ prefixCls: PREFIX, icon: ICON() }),
  'icon:placement-end': () => withText({ prefixCls: PREFIX, icon: ICON(), iconPlacement: 'end' }),
  'icon:position-end': () => withText({ prefixCls: PREFIX, icon: ICON(), iconPosition: 'end' }),

  // ---- 8. loading（自定义图标形态，理由见文件头）----
  'loading:custom-icon': () =>
    withText({ prefixCls: PREFIX, loading: { delay: 0, icon: LOADING_ICON() } }),
  'loading:custom-icon-only': () =>
    noText({ prefixCls: PREFIX, loading: { delay: 0, icon: LOADING_ICON() } }),

  // ---- 9. disabled（<button> vs <a> 两分支）----
  'disabled:button': () => withText({ prefixCls: PREFIX, disabled: true }),
  'disabled:button-false': () => withText({ prefixCls: PREFIX, disabled: false }),
  'href:enabled': () => withText({ prefixCls: PREFIX, href: 'https://example.com' }),
  'href:disabled': () =>
    withText({ prefixCls: PREFIX, href: 'https://example.com', disabled: true }),
  'href:target': () => withText({ prefixCls: PREFIX, href: '#', target: '_blank' }),

  // ---- 10. className / 属性透传 ----
  'class:className': () => withText({ prefixCls: PREFIX, className: 'my-class' }),
  'class:rootClassName': () => withText({ prefixCls: PREFIX, rootClassName: 'root-class' }),
  'class:both': () => withText({ prefixCls: PREFIX, className: 'a', rootClassName: 'b' }),
  'attrs:passthrough': () => withText({ prefixCls: PREFIX, 'data-testid': 'x', id: 'my-btn' }),

  // ---- 11. 语义化 ----
  'semantic:classNames-root': () =>
    withText({ prefixCls: PREFIX, classNames: { root: 'cn-root' } }),
  'semantic:classNames-all': () =>
    withText({
      prefixCls: PREFIX,
      icon: ICON(),
      classNames: { root: 'cn-root', icon: 'cn-icon', content: 'cn-content' },
    }),
  'semantic:styles-all': () =>
    withText({
      prefixCls: PREFIX,
      icon: ICON(),
      styles: {
        root: { color: 'red' },
        icon: { opacity: '0.5' },
        content: { padding: '2px' },
      },
    }),

  // ---- 12. style 合并顺序 ----
  'style:style-over-root': () =>
    withText({ prefixCls: PREFIX, style: { color: 'green' }, styles: { root: { color: 'red' } } }),

  // ---- 13. ConfigProvider ----
  'config:className': () =>
    withConfig({ components: { button: { className: 'cfg-class' } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:classNames': () =>
    withConfig({ components: { button: { classNames: { root: 'cfg-root' } } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:color-variant': () =>
    withConfig({ components: { button: { color: 'cyan', variant: 'filled' } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:variant-solid-only': () =>
    withConfig({ components: { button: { variant: 'solid' } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:shape': () =>
    withConfig({ components: { button: { shape: 'round' } } }, () =>
      withText({ prefixCls: PREFIX }),
    ),
  'config:auto-insert-space-off': () =>
    withConfig({ components: { button: { autoInsertSpace: false } } }, () =>
      withText({ prefixCls: PREFIX }, '确定'),
    ),
  'direction:rtl': () => withConfig({ direction: 'rtl' }, () => withText({ prefixCls: PREFIX })),
  'size-context': () => withSizeContext('large', () => withText({ prefixCls: PREFIX })),
  'disabled-context': () => withDisabledContext(true, () => withText({ prefixCls: PREFIX })),
};

/**
 * 允许的差异，**逐条列出**且断言「恰好等于这些」。
 */
const ALLOW = {
  'prefix-cls:no-props': {
    reason:
      'antd 的默认 prefixCls 是 `ant`，我们是 `apollo`（裁决 `prefix-cls-default` = A：默认 apollo，允许 ConfigProvider 覆盖为 ant）。' +
      '这条用例刻意两边都不传 prefixCls，用来把「默认值不同」这件事**钉成断言**，而不是靠所有用例都显式传前缀来回避它。' +
      '注意差异落在**同一个节点的三个类名**上（根 + type + color/variant 都由同一前缀派生）—— 只允许根那一处会掩盖「子结构类名没跟着前缀走」的 bug。',
    deviationId: 'D6',
    diff: [
      '$/button[0]: 类名不同 [ant-btn ant-btn-color-default ant-btn-default ant-btn-variant-outlined] vs [apollo-btn apollo-btn-color-default apollo-btn-default apollo-btn-variant-outlined]',
    ],
  },
} as const;

domContractTest('Button', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Button semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});

/** `CASES` 里多出来的 id 会让「少测一条」表现为「测试通过」，所以反向也校验一次。 */
describe('Button · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});
