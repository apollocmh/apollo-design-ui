/**
 * 单个面包屑项（上游 `es/breadcrumb/BreadcrumbItem.tsx`，122 行）。
 *
 * 两个组件：
 *   - `InternalBreadcrumbItem` —— **导出**（上游同名导出），渲染 `<li>` + 分隔符。
 *     它**不接 `className` / `style`**（上游的解构里就没有这两个键）。
 *   - `BreadcrumbItem` —— 公开的 `Breadcrumb.Item`（**已废弃**），薄壳：
 *     取 `prefixCls` → 用 `renderItem` 造出内容 → 交给 `InternalBreadcrumbItem`。
 *
 * ── 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 条件 1）──────────────
 *
 * 两条：① 内容是 `renderItem(...)` 的**返回值**（`VNodeChild`），模板里渲染 vnode 要
 * `<component :is="() => vnode" />`，那会每次换组件类型 ⇒ 卸载重挂；
 * ② 根**可能返回 `null`**（`link` 为 null 时整项不渲染），模板写不出「根是 null」。
 * 理由同步登记在 `README.md` §3。
 *
 * ── 🚨 四条上游判据（容易写错）────────────────────────────────────────────────
 *
 * 1. **`link` 为 null ⇒ 整项返回 `null`**（不是渲染空 `<li>`）。
 * 2. **`separator` 只在 `isRenderable(separator)` 为真时才渲染分隔符** ——
 *    最后一项的 `separator=''` 因此**不渲染** `<li class="-separator">`（分析 §6.1）。
 * 3. `menu` 存在时用 `Dropdown placement="bottom"` 包一层
 *    `<span class="{p}-overlay-link">{children}{dropdownIcon}</span>`。
 *    ⚠️ `menu.items` 的 `path` 会被拼成 `<a href={href + path}>` —— `href` 为
 *    `undefined` 时上游会拼出字面量 `"undefined/…"`。**照抄**（别「顺手修」）。
 * 4. ⚠️ **`className` / `style` 都不进 `<li>`**：`<li>` 的类名/样式恒为
 *    `semantic.item`；`item.className` 由 `renderItem` 拼到**链接元素**上，
 *    `item.style` 则**落不到 DOM**（分析 §6.2，待 G10 的 oracle 定论）。
 */

import { isNonNullable, isRenderable } from '@apollo-design/utils';
import {
  Comment,
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  type PropType,
  type VNodeChild,
} from 'vue';
import { useConfigContext } from '../config-provider/context';
// ⚠️ **叶子模块**导入（registry 的 `leafModules` 列了 `dropdown/dropdown`）——
//    走 `../dropdown` 的 index 会形成环（`dropdown` 的 index 会拉进 Menu 等）。
import Dropdown from '../dropdown/Dropdown';
import type { DropdownProps } from '../dropdown/interface';
import { BreadcrumbSeparator } from './BreadcrumbSeparator';
import { breadcrumbContextKey } from './context';
import type { BreadcrumbItemInput, BreadcrumbItemProps } from './interface';
import { renderItem } from './useItemRender';

/** 造出「可能被 Dropdown 包一层」的节点（上游 `renderBreadcrumbNode`）。 */
function renderBreadcrumbNode(
  prefixCls: string,
  breadcrumbItem: VNodeChild,
  props: {
    menu?: BreadcrumbItemProps['menu'];
    dropdownProps?: BreadcrumbItemProps['dropdownProps'];
    dropdownIcon?: VNodeChild;
    href?: string | undefined;
  },
): VNodeChild {
  const { menu, dropdownProps, dropdownIcon, href } = props;

  if (!menu) {
    return breadcrumbItem;
  }

  const { items, ...menuProps } = menu;

  const mergedDropdownProps: DropdownProps = {
    ...dropdownProps,
    menu: {
      ...menuProps,
      items: items?.map(({ key, title, label, path, ...itemProps }, index) => {
        let mergedLabel: VNodeChild = label ?? title;

        if (path) {
          // ⚠️ `href` 为 undefined 时上游就是拼出 `"undefined" + path` —— 照抄
          mergedLabel = h('a', { href: `${href}${path}` }, [mergedLabel]);
        }

        return {
          ...itemProps,
          // ⚠️ 本仓 `MenuItemType.key` 是 **`string`**（上游是 `React.Key`）⇒
          //    在这里 `String()` 归一。DOM 等价：React 本来就会把数字 key 串化。
          key: String(key ?? index),
          label: mergedLabel,
        };
      }),
    },
  };

  return h(
    // ⚠️ 叶子模块导入（registry 的 `leafModules` 列了 `dropdown/dropdown`）——
    //    走 `../dropdown` 的 index 会形成环。
    Dropdown,
    { placement: 'bottom', ...mergedDropdownProps },
    {
      default: () =>
        h('span', { class: `${prefixCls}-overlay-link` }, [breadcrumbItem, dropdownIcon]),
    },
  );
}

/**
 * 渲染 `<li>` + 分隔符（上游 `InternalBreadcrumbItem`）。
 *
 * ⚠️ **没有 `className` / `style` prop** —— 上游的解构里就没有它们。
 */
