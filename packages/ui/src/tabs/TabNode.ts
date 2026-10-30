/**
 * 单个页签（rc `TabNavList/TabNode.js` 的等价物）。**ARIA 规范的主力**。
 *
 * ── DOM（逐字）──────────────────────────────────────────────────────────────────
 *
 * ```
 * div.{p}-tab[data-node-key][-with-remove][-active][-disabled][-focus][style=item]
 * └─ div.{p}-tab-btn[role=tab][aria-selected][id={id}-tab-{key}]
 *      [aria-controls={id}-panel-{key}][aria-disabled][tabindex: disabled?null:tabStop?0:-1]
 *      [onKeydown / onFocus / onBlur / onMousedown / onMouseup / onClick]
 *    ├─ div[aria-live=polite][style: 0×0 裁剪]  ← **仅 focus 时**，文本 `Tab {i} of {n}`
 *    ├─ span.{p}-tab-icon{icon}                 ← 有 icon 时
 *    └─ {label}（⚠️ `icon && typeof label === 'string'` 时包一层 `<span>`）
 * └─ button.{p}-tab-remove[aria-label][tabindex: active?0:-1]   ← removable 时
 * ```
 *
 * ── 五个容易写错的判据 ─────────────────────────────────────────────────────────
 *
 *   1. `data-node-key` 走 `genDataNodeKey`（`"` → `TABS_DQ`），否则含引号的 key 会把
 *      属性选择器截断；
 *   2. `tabindex` 是**三态**：`disabled ? null : tabStop ? 0 : -1`（`null` 会移除属性）；
 *   3. **关闭按钮的 `tabIndex` 判据是 `active`**（不是 `disabled`）—— 与 btn 不同；
 *   4. `aria-live` 那个 div 只在 **focus** 时渲染，文本是 `Tab {currentPosition} of {tabCount}`
 *      （`tabCount` 是**启用**页签数，不是总数）；
 *   5. `focus` 为真时要**真的 `.focus()`**（用 watch 而不是「渲染后调」——
 *      Vue 里渲染函数不能保证当帧 DOM 可用）。
 *
 * ⚠️ Vue 事件 prop 名**全小写**（`onMousedown` / `onMouseup` / `onKeydown`）——
 *    大写会**静默失效**（PITFALLS 1）。这里用 `h()` 的 `on*` 键名，注意与 DOM 原生名对齐。
 */

import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import type { TabsEditableConfig, TabsEditEvent, TabsItem } from './interface';
import { genDataNodeKey, getPanelId, getRemovable, getTabId } from './util';

