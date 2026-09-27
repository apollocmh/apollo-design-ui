/**
 * rc-select `OptionList.js`（392 行）的 Vue 版 —— 下拉列表。
 *
 * ── 与 rc 的一处**结构**差异（不是偷懒，是 Vue 的合理分工）─────────────────
 *
 * rc 把 `activeIndex` 放在 OptionList 里，由 BaseSelect 通过 `ref.onKeyDown()`
 * **命令式**地把键盘事件转发进来。Vue 里没必要跨组件打洞：
 * **`activeIndex` 上移到 BaseSelect**，OptionList 只吃 `activeIndex` + 回调。
 * 行为等价（键盘/鼠标/滚动到激活项全部保留），DOM 完全一致。
 *
 * ── 两处必须照抄的细节 ──────────────────────────────────────────────────────
 *
 * 1. **虚拟滚动时有一个 0×0 的影子 listbox**（`height:0;width:0;overflow:hidden`），
 *    里面只渲染 active-1 / active / active+1 三项 —— 屏幕阅读器靠它播报。
 *    非虚拟时 `role=option` / `aria-selected` 挂在**可见**项上（快照可核）。
 * 2. **`aria-selected` 在 combobox 模式下是「值等于搜索词」**而不是「已选中」。
 */

import { KeyCode } from '@apollo-design/utils';
import { VirtualList, type VirtualListExposed } from '@apollo-design/virtual-list';
import type { PropType } from 'vue';
import { defineComponent, h, inject, ref } from 'vue';
import type { RawValueType, SelectSemanticClassNames, SelectSemanticStyles } from '../interface';
import { type BaseSelectContextValue, baseSelectContextKey, selectContextKey } from './context';
import TransBtn from './TransBtn';

function isTitleType(content: unknown): boolean {
  return typeof content === 'string' || typeof content === 'number';
}

/** rc `pickAttrs(itemData, true)`：只挑 `data-*` / `aria-*` 透传到选项节点。 */
function pickDataAttrs(data: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      picked[key] = data[key];
    }
  }
  return picked;
}

