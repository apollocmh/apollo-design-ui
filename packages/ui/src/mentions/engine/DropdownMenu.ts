/**
 * `@rc-component/mentions@1.12.0` 的 `es/DropdownMenu.js`（71 行）—— 候选列表。
 *
 * 上游注释：**「We only use Menu to display the candidate. The focus is controlled by
 * textarea to make accessibility easy.」** ⇒ rc-menu 在这里只是一张**展示用的列表**，
 * 键盘导航 / 焦点管理 / 子菜单 / 溢出折叠全部用不到。
 *
 * ── 为什么**不**复用本仓的 `menu/Menu.ts`（三条硬证据，实测）────────────────────
 *
 * | # | 事实 | 后果 |
 * |---|---|---|
 * | 1 | 本仓 `Menu` 的 `theme` 默认 `'light'`；rc-mentions 调 rc-menu 时**不传 theme**（实测 `<ul>` 无 `-light`） | 复用会多一个类，DOM 契约直接偏 |
 * | 2 | rc-mentions 给**每个** `MenuItem` 挂 `onMouseEnter` 来更新 `activeIndex`；本仓 `Menu` 的 `items` 不支持逐项事件 | 悬停高亮**无法表达** |
 * | 3 | rc-mentions 用 `menuRef.current.findItem({key}).scrollIntoView(...)`；本仓 `Menu` 没有这个 imperative 句柄 | 要加就得改**另一个组件**的公开面（仓库规则禁止） |
 *
 * ⇒ 自建这张 ~45 行的列表，DOM 由实测钉死（`docs/analysis/mentions.md` §3.1）。
 *
 * ── DOM 契约（实测自 React，逐条保留）─────────────────────────────────────────
 *
 * ```html
 * <ul class="{p} {p}-root {p}-vertical" role="menu" tabindex="0" data-menu-list="true">
 *   <li class="{p}-item [{p}-item-active] [{p}-item-disabled] [option.className]"
 *       [style] role="menuitem" [tabindex="-1"] [data-menu-id] [aria-disabled="true"]>label</li>
 * </ul>
 * <div style="display:none" aria-hidden="true"></div>   ← rc-menu 的隐藏测量层
 * ```
 *
 * ⚠️ 三条易错点（都是实测出来的）：
 *  1. **没有 `-light`**（见上表 #1）。
 *  2. **没有 `-only-child`** —— 那是 antd `Menu` 组件走 `items` 时的产物，rc-mentions 这条路径没有。
 *  3. **disabled 的 `<li>` 不带 `tabindex`**（非 disabled 才是 `-1`），但**带** `data-menu-id`
 *     与 `aria-disabled="true"`。
 */

import {
  defineComponent,
  h,
  inject,
  nextTick,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import type { MentionsOptionProps } from '../interface';
import { mentionsContextKey } from './context';

/** 归一化后的候选项（引擎的 `getOptions` 产物）。 */
export interface NormalizedOption extends MentionsOptionProps {
  /** `${item.key ?? item.value}-${uniqueKey}` —— 只用于 `data-menu-id`。 */
  key: string;
  label?: VNodeChild;
}

/** 全局计数器：`data-menu-id` 的 uuid 段（两侧不同，L4 会归一化）。 */
let menuUuid = 0;

/** 下一个菜单 id（上游是 `rc-menu-uuid-{useId}`；本仓用单调计数器，L4 会归一化）。 */
function nextMenuId(): string {
  menuUuid += 1;
  return `apollo-mentions-menu-${menuUuid}`;
}

export const DropdownMenu = defineComponent({
  name: 'AMentionsDropdownMenu',
  inheritAttrs: false,
  props: {
    /** **完整**前缀：`${dropdownPrefix}-menu`（如 `apollo-mentions-dropdown-menu`）。 */
    prefixCls: { type: String, required: true },
    options: { type: Array as PropType<NormalizedOption[]>, default: () => [] },
    /** 浮层是否已展开（由 `afterOpenChange` 置位）—— 未展开时不做滚动入视口。 */
    opened: { type: Boolean, default: false },
  },
  setup(props) {
    const context = inject(mentionsContextKey, null);
    const menuId = nextMenuId();
    const listRef = ref<HTMLElement | null>(null);

    const itemId = (key: string): string => `${menuId}-${key}`;

    /**
     * 高亮项变化 ⇒ 滚进可视区（上游 `useEffect([activeIndex, activeOption.key, opened])`）。
     *
     * ⚠️ 上游走 `menuRef.current.findItem({key})`（rc-menu 的 imperative 句柄）；
     *    本仓没有那个句柄 ⇒ 直接按 `data-menu-id` 查 DOM。**语义相同**：
     *    `findItem` 内部也是 `querySelector('[data-menu-id="{uuid}-{key}"]')`。
     * ⚠️ `block:'nearest'` 是契约 —— `'start'` 会把列表滚到底部。
     */
    watch(
      () => [
        context?.value.activeIndex ?? -1,
        props.options[context?.value.activeIndex ?? -1]?.key,
        props.opened,
      ],
      () => {
        const index = context?.value.activeIndex ?? -1;
        const option = props.options[index];
        if (index === -1 || !option || !props.opened) {
          return;
        }
        void nextTick(() => {
          const el = listRef.value?.querySelector<HTMLElement>(
            `[data-menu-id="${itemId(option.key)}"]`,
          );
          el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
      },
      { flush: 'post' },
    );

    return () => {
      const p = props.prefixCls;
      const activeIndex = context?.value.activeIndex ?? -1;
      const items = props.options.map((option, index) => {
        const disabled = option.disabled === true;
        return h(
          'li',
          {
            class: [
              `${p}-item`,
              {
                [`${p}-item-active`]: !disabled && index === activeIndex,
                [`${p}-item-disabled`]: disabled,
              },
              option.className,
            ],
            style: option.style,
            role: 'menuitem',
            // ⚠️ disabled 项**不带** tabindex（实测）
            ...(disabled ? {} : { tabindex: '-1' }),
            'data-menu-id': itemId(option.key),
            ...(disabled ? { 'aria-disabled': 'true' } : {}),
            onMouseenter: () => {
              if (!disabled) {
                context?.value.setActiveIndex(index);
              }
            },
            // rc-menu 的 `onSelect` 在**点击**时触发（键盘走 textarea 的 Enter，见 engine/Mentions.ts）
            onClick: () => {
              context?.value.selectOption(option);
            },
          },
          option.label as never,
        );
      });

      if (items.length === 0) {
        // 无候选：一个 disabled 的占位项（key 固定 `tmp_key-0`，与上游实测一致）
        items.push(
          h(
            'li',
            {
              class: [`${p}-item`, `${p}-item-disabled`],
              role: 'menuitem',
              'data-menu-id': itemId('tmp_key-0'),
              'aria-disabled': 'true',
            },
            context?.value.notFoundContent as never,
          ),
        );
      }

      return [
        h(
          'ul',
          {
            ref: listRef,
            class: [p, `${p}-root`, `${p}-vertical`],
            role: 'menu',
            tabindex: '0',
            'data-menu-list': 'true',
            onFocus: () => context?.value.onFocus(),
            onBlur: () => context?.value.onBlur(),
            onScroll: (event: Event) => context?.value.onScroll(event),
          },
          items,
        ),
        // rc-menu 的隐藏测量层（`display:none`，无视觉/语义影响）—— 逐字保留
        h('div', { style: { display: 'none' }, 'aria-hidden': 'true' }),
      ];
    };
  },
});
