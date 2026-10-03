/**
 * `Mentions._InternalPanelDoNotUseOrYouWillBeFired` 的 Vue 对应物 —— 静态面板。
 *
 * ── 契约（**实测自 antd 的 demo 快照**，不是照 `genPurePanel` 推演）──────────────
 *
 * `components/mentions/__tests__/__snapshots__/demo.test.tsx.snap` 的
 * `render-panel.tsx` 一条给出：
 *
 * ```html
 * <div style="padding-bottom:0;position:relative;min-width:0">
 *   <div class="ant-mentions ant-mentions-outlined ant-mentions css-var-test-id ant-mentions-css-var"
 *        style="width:100%;margin:0">
 *     <textarea class="rc-textarea" rows="1">@</textarea>
 *   </div>
 * </div>
 * ```
 *
 * 🚨 **候选面板根本不渲染**：`genPurePanel` 会把 `open: true` 塞进 props，但
 *    **Mentions 没有 `open` prop** ⇒ 它落进 `restProps` → `RcMentions` → `TextArea`
 *    → `<textarea open="true">`（被 React 丢弃）⇒ 面板不会展开。
 *    ⇒ 本仓**同样不展开**（`select/PurePanel.ts` 能展开是因为 Select 有 `open` prop）。
 *
 * 持有层的 `padding-bottom / min-width` 来自 `genPurePanel` 的 `popupHeight/Width`
 * （由 `ResizeObserver` 量测），SSR / 首帧都是 `0` ⇒ 静态产物是
 * `padding-bottom:0;position:relative;min-width:0`。
 */

import { defineComponent, h, ref } from 'vue';
import type { MentionsProps } from './interface';
import Mentions from './Mentions';

export const PurePanel = defineComponent({
  name: 'AMentionsPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    value: { type: String, default: undefined },
    options: { type: Array as never, default: undefined },
    style: { type: Object as never, default: undefined },
    classNames: { type: Object as never, default: undefined },
    styles: { type: Object as never, default: undefined },
    notFoundContent: { type: null as unknown as undefined, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const hostRef = ref<HTMLElement | null>(null);
    return () =>
      h(
        'div',
        {
          ref: hostRef,
          style: { paddingBottom: 0, position: 'relative', minWidth: 0 },
        },
        h(
          Mentions,
          {
            ...props,
            ...attrs,
            style: { ...(props.style as object), margin: 0 },
            getPopupContainer: () => hostRef.value as HTMLElement,
          } as MentionsProps as never,
          slots,
        ),
      );
  },
});

export default PurePanel;
