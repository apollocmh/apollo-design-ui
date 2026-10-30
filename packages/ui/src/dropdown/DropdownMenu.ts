import { LeftOutlined, RightOutlined } from '@apollo-design/icons';
import { computed, defineComponent, h, type PropType, provide, type SlotsType } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { type MenuOverrideData, menuOverrideKey } from '../menu/context';
import type { MenuProps } from '../menu/interface';
import Menu from '../menu/Menu';
import type { DropdownSemanticType, DropdownSlots } from './interface';

/** The live popup and static panel share the same actual Menu composition. */
export default defineComponent({
  name: 'ADropdownMenu',
  slots: Object as SlotsType<Pick<DropdownSlots, 'popupRender'>>,
  props: {
    prefixCls: { type: String, required: true },
    rtl: Boolean,
    menu: { type: Object as PropType<MenuProps>, default: undefined },
    classNames: {
      type: Object as PropType<DropdownSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<DropdownSemanticType['styles']>, default: undefined },
    onMenuClick: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots }) {
    const override: MenuOverrideData = {
      get prefixCls() {
        return `${props.prefixCls}-menu`;
      },
      mode: 'vertical',
      selectable: false,
      onClick: () => props.onMenuClick?.(),
      get expandIcon() {
        return h('span', { class: `${props.prefixCls}-menu-submenu-arrow` }, [
          h(props.rtl ? LeftOutlined : RightOutlined, {
            class: `${props.prefixCls}-menu-submenu-arrow-icon`,
          }),
        ]);
      },
    };
    provide(menuOverrideKey, override);
    const itemClassNames = computed(() => ({
      item: props.classNames?.item,
      itemTitle: props.classNames?.itemTitle,
      itemIcon: props.classNames?.itemIcon,
      itemContent: props.classNames?.itemContent,
    }));
    const itemStyles = computed(() => ({
      item: props.styles?.item,
      itemTitle: props.styles?.itemTitle,
      itemIcon: props.styles?.itemIcon,
      itemContent: props.styles?.itemContent,
    }));
    const semantic = useMergeSemantic<
      MenuProps,
      NonNullable<MenuProps['classNames']>,
      NonNullable<MenuProps['styles']>
    >(
      [() => props.menu?.classNames, itemClassNames],
      [() => props.menu?.styles, itemStyles],
      () => props.menu ?? {},
    );
    return () => {
      const originNode = props.menu?.items
        ? h(Menu, {
            ...props.menu,
            prefixCls: `${props.prefixCls}-menu`,
            classNames: semantic.classNames.value,
            styles: semantic.styles.value,
          })
        : null;
      return slots.popupRender ? slots.popupRender({ originNode }) : originNode;
    };
  },
});
