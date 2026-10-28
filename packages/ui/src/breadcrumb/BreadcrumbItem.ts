import { DownOutlined } from '@apollo-design/icons';
import { useControlledValue } from '@apollo-design/utils';
import {
  Comment,
  computed,
  defineComponent,
  h,
  inject,
  isVNode,
  mergeProps,
  nextTick,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
  watch,
} from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
// Keep the runtime dependency on the leaf module to avoid Dropdown/Menu barrel cycles.
import Dropdown from '../dropdown/Dropdown';
import type { MenuItemType } from '../menu/interface';
import { BreadcrumbSeparator } from './BreadcrumbSeparator';
import { breadcrumbContextKey } from './context';
import type { BreadcrumbItemProps, BreadcrumbItemSlots } from './interface';
import { hasBreadcrumbContent, renderItem } from './useItemRender';

const sharedProps = {
  prefixCls: { type: String as PropType<string | undefined>, default: undefined },
  href: { type: String as PropType<string | undefined>, default: undefined },
  separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  menu: { type: Object as PropType<BreadcrumbItemProps['menu']>, default: undefined },
  dropdownProps: {
    type: Object as PropType<BreadcrumbItemProps['dropdownProps']>,
    default: undefined,
  },
  dropdownIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
};
const contentSlots: SlotsType<BreadcrumbItemSlots> = {};

/** Item owns the li, stable content host and independent menu trigger. */
export const InternalBreadcrumbItem = defineComponent({
  name: 'ABreadcrumbItemInternal',
  inheritAttrs: false,
  slots: contentSlots,
  props: { ...sharedProps, isLast: { type: Boolean, default: false } },
  setup(props, { slots, attrs }) {
    const config = useConfigContext();
    const context = inject(breadcrumbContextKey, undefined);
    const prefixCls = computed(
      () => props.prefixCls ?? context?.prefixCls ?? config.getPrefixCls('breadcrumb'),
    );
    const [open, setOpen] = useControlledValue<boolean>({
      getValue: () => props.dropdownProps?.open,
      defaultValue: () => props.dropdownProps?.defaultOpen ?? false,
    });
    const visibleOpen = computed(
      () => Boolean(props.menu) && !props.dropdownProps?.disabled && open.value,
    );
    const trigger = ref<HTMLButtonElement | null>(null);
    const dropdown = ref<{ popupElement: () => HTMLElement | null } | null>(null);
    let focusOnOpen = false;
    const focusMenu = () => {
      if (!focusOnOpen || !visibleOpen.value) return;
      const popup = dropdown.value?.popupElement();
      const target =
        popup?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ??
        popup?.querySelector<HTMLElement>('[role="menu"]');
      if (target) {
        target.focus({ preventScroll: true });
        focusOnOpen = false;
      }
    };
    watch(
      visibleOpen,
      () => {
        if (visibleOpen.value) void nextTick(focusMenu);
        else focusOnOpen = false;
      },
      { flush: 'post' },
    );
    const requestOpen = (next: boolean) => {
      if (props.dropdownProps?.disabled) return;
      props.dropdownProps?.onOpenChange?.(next, { source: 'trigger' });
      setOpen(next);
      void nextTick(focusMenu);
    };

    const menu = computed(() => {
      if (!props.menu) return undefined;
      const { items, ...menuProps } = props.menu;
      return {
        ...menuProps,
        items: items?.map(({ key, title, label, path, href, ...item }, index): MenuItemType => {
          const content = label !== undefined ? label : title;
          const destination =
            href ?? (path !== undefined ? `${props.href ?? ''}${path}` : undefined);
          return {
            ...item,
            key: String(key ?? index),
            label: destination === undefined ? content : h('a', { href: destination }, [content]),
          };
        }),
      };
    });

    return () => {
      const children = slots.default?.();
      if (
        !props.menu &&
        (children === undefined ||
          children === null ||
          (Array.isArray(children) &&
            children.length > 0 &&
            children.every((node) => isVNode(node) && node.type === Comment)))
      ) {
        return null;
      }
      const p = prefixCls.value;
      const icon = slots.dropdownIcon
        ? slots.dropdownIcon()
        : props.dropdownIcon !== undefined
          ? props.dropdownIcon
          : (context?.dropdownIcon() ?? h(DownOutlined));
      const actions = props.dropdownProps?.trigger ?? ['hover', 'click'];
      const popupTrigger = props.menu
        ? h(
            Dropdown,
            {
              placement: 'bottom',
              ...props.dropdownProps,
              ref: dropdown,
              menu: menu.value,
              trigger: actions,
              open: visibleOpen.value,
              'onUpdate:open': (value: boolean) => setOpen(value),
              afterOpenChange: (value: boolean) => {
                props.dropdownProps?.afterOpenChange?.(value);
                if (value) focusMenu();
              },
            },
            {
              default: () =>
                h(
                  'button',
                  {
                    ref: trigger,
                    type: 'button',
                    class: `${p}-menu-trigger`,
                    disabled: props.dropdownProps?.disabled,
                    'aria-label': 'Open breadcrumb menu',
                    'aria-haspopup': 'menu',
                    'aria-expanded': String(visibleOpen.value),
                    onClick: (event: MouseEvent) => {
                      focusOnOpen = event.detail === 0;
                      if (!actions.includes('click')) requestOpen(!visibleOpen.value);
                    },
                    onKeydown: (event: KeyboardEvent) => {
                      if (event.key === 'ArrowDown' && !event.isComposing) {
                        event.preventDefault();
                        focusOnOpen = true;
                        if (visibleOpen.value) focusMenu();
                        else requestOpen(true);
                      }
                    },
                  },
                  [h('span', { 'aria-hidden': 'true' }, [icon])],
                ),
            },
          )
        : null;
      const separator = props.isLast
        ? null
        : slots.separator
          ? slots.separator()
          : props.separator !== undefined
            ? props.separator
            : (context?.separator() ?? '/');
      return [
        h(
          'li',
          mergeProps(styleAttrs(context?.styles.item), attrs, {
            class: [`${p}-item`, context?.classNames.item],
          }),
          [
            // This host remains when the menu is added/removed; existing controls retain identity.
            h('span', { class: [`${p}-content`, { [`${p}-overlay-link`]: Boolean(props.menu) }] }, [
              children,
              popupTrigger,
            ]),
          ],
        ),
        hasBreadcrumbContent(separator)
          ? h(BreadcrumbSeparator, null, { default: () => separator })
          : null,
      ];
    };
  },
});

export const BreadcrumbItem = defineComponent({
  name: 'ABreadcrumbItem',
  inheritAttrs: false,
  slots: contentSlots,
  props: sharedProps,
  setup(props, { slots, attrs }) {
    const config = useConfigContext();
    const context = inject(breadcrumbContextKey, undefined);
    const prefixCls = computed(
      () => props.prefixCls ?? context?.prefixCls ?? config.getPrefixCls('breadcrumb'),
    );
    return () => {
      const { __apolloBreadcrumbLast, ...itemAttrs } = attrs;
      return h(
        InternalBreadcrumbItem,
        mergeProps(itemAttrs, props, {
          prefixCls: prefixCls.value,
          isLast: __apolloBreadcrumbLast === true,
        }),
        {
          default: () => renderItem(prefixCls.value, {}, slots.default?.(), props.href),
          ...(slots.separator ? { separator: () => slots.separator?.() } : {}),
          ...(slots.dropdownIcon ? { dropdownIcon: () => slots.dropdownIcon?.() } : {}),
        },
      );
    };
  },
});
export default BreadcrumbItem;
