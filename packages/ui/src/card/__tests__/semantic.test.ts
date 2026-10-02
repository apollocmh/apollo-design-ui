/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/card.dom.json`，由 `tests/compat/baseline/card.mjs`
 * 直接调用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Card` 产出。
 * 机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 这个契约覆盖什么、不覆盖什么 ──────────────────────────────────────────────
 *
 * ✅ 覆盖：**四段结构**（head / cover / body / actions）的存在判据与层序、
 *    根类名的九个条件组合（`-loading` / `-bordered` / `-hoverable` / `-contain-grid` /
 *    `-contain-tabs` / `-small` / `-type-inner` / `-rtl` / `-css-var`）、
 *    `actions` 的**内联百分比宽度**、`Card.Grid` 的 vnode 身份判据、
 *    `tabList` 的两个判据（head 用真值 / `-contain-tabs` 用 `length`）、
 *    `Card.Meta` 的 avatar/section 层序、语义化 7 槽 + 5 槽（含**函数形态**）、
 *    `id` / `data-*` / `aria-*` 的落点。
 * ❌ 不覆盖：页签**浮层**（静态帧里不展开）、`:hover` 态、像素（那是 L6）。
 *
 * ── 🚨 三条必须记住的判据（都实测过）─────────────────────────────────────────
 *
 * 1. **每个用例都要包 `ConfigProvider`**：`Card.Meta` 的类名前缀取自
 *    `getPrefixCls('card', prefixCls)`（**根前缀** + `card`），而 `Card` 自己的
 *    `prefixCls` prop 是「**根前缀本身**」（传 `'apollo'` ⇒ 根类名就是 `apollo`，
 *    **没有** `-card` 后缀）。两条路都靠 Provider + prop 对齐。
 * 2. **`isRenderable` 的三态**：`''` / `false` 判假（不渲染 head）；`0` 判**真**。
 * 3. **`Card.Grid` 的 vnode 身份**是 `-contain-grid` 的唯一判据 ⇒ Vue 侧必须用
 *    `CardGrid`（与 `Card.Grid` **同一对象**）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { type CSSProperties, defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/card.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Card, CardGrid, CardMeta } from '../index';
import type { CardProps } from '../interface';

/** 两侧共用的前缀。与 `tests/compat/baseline/card.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ACardCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 与基线逐字相同的正文。 */
const body = () => [h('p', null, 'Card content'), h('p', null, 'Card content')];

const more = () => h('a', { href: '#more' }, 'More');

const TAB_LIST = [
  { key: 'tab1', tab: 'Tab 1' },
  { key: 'tab2', tab: 'Tab 2' },
];

const GRID_STYLE: CSSProperties = { width: '25%', textAlign: 'center' };

const grids = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    h(CardGrid, { key: i, style: GRID_STYLE }, { default: () => 'Content' }),
  );

