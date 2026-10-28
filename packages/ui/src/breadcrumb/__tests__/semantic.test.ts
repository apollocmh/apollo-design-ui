/** Original 30 React reference cases are retained. Exact finite differences for
 * current Vue ownership are reviewed in contract-differences.json; native replacement
 * behavior is exercised by contract-audit.test.ts and browser/breadcrumb-contracts.mjs.
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/breadcrumb.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Breadcrumb } from '../Breadcrumb';
import { BreadcrumbItem } from '../BreadcrumbItem';
import { BreadcrumbSeparator } from '../BreadcrumbSeparator';
import type {
  BreadcrumbItemInput,
  BreadcrumbItemSlotProps,
  BreadcrumbProps,
  BreadcrumbSlots,
} from '../interface';
import breadcrumbContractDifferences from './contract-differences.json';

/** 两侧共用的前缀。与 `tests/compat/baseline/breadcrumb.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 在指定的 ConfigProvider 上下文下渲染（Vue 侧对应物是 `provide`）。 */
function withConfig(config: Partial<ConfigContextValue>, children: () => VNodeChild) {
  return defineComponent({
    name: 'ABreadcrumbCompatConfigProbe',
    setup() {
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return () => children();
    },
  });
}

/** 与基线逐字相同的 items。 */
const ITEMS: BreadcrumbItemInput[] = [
  { title: 'Home', href: '#/home' },
  { title: 'List', href: '#/list' },
  { title: 'Detail' },
];

const base = { prefixCls: PREFIX, items: ITEMS };

/** 用例规格表：id → Vue 侧的 props / slots / ctx。 */
const specs: Record<
  string,
  {
    props: BreadcrumbProps & Record<string, unknown>;
    /** ⚠️ 本仓的 `children` 是**默认插槽**（规则 C19）⇒ 单独一个字段，不能塞进 props */
    slots?: BreadcrumbSlots;
    ctx?: Partial<ConfigContextValue>;
    /** 不包 ConfigProvider（用来钉「默认根前缀」的差异 D1）。 */
    bare?: boolean;
  }
