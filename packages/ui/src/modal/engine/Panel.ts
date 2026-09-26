/**
 * `Panel` —— `@rc-component/dialog@1.10.0` `es/Dialog/Content/Panel.js`（135 行）的 Vue 版。
 *
 * 渲染树（逐条对齐上游，L4 的判据）：
 *
 * ```
 * <div role="dialog" aria-modal="true" aria-labelledby={title ? ariaId : null}
 *      tabIndex={-1} ref={mergedRef}
 *      class="{p} [className]" style={{...style, width, height}}
 *      onMouseDown onMouseUp onFocus={e => ignoreElement(e.target)}>
 *   └─ MemoChildren(shouldUpdate = visible || forceRender)
 *      └─ (modalRender ? modalRender(content) : content)
 *         └─ <div class="{p}-container [classNames.container]" style={styles.container}>
 *            ├─ closable && <button type="button" aria-label="Close" {...ariaProps}
 *            │                class="{p}-close [classNames.close]" disabled={closeBtnIsDisabled}
 *            │                style={styles.close}>{closableObj.closeIcon}</button>
 *            ├─ title && <div class="{p}-header [classNames.header]" style={styles.header}>
 *            │             <div class="{p}-title [classNames.title]" id={ariaId} style={styles.title}>
 *            │               {title}
 *            ├─ <div class="{p}-body [classNames.body]" style={{...bodyStyle, ...styles.body}} {...bodyProps}>
 *            │    {children}
 *            └─ footer && <div class="{p}-footer [classNames.footer]" style={styles.footer}>{footer}</div>
 * ```
 *
 * 关键判据：
 *   1. **焦点陷阱**：`useLockFocus(visible && isFixedPos && focusTrap !== false, () => panel)`，
 *      返回的 `ignoreElement` 在 `onFocus` 里用 —— 焦点跑到面板外时拉回来；
 *   2. **`aria-modal="true"` 恒在**；`aria-labelledby` **只在有 title 时**挂（值是 `ariaId`）；
 *   3. `closable` 是对象 ⇒ **对象自己的 `closeIcon` 赢**；`closable === true` 才用 `closeIcon` prop；
 *   4. 宽高走 `contentStyle`（`width !== undefined` 才写）；⚠️ **必须过 `toCssSize`**
 *      （Vue 不给数字补 px，PITFALLS 170 / D94）；
 *   5. `bodyProps` 原样展开到 body div（antd 用它挂 `data-*`）。
 */
import { pickAttrs, useLockFocus } from '@apollo-design/utils';
import { computed, defineComponent, h, inject, type PropType, ref, type VNodeChild } from 'vue';

import type { ModalSemanticType } from '../interface';
import { dialogRefContextKey } from './context';
import MemoChildren from './MemoChildren';
import { clsx, toCssSize } from './util';

interface ClosableLike {
  closeIcon?: VNodeChild;
  disabled?: boolean;
  [key: string]: unknown;
}

export default defineComponent({
  name: 'ADialogPanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    ariaId: { type: String, default: undefined },
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<boolean | ClosableLike>, default: true },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    modalRender: {
      type: Function as PropType<(node: VNodeChild) => VNodeChild>,
      default: undefined,
    },
    visible: { type: Boolean, default: false },
    forceRender: { type: Boolean, default: false },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    classNames: {
      type: Object as PropType<ModalSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    /** 容器 `position` 是否为 `fixed`（焦点陷阱的门控之一）。 */
    isFixedPos: { type: Boolean, default: false },
    focusTrap: { type: Boolean, default: undefined },
    /** antd 的 `panelRef`（`composeRef(panelRef, innerPanelRef)`）。 */
    panelRef: { type: [Object, Function] as PropType<unknown>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const internalRef = ref<HTMLElement | null>(null);

    // `Dialog` 通过 ref-context 把自己的面板元素引用交下来（焦点归还要 `focus()` 它）
    const refContext = inject(dialogRefContextKey, null);

    const setRef = (el: unknown): void => {
      internalRef.value = (el as HTMLElement | null) ?? null;
      if (refContext?.panel) refContext.panel.value = internalRef.value;
      const external = props.panelRef;
      if (typeof external === 'function') (external as (e: unknown) => void)(el);
      else if (external && typeof external === 'object' && 'value' in (external as object)) {
        (external as { value: unknown }).value = el;
      }
    };

    // ------------------------------ 焦点陷阱 ------------------------------
    // ⚠️ 三个门都要真：visible && isFixedPos && focusTrap !== false（上游逐字）
    const [ignoreElement] = useLockFocus(
      () => props.visible && props.isFixedPos && props.focusTrap !== false,
      () => internalRef.value,
    );

    // ------------------------------ 样式 ------------------------------
    const contentStyle = computed<Record<string, unknown>>(() => {
      const style: Record<string, unknown> = {};
      if (props.width !== undefined) style.width = toCssSize(props.width);
      if (props.height !== undefined) style.height = toCssSize(props.height);
      return style;
    });

    return () => {
      const prefixCls = props.prefixCls;
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};

      // >>> closable 归一化（上游逐字）
      const closableObj: ClosableLike =
        typeof props.closable === 'object' && props.closable !== null
          ? (props.closable as ClosableLike)
          : props.closable
            ? { closeIcon: props.closeIcon ?? h('span', { class: `${prefixCls}-close-x` }) }
            : {};

      const ariaProps = pickAttrs(closableObj as Record<string, unknown>, true);
      const closeBtnIsDisabled =
        typeof props.closable === 'object' && props.closable !== null
          ? !!closableObj.disabled
          : false;

      const closerNode = props.closable
        ? h(
            'button',
            {
              type: 'button',
              onClick: props.onClose,
              'aria-label': 'Close',
              ...ariaProps,
              class: clsx(`${prefixCls}-close`, cn.close),
              disabled: closeBtnIsDisabled,
              style: st.close,
            },
            closableObj.closeIcon as never,
          )
        : null;

      const headerNode = props.title
        ? h(
            'div',
            { class: clsx(`${prefixCls}-header`, cn.header), style: st.header },
            h(
              'div',
              { class: clsx(`${prefixCls}-title`, cn.title), id: props.ariaId, style: st.title },
              props.title as never,
            ),
          )
        : null;

      const footerNode = props.footer
        ? h(
            'div',
            { class: clsx(`${prefixCls}-footer`, cn.footer), style: st.footer },
            props.footer as never,
          )
        : null;

      const content = h(
        'div',
        {
          class: clsx(`${prefixCls}-container`, cn.container),
          style: st.container,
        },
        [
          closerNode,
          headerNode,
          h(
            'div',
            {
              class: clsx(`${prefixCls}-body`, cn.body),
              style: { ...props.bodyStyle, ...st.body },
              ...props.bodyProps,
            },
            slots.default?.(),
          ),
          footerNode,
        ],
      );

      return h(
        'div',
        {
          key: 'dialog-element',
          role: 'dialog',
          'aria-labelledby': props.title ? props.ariaId : null,
          'aria-modal': 'true',
          ref: setRef,
          style: { ...props.style, ...contentStyle.value },
          class: clsx(prefixCls, props.className),
          tabIndex: -1,
          onFocus: (e: FocusEvent) => {
            ignoreElement(e.target as HTMLElement);
          },
          ...pickAttrs(attrs as Record<string, unknown>, { aria: true }),
        },
        h(
          MemoChildren,
          { shouldUpdate: props.visible || props.forceRender },
          {
            default: () => (props.modalRender ? (props.modalRender(content) as never) : content),
          },
        ),
      );
    };
  },
});
