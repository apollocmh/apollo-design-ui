import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { useZIndex } from '@apollo-design/portal';
import {
  canUseDom,
  isEmptyVNode,
  isNumber,
  isPlainObject,
  useControlledValue,
} from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeClass,
  normalizeStyle,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { computeClosable } from '../_internal/use-closable';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { type MaskType, useMergedMask } from '../_internal/use-merged-mask';
import { useComponentConfig } from '../config-provider/context';
import Skeleton from '../skeleton';
import { usePanelRef } from '../watermark/context';
import NormalCancelBtn from './components/NormalCancelBtn';
import NormalOkBtn from './components/NormalOkBtn';
import { modalContextKey } from './context';
import DialogWrap from './engine/DialogWrap';
import type {
  FocusableConfig,
  ModalBreakpoint,
  ModalButtonProps,
  ModalGetContainer,
  ModalOkType,
  ModalPanelRef,
  ModalProps,
  ModalSemanticType,
  ModalSemanticTypeInput,
  ModalSlots,
  MousePosition,
} from './interface';
import ModalPanel, { renderCloseIcon } from './ModalPanel';
import { useModalTheme } from './use-modal-theme';
import { getTransitionName } from './util';

const DEFAULT_WIDTH = 520;

/**
 * 最近一次点击位置 —— antd `Modal` 的 zoom 入场原点来源。
 *
 * 上游在 `es/modal/Modal.js:24-41` 用模块级 capture click 记录 `pageX/pageY`，
 * 100ms 内打开 Modal 就用它作为 `transform-origin`；否则回退到面板中心。
 * 这是**行为契约**（同一操作下 antd 从点击点放大），不是要复制 React 实现。
 *
 * 放在模块级是为了覆盖「点击后才条件挂载 Modal」的用法：事件发生在组件 setup
 * 之前，组件内部监听来不及捕获。`canUseDom()` 保护 SSR；顶层菜单/弹窗都只依赖
 * 一次全局监听，不需要每个实例重复绑定。
 */
let lastClickPosition: MousePosition | null = null;
let clickPositionTimer: ReturnType<typeof setTimeout> | null = null;

function recordClickPosition(event: MouseEvent): void {
  lastClickPosition = { x: event.pageX, y: event.pageY };
  if (clickPositionTimer) clearTimeout(clickPositionTimer);
  clickPositionTimer = setTimeout(() => {
    lastClickPosition = null;
    clickPositionTimer = null;
  }, 100);
}

if (canUseDom()) {
  document.documentElement.addEventListener('click', recordClickPosition, true);
}