export const InternalBreadcrumbItem = defineComponent({
  name: 'ABreadcrumbItemInternal',
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    href: { type: String as PropType<string | undefined>, default: undefined },
    separator: {
      type: null as unknown as PropType<BreadcrumbItemProps['separator']>,
      default: '/',
    },
    menu: {
      type: Object as PropType<BreadcrumbItemProps['menu']>,
      default: undefined,
    },
    dropdownProps: {
      type: Object as PropType<BreadcrumbItemProps['dropdownProps']>,
      default: undefined,
    },
    dropdownIcon: {
      type: null as unknown as PropType<BreadcrumbItemProps['dropdownIcon']>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const context = inject(breadcrumbContextKey, undefined);

    return () => {
      const children = slots.default?.();

      /**
       * 🚨 Vue 的插槽会把 `null` **归一成 `Comment` vnode**
       * （`normalizeSlotValue` ⇒ `[normalizeVNode(null)]`）⇒ 直接
       * `isNonNullable(children)` 恒为真、**空项也会被渲染出来**。
       *
       * 这里还原成上游的「`children` 是 `null`」语义。⚠️ **只认 `Comment`**：
       * `[Text('')]` 要**保留** —— 上游的 `''` 是**有值**的（`isNonNullable('')` 为真），
       * 只是 `renderItem` 的 `isRenderable` 会把它拦下；自定义 `itemRender` 返回 `''` 时
       * 上游**会**渲染这个空 `<li>`，本仓同判。
       */
      const isEmptyContent =
        children !== undefined &&
        children.length > 0 &&
        children.every((node) => isVNode(node) && node.type === Comment);
      const breadcrumbItem: VNodeChild = isEmptyContent ? null : children;

      const link = renderBreadcrumbNode(props.prefixCls ?? '', breadcrumbItem, {
        menu: props.menu,
        dropdownProps: props.dropdownProps,
        dropdownIcon: props.dropdownIcon,
        href: props.href,
      });

      if (!isNonNullable(link)) {
        return null;
      }

      return [
        h(
          'li',
          {
            class: [`${props.prefixCls}-item`, context?.classNames?.item],
            style: context?.styles?.item,
          },
          [link],
        ),
        isRenderable(props.separator)
          ? h(BreadcrumbSeparator, null, { default: () => props.separator })
          : null,
      ];
    };
  },
});

/**
 * 公开的 `Breadcrumb.Item`（**已废弃**，上游 `BreadcrumbItem`）。
 *
 * 薄壳：解析 `prefixCls` → 用 `renderItem` 造内容 → 交给 `InternalBreadcrumbItem`。
 * ⚠️ 上游把 `className` / `style` 一起塞进 `restProps` 传给 `renderItem`
 * （`className` 落在链接元素上、`style` 被丢弃）—— 本仓照抄。
 */
export const BreadcrumbItem = defineComponent({
  name: 'ABreadcrumbItem',
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    href: { type: String as PropType<string | undefined>, default: undefined },
    separator: {
      type: null as unknown as PropType<BreadcrumbItemProps['separator']>,
      default: undefined,
    },
    menu: {
      type: Object as PropType<BreadcrumbItemProps['menu']>,
      default: undefined,
    },
    dropdownProps: {
      type: Object as PropType<BreadcrumbItemProps['dropdownProps']>,
      default: undefined,
    },
    dropdownIcon: {
      type: null as unknown as PropType<BreadcrumbItemProps['dropdownIcon']>,
      default: undefined,
    },
    onClick: {
      type: Function as PropType<BreadcrumbItemProps['onClick']>,
      default: undefined,
    },
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: {
      type: Object as PropType<BreadcrumbItemProps['style']>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const config = useConfigContext();
    const prefixCls = computed(() => config.getPrefixCls('breadcrumb', props.prefixCls));

    return () => {
      const { prefixCls: _ignoredPrefixCls, href, ...restProps } = props;

      return h(
        InternalBreadcrumbItem,
        {
          // 🚨 **只传 `InternalBreadcrumbItem` 声明过的键**（与 `Breadcrumb.ts` 同判）：
          //    上游把 `className` / `style` / `onClick` 一起 spread 过去，但它**全部忽略**
          //    （`className` 由 `renderItem` 拼到链接元素上、`onClick` 也是）；
          //    本仓若照抄会落进 `attrs`，而它是**多根**（`li` + 分隔符）⇒
          //    Vue 报 `Extraneous non-props attributes` 并整批丢弃（实测）。
          //    有效 DOM 完全相同。
          separator: restProps.separator,
          menu: restProps.menu,
          dropdownProps: restProps.dropdownProps,
          dropdownIcon: restProps.dropdownIcon,
          href,
          prefixCls: prefixCls.value,
        },
        {
          // 上游：`renderItem(prefixCls, restProps as ItemType, children, href)`
          default: () =>
            renderItem(prefixCls.value, restProps as BreadcrumbItemInput, slots.default?.(), href),
        },
      );
    };
  },
});

export default BreadcrumbItem;
