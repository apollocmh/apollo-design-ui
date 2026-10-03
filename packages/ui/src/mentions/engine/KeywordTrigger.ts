/**
 * `@rc-component/mentions@1.12.0` 的 `es/KeywordTrigger.js`（52 行）—— 候选浮层的定位壳。
 *
 * 上游做的事只有三件：① 4 个 `BUILT_IN_PLACEMENTS`；② 由 `placement` + `direction`
 * 推出 `bottomRight` / `bottomLeft` / `topRight` / `topLeft`；③ 把这些交给 rc-trigger。
 * **本仓的 `_internal/trigger.ts` 就是 rc-trigger 的等价物**（tooltip 的第一消费者），
 * 所以这里只剩「prop 名映射」与「`getPopupContainer` 签名适配」。
 *
 * ── prop 名映射（rc-trigger → 本仓 Trigger）────────────────────────────────────
 *
 * | rc | 本仓 |
 * |---|---|
 * | `popupVisible` | `open` |
 * | `popupPlacement` | `placement` |
 * | `popupMotion` | `motion: { motionName }` |
 * | `builtinPlacements` | 同名（**required**） |
 * | `afterOpenChange` | 同名 |
 * | `getPopupContainer(triggerNode)` | 本仓签名同；而 `MentionsProps.getPopupContainer` 是 `() => HTMLElement` ⇒ **这里适配** |
 *
 * ── 实测对拍 ──────────────────────────────────────────────────────────────────
 *
 * `placement='bottom'`（默认）⇒ 浮层类名 `{p}-dropdown-placement-bottomRight`；
 * `placement='top'` ⇒ `-topRight`；`direction='rtl'` ⇒ 取 `Left` 侧（实测见 analysis §3.1）。
 */

import { computed, defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';
import type { TriggerAlign } from '../../_internal/trigger';
import { Trigger } from '../../_internal/trigger';
import type { MentionPlacement } from '../interface';
import { DropdownMenu, type NormalizedOption } from './DropdownMenu';

/**
 * 上游的 4 个内置位置（`offset: [0, 4]` / `[0, -4]`，`overflow` 双向自动调整）。
 * `points` 是 `[浮层点, 目标点]`。
 */
export const BUILT_IN_PLACEMENTS: Record<string, TriggerAlign> = {
  bottomRight: {
    points: ['tl', 'br'],
    offset: [0, 4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
  bottomLeft: {
    points: ['tr', 'bl'],
    offset: [0, 4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
  topRight: {
    points: ['bl', 'tr'],
    offset: [0, -4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
  topLeft: {
    points: ['br', 'tl'],
    offset: [0, -4],
    overflow: { adjustX: 1, adjustY: 1 },
  },
};

export const KeywordTrigger = defineComponent({
  name: 'AMentionsKeywordTrigger',
  inheritAttrs: false,
  props: {
    /** **浮层**前缀：`${mentionsPrefixCls}-dropdown`。 */
    prefixCls: { type: String, required: true },
    options: { type: Array as PropType<NormalizedOption[]>, default: () => [] },
    /** 恒为真（组件只在 measuring 时渲染）—— 保留 prop 是为了与上游同形。 */
    visible: { type: Boolean, default: undefined },
    transitionName: { type: String, default: undefined },
    getPopupContainer: { type: Function as PropType<() => HTMLElement>, default: undefined },
    popupClassName: { type: String as PropType<string | undefined>, default: undefined },
    popupStyle: {
      type: Object as PropType<Record<string, string | number> | undefined>,
      default: undefined,
    },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    placement: { type: String as PropType<MentionPlacement>, default: undefined },
    popupRender: {
      type: Function as PropType<(menu: VNodeChild) => VNodeChild>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    /** `afterOpenChange` 置位 ⇒ `DropdownMenu` 才开始做「滚动入视口」。 */
    const opened = ref(false);

    const dropdownPlacement = computed(() => {
      if (props.direction === 'rtl') {
        return props.placement === 'top' ? 'topLeft' : 'bottomLeft';
      }
      return props.placement === 'top' ? 'topRight' : 'bottomRight';
    });

    const renderDropdown = (): VNodeChild =>
      h(DropdownMenu, {
        prefixCls: `${props.prefixCls}-menu`,
        options: props.options,
        opened: opened.value,
      });

    return () =>
      h(
        Trigger,
        {
          prefixCls: props.prefixCls,
          open: props.visible,
          popup: () => (props.popupRender ? props.popupRender(renderDropdown()) : renderDropdown()),
          placement: dropdownPlacement.value,
          builtinPlacements: BUILT_IN_PLACEMENTS,
          motion: { motionName: props.transitionName },
          ...(props.getPopupContainer
            ? { getPopupContainer: () => props.getPopupContainer?.() ?? document.body }
            : {}),
          popupClassName: props.popupClassName,
          popupStyle: props.popupStyle,
          afterOpenChange: (open: boolean) => {
            opened.value = open;
          },
        },
        { default: () => slots.default?.() },
      );
  },
});