> = {
  'breadcrumb:basic': { props: { ...base } },
  // ⚠️ **不包 ConfigProvider** ⇒ 根前缀回落各家默认值（antd `ant` vs 我们 `apollo`）⇒ D1
  'breadcrumb:prefix-cls:no-props': { props: { items: ITEMS }, bare: true },
  'breadcrumb:prefix-cls:custom': { props: { prefixCls: 'custom', items: ITEMS } },
  'breadcrumb:rtl': { props: { ...base }, ctx: { direction: 'rtl' } },
  'breadcrumb:items-empty': { props: { ...base, items: [] } },

  'breadcrumb:separator-default': { props: { ...base } },
  'breadcrumb:separator-custom': { props: { ...base, separator: '>' } },
  'breadcrumb:separator-empty': { props: { ...base, separator: '' } },
  'breadcrumb:separator-item': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        { type: 'separator', separator: '|' },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:separator-item-empty': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        { type: 'separator', separator: '' },
        { title: 'Detail' },
      ],
    },
  },

  'breadcrumb:path': {
    props: {
      ...base,
      params: { id: '7' },
      items: [
        { title: 'Home', path: 'home' },
        { title: 'List :id', path: 'list/:id' },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:path-slash': {
    props: { ...base, items: [{ title: 'A', path: '/a' }, { title: 'B' }] },
  },
  'breadcrumb:params-empty': { props: { ...base, items: [{ title: 'x:y:z' }] } },
  'breadcrumb:params-falsy': {
    props: { ...base, params: { id: 0, name: '' }, items: [{ title: 'a-:id-b-:name' }] },
  },
  'breadcrumb:href-direct': { props: { ...base, items: [{ title: 'A', href: 'https://x.dev' }] } },
  'breadcrumb:title-vnode': {
    props: {
      ...base,
      params: { id: '7' },
      items: [{ title: h('span', { class: 'title-span' }, ':id') }],
    },
  },
  'breadcrumb:title-empty': { props: { ...base, items: [{ title: '' }, { title: 'B' }] } },

  'breadcrumb:routes': {
    props: {
      prefixCls: PREFIX,
      routes: [
        { breadcrumbName: 'ignored', title: 'parent-title' },
        {
          breadcrumbName: 'child',
          children: [{ breadcrumbName: 'child-name', title: 'ignored-child-title' }],
        },
      ],
    },
  },
  'breadcrumb:items-over-routes': { props: { ...base, routes: [{ title: 'from-routes' }] } },
  'breadcrumb:children': {
    props: { prefixCls: PREFIX },
    slots: {
      default: () => [
        h(BreadcrumbItem, { key: 'a' }, { default: () => 'A' }),
        h(BreadcrumbSeparator, { key: 's' }, { default: () => '|' }),
        h(BreadcrumbItem, { key: 'b' }, { default: () => 'B' }),
      ],
    },
  },
  'breadcrumb:children-separator': {
    props: { prefixCls: PREFIX, separator: '>' },
    slots: {
      default: () => [
        h(BreadcrumbItem, { key: 'a' }, { default: () => 'A' }),
        h(BreadcrumbItem, { key: 'b' }, { default: () => 'B' }),
      ],
    },
  },

  'breadcrumb:item-render': {
    props: { ...base },
    slots: {
      itemRender: ({ route, params, routes, paths }: BreadcrumbItemSlotProps) =>
        h(
          'span',
          { class: 'custom-render' },
          `${String(route.title)}|${Object.keys(params).length}|${routes.length}|${paths.join(',')}`,
        ),
    },
  },

  'breadcrumb:item-class-style': {
    props: {
      ...base,
      items: [{ title: 'A', href: '#/a', className: 'item-cls', style: { color: 'red' } }],
    },
  },
  'breadcrumb:item-data-aria': {
    props: {
      ...base,
      items: [{ title: 'A', href: '#/a', 'data-testid': 'x', 'aria-label': 'A 项' }],
    },
  },
  'breadcrumb:key-number': {
    props: {
      ...base,
      items: [
        { key: 0, title: 'A' },
        { key: 1, title: 'B' },
      ],
    },
  },

  'breadcrumb:menu': {
    props: {
      ...base,
      items: [
        { title: 'Home', href: '#/home' },
        {
          title: 'Group',
          menu: {
            items: [
              { key: 'a', label: 'A' },
              { key: 'b', title: 'B' },
              { key: 'c', label: 'C', path: '/c' },
            ],
          },
        },
        { title: 'Detail' },
      ],
    },
  },
  'breadcrumb:dropdown-icon': {
    props: {
      ...base,
      dropdownIcon: h('span', { class: 'my-icon' }, 'v'),
      items: [
        { title: 'Home', href: '#/home' },
        { title: 'Group', menu: { items: [{ key: 'a', label: 'A' }] } },
      ],
    },
  },

  'breadcrumb:class-names': {
    props: {
      ...base,
      classNames: { root: 'custom-root', item: 'custom-item', separator: 'custom-separator' },
    },
  },
  'breadcrumb:styles': {
    props: {
      ...base,
      classNames: { root: 'custom-root' },
      styles: {
        root: { background: '#fafafa' },
        item: { opacity: 0.8 },
        separator: { color: 'red' },
      },
    },
  },
  'breadcrumb:class-names-fn': {
    props: {
      ...base,
      separator: '>',
      classNames: ({ props }) => ({ root: `sep-${String(props.separator)}`, item: 'fn-item' }),
    },
  },
};

export const renderBreadcrumbReferenceCase = (id: string): DomRenderResult => {
  const spec = specs[id];
  if (!spec) {
    throw new Error(`[Breadcrumb L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
  }
  const vnode = h(Breadcrumb, spec.props as never, spec.slots as never);
  if (spec.bare) return vnode;
  const result: DomRenderResult = spec.ctx ? withConfig(spec.ctx, () => vnode) : vnode;
  return result;
};

domContractTest('Breadcrumb', {
  baseline,
  keepStyle: true,
  allow: breadcrumbContractDifferences,
  render: renderBreadcrumbReferenceCase,
});
