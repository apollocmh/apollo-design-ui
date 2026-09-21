/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/flex.dom.json`，由 `tests/compat/baseline/flex.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Flex` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**。
 * `keepStyle: true`：`flex` / `gap` 的内联样式与 ConfigProvider 的 style 合并
 * 顺序是本组件最容易写错的地方（docs/analysis/flex.md §2.4），
 * 只投影 class 会让它完全测不到。这是对 T10 的**加强**，不是放宽。
 *
 * ── 类名不做「事后归一化」──────────────────────────────────────────────────────
 *
 * 两侧传**同一个** `prefixCls`（`apollo`）。注意它是**完整前缀**：
 * `getPrefixCls('flex', 'apollo')` 直接返回 `apollo`，根类名**没有** `-flex` 段。
 * 默认前缀单独由 `prefix-cls:no-props` 用例覆盖（allow 登记为 D6）。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6，见 `tests/visual`）
 *   - 没证明 ConfigProvider **组件**的整体行为（那是 config-provider 自己的 L4）
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/flex.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Flex } from '../index';
import type { FlexProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/flex.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'AFlexCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/**
 * 用例规格表：id → Vue 侧的 props / children / ctx。
 *
 * ⚠️ 必须覆盖基线里的**每一个**用例（domContractTest 会校验）。键名与
 * `tests/compat/baseline/flex.mjs` 的 `push` 一一对应，缺一条即红。
 */
const specs: Record<
  string,
  {
    props: FlexProps & Record<string, unknown>;
    children?: string;
    ctx?: Partial<ConfigContextValue>;
  }
> = {
  basic: { props: { prefixCls: PREFIX }, children: 'Content' },
  'prefix-cls:custom': { props: { prefixCls: 'custom' } },
  'prefix-cls:no-props': { props: {} },
  empty: { props: { prefixCls: PREFIX } },

  'vertical:true': { props: { prefixCls: PREFIX, vertical: true }, children: 'Content' },
  'orientation:vertical': {
    props: { prefixCls: PREFIX, orientation: 'vertical' },
    children: 'Content',
  },
  'orientation:horizontal': {
    props: { prefixCls: PREFIX, orientation: 'horizontal' },
    children: 'Content',
  },
  'orientation:vertical+vertical:false': {
    props: { prefixCls: PREFIX, orientation: 'vertical', vertical: false },
    children: 'Content',
  },
  // orientation 取非法值（divider 的旧 API 语义在这里不合法）→ 回落 vertical 布尔。
  'orientation:invalid+vertical:true': {
    props: {
      prefixCls: PREFIX,
      orientation: 'left' as unknown as FlexProps['orientation'],
      vertical: true,
    },
    children: 'Content',
  },
  'orientation:unset': { props: { prefixCls: PREFIX }, children: 'Content' },

  'wrap:true': { props: { prefixCls: PREFIX, wrap: true }, children: 'Content' },
  'wrap:nowrap': { props: { prefixCls: PREFIX, wrap: 'nowrap' }, children: 'Content' },
  'wrap:wrap-reverse': { props: { prefixCls: PREFIX, wrap: 'wrap-reverse' }, children: 'Content' },
  // 非法 wrap 值 → 不产生类名（基线是 oracle，这里验证「不加」而不是「报错」）。
  'wrap:invalid': {
    props: { prefixCls: PREFIX, wrap: 'invalid' as unknown as FlexProps['wrap'] },
    children: 'Content',
  },

  'justify:center': { props: { prefixCls: PREFIX, justify: 'center' }, children: 'Content' },
  'justify:flex-start': {
    props: { prefixCls: PREFIX, justify: 'flex-start' },
    children: 'Content',
  },
  'justify:invalid': {
    props: { prefixCls: PREFIX, justify: 'invalid' as unknown as FlexProps['justify'] },
    children: 'Content',
  },
  'align:center': { props: { prefixCls: PREFIX, align: 'center' }, children: 'Content' },
  'align:flex-end': { props: { prefixCls: PREFIX, align: 'flex-end' }, children: 'Content' },
  // 垂直且未传 align → -align-stretch
  'align:stretch-implicit-vertical': {
    props: { prefixCls: PREFIX, vertical: true },
    children: 'Content',
  },
  // 垂直但显式 align → 不加 -align-stretch
  'align:explicit-align-vertical': {
    props: { prefixCls: PREFIX, vertical: true, align: 'center' },
    children: 'Content',
  },
  // 水平且未传 align → 也不加（stretch 只属于垂直）
  'align:stretch-implicit-horizontal': { props: { prefixCls: PREFIX }, children: 'Content' },

  'flex:string': { props: { prefixCls: PREFIX, flex: '2 2 100px' }, children: 'Content' },
  'flex:number': { props: { prefixCls: PREFIX, flex: 1 }, children: 'Content' },
  'gap:small': { props: { prefixCls: PREFIX, gap: 'small' }, children: 'Content' },
  'gap:medium': { props: { prefixCls: PREFIX, gap: 'medium' }, children: 'Content' },
  'gap:middle': { props: { prefixCls: PREFIX, gap: 'middle' }, children: 'Content' },
  'gap:large': { props: { prefixCls: PREFIX, gap: 'large' }, children: 'Content' },
  'gap:number': { props: { prefixCls: PREFIX, gap: 16 }, children: 'Content' },
  // ⭐ gap:0 也写内联 gap:'0'（isNonNullable 判据；与 Space 的 isValidGapNumber 不同）
  'gap:zero': { props: { prefixCls: PREFIX, gap: 0 }, children: 'Content' },
  'gap:string': { props: { prefixCls: PREFIX, gap: '10px' }, children: 'Content' },

  'component:section': { props: { prefixCls: PREFIX, component: 'section' }, children: 'Content' },
  'attrs:passthrough': {
    props: { prefixCls: PREFIX, id: 'my-flex', 'data-testid': 'x' },
    children: 'Content',
  },
  // justify/wrap/align 是声明过的 props → 不进 attrs → 不落 DOM（antd 的 omit 同义）
  'omit:justify-wrap-align': {
    props: { prefixCls: PREFIX, justify: 'center', wrap: true, align: 'center' },
    children: 'Content',
  },

  'ctx:className+style': {
    props: { prefixCls: PREFIX },
    children: 'Content',
    ctx: { components: { flex: { className: 'ctx-cls', style: { padding: '8px' } } } },
  },
  'ctx:vertical': {
    props: { prefixCls: PREFIX },
    children: 'Content',
    ctx: { components: { flex: { vertical: true } } },
  },
  'ctx:vertical+vertical:false': {
    props: { prefixCls: PREFIX, vertical: false },
    children: 'Content',
    ctx: { components: { flex: { vertical: true } } },
  },
  'ctx:rtl': {
    props: { prefixCls: PREFIX },
    children: 'Content',
    ctx: { direction: 'rtl' },
  },
  'style:ctx+prop-override': {
    props: { prefixCls: PREFIX, style: { margin: '2px' } },
    children: 'Content',
    ctx: { components: { flex: { style: { padding: '8px', margin: '4px' } } } },
  },
};

domContractTest('Flex', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：antd `ant-flex` vs 我们 `apollo-flex`。
    'prefix-cls:no-props': {
      reason: 'D6 · 默认前缀 apollo vs ant',
      deviationId: 'D6',
      diff: ['$/div[0]: 类名不同 [ant-flex] vs [apollo-flex]'],
    },
    // React 走 SSR 字符串（`flex:1` 原样输出），我们经真实 DOM 的 CSSOM 读回 ——
    // CSSOM 把 flex 简写展开为 `flex:1 1 0%`。两条声明在 CSS 语义上完全等价，
    // 差异只存在于序列化路径（PLATFORM）。
    'flex:number': {
      reason: 'PLATFORM · CSSOM 把 flex 简写展开（1 → 1 1 0%），语义等价',
      diff: ['$/div[0]: style 不同 [flex:1] vs [flex:110%]'],
    },
    // 同上：CSSOM 把 `gap:0` 规范化为 `gap:0px`。语义等价，序列化路径差异（PLATFORM）。
    'gap:zero': {
      reason: 'PLATFORM · CSSOM 规范化 gap:0 → gap:0px，语义等价',
      diff: ['$/div[0]: style 不同 [gap:0] vs [gap:0px]'],
    },
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Flex L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    const vnode = h(Flex, spec.props, spec.children ? () => spec.children : undefined);
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