const BP = { prefixCls: PREFIX };

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props: CardProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: Record<string, () => VNodeChild>;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'card:empty': { props: { ...BP } },
  'card:body-only': { props: { ...BP }, slots: { default: body } },
  'card:title-only': { props: { ...BP, title: 'Card title' } },
  'card:extra-only': { props: { ...BP, extra: more() } },
  'card:title-extra': {
    props: { ...BP, title: 'Card title', extra: more() },
    slots: { default: body },
  },
  'card:cover': {
    props: { ...BP, title: 'Card title', cover: h('img', { alt: 'c' }) },
    slots: { default: body },
  },
  'card:title-empty': { props: { ...BP, title: '' } },
  'card:title-false': { props: { ...BP, title: false } },
  'card:title-zero': { props: { ...BP, title: 0 } },
  'card:extra-empty': { props: { ...BP, extra: '' } },

  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'card:prefix-cls:no-props': { props: {}, slots: { default: body }, bare: true },
  'card:prefix-cls:custom': {
    props: { prefixCls: 'custom', title: 'T' },
    slots: { default: body },
  },

  'card:rtl': {
    props: { ...BP, title: 'T' },
    slots: { default: body },
    ctx: { direction: 'rtl' },
  },
  'card:small': {
    props: { ...BP, size: 'small', title: 'T', extra: more() },
    slots: { default: body },
  },
  'card:medium': { props: { ...BP, size: 'medium', title: 'T' }, slots: { default: body } },
  'card:borderless': {
    props: { ...BP, variant: 'borderless', title: 'T' },
    slots: { default: body },
  },
  'card:bordered-false': {
    props: { ...BP, bordered: false, title: 'T' },
    slots: { default: body },
  },
  'card:hoverable': { props: { ...BP, hoverable: true, title: 'T' }, slots: { default: body } },
  'card:type-inner': {
    props: { ...BP, type: 'inner', title: 'T', extra: more() },
    slots: { default: body },
  },

  'card:loading': {
    props: { ...BP, loading: true, title: 'T' },
    slots: { default: body },
  },
  'card:loading-no-title': { props: { ...BP, loading: true } },
  'card:head-style': {
    props: { ...BP, title: 'T', headStyle: { color: 'red' } },
    slots: { default: body },
  },
  'card:body-style': {
    props: { ...BP, bodyStyle: { padding: '1px' } },
    slots: { default: body },
  },

  'card:actions': {
    props: {
      ...BP,
      title: 'T',
      actions: [h('span', null, 'A'), h('span', null, 'B'), h('span', null, 'C')],
    },
    slots: { default: body },
  },
  'card:actions-one': {
    props: { ...BP, actions: [h('span', null, 'A')] },
    slots: { default: body },
  },
  'card:actions-empty': { props: { ...BP, actions: [] }, slots: { default: body } },

  'card:grid': { props: { ...BP, title: 'Card Title' }, slots: { default: () => grids(6) } },
  'card:grid-hoverable-false': {
    props: { ...BP, title: 'T' },
    slots: {
      default: () => [h(CardGrid, { hoverable: false, style: GRID_STYLE }, { default: () => 'G' })],
    },
  },
  'card:grid-no-head': { props: { ...BP }, slots: { default: () => grids(2) } },

  'card:tabs': {
    props: { ...BP, title: 'T', extra: more(), tabList: TAB_LIST },
    slots: { default: body },
  },
  'card:tabs-empty': { props: { ...BP, tabList: [] }, slots: { default: body } },
  'card:tabs-active-key': {
    props: { ...BP, tabList: TAB_LIST, activeTabKey: 'tab2' },
    slots: { default: body },
  },
  'card:tabs-default-active-key': {
    props: { ...BP, tabList: TAB_LIST, defaultActiveTabKey: 'tab2' },
    slots: { default: body },
  },
  'card:tabs-extra': {
    props: { ...BP, tabList: TAB_LIST, tabBarExtraContent: more() },
    slots: { default: body },
  },
  'card:tabs-tab-props': {
    props: { ...BP, tabList: TAB_LIST, tabProps: { centered: true } },
    slots: { default: body },
  },
  'card:tabs-label': {
    props: { ...BP, tabList: [{ key: 'a', tab: 'from-tab', label: 'from-label' }] },
    slots: { default: body },
  },
  'card:tabs-small': {
    props: { ...BP, size: 'small', tabList: TAB_LIST },
    slots: { default: body },
  },

  'card:meta': {
    props: { ...BP, cover: h('img', { alt: 'c' }) },
    slots: {
      default: () => [
        h(CardMeta, {
          avatar: h('span', { class: 'av' }, 'AV'),
          title: 'Card title',
          description: 'This is the description',
        }),
      ],
    },
  },
  'card:meta-avatar-only': {
    props: { ...BP },
    slots: { default: () => [h(CardMeta, { avatar: h('span', { class: 'av' }, 'AV') })] },
  },
  'card:meta-title-only': {
    props: { ...BP },
    slots: { default: () => [h(CardMeta, { title: 'Card title' })] },
  },
  'card:meta-description-only': {
    props: { ...BP },
    slots: { default: () => [h(CardMeta, { description: 'This is the description' })] },
  },
  'card:meta-prefix-cls': {
    props: { ...BP },
    slots: { default: () => [h(CardMeta, { prefixCls: 'custom', title: 'T' })] },
  },
  'card:meta-class-style': {
    props: { ...BP },
    slots: {
      default: () => [
        h(CardMeta, {
          className: 'meta-cls',
          style: { color: 'red' },
          title: 'T',
          'data-testid': 'meta',
        }),
      ],
    },
  },
  'card:meta-rtl': {
    props: { ...BP },
    slots: { default: () => [h(CardMeta, { title: 'T' })] },
    ctx: { direction: 'rtl' },
  },

  'card:class-names': {
    props: {
      ...BP,
      title: 'T',
      extra: more(),
      cover: h('img', { alt: 'c' }),
      actions: [h('span', null, 'A')],
      classNames: {
        root: 'c-root',
        header: 'c-header',
        body: 'c-body',
        extra: 'c-extra',
        title: 'c-title',
        actions: 'c-actions',
        cover: 'c-cover',
      },
    },
    slots: { default: body },
  },
  'card:styles': {
    props: {
      ...BP,
      title: 'T',
      extra: more(),
      cover: h('img', { alt: 'c' }),
      actions: [h('span', null, 'A')],
      styles: {
        root: { background: '#fafafa' },
        header: { opacity: 0.9 },
        body: { padding: '1px' },
        extra: { color: 'red' },
        title: { color: 'blue' },
        actions: { margin: '1px' },
        cover: { height: '1px' },
      },
    },
    slots: { default: body },
  },
  'card:class-names-fn': {
    props: {
      ...BP,
      size: 'small',
      variant: 'borderless',
      classNames: ({ props }: { props: CardProps }) => ({
        root: `sz-${String(props.size)}-vr-${String(props.variant)}`,
      }),
    },
    slots: { default: body },
  },
  'card:meta-class-names': {
    props: { ...BP },
    slots: {
      default: () => [
        h(CardMeta, {
          avatar: h('span', { class: 'av' }, 'AV'),
          title: 'T',
          description: 'D',
          classNames: {
            root: 'm-root',
            section: 'm-section',
            avatar: 'm-avatar',
            title: 'm-title',
            description: 'm-description',
          },
        }),
      ],
    },
  },

  'card:id': { props: { ...BP, id: 'card-1', title: 'T' }, slots: { default: body } },
  'card:attrs': {
    props: { ...BP, title: 'T', 'data-testid': 'card', 'aria-label': '卡片' },
    slots: { default: body },
  },
  'card:className': {
    props: { ...BP, className: 'user-cls', rootClassName: 'root-cls' },
    slots: { default: body },
  },
};