export const OptionList = defineComponent({
  name: 'ASelectOptionList',
  inheritAttrs: false,
  props: {
    /** 由 BaseSelect 持有（见文件头说明）。 */
    activeIndex: { type: Number, default: -1 },
    onActiveIndexChange: {
      type: Function as PropType<(index: number, fromKeyboard?: boolean) => void>,
      default: undefined,
    },
    onSelectValue: {
      type: Function as PropType<(value: RawValueType | undefined) => void>,
      default: undefined,
    },
    onPopupScroll: { type: Function as PropType<(event: Event) => void>, default: undefined },
  },
  setup(props, { expose }) {
    const listRef = ref<VirtualListExposed | null>(null);
    const selectCtx = inject(selectContextKey, null);
    const baseCtx = inject(baseSelectContextKey, null);

    expose({
      scrollTo: (arg?: number | { index?: number }) => {
        listRef.value?.scrollTo(typeof arg === 'number' ? { index: arg } : arg);
      },
    });

    const ctx = (): {
      select: NonNullable<typeof selectCtx>['value'];
      base: BaseSelectContextValue;
    } => {
      if (!selectCtx || !baseCtx) {
        throw new Error('[apollo-design] OptionList 必须在 Select 内部使用');
      }
      return { select: selectCtx.value, base: baseCtx.value };
    };

    const isSelected = (value: RawValueType | undefined): boolean => {
      const { select, base } = ctx();
      if (base.mode === 'combobox') return false;
      return value !== undefined && select.rawValues.has(value);
    };

    const isAriaSelected = (value: RawValueType | undefined): boolean => {
      const { select, base } = ctx();
      if (base.mode === 'combobox') {
        return String(value ?? '').toLowerCase() === base.searchValue.toLowerCase();
      }
      return value !== undefined && select.rawValues.has(value);
    };

    return () => {
      const { select, base } = ctx();
      const { prefixCls, id } = base;
      const itemPrefixCls = `${prefixCls}-item`;
      const flatten = select.flattenOptions;
      const overMaxCount =
        base.multiple &&
        typeof select.maxCount === 'number' &&
        select.rawValues.size >= select.maxCount;

      const onListMouseDown = (event: MouseEvent): void => {
        event.preventDefault();
      };

      // ---------------------------- 空态 ----------------------------
      if (flatten.length === 0) {
        return h(
          'div',
          {
            role: 'listbox',
            id: `${id}_list`,
            class: `${itemPrefixCls}-empty`,
            onMousedown: onListMouseDown,
          },
          [base.notFoundContent as never],
        );
      }

      const classNames: SelectSemanticClassNames | undefined = select.classNames;
      const styles: SelectSemanticStyles | undefined = select.styles;
      const a11yProps = { role: 'listbox', id: `${id}_list` };

      const renderHiddenItem = (index: number) => {
        const item = flatten[index];
        if (!item) return null;
        const mergedLabel = item.label;
        return h(
          'div',
          {
            'aria-label': typeof mergedLabel === 'string' && !item.group ? mergedLabel : null,
            ...pickDataAttrs(item.data as unknown as Record<string, unknown>),
            role: item.group ? 'presentation' : 'option',
            id: `${id}_list_${index}`,
            'aria-selected': isAriaSelected(item.value),
          },
          [String(item.value ?? '')],
        );
      };

      const renderItem = (item: (typeof flatten)[number], itemIndex: number) => {
        const { data, group, groupOption, label, value } = item;

        // ---------------- 分组标题 ----------------
        if (group) {
          const groupTitle =
            (data.title as string | undefined) ?? (isTitleType(label) ? String(label) : undefined);
          return h(
            'div',
            {
              class: [itemPrefixCls, `${itemPrefixCls}-group`, data.className as string]
                .filter(Boolean)
                .join(' '),
              title: groupTitle,
            },
            [label !== undefined ? (label as never) : (data.key as never)],
          );
        }

        const { className, title, style, ...otherProps } = data as Record<string, unknown>;
        const selected = isSelected(value);
        const mergedDisabled = Boolean(data.disabled) || (!selected && overMaxCount);
        const optionPrefixCls = `${itemPrefixCls}-option`;
        const optionClassName = [
          itemPrefixCls,
          optionPrefixCls,
          className as string,
          classNames?.popup?.listItem,
          groupOption ? `${optionPrefixCls}-grouped` : '',
          props.activeIndex === itemIndex && !mergedDisabled ? `${optionPrefixCls}-active` : '',
          mergedDisabled ? `${optionPrefixCls}-disabled` : '',
          selected ? `${optionPrefixCls}-selected` : '',
        ]
          .filter(Boolean)
          .join(' ');

        // https://github.com/ant-design/ant-design/issues/34145
        const content = typeof label === 'number' ? label : (label ?? value);
        let optionTitle = isTitleType(content) ? String(content) : undefined;
        if (title !== undefined) optionTitle = title as string;

        const menuItemSelectedIcon = select.menuItemSelectedIcon;
        const iconVisible =
          !menuItemSelectedIcon || typeof menuItemSelectedIcon === 'function' || selected;

        return h(
          'div',
          {
            ...pickDataAttrs(otherProps),
            ...(select.virtual ? {} : { role: 'option', id: `${id}_list_${itemIndex}` }),
            'aria-selected': select.virtual ? undefined : isAriaSelected(value),
            'aria-disabled': mergedDisabled,
            class: optionClassName,
            title: optionTitle,
            style: { ...(styles?.popup?.listItem ?? {}), ...((style as object) ?? {}) },
            onMousemove: () => {
              if (props.activeIndex === itemIndex || mergedDisabled) return;
              props.onActiveIndexChange?.(itemIndex);
            },
            onClick: () => {
              if (!mergedDisabled) props.onSelectValue?.(value);
            },
          },
          [
            h('div', { class: `${optionPrefixCls}-content` }, [
              typeof select.optionRender === 'function'
                ? (select.optionRender(item, { index: itemIndex }) as never)
                : (content as never),
            ]),
            (typeof menuItemSelectedIcon === 'function' || selected) && iconVisible
              ? h(
                  TransBtn,
                  {
                    className: `${itemPrefixCls}-option-state`,
                    customizeIcon: menuItemSelectedIcon as never,
                    customizeIconProps: { value, disabled: mergedDisabled, isSelected: selected },
                  } as never,
                  () => (selected ? '✓' : null),
                )
              : null,
          ],
        );
      };

      // ⚠️ 返回**多根**（影子 listbox + 虚拟列表），不包一层 div：
      //    antd 的 `.ant-select-dropdown` 下只有一层 wrapper（SelectTrigger 的），
      //    再套一层会破坏 DOM 契约。
      return [
        select.virtual
          ? h('div', { ...a11yProps, style: { height: '0px', width: '0px', overflow: 'hidden' } }, [
              renderHiddenItem(props.activeIndex - 1),
              renderHiddenItem(props.activeIndex),
              renderHiddenItem(props.activeIndex + 1),
            ])
          : null,
        h(
          VirtualList,
          {
            ref: listRef,
            prefixCls: `${prefixCls}-dropdown-list`,
            itemKey: 'key',
            data: flatten,
            height: select.listHeight,
            itemHeight: select.listItemHeight,
            fullHeight: false,
            onMousedown: onListMouseDown,
            onScroll: props.onPopupScroll,
            virtual: select.virtual,
            direction: select.direction,
            innerProps: (select.virtual ? undefined : a11yProps) as never,
            showScrollBar: base.showScrollBar,
            class: classNames?.popup?.list,
            style: styles?.popup?.list,
          },
          {
            default: ({ item, index }: { item: unknown; index: number }) =>
              renderItem(item as (typeof flatten)[number], index) as never,
          },
        ),
      ];
    };
  },
});

/** 导出给 BaseSelect 用的按键常量（避免两处各写一份 KeyCode）。 */
export const OPTION_KEY = {
  UP: KeyCode.UP,
  DOWN: KeyCode.DOWN,
  ENTER: KeyCode.ENTER,
  TAB: KeyCode.TAB,
  ESC: KeyCode.ESC,
};

export default OptionList;
