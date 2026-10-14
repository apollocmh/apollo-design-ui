/**
 * DropdownButton —— antd `components/dropdown/dropdown-button.tsx`（153 行）的 Vue 版。
 * ⚠️ antd 已 deprecated 该组件（改用 Space.Compact + Dropdown + Button）——
 * 本仓保留同款告警（D91）。分两钮渲染：主钮（onClick）+ 箭头钮（icon=EllipsisOutlined，
 * 触发下拉）；非 split 时整体触发（dropdown 触发动作透传）。
 */

import { EllipsisOutlined } from '@apollo-design/icons';
import { isEmptyVNode } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, shallowRef, type VNodeChild } from 'vue';

import Button from '../button';
import Dropdown from './Dropdown';
import type { DropdownButtonProps } from './interface';

type StyleLike = Record<string, string | number>;

const DropdownButton = defineComponent({
  name: 'ADropdownButton',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: {
      type: String as PropType<NonNullable<DropdownButtonProps['type']>>,
      default: 'default',
    },
    size: { type: String as PropType<DropdownButtonProps['size']>, default: undefined },
    loading: { type: Boolean, default: undefined },
    danger: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    // icon：C8-R2 改 `#icon` 插槽（默认 EllipsisOutlined）
    href: { type: String, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    // Dropdown 通道
    menu: { type: Object as PropType<DropdownButtonProps['menu']>, default: undefined },
    placement: { type: String, default: undefined },
    trigger: {
      type: Array as PropType<DropdownButtonProps['trigger']>,
      default: undefined,
    },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    onOpenChange: {
      type: Function as PropType<(open: boolean, info: { source: 'trigger' | 'menu' }) => void>,
      default: undefined,
    },
    split: { type: Boolean, default: undefined },

    autoAdjustOverflow: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },

    id: { type: String, default: undefined },
    zIndex: { type: Number, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
  },
  setup(props, { slots, attrs, emit, expose }) {
    const prefixCls = props.prefixCls ?? 'apollo-dropdown';
    const buttonPrefixCls = `${prefixCls}-button`;

    if (import.meta.env?.DEV ?? true) {
      console.error(
        '[Warning] [antd: Dropdown.Button] `Dropdown.Button` is deprecated. Please use `Space.Compact` + `Dropdown` + `Button` instead.',
      );
    }

    const dropdownRef = shallowRef<{ nativeElement: () => HTMLElement | null } | null>(null);
    expose({
      nativeElement: () => dropdownRef.value?.nativeElement() ?? null,
    });

    // C8-R2：`#icon` 插槽 → 默认 EllipsisOutlined
    const defaultIcon = computed<VNodeChild>(() => {
      const fromSlot = slots.icon?.();
      if (fromSlot !== undefined && !isEmptyVNode(fromSlot)) {
        const first = Array.isArray(fromSlot) ? fromSlot[0] : fromSlot;
        return first as VNodeChild;
      }
      return h(EllipsisOutlined);
    });

    return () => {
      const children = slots.default?.();

      const leftButton = h(
        Button,
        {
          type: props.type,
          danger: props.danger,
          disabled: props.disabled,
          loading: props.loading,
          size: props.size,
          href: props.href,
          onClick: props.onClick,
        },
        { default: () => children },
      );
      const rightButton = h(Button, {
        type: props.type,
        danger: props.danger,
        disabled: props.disabled,
        size: props.size,
        icon: defaultIcon.value,
      });

      // C8-R2：`#buttonsRender="{ buttons }"` 作用域插槽（原 buttonsRender fn prop）
      const buttons = slots.buttonsRender
        ? ((slots.buttonsRender as (p: { buttons: VNodeChild[] }) => unknown)({
            buttons: [leftButton, rightButton] as VNodeChild[],
          }) as VNodeChild[])
        : ([leftButton, rightButton] as VNodeChild[]);

      const dropdownProps = {
        menu: props.menu,
        arrow: props.arrow,
        disabled: props.disabled,
        trigger: props.disabled ? [] : props.trigger,
        onOpenChange: (open: boolean, info: { source: 'trigger' | 'menu' }) => {
          props.onOpenChange?.(open, info);
          emit('update:open', open);
        },
        getPopupContainer: props.getPopupContainer,
        autoAdjustOverflow: props.autoAdjustOverflow,
        destroyOnHidden: props.destroyOnHidden,
        forceRender: props.forceRender,
        // ⚠️ `popupRender` **不是 Dropdown 的 prop**（C8-R2 已改成 `#popupRender`
        //    作用域插槽）⇒ 必须在下面的第三参数里转发，塞进 props 会被静默忽略
        //    （Issue #21.2）。
        id: props.id,
        zIndex: props.zIndex,
        open: props.open,
        placement: props.placement ?? 'bottomRight',
        prefixCls,
      };

      const dropdownSlots = {
        // antd `dropdown-button.js`：`leftButton` 在 Dropdown **外面**，`rightButton`
        // 才是 `<Dropdown>` 的 trigger。split 语义正是「主钮只发 onClick、箭头触发下拉」，
        // 把两个同级 VNode 一起塞进 Dropdown 的默认插槽，会被它按 `Children.only`
        // 包成一个 span ⇒ 点主钮也会开下拉（Issue #21.1）。
        default: () => (props.split ? buttons[1] : buttons[0]),
        // C8-R2：自定义浮层是**作用域插槽**，签名与 Dropdown 一致 `{ originNode }`
        popupRender: slots.popupRender as
          | ((p: { originNode: VNodeChild }) => VNodeChild)
          | undefined,
      };

      return h(
        'div',
        {
          ...attrs,
          class: [buttonPrefixCls, attrs.class],
          style: attrs.style as StyleLike | undefined,
        },
        props.split
          ? [buttons[0], h(Dropdown, dropdownProps as never, dropdownSlots)]
          : [h(Dropdown, dropdownProps as never, dropdownSlots)],
      );
    };
  },
});

export default DropdownButton;
