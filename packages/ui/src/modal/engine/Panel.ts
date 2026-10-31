import { isEmptyVNode, pickAttrs, useLockFocus } from '@apollo-design/utils';
import type { SlotsType, StyleValue, VNodeChild } from 'vue';
import {
  type ComponentPublicInstance,
  type CSSProperties,
  computed,
  defineComponent,
  type FunctionalComponent,
  h,
  inject,
  mergeProps,
  type PropType,
  ref,
} from 'vue';
import type { ModalSemanticType } from '../interface';
import { dialogRefContextKey } from './context';
import type { DialogClosable, DialogSlots, ModalPanelRef } from './interface';
import MemoChildren from './MemoChildren';
import { clsx, toCssSize } from './util';

type ClosableLike = Exclude<DialogClosable, boolean | null>;

export default defineComponent({
  name: 'ADialogPanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: [Object, Array, String] as PropType<StyleValue>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    ariaId: { type: String, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<DialogClosable>, default: true },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    bodyStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
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
    panelRef: { type: [Object, Function] as PropType<ModalPanelRef>, default: undefined },
  },
  slots: {} as SlotsType<DialogSlots>,
  setup(props, { attrs, slots }) {
    const internalRef = ref<HTMLElement | null>(null);

    // `Dialog` 通过 ref-context 把自己的面板元素引用交下来（焦点归还要 `focus()` 它）
    const refContext = inject(dialogRefContextKey, null);

    const setRef = (el: Element | ComponentPublicInstance | null): void => {
      internalRef.value = el instanceof HTMLElement ? el : null;
      if (refContext?.panel) refContext.panel.value = internalRef.value;
      const external = props.panelRef;
      if (typeof external === 'function') external(internalRef.value);
      else if (external) external.value = internalRef.value;
    };

    // ------------------------------ 焦点陷阱 ------------------------------
    // ⚠️ 三个门都要真：visible && isFixedPos && focusTrap !== false（上游逐字）
    const [ignoreElement] = useLockFocus(
      () => props.visible && props.isFixedPos && props.focusTrap !== false,
      () => internalRef.value,
    );

    // ------------------------------ 样式 ------------------------------
    const contentStyle = computed<CSSProperties>(() => {
      const style: CSSProperties = {};
      if (props.width !== undefined) style.width = toCssSize(props.width);
      if (props.height !== undefined) style.height = toCssSize(props.height);
      return style;
    });

    const ModalPanel: FunctionalComponent = () => {
      const prefixCls = props.prefixCls;
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};

      // >>> closable 归一化（上游逐字）
      const closableObj: ClosableLike =
        typeof props.closable === 'object' && props.closable !== null
          ? props.closable
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
            [closableObj.closeIcon],
          )
        : null;

      const headerNode = !isEmptyVNode(props.title)
        ? h(
            'div',
            { class: clsx(`${prefixCls}-header`, cn.header), style: st.header },
            h(
              'div',
              { class: clsx(`${prefixCls}-title`, cn.title), id: props.ariaId, style: st.title },
              [props.title],
            ),
          )
        : null;

      const footerNode = !isEmptyVNode(props.footer)
        ? h('div', { class: clsx(`${prefixCls}-footer`, cn.footer), style: st.footer }, [
            props.footer,
          ])
        : null;

      return h(
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
            mergeProps(
              { class: clsx(`${prefixCls}-body`, cn.body), style: [props.bodyStyle, st.body] },
              props.bodyProps ?? {},
            ),
            [slots.default?.()],
          ),
          footerNode,
        ],
      );
    };

    return () =>
      h(
        'div',
        mergeProps(
          {
            key: 'dialog-element',
            role: 'dialog',
            'aria-labelledby': !isEmptyVNode(props.title) ? props.ariaId : undefined,
            'aria-modal': 'true',
            ref: setRef,
            style: [props.style, contentStyle.value],
            class: [props.prefixCls, props.className],
            tabIndex: -1,
            onFocus: (event: FocusEvent) => {
              if (event.target instanceof HTMLElement) ignoreElement(event.target);
            },
          },
          attrs,
        ),
        [
          h(
            MemoChildren,
            { shouldUpdate: props.visible || props.forceRender },
            {
              default: () =>
                slots.modalRender ? slots.modalRender({ ModalPanel }) : h(ModalPanel),
            },
          ),
        ],
      );
  },
});