export default defineComponent({
  name: 'AModal',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    /** ⚠️ 默认 520。 */
    width: {
      type: [String, Number, Object] as PropType<
        string | number | Partial<Record<ModalBreakpoint, string | number>>
      >,
      default: DEFAULT_WIDTH,
    },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    title: { type: String, default: undefined },
    okText: { type: String, default: undefined },
    cancelText: { type: String, default: undefined },
    okType: { type: String as PropType<ModalOkType>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    centered: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: false },
    closable: {
      type: [Boolean, Object] as PropType<ModalProps['closable']>,
      default: undefined,
    },
    mask: { type: [Boolean, Object] as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    maskStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    mousePosition: {
      type: Object as PropType<MousePosition>,
      default: undefined,
    },
    zIndex: { type: Number, default: undefined },
    getContainer: {
      type: [String, Boolean, Function, Object] as PropType<ModalGetContainer>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    destroyOnHidden: { type: Boolean, default: undefined },
    destroyOnClose: { type: Boolean, default: undefined },
    keyboard: { type: Boolean, default: true },
    scrollLock: { type: Boolean, default: true },
    wrapClassName: { type: String, default: undefined },
    wrapStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    wrapProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    transitionName: { type: String, default: undefined },
    maskTransitionName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    /**
     * 语义槽类名。
     *
     * ⚠️ 运行时**同时接受函数形态**（`(info) => classNames`）—— `useMergeSemantic`
     *    的 `resolveSemantic` 会调用它。类型面按 D36 只声明对象形态，
     *    所以这里用 `[Object, Function]` 放行（同 `_internal/use-merge-semantic` 的约定）。
     */
    classNames: {
      type: [Object, Function] as PropType<ModalSemanticTypeInput['classNames']>,
      default: undefined,
    },
    /** 语义槽样式。⚠️ 同 `classNames`，运行时接受函数形态。 */
    styles: {
      type: [Object, Function] as PropType<ModalSemanticTypeInput['styles']>,
      default: undefined,
    },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    panelRef: { type: [Object, Function] as PropType<ModalPanelRef>, default: undefined },
    /** 内部：`ConfirmDialog` 用（从语义槽里摘掉若干键）。 */
    _semanticOmit: {
      type: Array as unknown as PropType<string[] | undefined>,
      default: undefined,
    },
    /** 内部：`ConfirmDialog` 用（接管 body 的渲染）。 */
    _renderSemanticContent: {
      type: Function as PropType<
        (info: {
          classNames: ModalSemanticType['classNames'];
          styles: ModalSemanticType['styles'];
        }) => VNodeChild
      >,
      default: undefined,
    },
  },
  slots: {} as SlotsType<ModalSlots>,
  emits: {
    'update:open': (_open: boolean) => true,
    ok: (_event: Event) => true,
    cancel: (_event: Event) => true,
    afterClose: () => true,
    afterOpenChange: (_open: boolean) => true,
  },
  setup(props, { attrs, slots, emit }) {
    const theme = useModalTheme();
    const [open, setOpen] = useControlledValue({
      defaultValue: false,
      getValue: () => props.open,
      onChange: (value) => emit('update:open', value),
    });
    const config = useComponentConfig<{
      className?: string;
      style?: import('vue').CSSProperties;
      classNames?: ModalProps['classNames'];
      styles?: ModalProps['styles'];
      closable?: ModalProps['closable'];
      closeIcon?: VNodeChild;
      centered?: boolean;
      cancelButtonProps?: ModalButtonProps;
      okButtonProps?: ModalButtonProps;
      mask?: MaskType;
      focusable?: FocusableConfig;
    }>('modal');

    // ⚠️ 两个前缀都必须是 computed —— 普通字符串是 setup 期快照，父组件更新局部
    //    `prefixCls`（或 ConfigProvider 换全局前缀）后，mask/wrap/panel 的类名与动效名
    //    会继续用旧值（Issue #19.2）。
    const prefixCls = computed(() => props.prefixCls || config.getPrefixCls('modal'));
    const rootPrefixCls = computed(() => config.getPrefixCls());

    // ============================ Closable ============================
    const closableAfterClose = computed(() =>
      typeof props.closable === 'boolean' ? undefined : props.closable?.afterClose,
    );
    const closableOnClose = computed(() =>
      typeof props.closable === 'boolean' ? undefined : props.closable?.onClose,
    );

    // ============================== Mask ==============================
    const mask = useMergedMask(
      () => props.mask,
      () => config.mask,
      () => prefixCls.value,
      () => props.maskClosable,
    );

    // ============================ Focusable ===========================
    const mergedFocusable = computed<FocusableConfig>(() => ({
      trap: mask.enabled.value,
      focusTriggerAfterClose: props.focusTriggerAfterClose ?? true,
      ...(config.focusable ?? {}),
      ...(props.focusable ?? {}),
    }));

    // ============================== Open ==============================
    const handleCancel = (e: Event): void => {
      if (props.confirmLoading) return;
      setOpen(false);
      emit('cancel', e);
      closableOnClose.value?.();
    };
    const handleOk = (e: Event): void => {
      emit('ok', e);
      closableOnClose.value?.();
    };

    // ============================= Warning ============================
    if (process.env.NODE_ENV !== 'production') {
      const deprecated: Array<[unknown, string]> = [
        [props.bodyStyle, 'styles.body'],
        [props.maskStyle, 'styles.mask'],
        [props.destroyOnClose, 'destroyOnHidden'],
        [props.focusTriggerAfterClose, 'focusable.focusTriggerAfterClose'],
        [props.maskClosable, 'mask.closable'],
      ];
      for (const [value, replacement] of deprecated) {
        if (value !== undefined) {
          // eslint-disable-next-line no-console
          console.warn(
            `[Apollo Design] \`Modal\`: \`${String(value)}\` 已废弃，请用 \`${replacement}\`。`,
          );
        }
      }
    }

    // ============================ zIndex ==============================
    // ⚠️ Modal 没有 `zIndexPopup` 这个 ComponentToken —— 上游直接用 `token.zIndexPopupBase`，
    //    本仓的 `useZIndex` 默认值就是它（`DEFAULT_Z_INDEX_POPUP_BASE` = 1000）。
    const zIndex = useZIndex('Modal', () => props.zIndex);

    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    /**
     * 读一个 slot；「提供了但渲染为空」归一为 null（语义：隐藏），「未提供」为
     * undefined。判空必须走 `isEmptyVNode` —— Vue 会把 slot 返回的 null / 空数组
     * 归一成 comment vnode，不能比 `null` / `length`（is.ts §空渲染判据）。
     */
    const readSlot = (name: 'title' | 'okText' | 'cancelText' | 'closeIcon'): VNodeChild => {
      const nodes = slots[name]?.();
      return nodes === undefined ? undefined : isEmptyVNode(nodes) ? null : nodes;
    };

    // =========================== Closable =============================
    // 关闭按钮的可访问名来自 locale（antd 逐字：`useLocale('global').close`）
    const [globalLocale] = useLocale('global');
    // ============================= Refs ==============================
    const panelSelector = () => `.${prefixCls.value}-${slots.modalRender ? 'render' : 'container'}`;
    // The getter also tracks dynamic modalRender slot presence.
    const innerPanelRef = usePanelRef(panelSelector);
    const mergedPanelRef = (el: HTMLElement | null): void => {
      const external = props.panelRef;
      if (typeof external === 'function') external(el);
      else if (external) external.value = el;
      innerPanelRef(el);
    };

    // =========================== 语义槽合并 ===========================
    const semantic = useMergeSemantic<
      ModalProps,
      NonNullable<ModalSemanticType['classNames']>,
      NonNullable<ModalSemanticType['styles']>
    >(
      [() => config.classNames, () => props.classNames, () => mask.classNames.value],
      [() => config.styles, () => props.styles],
      () => props,
    );

    // ============================= Width ==============================
    const numWidth = computed(() =>
      isPlainObject(props.width) && typeof props.width === 'object'
        ? undefined
        : (props.width as string | number),
    );
    const responsiveWidth = computed(() =>
      isPlainObject(props.width) && typeof props.width === 'object'
        ? (props.width as Partial<Record<ModalBreakpoint, string | number>>)
        : undefined,
    );
    const responsiveWidthVars = computed<Record<string, string>>(() => {
      const vars: Record<string, string> = {};
      const width = responsiveWidth.value;
      if (width) {
        for (const breakpoint of Object.keys(width) as ModalBreakpoint[]) {
          const breakpointWidth = width[breakpoint];
          if (breakpointWidth !== undefined && breakpointWidth !== null) {
            vars[`--apollo-modal-${breakpoint}-width`] = isNumber(breakpointWidth)
              ? `${breakpointWidth}px`
              : breakpointWidth;
          }
        }
      }
      return vars;
    });

    // ============================ Render ==============================
    return () => {
      const { class: rootClass, style: nativeStyle, ...nativeAttrs } = attrs;
      const wrapClassNameExtended = [
        props.wrapClassName,
        (props.centered ?? config.centered) ? `${prefixCls.value}-centered` : undefined,
        config.direction === 'rtl' ? `${prefixCls.value}-wrap-rtl` : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      const closableResult = computeClosable(
        { closable: props.closable, closeIcon: readSlot('closeIcon') },
        { closable: config.closable, closeIcon: config.closeIcon },
        {
          closable: true,
          closeLabel: globalLocale.value.close,
          closeIcon: h(CloseOutlined, { class: `${prefixCls.value}-close-icon` }),
          closeIconRender: (icon: unknown) => renderCloseIcon(prefixCls.value, icon as VNodeChild),
        },
      );
      const mergedClosable = closableResult.closable
        ? {
            disabled: closableResult.closeBtnIsDisabled,
            closeIcon: closableResult.closeIconNode as VNodeChild,
            afterClose: closableAfterClose.value,
            ...closableResult.ariaProps,
          }
        : false;
      const allCn = semantic.classNames.value;
      const allSt = semantic.styles.value;
      const cn = { ...allCn };
      const st = { ...allSt };
      if (props._semanticOmit?.includes('body')) {
        delete cn.body;
        delete st.body;
      }
      const footerContent = slots.footer?.({ OkBtn: NormalOkBtn, CancelBtn: NormalCancelBtn });
      const footer =
        props.loading || (slots.footer && isEmptyVNode(footerContent))
          ? null
          : h(
              ModalPanel,
              {
                okText: slots.okText ? readSlot('okText') : props.okText,
                okType: props.okType,
                cancelText: slots.cancelText ? readSlot('cancelText') : props.cancelText,
                confirmLoading: props.confirmLoading,
                okButtonProps: { ...config.okButtonProps, ...props.okButtonProps },
                cancelButtonProps: { ...config.cancelButtonProps, ...props.cancelButtonProps },
                onOk: handleOk,
                onCancel: handleCancel,
              },
              slots.footer ? { default: () => footerContent } : undefined,
            );

      const bodyNode = props.loading
        ? h(Skeleton, {
            active: true,
            title: false,
            paragraph: { rows: 4 },
            // 根类名走 Vue 原生 `class`（Skeleton 已迁移：根 class 由 attrs 承接；
            // 其余多余属性仍按上游丢弃）
            class: `${prefixCls.value}-body-skeleton`,
          })
        : props._renderSemanticContent
          ? props._renderSemanticContent({ classNames: allCn, styles: allSt })
          : slots.default?.();

      return h(
        DialogWrap,
        {
          ...nativeAttrs,
          prefixCls: prefixCls.value,
          visible: open.value,
          zIndex: zIndex.value,
          getContainer:
            props.getContainer === undefined ? config.getPopupContainer : props.getContainer,
          rootClassName: normalizeClass([config.className, cn.root]),
          rootStyle: { ...theme.style.value, ...config.style, ...props.rootStyle, ...st.root },
          footer,
          closable: mergedClosable,
          closeIcon: closableResult.closeIconNode as VNodeChild,
          // ⚠️ 动效名走 **rootPrefixCls**（`apollo-zoom` / `apollo-fade`），
          //    不是组件前缀 —— 见 `util.ts` 的 `getTransitionName`
          transitionName: getTransitionName(rootPrefixCls.value, 'zoom', props.transitionName),
          maskTransitionName: getTransitionName(
            rootPrefixCls.value,
            'fade',
            props.maskTransitionName,
          ),
          mask: mask.enabled.value,
          maskClosable: mask.closable.value,
          maskStyle: props.maskStyle,
          maskProps: props.maskProps,
          // ⚠️ 这两个 prop 是**公开**的（interface.ts 有声明），但原来没往下传 ⇒ 调用方的
          //    wrapper 样式 / ARIA / data-* 全丢（Issue #19.1）。合并顺序由 engine/Dialog
          //    决定：`zIndex → wrapStyle → styles.wrapper → display`，`wrapProps` 最后展开。
          wrapStyle: props.wrapStyle,
          wrapProps: props.wrapProps,
          scrollLock: props.scrollLock,
          keyboard: props.keyboard,
          // 调用方原生 class（位置与原先的 props.className 一致）
          className: normalizeClass(rootClass),
          style: [theme.style.value, normalizeStyle(nativeStyle), responsiveWidthVars.value],
          classNames: {
            ...cn,
            wrapper: [cn.wrapper, wrapClassNameExtended].filter(Boolean).join(' ') || undefined,
          },
          styles: st,
          panelRef: mergedPanelRef,
          forceRender: props.forceRender,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyOnClose,
          afterClose: () => emit('afterClose'),
          afterOpenChange: (value: boolean) => emit('afterOpenChange', value),
          onClose: handleCancel,
          title: slots.title ? readSlot('title') : props.title,
          bodyStyle: props.bodyStyle,
          bodyProps: props.bodyProps,

          width: numWidth.value,
          height: props.height,
          mousePosition: props.mousePosition ?? lastClickPosition,
          focusTriggerAfterClose: mergedFocusable.value.focusTriggerAfterClose,
          focusTrap: mergedFocusable.value.trap,
        },
        {
          default: () => bodyNode,
          ...(slots.modalRender
            ? {
                modalRender: (scope: import('./interface').ModalRenderSlotProps) =>
                  h('div', { class: `${prefixCls.value}-render` }, [slots.modalRender?.(scope)]),
              }
            : {}),
        },
      );
    };
  },
});

export { modalContextKey };
