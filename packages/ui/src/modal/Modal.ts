/**
 * antd 侧的 `Modal` —— `components/modal/Modal.tsx`（335 行）的 Vue 版（壳）。
 *
 * 职责：把 antd 的语义（mask 合并 / 焦点 / zIndex / 语义槽 / closable / 响应式宽度 /
 * 9 条 deprecated）翻译成 rc 内核（`engine/DialogWrap`）的 props，并把 `ModalPanel`
 * （footer）与 children 交下去。
 *
 * 逐条对齐上游：
 *   1. `prefixCls = getPrefixCls('modal', customizePrefixCls)`；
 *   2. `closable` 是对象时摘出 `afterClose` / `onClose`（**不是** boolean 时才是）；
 *   3. `mask` 走 `useMergedMask`（props > `maskClosable` > context > true）；
 *   4. `focusable = { ...contextFocusable, ...props.focusable }`，
 *      默认 trap = mask 是否渲染，`focusTriggerAfterClose` 默认 true；
 *   5. `handleCancel` **在 `confirmLoading` 时直接 return**（不关、不回调）；
 *   6. `footer !== null && !loading` 才渲染 Footer —— `loading` 时 footer 强制不渲染；
 *   7. `closable` 走 `useClosable`（Tag 建的那套三方合并），
 *      `closeIconRender` 把图标包成 `{p}-close-x`；
 *   8. `modalRender` 非空 ⇒ 面板多包一层 `{p}-render`，且 watermark 的选择器换成它；
 *   9. `width` 是对象 ⇒ 不写 `numWidth`，把每个断点写进内联 `--{p}-{bp}-width`；
 *  10. `centered` / rtl 通过 **wrapClassName** 表达（`{p}-centered` / `{p}-wrap-rtl`）；
 *  11. 9 条 deprecated 告警（dev）。
 *
 * ⚠️ 与上游的两处**架构差异**（静态 CSS，非行为差异）：
 *   - `useCSSVarCls` / `useStyle` 在零运行时架构下没有对应物（样式在构建期落盘）
 *     ⇒ 不产生 `css-var-*` 类，也不注入 hash 类；
 *   - `ContextIsolator`（form / space）本仓未落地（D36 同判）。
 */
import { useZIndex } from '@apollo-design/portal';
import { isNumber, isPlainObject, omit, pickAttrs } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { pickClosable, useClosable } from '../_internal/use-closable';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { type MaskType, useMergedMask } from '../_internal/use-merged-mask';
import { useComponentConfig } from '../config-provider/context';
import Skeleton from '../skeleton';
import { usePanelRef } from '../watermark/context';
import { modalContextKey } from './context';
import DialogWrap from './engine/DialogWrap';
import type {
  ClosableType,
  FocusableConfig,
  ModalBreakpoint,
  ModalButtonProps,
  ModalGetContainer,
  ModalOkType,
  ModalSemanticType,
  MousePosition,
} from './interface';
import ModalPanel, { renderCloseIcon } from './ModalPanel';
import { getTransitionName } from './util';

const DEFAULT_WIDTH = 520;

/** 语义槽的默认空对象（稳定引用，避免 computed 每次都新建）。 */
const EMPTY_CLASS_NAMES: ModalSemanticType['classNames'] = {};
const EMPTY_STYLES: ModalSemanticType['styles'] = {};

