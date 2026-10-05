/**
 * Breadcrumb —— 面包屑导航。对应 antd 6.6.4 的 `es/breadcrumb/`（805 行源码 / 16 文件）。
 *
 * 契约全文见 `docs/analysis/breadcrumb.md`（G1 产物）；下面只留**实现期最容易写错的判据**。
 *
 * ── 为什么是 `.ts` 而不是 `.vue`（`COMPONENT-RULES.md` §2 **条件 2**）────────────
 *
 * 「渲染树深度动态、由数据驱动的分支远超模板表达能力」：
 * ① 根的孩子是**异构**的（`BreadcrumbItem` / `BreadcrumbSeparator` 混排，由 `items`
 *    里的 `type === 'separator'` 决定），且每一项的**内容**是 `itemRender` 的返回值
 *    （`VNodeChild`）—— 模板里渲染它只能靠 `<component :is="() => vnode" />`，
 *    那会**每次换一个组件类型** ⇒ Vue 走「卸载 + 重挂」（`tour/demo/actions-render.vue`
 *    的既有陷阱）；
 * ② 两条互斥的数据通道（`items` / `children`）要**复用同一份 `crumbs`**，而 `children`
 *    分支必须 `cloneVNode` 逐个注入 `separator`；
 * ③ 类名是**多来源定序合并**（`clsx` 的实参顺序即契约）。
 * 理由同步登记在 `README.md` §3；`anchor/Anchor.ts` / `splitter/Splitter.ts` 是同类先例。
 *
 * ── 七条必须复刻的上游行为 ───────────────────────────────────────────────────
 *
 * 1. **三级兜底**：`separator ?? context.separator ?? '/'`；
 *    `dropdownIcon ?? context.dropdownIcon ?? <DownOutlined />`。
 * 2. **`items` 优先于 `routes`**；两者都没有 ⇒ 走 `children` 分支。
 * 3. **`paths` 逐项累积**，`href` 在 `paths.length && mergedPath !== undefined` 时
 *    **被覆盖**成 `#/${paths.join('/')}`（不是拼在 item 的 `href` 后面）。
 * 4. **最后一项的 `separator` 是 `''`** ⇒ `isRenderable('')` 为假 ⇒
 *    **不渲染**分隔符 `<li>`（已实测 rc-util 语义，见分析 §6.1）。
 * 5. **`itemRender` 只收 4 个实参**（没有 `href`）。
 * 6. **`children` 分支只 `cloneVNode` 两个 prop**（`separator` / `key`），
 *    不 pickAttrs、不注入 `prefixCls`。
 * 7. **`-rtl` 落在根 `<nav>` 上**；`ref` 暴露的是 `{ nativeElement }` 而不是元素本身。
 *
 * ── 🚨 两处**刻意不照抄**上游的地方（都是平台原因，DOM 结果相同）──────────────
 *
 * - 上游把 `className` / `style` / `onClick` / `pickAttrs(item)` 一并传给
 *   `InternalBreadcrumbItem`，而它**全部忽略**（解构里没有这些键、也不 spread 到 `<li>`）。
 *   本仓**不传** —— 传了会落进 `attrs`，而 `InternalBreadcrumbItem` 是**多根**（`li` + 分隔符）
 *   ⇒ Vue 会报 `Extraneous non-props attributes` 并整批丢弃。**有效 DOM 完全相同**。
 * - 上游的 `hashId` 本仓没有（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）。
 */

import { DownOutlined } from '@apollo-design/icons';
import { toArray, useDevWarning } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  mergeProps,
  type PropType,
  provide,
  reactive,
  ref,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { BreadcrumbItem, InternalBreadcrumbItem } from './BreadcrumbItem';
import { BreadcrumbSeparator } from './BreadcrumbSeparator';
import { type BreadcrumbContextValue, breadcrumbContextKey } from './context';
import type {
  BreadcrumbItemInput,
  BreadcrumbParams,
  BreadcrumbProps,
  BreadcrumbSemanticClassNames,
  BreadcrumbSemanticStyles,
} from './interface';
import { useItemRender } from './useItemRender';
import { useItems } from './useItems';

/**
 * `path` 的 `:param` 替换（上游 `getPath`）。
 *
 * ⚠️ `path === undefined` ⇒ **原样返回 `undefined`**（调用方据此**不** push 进 `paths`）。
 * ⚠️ `params[key]` 为 `undefined` 时会被 `String()` 成字面量 `'undefined'` ——
 * 上游的 `replace` 也是这个行为（`replace` 的第二参不是字符串就 `String()`）。
 */
