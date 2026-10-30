/** Apollo split-button composition: main action and an independent Dropdown trigger. */

import { EllipsisOutlined } from '@apollo-design/icons';
import { computed, defineComponent, h, type PropType, type SlotsType, shallowRef } from 'vue';

import Button from '../button';
import { useComponentConfig } from '../config-provider/context';
import Dropdown from './Dropdown';
import type {
  DropdownButtonProps,
  DropdownButtonRef,
  DropdownButtonSlots,
  DropdownOpenInfo,
  DropdownProps,
  DropdownRef,
} from './interface';

const DropdownButton = defineComponent({
  name: 'ADropdownButton',
  inheritAttrs: false,
  slots: Object as SlotsType<DropdownButtonSlots>,
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
    target: { type: String, default: undefined },
    // Dropdown 通道
    menu: { type: Object as PropType<DropdownButtonProps['menu']>, default: undefined },
    placement: { type: String as PropType<DropdownButtonProps['placement']>, default: undefined },
    trigger: {
      type: Array as PropType<DropdownButtonProps['trigger']>,
      default: undefined,
    },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
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
    openChange: (_open: boolean, _info: DropdownOpenInfo) => true,
    click: (_event: MouseEvent) => true,
  },
  setup(props, { slots, attrs, emit, expose }) {
    const config = useComponentConfig('dropdown');
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('dropdown'));
    const dropdownRef = shallowRef<DropdownRef | null>(null);
    const publicApi: DropdownButtonRef = {
      nativeElement: () => dropdownRef.value?.nativeElement() ?? null,
    };
    expose(publicApi);

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
          target: props.target,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        { default: () => children },
      );
      const rightButton = h(Button, {
        type: props.type,
        danger: props.danger,
        disabled: props.disabled,
        size: props.size,
        'aria-label': 'Open menu',
        icon: slots.icon ? slots.icon() : h(EllipsisOutlined),
      });

      // C8-R2：`#buttonsRender="{ buttons }"` 作用域插槽（原 buttonsRender fn prop）
      const buttons = slots.buttonsRender
        ? slots.buttonsRender({ buttons: [leftButton, rightButton] })
        : [leftButton, rightButton];

      const dropdownProps: DropdownProps = {
        menu: props.menu,
        arrow: props.arrow,
        disabled: props.disabled,
        trigger: props.disabled ? [] : props.trigger,
        onOpenChange: (open: boolean, info: DropdownOpenInfo) => {
          emit('openChange', open, info);
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
        prefixCls: prefixCls.value,
      };

      const dropdownSlots = {
        // antd `dropdown-button.js`：`leftButton` 在 Dropdown **外面**，`rightButton`
        // 才是 `<Dropdown>` 的 trigger。split 语义正是「主钮只发 onClick、箭头触发下拉」，
        // 把两个同级 VNode 一起塞进 Dropdown 的默认插槽，会被它按 `Children.only`
        // 包成一个 span ⇒ 点主钮也会开下拉（Issue #21.1）。
        default: () => (props.split ? buttons[1] : buttons[0]),
        // C8-R2：自定义浮层是**作用域插槽**，签名与 Dropdown 一致 `{ originNode }`
        popupRender: slots.popupRender,
      };

      return h(
        'div',
        {
          ...attrs,
          class: [`${prefixCls.value}-button`, attrs.class],
          style: attrs.style,
        },
        props.split
          ? [buttons[0], h(Dropdown, { ...dropdownProps, ref: dropdownRef }, dropdownSlots)]
          : [h(Dropdown, { ...dropdownProps, ref: dropdownRef }, dropdownSlots)],
      );
    };
  },
});

export default DropdownButton;
