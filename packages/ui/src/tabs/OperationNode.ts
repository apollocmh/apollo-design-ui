/**
 * 溢出下拉（rc `TabNavList/OperationNode.js` 的等价物）。
 *
 * ── DOM（逐字）──────────────────────────────────────────────────────────────────
 *
 * ```
 * div.{p}-nav-operations[-hidden]                       ← 触发器容器（`-hidden` = 没有隐藏页签）
 * ├─ [mobile ⇒ 不渲染触发器]
 * │  └─ button.{p}-nav-more[type=button][aria-haspopup=listbox]
 * │       [aria-controls={id}-more-popup][id={id}-more][aria-expanded]  → more.icon
 * └─ AddButton（editable-card 时）
 * ```
 * 浮层里是**本仓 Menu**：`ul.{dropdown}-menu[role=listbox][aria-activedescendant][aria-label]`
 * + `li[role=option][aria-controls]` + 可选 `button.{dropdown}-menu-item-remove`。
 *
 * ── 七条容易写错的判据 ─────────────────────────────────────────────────────────
 *
 *   1. **删除按钮的 `tabIndex` 恒为 0**（与 `TabNode` 的 remove 用 `active` 判据**不同**）；
 *   2. `aria-label` 的三元判的是 **`undefined`**（`locale.dropdownAriaLabel !== undefined ? 它 : 'expanded dropdown'`）
 *      —— 空串会照用，不能写成 `||`；
 *   3. 浮层是 `role='listbox'`、每项 `role='option'`（靠给 Menu 传 `role` 表达，rc-menu 同判）；
 *   4. `selectOffset` 里 `findIndex(...) || 0` 用的是 **`||`**（不是 `??`）—— 找不到时 `-1`
 *      也要落到 `0`，否则会拿 `-1` 当下标；
 *   5. 键盘：**关着**时 `↓ / Space / Enter` 打开；**开着**时 `↑↓` 移动（跳过 disabled）、
 *      `Esc` 关、`Space / Enter` 选中；
 *   6. `moreStyle`：没有隐藏页签时补 `visibility: hidden` + `order: 1`（**占位但不显示** ——
 *      用 `display:none` 会让测量抖动）；
 *   7. `mobile` 时**整个触发器不渲染**（但 `-nav-operations` 容器与 AddButton 仍在）。
 *
 * ⚠️ 浮层动效名是 `{rootPrefixCls}-slide-up`（**不是**组件前缀）—— antd 壳强制覆盖调用方给的值
 *    （PITFALLS 180 同族：写错只是静默没动画）。
 */

import { defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import Dropdown from '../dropdown/Dropdown';
import type { ItemType, MenuInfo } from '../menu/interface';
import AddButton from './AddButton';
import type {
  TabsEditableConfig,
  TabsEditEvent,
  TabsItem,
  TabsLocale,
  TabsMoreProps,
} from './interface';
import { getRemovable } from './util';

/** 键盘码（rc 用 `@rc-component/util` 的 `KeyCode`）。 */
const KeyCode = {
  UP: 38,
  DOWN: 40,
  SPACE: 32,
  ENTER: 13,
  ESC: 27,
} as const;

export default defineComponent({
  name: 'ATabsOperationNode',
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    locale: { type: Object as PropType<TabsLocale | undefined>, default: undefined },
    mobile: { type: Boolean, default: false },
    more: { type: Object as PropType<TabsMoreProps | undefined>, default: undefined },
    editable: { type: Object as PropType<TabsEditableConfig | undefined>, default: undefined },
    tabBarGutter: { type: Number, default: undefined },
    rtl: { type: Boolean, default: false },
    removeAriaLabel: { type: String, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    /** 容器类名（父组件传 `-hidden`）。 */
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown> | undefined>, default: undefined },
    popupClassName: { type: String, default: undefined },
    popupStyle: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: undefined,
    },
    removeClassName: { type: String, default: undefined },
    removeStyle: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: undefined,
    },
    onTabClick: {
      type: Function as PropType<(key: string, event: TabsEditEvent) => void>,
      required: true,
    },
  },
  setup(props, { expose }) {
    const open = ref(false);
    const selectedKey = ref<string | null>(null);
    const containerRef = ref<HTMLElement | null>(null);

    expose({ getElement: (): HTMLElement | null => containerRef.value });

    const popupId = (): string => `${props.id ?? ''}-more-popup`;
    const dropdownPrefix = (): string => `${props.prefixCls}-dropdown`;
    const selectedItemId = (): string | null => {
      const key = selectedKey.value;
      return key !== null ? `${popupId()}-${key}` : null;
    };

    const onRemoveTab = (event: TabsEditEvent, key: string): void => {
      event.preventDefault();
      event.stopPropagation();
      props.editable?.onEdit('remove', { key, event });
    };

    /** 在**启用**的页签上按 offset 环形移动（rc `selectOffset`）。 */
    const selectOffset = (offset: number): void => {
      const enabledTabs = props.tabs.filter((tab) => !tab.disabled);
      const len = enabledTabs.length;
      if (!len) return;
      // ⚠️ `|| 0` 而不是 `?? 0`：`findIndex` 返回 `-1` 时也要落到 0
      let selectedIndex = enabledTabs.findIndex((tab) => tab.key === selectedKey.value) || 0;
      for (let i = 0; i < len; i += 1) {
        selectedIndex = (selectedIndex + offset + len) % len;
        const tab = enabledTabs[selectedIndex];
        if (tab && !tab.disabled) {
          selectedKey.value = tab.key;
          return;
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      const which = e.which || e.keyCode;
      if (!open.value) {
        if (which === KeyCode.DOWN || which === KeyCode.SPACE || which === KeyCode.ENTER) {
          open.value = true;
          e.preventDefault();
        }
        return;
      }
      switch (which) {
        case KeyCode.UP:
          selectOffset(-1);
          e.preventDefault();
          break;
        case KeyCode.DOWN:
          selectOffset(1);
          e.preventDefault();
          break;
        case KeyCode.ESC:
          open.value = false;
          break;
        case KeyCode.SPACE:
        case KeyCode.ENTER:
          if (selectedKey.value !== null) {
            props.onTabClick(selectedKey.value, e);
          }
          break;
        default:
          break;
      }
    };

    // 选中项滚进视野（rc 用 `document.getElementById`）
    watch([selectedKey, open], () => {
      const elementId = selectedItemId();
      if (!elementId) return;
      document.getElementById(elementId)?.scrollIntoView?.(false);
    });

    // 关闭时清空选中项
    watch(open, (isOpen) => {
      if (!isOpen) selectedKey.value = null;
    });

    return () => {
      const { prefixCls, id, tabs, locale, mobile, editable, tabBarGutter, rtl, removeAriaLabel } =
        props;
      const moreProps = props.more ?? {};
      const moreIcon = (moreProps.icon ?? 'More') as VNodeChild;
      const popupRender = moreProps.popupRender;
      const dropdown = dropdownPrefix();

      const menuItems: ItemType[] = tabs.map((tab) => {
        const removable = getRemovable(tab.closable, tab.closeIcon, editable, tab.disabled);
        // ⚠️ 子节点数组要 `as never`：`VNodeChild` 里含 `null`/`undefined`，
        //    `h` 的 children 重载不收（只有 `as never` 能同时绕开三个重载）
        const label = h('span', {}, [
          h('span', {}, tab.label as never),
          removable
            ? h(
                'button',
                {
                  type: 'button',
                  'aria-label': removeAriaLabel || 'remove',
                  // ⚠️ 恒 0（TabNode 的 remove 才是 `active ? 0 : -1`）
                  tabIndex: 0,
                  class: [`${dropdown}-menu-item-remove`, props.removeClassName]
                    .filter(Boolean)
                    .join(' '),
                  style: props.removeStyle,
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    onRemoveTab(e, tab.key);
                  },
                },
                // `VNodeChild` 含 `null`/`false` ⇒ 子节点重载不收，显式断言
                (tab.closeIcon || editable?.removeIcon || '×') as never,
              )
            : undefined,
        ] as never);
        return {
          key: tab.key,
          label,
          disabled: tab.disabled,
          id: `${popupId()}-${tab.key}`,
          role: 'option',
          'aria-controls': id ? `${id}-panel-${tab.key}` : undefined,
        } as ItemType;
      });

      // ⚠️ 浮层的角色与 aria 都挂在**菜单根**上（rc 同判），不额外包一层 div
      const menuProps: Record<string, unknown> = {
        items: menuItems,
        prefixCls: `${dropdown}-menu`,
        id: popupId(),
        tabIndex: -1,
        role: 'listbox',
        'aria-activedescendant': selectedItemId() ?? undefined,
        // rc 传的是 `[selectedKey]`（可能是 [null]，由 Menu 自己忽略）
        selectedKeys: [selectedKey.value],
        'aria-label':
          locale?.dropdownAriaLabel !== undefined ? locale.dropdownAriaLabel : 'expanded dropdown',
        onClick: (info: MenuInfo) => {
          props.onTabClick(info.key, info.domEvent as TabsEditEvent);
          open.value = false;
        },
      };

      const moreStyle: Record<string, unknown> = {};
      if (tabBarGutter !== undefined) moreStyle.marginInlineStart = tabBarGutter;
      if (!tabs.length) {
        moreStyle.visibility = 'hidden';
        moreStyle.order = 1;
      }

      const overlayClassName = [props.popupClassName, rtl ? `${dropdown}-rtl` : undefined]
        .filter(Boolean)
        .join(' ');

      const moreNode = mobile
        ? null
        : h(
            Dropdown as never,
            {
              prefixCls: dropdown,
              menu: menuProps,
              open: tabs.length ? open.value : false,
              onOpenChange: (next: boolean) => {
                open.value = next;
              },
              overlayClassName: overlayClassName || undefined,
              overlayStyle: props.popupStyle,
              mouseEnterDelay: 0.1,
              mouseLeaveDelay: 0.1,
              getPopupContainer: props.getPopupContainer,
              // ⚠️ 动效名由 antd 壳强制成 `{rootPrefixCls}-slide-up`
              transitionName: moreProps.transitionName as string | undefined,
            },
            {
              default: () =>
                h(
                  'button',
                  {
                    type: 'button',
                    class: `${prefixCls}-nav-more`,
                    style: moreStyle,
                    'aria-haspopup': 'listbox',
                    'aria-controls': popupId(),
                    id: id ? `${id}-more` : undefined,
                    'aria-expanded': open.value,
                    onKeydown: onKeyDown,
                  },
                  moreIcon as never,
                ),
              // `more.popupRender` 的逃生口 → Dropdown 的 `#popupRender` 槽
              ...(popupRender
                ? {
                    popupRender: ({ originNode }: { originNode: VNodeChild }) =>
                      popupRender(originNode as VNodeChild, {
                        restTabs: tabs,
                        onClose: () => {
                          open.value = false;
                        },
                      }),
                  }
                : {}),
            },
          );

      return h(
        'div',
        {
          class: [`${prefixCls}-nav-operations`, props.className].filter(Boolean).join(' '),
          style: props.style,
          ref: (el: unknown) => {
            containerRef.value = (el as HTMLElement | null) ?? null;
          },
        },
        [moreNode, h(AddButton as never, { prefixCls, locale, editable })],
      );
    };
  },
});
