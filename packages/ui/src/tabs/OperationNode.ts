/** Tabs overflow uses the current Dropdown slot chain and owns its keyboard selection. */
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type SlotsType,
  watch,
  watchEffect,
} from 'vue';
import { toCssSize } from '../_internal/to-css-size';
import Dropdown from '../dropdown/Dropdown';
import AddButton from './AddButton';
import type {
  TabsEditableConfig,
  TabsEditEvent,
  TabsItem,
  TabsLocale,
  TabsMoreProps,
  TabsSlots,
} from './interface';
import { getOverflowOptionId, getPanelId, getRemovable } from './util';

const popupSlots: SlotsType<Pick<TabsSlots, 'popupRender'>> = {};

export default defineComponent({
  name: 'ATabsOperationNode',
  slots: popupSlots,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String as PropType<string | undefined>, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    locale: { type: Object as PropType<TabsLocale | undefined>, default: undefined },
    mobile: { type: Boolean, default: false },
    more: { type: Object as PropType<TabsMoreProps | undefined>, default: undefined },
    editable: { type: Object as PropType<TabsEditableConfig | undefined>, default: undefined },
    tabBarGutter: { type: Number as PropType<number | undefined>, default: undefined },
    rtl: { type: Boolean, default: false },
    removeAriaLabel: { type: String as PropType<string | undefined>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<((node: HTMLElement) => HTMLElement) | undefined>,
      default: undefined,
    },
    /** 容器类名（父组件传 `-hidden`）。 */
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
    popupClassName: { type: String as PropType<string | undefined>, default: undefined },
    popupZIndex: { type: Number as PropType<number | undefined>, default: undefined },
    popupStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    removeClassName: { type: String as PropType<string | undefined>, default: undefined },
    removeStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
  },
  emits: { tabClick: (_key: string, _event: TabsEditEvent) => true },
  setup(props, { expose, slots, emit }) {
    const open = ref(false);
    const selectedKey = ref<string | undefined>();
    const containerRef = ref<HTMLElement | null>(null);
    const triggerRef = ref<HTMLButtonElement | null>(null);
    const dropdownRef = ref<{ popupElement: () => HTMLElement | null } | null>(null);
    const focusPopup = ref(false);
    const enabledTabs = computed(() => props.tabs.filter((tab) => !tab.disabled));

    expose({ getElement: (): HTMLElement | null => containerRef.value });

    const popupId = (): string => `${props.id ?? ''}-more-popup`;
    const selectedItemId = (): string | undefined =>
      selectedKey.value === undefined
        ? undefined
        : getOverflowOptionId(popupId(), selectedKey.value);
    const closePopup = (restoreFocus = false): void => {
      open.value = false;
      focusPopup.value = false;
      if (restoreFocus) triggerRef.value?.focus();
    };
    const selectOffset = (offset: number): void => {
      const tabs = enabledTabs.value;
      if (!tabs.length) return;
      const index = tabs.findIndex((tab) => tab.key === selectedKey.value);
      selectedKey.value =
        tabs[
          index < 0
            ? offset < 0
              ? tabs.length - 1
              : 0
            : (index + offset + tabs.length) % tabs.length
        ]?.key;
    };
    const activate = (key: string, event: TabsEditEvent): void => {
      if (!enabledTabs.value.some((tab) => tab.key === key)) return;
      closePopup(event instanceof KeyboardEvent);
      emit('tabClick', key, event);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key || event.code;
      if (!props.tabs.length) return;
      if (!open.value) {
        if (
          key === 'ArrowDown' ||
          key === 'ArrowUp' ||
          key === 'Enter' ||
          key === ' ' ||
          key === 'Space'
        ) {
          event.preventDefault();
          event.stopPropagation();
          selectedKey.value =
            key === 'ArrowUp' ? enabledTabs.value.at(-1)?.key : enabledTabs.value[0]?.key;
          focusPopup.value = true;
          open.value = true;
        }
        return;
      }
      switch (key) {
        case 'ArrowUp':
          selectOffset(-1);
          break;
        case 'ArrowDown':
          selectOffset(1);
          break;
        case 'Home':
          selectedKey.value = enabledTabs.value[0]?.key;
          break;
        case 'End':
          selectedKey.value = enabledTabs.value.at(-1)?.key;
          break;
        case 'Escape':
          closePopup(true);
          break;
        case 'Enter':
        case ' ':
        case 'Space':
          if (selectedKey.value !== undefined) activate(selectedKey.value, event);
          break;
        default:
          return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    const onPopupKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      // Close controls and custom slot inputs keep their own keyboard activation.
      if (
        (event.key || event.code) !== 'Escape' &&
        target.closest('button,input,textarea,select,[contenteditable="true"]')
      )
        return;
      onKeyDown(event);
    };

    watchEffect(
      (onCleanup) => {
        const popup = dropdownRef.value?.popupElement();
        if (!open.value || !popup) return;
        popup.addEventListener('keydown', onPopupKeyDown, true);
        onCleanup(() => popup.removeEventListener('keydown', onPopupKeyDown, true));
        if (focusPopup.value) {
          const listbox = popup.querySelector<HTMLElement>('[role="listbox"]');
          if (listbox) {
            listbox.focus();
            focusPopup.value = false;
          }
        }
      },
      { flush: 'post' },
    );

    watch(
      [selectedKey, open],
      () => {
        if (!open.value) return;
        const item = Array.from(
          dropdownRef.value?.popupElement()?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
        ).find((node) => node.id === selectedItemId());
        item?.scrollIntoView?.({ block: 'nearest' });
      },
      { flush: 'post' },
    );
    watch([open, enabledTabs], () => {
      if (!props.tabs.length) closePopup();
      if (!open.value) selectedKey.value = undefined;
      else if (!enabledTabs.value.some((tab) => tab.key === selectedKey.value)) {
        selectedKey.value = enabledTabs.value[0]?.key;
      }
    });

    return () => {
      const { prefixCls, id, tabs, locale, mobile, editable, tabBarGutter, rtl } = props;
      const more = props.more ?? {};
      const dropdown = `${prefixCls}-dropdown`;
      const originNode = h(
        'div',
        {
          class: [`${dropdown}-menu`, `${dropdown}-menu-root`, `${dropdown}-menu-vertical`],
          style: { position: 'relative' },
        },
        [
          h('div', {
            id: popupId(),
            role: 'listbox',
            tabIndex: -1,
            'aria-label': locale?.dropdownAriaLabel ?? 'expanded dropdown',
            'aria-activedescendant': selectedItemId(),
            'aria-owns': tabs.length
              ? tabs.map((tab) => getOverflowOptionId(popupId(), tab.key)).join(' ')
              : undefined,
            // Own only the options. The adjacent remove buttons retain independent semantics.
            style: { position: 'absolute', inset: '0', outline: 'none', pointerEvents: 'none' },
          }),
          ...tabs.map((tab) => {
            const removable = getRemovable(tab.closable, tab.closeIcon, editable, tab.disabled);
            return h(
              'div',
              {
                key: tab.key,
                class: [
                  `${dropdown}-menu-item`,
                  tab.disabled ? `${dropdown}-menu-item-disabled` : undefined,
                  selectedKey.value === tab.key ? `${dropdown}-menu-item-active` : undefined,
                ],
                onPointerenter: () => {
                  if (!tab.disabled) selectedKey.value = tab.key;
                },
                onClick: (event: MouseEvent) => activate(tab.key, event),
              },
              [
                h(
                  'span',
                  {
                    id: getOverflowOptionId(popupId(), tab.key),
                    role: 'option',
                    'aria-selected': selectedKey.value === tab.key,
                    'aria-disabled': tab.disabled,
                    'aria-controls': id ? getPanelId(id, tab.key) : undefined,
                  },
                  [tab.label],
                ),
                removable
                  ? h(
                      'button',
                      {
                        type: 'button',
                        'aria-label': props.removeAriaLabel || 'remove',
                        class: [`${dropdown}-menu-item-remove`, props.removeClassName],
                        style: props.removeStyle,
                        onClick: (event: MouseEvent) => {
                          event.preventDefault();
                          event.stopPropagation();
                          editable?.onEdit('remove', { key: tab.key, event });
                        },
                      },
                      [
                        tab.closeIcon === false
                          ? (editable?.removeIcon ?? '×')
                          : (tab.closeIcon ?? editable?.removeIcon ?? '×'),
                      ],
                    )
                  : null,
              ],
            );
          }),
        ],
      );
      const moreStyle: CSSProperties = {
        marginInlineStart: tabBarGutter === undefined ? undefined : toCssSize(tabBarGutter),
        visibility: tabs.length ? undefined : 'hidden',
        order: tabs.length ? undefined : 1,
      };
      const moreNode = mobile
        ? null
        : h(
            Dropdown,
            {
              ref: dropdownRef,
              prefixCls: dropdown,
              trigger: ['hover', 'click'],
              open: tabs.length > 0 && open.value,
              onOpenChange: (next: boolean) => {
                open.value = next;
              },
              classNames: {
                root: [props.popupClassName, rtl ? `${dropdown}-rtl` : undefined]
                  .filter(Boolean)
                  .join(' '),
              },
              styles: { root: props.popupStyle },
              ...(props.popupZIndex === undefined ? {} : { zIndex: props.popupZIndex }),
              mouseEnterDelay: 0.1,
              mouseLeaveDelay: 0.1,
              ...(props.getPopupContainer ? { getPopupContainer: props.getPopupContainer } : {}),
              ...(more.transitionName !== undefined ? { transitionName: more.transitionName } : {}),
            },
            {
              default: () =>
                h(
                  'button',
                  {
                    ref: triggerRef,
                    type: 'button',
                    class: `${prefixCls}-nav-more`,
                    style: moreStyle,
                    'aria-haspopup': 'listbox',
                    'aria-label': locale?.dropdownAriaLabel ?? 'expanded dropdown',
                    'aria-controls': popupId(),
                    id: id ? `${id}-more` : undefined,
                    'aria-expanded': tabs.length > 0 && open.value,
                    onKeydown: onKeyDown,
                  },
                  [more.icon ?? 'More'],
                ),
              popupRender: () =>
                slots.popupRender
                  ? slots.popupRender({
                      originNode,
                      restTabs: tabs,
                      onClose: () => closePopup(true),
                    })
                  : originNode,
            },
          );
      return h(
        'div',
        {
          class: [`${prefixCls}-nav-operations`, props.className],
          style: props.style,
          ref: containerRef,
        },
        [moreNode, h(AddButton, { prefixCls, locale, editable })],
      );
    };
  },
});