function getPath(params: BreadcrumbParams, path?: string): string | undefined {
  if (path === undefined) {
    return path;
  }
  let mergedPath = (path || '').replace(/^\//, '');
  Object.keys(params).forEach((key) => {
    mergedPath = mergedPath.replace(`:${key}`, String(params[key]));
  });
  return mergedPath;
}

export const Breadcrumb = defineComponent({
  name: 'ABreadcrumb',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    separator: {
      type: null as unknown as PropType<BreadcrumbProps['separator']>,
      default: undefined,
    },
    dropdownIcon: {
      type: null as unknown as PropType<BreadcrumbProps['dropdownIcon']>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<BreadcrumbProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<BreadcrumbProps['styles']>,
      default: undefined,
    },
    items: {
      type: Array as PropType<BreadcrumbItemInput[] | undefined>,
      default: undefined,
    },
    routes: {
      type: Array as PropType<BreadcrumbItemInput[] | undefined>,
      default: undefined,
    },
    params: {
      type: Object as PropType<BreadcrumbParams | undefined>,
      default: undefined,
    },
    itemRender: {
      type: Function as PropType<BreadcrumbProps['itemRender']>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs, expose }) {
    const context = useComponentConfig<{
      className?: string;
      style?: Record<string, string | number>;
      classNames?: BreadcrumbSemanticClassNames;
      styles?: BreadcrumbSemanticStyles;
      separator?: VNodeChild;
      dropdownIcon?: VNodeChild;
    }>('breadcrumb');
    const direction = useDirection();

    const prefixCls = computed(() => context.getPrefixCls('breadcrumb', props.prefixCls));
    /** 上游 `params = {}`（默认空对象 —— 空对象会让参数正则退化成 `:()`，见分析 §2.5）。 */
    const params = computed<BreadcrumbParams>(() => props.params ?? {});

    // ======================= 三级兜底 =======================
    const mergedSeparator = computed<VNodeChild>(() => props.separator ?? context.separator ?? '/');
    const mergedDropdownIcon = computed<VNodeChild>(
      () => props.dropdownIcon ?? context.dropdownIcon ?? h(DownOutlined),
    );

    // ======================= 语义化 =======================
    /**
     * ⚠️ 与 Spin / Result / masonry 同法：`useMergeSemantic` 在 `setup` 期捕获 props 对象
     * ⇒ 传一个**身份稳定、内容会变**的普通对象（函数式变体读到的 `separator` 必须是
     * **解析后**的值 —— 上游传的是 `mergedProps = {...props, separator: mergedSeparator}`）。
     */
    const semanticProps: BreadcrumbProps = { ...props };
    watchEffect(() => {
      Object.assign(semanticProps, props, { separator: mergedSeparator.value });
    });

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      BreadcrumbProps,
      BreadcrumbSemanticClassNames,
      BreadcrumbSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      semanticProps,
    );

    // ======================= 告警（上游 :170-196）=======================
    const devWarning = useDevWarning('Breadcrumb');
    const items = useItems(
      () => props.items,
      () => props.routes,
    );

    /**
     * 🚨 **告警必须在 `render` 里做，不能在 `watchEffect` 里做**：
     * Vue 的插槽函数只允许在渲染期调用，在 render 之外调用会打
     * `Slot "default" invoked outside of the render function` 的 dev 告警
     * （实测：它会把真正的 usage 告警淹没在控制台里）。
     * 上游是 React 函数组件 —— 函数体每次渲染都跑，本来就等于「渲染期」。
     *
     * ⚠️ 同时**只取一次**插槽（`getChildList` 惰性缓存）：`items` 存在时上游**不读**
     * children，本仓也不读（读一次会白跑用户的插槽函数）。
     */
    let childListCache: VNode[] | null = null;
    const getChildList = (): VNode[] => {
      if (childListCache === null) {
        childListCache = slots.default ? toArray(slots.default()) : [];
      }
      return childListCache;
    };

    /** 在渲染期跑上游 `:170-196` 的三条告警。 */
    const runDevWarnings = (mergedItems: BreadcrumbItemInput[] | null): void => {
      devWarning.deprecated(!props.routes, 'routes', 'items');

      if (!mergedItems || mergedItems.length === 0) {
        const childList = getChildList();
        devWarning.deprecated(
          childList.length === 0,
          'Breadcrumb.Item and Breadcrumb.Separator',
          'items',
        );
        // 上游用 `element.type.__ANT_BREADCRUMB_ITEM`（函数组件上的标记属性）；
        // Vue 的对应物是**组件身份比较**（vnode.type 就是组件对象）。
        childList.forEach((element) => {
          if (!element || typeof element !== 'object') {
            return;
          }
          const type = (element as { type?: unknown }).type;
          devWarning(
            type === BreadcrumbItem || type === BreadcrumbSeparator,
            "Only accepts Breadcrumb.Item and Breadcrumb.Separator as it's children",
          );
        });
      }
    };

    // ======================= 渲染 =======================
    const itemRender = useItemRender(
      () => prefixCls.value,
      () => props.itemRender,
    );

    const nativeElementRef = ref<HTMLElement | null>(null);
    expose({ nativeElement: nativeElementRef });

    const rootClassNames = computed(() => [
      prefixCls.value,
      context.className,
      { [`${prefixCls.value}-rtl`]: direction.value === 'rtl' },
      mergedClassNames.value.root,
      // 本仓无 hashId（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）
      `${prefixCls.value}-css-var`,
    ]);

    // ======================= context（语义化两个槽）=======================
    /**
     * 🚨 必须是**身份稳定**的 `reactive` 对象：`inject` 只在 `setup` 期解析一次，
     * 子组件要在语义化槽变化时跟着变，就必须读到被追踪的值（见 `context.ts` 的长注释）。
     */
    const contextValue = reactive<BreadcrumbContextValue>({});
    watchEffect(() => {
      Object.assign(contextValue, {
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
      });
    });
    provide(breadcrumbContextKey, contextValue);

    return () => {
      const mergedItems = items.value;
      runDevWarnings(mergedItems);

      let crumbs: VNodeChild = null;

      if (mergedItems && mergedItems.length > 0) {
        const paths: string[] = [];
        const itemRoutes = props.items || props.routes || [];

        crumbs = mergedItems.map((item, index) => {
          // ⚠️ 刻意**不解构** `className` / `onClick` / `style`：
          //    它们由 `itemRender` → `renderItem` 消费（`className` 拼到链接元素、
          //    `onClick` 挂到链接元素、`style` 上游本来就丢弃）。
          //    在这里解构出来只会是「未使用变量」（biome 会报 error）。
          const { path, key, type, menu, separator: itemSeparator, dropdownProps } = item;
          const mergedPath = getPath(params.value, path);

          if (mergedPath !== undefined) {
            paths.push(mergedPath);
          }

          const mergedKey = key ?? index;

          if (type === 'separator') {
            return h(BreadcrumbSeparator, { key: mergedKey }, { default: () => itemSeparator });
          }

          const isLastItem = index === mergedItems.length - 1;

          let href = item.href;
          if (paths.length && mergedPath !== undefined) {
            href = `#/${paths.join('/')}`;
          }

          return h(
            InternalBreadcrumbItem,
            {
              key: mergedKey,
              // ⚠️ 只传 `InternalBreadcrumbItem` **声明过**的键：上游还会传
              //    `className` / `style` / `onClick` / `pickAttrs(item)`，但它**全部忽略**；
              //    本仓传了会落进 attrs，而它是多根组件 ⇒ Vue 报 Extraneous 并丢弃。
              menu,
              dropdownProps,
              dropdownIcon: mergedDropdownIcon.value,
              href,
              separator: isLastItem ? '' : mergedSeparator.value,
              prefixCls: prefixCls.value,
            },
            {
              default: () => itemRender(item, params.value, itemRoutes, paths, href),
            },
          );
        });
      } else if (slots.default) {
        const childList = getChildList();
        const childrenLength = childList.length;

        crumbs = childList.map((element, index) => {
          if (!element) {
            return element;
          }

          const isLastItem = index === childrenLength - 1;

          return cloneVNode(element, {
            separator: isLastItem ? '' : mergedSeparator.value,
            key: index,
          });
        });
      }

      // 根 `class` / `style` 是 Vue 原生 attrs：`attrs` 排在语义根样式**之后**
      // ⇒ 调用方同名样式优先（与原先 `props.style` 参与合并的优先级一致）。
      return h(
        'nav',
        mergeProps(styleAttrs(mergedStyles.value.root), attrs, {
          ref: nativeElementRef,
          class: rootClassNames.value,
        }),
        [h('ol', null, [crumbs])],
      );
    };
  },
});

export default Breadcrumb;