export default defineComponent({
  name: 'AModal',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: false },
    /** ⚠️ 默认 520。 */
    width: {
      type: [String, Number, Object] as PropType<
        string | number | Partial<Record<ModalBreakpoint, string | number>>
      >,
      default: DEFAULT_WIDTH,
    },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: {
      type: [String, Number, Object, Array, Function, null] as unknown as PropType<unknown>,
      default: undefined,
    },
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<ModalOkType>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    onOk: { type: Function as PropType<(e: Event) => void>, default: undefined },
    onCancel: { type: Function as PropType<(e: Event) => void>, default: undefined },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    centered: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: false },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    mask: { type: [Boolean, Object] as unknown as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    maskProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    modalRender: {
      type: Function as PropType<(node: VNodeChild) => VNodeChild>,
      default: undefined,
    },
    mousePosition: {
      type: Object as PropType<MousePosition>,
      default: undefined,
    },
    zIndex: { type: Number, default: undefined },
    getContainer: {
      type: [String, Boolean, Function, Object] as unknown as PropType<ModalGetContainer>,
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
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    classNames: {
      type: Object as PropType<ModalSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    panelRef: { type: [Object, Function] as unknown as PropType<unknown>, default: null },
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
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<{
      className?: string;
      style?: Record<string, unknown>;
      classNames?: ModalSemanticType['classNames'];
      styles?: ModalSemanticType['styles'];
      centered?: boolean;
      cancelButtonProps?: ModalButtonProps;
      okButtonProps?: ModalButtonProps;
      mask?: MaskType;
      focusable?: FocusableConfig;
    }>('modal');

    const prefixCls = props.prefixCls || config.getPrefixCls('modal');
    const rootPrefixCls = config.getPrefixCls();

    // ============================ Closable ============================
    const closableAfterClose = computed(() =>
      typeof props.closable === 'boolean'
        ? undefined
        : (props.closable as { afterClose?: () => void } | undefined)?.afterClose,
    );
    const closableOnClose = computed(() =>
      typeof props.closable === 'boolean'
        ? undefined
        : (props.closable as { onClose?: () => void } | undefined)?.onClose,
    );

    // ============================== Mask ==============================
    const mask = useMergedMask(
      () => props.mask,
      () => config.mask,
      () => prefixCls,
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
      props.onCancel?.(e);
      closableOnClose.value?.();
    };
    const handleOk = (e: Event): void => {
      props.onOk?.(e);
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

    // =========================== Closable =============================
    const closableResult = useClosable(
      pickClosable(() => ({
        closable: props.closable as ClosableType,
        closeIcon: props.closeIcon,
      })),
      pickClosable(
        computed(() => ({
          closable: (config as { closable?: ClosableType }).closable,
          closeIcon: (config as { closeIcon?: unknown }).closeIcon,
        })),
      ),
      {
        closable: true,
        closeIcon: h('span', { class: `${prefixCls}-close-icon` }),
        closeIconRender: (icon: unknown) => renderCloseIcon(prefixCls, icon as VNodeChild),
      },
    );

    const mergedClosable = computed(() => {
      const r = closableResult.value;
      if (!r.closable) return false;
      return {
        disabled: r.closeBtnIsDisabled,
        closeIcon: r.closeIconNode,
        afterClose: closableAfterClose.value,
        ...r.ariaProps,
      };
    });

    // ========================= modalRender ============================
    const mergedModalRender = computed(() =>
      props.modalRender
        ? (node: VNodeChild) =>
            h('div', { class: `${prefixCls}-render` }, props.modalRender?.(node))
        : undefined,
    );

    // ============================= Refs ==============================
    const panelSelector = computed(
      () => `.${prefixCls}-${props.modalRender ? 'render' : 'container'}`,
    );
    const innerPanelRef = usePanelRef(panelSelector.value);
    const mergedPanelRef = (el: unknown): void => {
      const external = props.panelRef;
      if (typeof external === 'function') (external as (e: unknown) => void)(el);
      else if (external && typeof external === 'object' && 'value' in (external as object)) {
        (external as { value: unknown }).value = el;
      }
      innerPanelRef(el as HTMLElement | null);
    };

    // =========================== 语义槽合并 ===========================
    const mergedSemanticProps = computed<Record<string, unknown>>(() => ({
      ...(props as unknown as Record<string, unknown>),
      width: props.width,
      focusTriggerAfterClose: mergedFocusable.value.focusTriggerAfterClose,
      focusable: mergedFocusable.value,
      mask: mask.enabled.value,
      maskClosable: mask.closable.value,
      zIndex: zIndex.value,
    }));

    const semantic = useMergeSemantic<
      Record<string, unknown>,
      NonNullable<ModalSemanticType['classNames']>,
      NonNullable<ModalSemanticType['styles']>
    >(
      [() => config.classNames, () => props.classNames, () => mask.classNames.value],
      [() => config.styles, () => props.styles],
      mergedSemanticProps.value,
    );

    const dialogClassNames = computed<ModalSemanticType['classNames']>(() => {
      const merged = semantic.classNames.value;
      return props._semanticOmit
        ? (omit(
            merged as Record<string, unknown>,
            props._semanticOmit,
          ) as ModalSemanticType['classNames'])
        : (merged as ModalSemanticType['classNames']);
    });
    const dialogStyles = computed<ModalSemanticType['styles']>(() => {
      const merged = semantic.styles.value;
      return props._semanticOmit
        ? (omit(
            merged as Record<string, unknown>,
            props._semanticOmit,
          ) as ModalSemanticType['styles'])
        : (merged as ModalSemanticType['styles']);
    });

    const semanticContent = computed<VNodeChild>(() =>
      props._renderSemanticContent
        ? props._renderSemanticContent({
            classNames: semantic.classNames.value as ModalSemanticType['classNames'],
            styles: semantic.styles.value as ModalSemanticType['styles'],
          })
        : slots.default?.(),
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
            vars[`--${prefixCls}-${breakpoint}-width`] = isNumber(breakpointWidth)
              ? `${breakpointWidth}px`
              : breakpointWidth;
          }
        }
      }
      return vars;
    });

    // ============================ Footer ==============================
    const dialogFooter = computed<VNodeChild>(() => {
      if (props.footer === null || props.loading) return null;
      return h(ModalPanel, {
        okText: props.okText,
        okType: props.okType,
        cancelText: props.cancelText,
        confirmLoading: props.confirmLoading,
        okButtonProps: { ...config.okButtonProps, ...props.okButtonProps },
        cancelButtonProps: { ...config.cancelButtonProps, ...props.cancelButtonProps },
        onOk: handleOk,
        onCancel: handleCancel,
        footer: props.footer,
      } as never);
    });

    // ============================ Render ==============================
    return () => {
      const wrapClassNameExtended = [
        props.wrapClassName,
        (props.centered ?? config.centered) ? `${prefixCls}-centered` : undefined,
        config.direction === 'rtl' ? `${prefixCls}-wrap-rtl` : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      const cn = dialogClassNames.value ?? EMPTY_CLASS_NAMES;
      const st = dialogStyles.value ?? EMPTY_STYLES;

      const bodyNode = props.loading
        ? h(Skeleton, {
            active: true,
            title: false,
            paragraph: { rows: 4 },
            // ⚠️ 是 `className` **prop**，不是 attrs 的 `class` —— Skeleton 设了
            //    `inheritAttrs: false`，走 `class` 会被静默丢弃（上游也是传 `className`）
            className: `${prefixCls}-body-skeleton`,
          } as never)
        : (semanticContent.value as never);

      return h(
        DialogWrap,
        {
          ...(pickAttrs(attrs as Record<string, unknown>, { aria: true, data: true }) as Record<
            string,
            unknown
          >),
          prefixCls,
          visible: props.open,
          zIndex: zIndex.value,
          getContainer:
            props.getContainer === undefined ? config.getPopupContainer : props.getContainer,
          rootClassName:
            [config.className, props.rootClassName, cn.root].filter(Boolean).join(' ') || undefined,
          rootStyle: { ...config.style, ...props.rootStyle, ...st.root },
          footer: dialogFooter.value,
          closable: mergedClosable.value,
          closeIcon: closableResult.value.closeIconNode,
          // ⚠️ 动效名走 **rootPrefixCls**（`apollo-zoom` / `apollo-fade`），
          //    不是组件前缀 —— 见 `util.ts` 的 `getTransitionName`
          transitionName: getTransitionName(rootPrefixCls, 'zoom', props.transitionName),
          maskTransitionName: getTransitionName(rootPrefixCls, 'fade', props.maskTransitionName),
          mask: mask.enabled.value,
          maskClosable: mask.closable.value,
          maskStyle: props.maskStyle,
          maskProps: props.maskProps,
          scrollLock: props.scrollLock,
          keyboard: props.keyboard,
          className: props.className,
          style: {
            ...props.style,
            ...responsiveWidthVars.value,
          },
          classNames: {
            ...cn,
            wrapper: [cn.wrapper, wrapClassNameExtended].filter(Boolean).join(' ') || undefined,
          },
          styles: st,
          panelRef: mergedPanelRef,
          forceRender: props.forceRender,
          destroyOnHidden: props.destroyOnHidden ?? props.destroyOnClose,
          afterClose: props.afterClose,
          afterOpenChange: props.afterOpenChange,
          onClose: handleCancel,
          title: props.title,
          bodyStyle: props.bodyStyle,
          bodyProps: props.bodyProps,
          modalRender: mergedModalRender.value,
          width: numWidth.value,
          height: props.height,
          mousePosition: props.mousePosition,
          focusTriggerAfterClose: mergedFocusable.value.focusTriggerAfterClose,
          focusTrap: mergedFocusable.value.trap,
        } as never,
        { default: () => bodyNode },
      );
    };
  },
});

export { modalContextKey };
