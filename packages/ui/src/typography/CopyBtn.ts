/**
 * `CopyBtn` —— `copyable` 的按钮。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/CopyBtn.js`（**逐条对齐**）。
 *
 * ```jsx
 * <Tooltip title={copyTitle}>
 *   <button type="button" class="{prefixCls}-copy [className] [-copy-success] [-copy-icon-only]"
 *           style={style} onClick={onCopy} aria-label={ariaLabel} tabIndex={tabIndex}>
 *     {copied ? (icon[1] ?? <CheckOutlined/>)
 *             : (icon[0] ?? (loading ? <LoadingOutlined/> : <CopyOutlined/>))}
 *   </button>
 * </Tooltip>
 * ```
 *
 * ── 三处必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **`aria-label` 的兜底顺序**：`typeof copyTitle === 'string' ? copyTitle : systemStr`。
 *      也就是说 `tooltips` 给的是节点（非字符串）时，`aria-label` 退回语言包文案 ——
 *      而不是空字符串。可访问名必须有内容。
 *   2. **`iconOnly` 只看 children 是否可渲染**（`isReactRenderable`）。它不是
 *      「按钮里没有图标」，而是「文字内容为空、只有图标」⇒ 加 `-copy-icon-only`
 *      让 CSS 用更小的点击热区。判据来自 `Base`，本组件只负责落类名。
 *   3. **`copied` / 未复制两个分支的 `needDom` 都是 `true`**：`icon: false` 在两种状态下
 *      **都仍然渲染默认图标**（`false || (true && <CheckOutlined/>)` ⇒ `CheckOutlined`；
 *      未复制态同理 ⇒ `CopyOutlined`）。这是 `getNode` 的既定行为，不是笔误 ——
 *      `icon: false` 在本组件里**不是**「不画图标」的开关。
 *      （「不画」的语义只在 `needDom` 为假时成立，例如 `tooltips: false`：那里
 *      `getNode(false, systemStr)` 得到 `false` ⇒ 气泡不弹，而 `aria-label` 退回语言包文案。）
 *      ⇒ 用例断言的是「仍然渲染默认图标」，防止有人把它「修」成不渲染而偏离上游。
 *
 * ── 与 antd 的一处差异（INTENDED，见 README §7）─────────────────────────────────
 *
 * 2026-10-04 起：Tooltip 已收口，这里与 antd 逐字对齐 —— 按钮包进 `<Tooltip
 * title={copyTitle}>`。关闭态 DOM 等价（Trigger 对单元素子节点只 cloneVNode），
 * `tooltips` 的文案仍然完整地参与 `aria-label` 的计算。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` ────────────────────────────────────────
 *
 * 「渲染一个 `VNodeChild` 变量」在模板里没有直接语法（`{{ x }}` 会把 VNode
 * JSON 化，`<component :is="x">` 只接受组件/标签名）。而本组件的图标恰恰是一个
 * `VNodeChild`（可能是用户给的节点、`false`、或内置图标组件）。这是
 * COMPONENT-RULES.md §2 允许 `.ts` 渲染函数的第 1 条情形（纯渲染函数内部组件）。
 */

import { CheckOutlined, CopyOutlined, LoadingOutlined } from '@apollo-design/icons';
import type { TextLocale } from '@apollo-design/locale';
import { type CSSProperties, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import Tooltip from '../tooltip/Tooltip';
import { type CopyConfigListNode, getNode, toCopyConfigList } from './_util/util';

export const CopyBtn = defineComponent({
  name: 'ATypographyCopyBtn',
  props: {
    prefixCls: { type: String, required: true },
    /** 是否处于「已复制」态。 */
    copied: { type: Boolean, default: undefined },
    /** 语言包。取 `copy` / `copied` 作为 `aria-label` 的兜底。 */
    locale: { type: Object as PropType<TextLocale>, default: undefined },
    /** 内容为空（只有图标）⇒ 加 `-copy-icon-only`。 */
    iconOnly: { type: Boolean, default: undefined },
    /** 悬浮提示。`[未复制, 已复制]`。 */
    tooltips: { type: null as unknown as PropType<CopyConfigListNode>, default: undefined },
    /** 图标。`[未复制, 已复制]`。 */
    // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（源自 copyable.icon）
    icon: { type: null as unknown as PropType<CopyConfigListNode>, default: undefined },
    tabIndex: { type: Number, default: undefined },
    onCopy: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
    /** 剪贴板写入进行中（决定未复制态用 `LoadingOutlined` 还是 `CopyOutlined`）。 */
    loading: { type: Boolean, default: undefined },
    /** 语义化 `action` 类名（由 `Base` 合并后传入）。 */
    className: { type: String, default: undefined },
    /** 语义化 `action` 样式（由 `Base` 合并后传入）。 */
    style: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props) {
    return () => {
      const tooltipNodes = toCopyConfigList(props.tooltips);
      const iconNodes = toCopyConfigList(props.icon);

      const copiedText = props.locale?.copied;
      const copyText = props.locale?.copy;
      const systemStr: VNodeChild = props.copied ? copiedText : copyText;

      const copyTitle = getNode(tooltipNodes[props.copied ? 1 : 0], systemStr);
      const ariaLabel = typeof copyTitle === 'string' ? copyTitle : systemStr;

      const iconNode: VNodeChild = props.copied
        ? getNode(iconNodes[1], h(CheckOutlined), true)
        : getNode(iconNodes[0], props.loading ? h(LoadingOutlined) : h(CopyOutlined), true);

      const buttonNode = h(
        'button',
        {
          type: 'button',
          class: [
            `${props.prefixCls}-copy`,
            props.className,
            {
              [`${props.prefixCls}-copy-success`]: props.copied,
              [`${props.prefixCls}-copy-icon-only`]: props.iconOnly,
            },
          ],
          style: props.style,
          onClick: props.onCopy,
          'aria-label': ariaLabel,
          tabIndex: props.tabIndex,
        },
        [iconNode],
      );
      // antd 逐字：`<Tooltip title={copyTitle}>{button}</Tooltip>` —— title 可能是
      // `false`（`tooltips: false` ⇒ 气泡不弹，aria-label 走语言包兜底），照传。
      return h(Tooltip, { title: copyTitle } as never, { default: () => buttonNode });
    };
  },
});
