/** Data routes and native Item/Separator composition share one Vue-owned navigation tree. */
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
  ref,
  type SlotsType,
  type VNode,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { BreadcrumbItem, InternalBreadcrumbItem } from './BreadcrumbItem';
import { BreadcrumbSeparator } from './BreadcrumbSeparator';
import { breadcrumbContextKey } from './context';
import type {
  BreadcrumbItemInput,
  BreadcrumbProps,
  BreadcrumbSemanticClassNames,
  BreadcrumbSemanticStyles,
  BreadcrumbSlots,
} from './interface';
import { useBreadcrumbTheme } from './use-breadcrumb-theme';
import { getBreadcrumbName, renderItem, substituteParams } from './useItemRender';
import { useItems } from './useItems';

const contentSlots: SlotsType<BreadcrumbSlots> = {};

export const Breadcrumb = defineComponent({
  name: 'ABreadcrumb',
  inheritAttrs: false,
  slots: contentSlots,
  props: {
    prefixCls: { type: String as PropType<string | undefined>, default: undefined },
    separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    dropdownIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<BreadcrumbProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<BreadcrumbProps['styles']>,
      default: undefined,
    },
    items: { type: Array as PropType<BreadcrumbItemInput[] | undefined>, default: undefined },
    routes: { type: Array as PropType<BreadcrumbItemInput[] | undefined>, default: undefined },
    params: { type: Object as PropType<BreadcrumbProps['params']>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const config = useComponentConfig<{
      className?: string;
      style?: Record<string, string | number>;
      classNames?: BreadcrumbProps['classNames'];
      styles?: BreadcrumbProps['styles'];
      separator?: VNodeChild;
      dropdownIcon?: VNodeChild;
    }>('breadcrumb');
    const direction = useDirection();
    const prefixCls = computed(() => config.getPrefixCls('breadcrumb', props.prefixCls));
    const themeStyle = useBreadcrumbTheme(() => prefixCls.value);
    const params = computed(() => props.params ?? {});
    const mergedSeparator = computed(() => props.separator ?? config.separator ?? '/');
    const mergedDropdownIcon = computed(
      () => props.dropdownIcon ?? config.dropdownIcon ?? h(DownOutlined),
    );
    const { classNames, styles } = useMergeSemantic<
      BreadcrumbProps,
      BreadcrumbSemanticClassNames,
      BreadcrumbSemanticStyles
    >(
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
      () => ({
        ...props,
        separator: mergedSeparator.value,
        dropdownIcon: mergedDropdownIcon.value,
      }),
    );

    // Getters keep the same provider identity while every consumer reads current values.
    provide(breadcrumbContextKey, {
      get prefixCls() {
        return prefixCls.value;
      },
      get classNames() {
        return classNames.value;
      },
      get styles() {
        return styles.value;
      },
      separator: () => (slots.separator ? slots.separator() : mergedSeparator.value),
      dropdownIcon: () => (slots.dropdownIcon ? slots.dropdownIcon() : mergedDropdownIcon.value),
    });

    const nativeElement = ref<HTMLElement | null>(null);
    expose({ nativeElement });
    const items = useItems(
      () => props.items,
      () => props.routes,
    );
    const warning = useDevWarning('Breadcrumb');
    const checkChildren = (children: VNode[]) => {
      for (const child of children) {
        warning(
          child.type === BreadcrumbItem || child.type === BreadcrumbSeparator,
          "Only accepts Breadcrumb.Item and Breadcrumb.Separator as it's children",
        );
      }
    };

    return () => {
      warning.deprecated(props.routes === undefined, 'routes', 'items');
      const mergedItems = items.value;
      let crumbs: VNodeChild;
      if (mergedItems !== null) {
        const paths: string[] = [];
        crumbs = mergedItems.map((item, index) => {
          const key = item.key ?? index;
          if (item.type === 'separator') {
            return h(
              BreadcrumbSeparator,
              { key },
              item.separator === undefined ? {} : { default: () => item.separator },
            );
          }
          const path =
            item.path === undefined
              ? undefined
              : substituteParams(item.path.replace(/^\//, ''), params.value);
          if (path !== undefined) paths.push(path);
          const href = path !== undefined ? `#/${paths.join('/')}` : item.href;
          const scope = {
            route: item,
            params: params.value,
            routes: props.items ?? props.routes ?? [],
            paths: [...paths],
            href,
          };
          return h(
            InternalBreadcrumbItem,
            {
              key,
              menu: item.menu,
              dropdownProps: item.dropdownProps,
              href,
              isLast: index === mergedItems.length - 1,
            },
            {
              default: () =>
                slots.itemRender
                  ? slots.itemRender(scope)
                  : renderItem(prefixCls.value, item, getBreadcrumbName(item, params.value), href),
            },
          );
        });
      } else {
        const children = slots.default ? toArray(slots.default()) : [];
        checkChildren(children);
        crumbs = children.map((child, index) =>
          cloneVNode(child, {
            key: child.key ?? index,
            ...(child.type === BreadcrumbItem
              ? { __apolloBreadcrumbLast: index === children.length - 1 }
              : {}),
          }),
        );
      }
      return h(
        'nav',
        mergeProps(styleAttrs(themeStyle.value), styleAttrs(styles.value.root), attrs, {
          ref: nativeElement,
          class: [
            prefixCls.value,
            config.className,
            { [`${prefixCls.value}-rtl`]: direction.value === 'rtl' },
            classNames.value.root,
            `${prefixCls.value}-css-var`,
          ],
        }),
        [h('ol', null, crumbs)],
      );
    };
  },
});
export default Breadcrumb;