export default defineComponent({
  name: 'ATabNode',
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String as PropType<string | undefined>, default: undefined },
    tab: { type: Object as PropType<TabsItem>, required: true },
    active: { type: Boolean, default: false },
    focus: { type: Boolean, default: false },
    tabStop: { type: Boolean, default: false },
    closable: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    editable: { type: Object as PropType<TabsEditableConfig | undefined>, default: undefined },
    removeAriaLabel: { type: String as PropType<string | undefined>, default: undefined },
    itemClassName: { type: String as PropType<string | undefined>, default: undefined },
    removeClassName: { type: String as PropType<string | undefined>, default: undefined },
    itemStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    removeStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    tabCount: { type: Number, default: 0 },
    currentPosition: { type: Number, default: 0 },
  },
  emits: {
    tabClick: (_key: string, _event: TabsEditEvent) => true,
    focusTab: (_key: string) => true,
    blurTab: () => true,
    tabKeydown: (_event: KeyboardEvent) => true,
    tabMousedown: (_key: string, _event: MouseEvent) => true,
    tabMouseup: () => true,
    removeTab: (_key: string, _event: TabsEditEvent) => true,
  },
  setup(props, { emit }) {
    const btnRef = ref<HTMLElement | null>(null);

    const removable = computed(() =>
      getRemovable(props.closable, props.tab.closeIcon, props.editable, props.tab.disabled),
    );

    // focus 为真时真的聚焦（rc 用 `useEffect([focus])`）
    watch(
      () => props.focus,
      (focus) => {
        if (focus && btnRef.value) {
          btnRef.value.focus();
        }
      },
      { immediate: true, flush: 'post' },
    );

    const onInternalClick = (e: MouseEvent): void => {
      if (props.tab.disabled) return;
      emit('tabClick', props.tab.key, e);
    };

    const onRemoveClick = (e: MouseEvent): void => {
      e.stopPropagation();
      emit('removeTab', props.tab.key, e);
    };

    return () => {
      const { prefixCls, tab, active, editable } = props;
      const tabPrefix = `${prefixCls}-tab`;
      const { key, label, icon, disabled } = tab;

      // ⚠️ `icon && typeof label === 'string'` 时把 label 包一层 `<span>`
      //    （否则 icon 与纯文本会被 flex 挤在一起、间距规则失效）
      const labelNode: VNodeChild =
        icon !== undefined && icon !== null && icon !== false && typeof label === 'string'
          ? h('span', null, label)
          : label;

      const btn = h(
        'div',
        {
          ref: btnRef,
          role: 'tab',
          'aria-selected': active,
          id: props.id ? getTabId(props.id, key) : undefined,
          class: `${tabPrefix}-btn`,
          'aria-controls': props.id ? getPanelId(props.id, key) : undefined,
          'aria-disabled': disabled,
          // Keep an enabled Tab entry even when a controlled active key is disabled.
          tabIndex: disabled ? null : props.tabStop ? 0 : -1,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            onInternalClick(e);
          },
          onKeydown: (event: KeyboardEvent) => {
            if (!disabled) emit('tabKeydown', event);
          },
          onMousedown: (e: MouseEvent) => emit('tabMousedown', key, e),
          onMouseup: () => emit('tabMouseup'),
          onFocus: () => {
            if (!disabled) emit('focusTab', key);
          },
          onBlur: () => emit('blurTab'),
        },
        [
          // 仅 focus 时的屏幕阅读器播报（视觉隐藏：0×0 + 裁剪 + 透明）
          props.focus &&
            h(
              'div',
              {
                'aria-live': 'polite',
                // ⚠️ 用**字符串**而不是裸数字：React 会把 `0` 序列化成 `0px`，
                //    Vue 原样写 `0` —— 视觉等价，但 DOM 逐字不同（做对拍时会被抓到）。
                style: {
                  width: '0px',
                  height: '0px',
                  position: 'absolute',
                  overflow: 'hidden',
                  opacity: '0',
                },
              },
              `Tab ${props.currentPosition} of ${props.tabCount}`,
            ),
          icon !== undefined && icon !== null && icon !== false
            ? h('span', { class: `${tabPrefix}-icon` }, [icon])
            : null,
          labelNode,
        ],
      );

      const removeBtn =
        removable.value &&
        h(
          'button',
          {
            type: 'button',
            'aria-label': props.removeAriaLabel || 'remove',
            // ⚠️ 判据是 active（不是 disabled）—— 与上面的 btn 不同
            tabIndex: active ? 0 : -1,
            class: [`${tabPrefix}-remove`, props.removeClassName].filter(Boolean).join(' '),
            style: props.removeStyle,
            onClick: onRemoveClick,
          },
          [
            tab.closeIcon === false
              ? (editable?.removeIcon ?? '×')
              : (tab.closeIcon ?? editable?.removeIcon ?? '×'),
          ],
        );

      return h(
        'div',
        {
          'data-node-key': genDataNodeKey(key),
          class: [
            tabPrefix,
            props.itemClassName,
            removable.value ? `${tabPrefix}-with-remove` : '',
            active ? `${tabPrefix}-active` : '',
            disabled ? `${tabPrefix}-disabled` : '',
            props.focus ? `${tabPrefix}-focus` : '',
          ]
            .filter(Boolean)
            .join(' '),
          style: props.itemStyle,
          onClick: onInternalClick,
        },
        [btn, removeBtn],
      );
    };
  },
});