domContractTest('Card', {
  baseline,
  keepStyle: true,
  allow: {
    // 默认前缀不同（裁决 `prefix-cls-default` = A）：`bare` 用例下两侧的根前缀分别是
    // antd 的 `ant` 与我们的 `apollo` ⇒ **每一层带前缀的元素**都不同。
    // ⚠️ `-css-var` 由投影的 `CSSINJS_VAR_CLS` 对称剔除，**不算差异**。
    'card:prefix-cls:no-props': {
      reason: 'D1 · 默认根前缀 apollo vs ant（bare 用例）',
      deviationId: 'D1',
      diff: [
        '$/div[0]: 类名不同 [ant-card ant-card-bordered] vs [apollo-card apollo-card-bordered]',
        '$/div[0]/div[0]: 类名不同 [ant-card-body] vs [apollo-card-body]',
      ],
    },
    // React 侧是 SSR **字符串**（`#fafafa` 原样），Vue 侧经真实 DOM 的 CSSOM 读回时
    // 被规范化为 `rgb(250,250,250)` —— 语义完全等价（D114 家族）。
    'card:styles': {
      reason: 'PLATFORM · CSSOM 把十六进制色规范化成 rgb()，语义等价',
      deviationId: 'D114',
      diff: ['$/div[0]: style 不同 [background:#fafafa] vs [background:rgb(250,250,250)]'],
    },
    // tabs 家族的 **8 个用例**各有一条**继承自 Tabs** 的已知差异（U15）—— 与 Card 的
    // 实现无关：本仓的溢出触发器走**本仓 Dropdown**（= antd 那一层的组件），它按自己的
    // 契约给触发器补 `-trigger` 类；上游 Tabs 用的是 **rc 级** `@rc-component/dropdown`
    // （只加 `-open`）。Tabs 自己已登记同一条（`tabs/__tests__/semantic.test.ts` 的 U15），
    // 这里只是把它**传递**出来。
    // ⚠️ 8 个用例的差异**逐字相同**（同一个 Tabs 结构、同一个触发器）⇒ 用生成式声明，
    //    避免 8 份复制粘贴漂移。
    ...Object.fromEntries(
      [
        'card:tabs',
        'card:tabs-empty',
        'card:tabs-active-key',
        'card:tabs-default-active-key',
        'card:tabs-extra',
        'card:tabs-tab-props',
        'card:tabs-label',
        'card:tabs-small',
      ].map((id) => [
        id,
        {
          reason:
            'U15（继承自 Tabs）：本仓的溢出触发器走本仓 Dropdown（= antd 那层），它按自己的契约给触发器补 `-trigger` 类；上游 Tabs 用的是 rc 级 dropdown（只加 `-open`）。',
          deviationId: 'U15',
          diff: [
            '$/div[0]/div[0]/div[1]/div[0]/div[1]/button[0]: 类名不同 [apollo-tabs-nav-more] vs [apollo-tabs-dropdown-trigger apollo-tabs-nav-more]',
          ],
        },
      ]),
    ),
  },
  render: (id) => {
    const spec = specs[id];
    if (!spec) {
      throw new Error(`[Card L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    }
    const vnode = h(Card, spec.props as never, spec.slots as never);
    if (spec.bare) return vnode;
    const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
    return result;
  },
});
