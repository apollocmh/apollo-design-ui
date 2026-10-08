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
 *   6. `#footer` slot 非空且 !loading 才渲染 Footer —— `loading` 时 footer 强制不渲染；
 *      C8-R2：footer / closeIcon / title 的 ReactNode prop 已删除，一律 slot（文本
 *      title / okText / cancelText 保留 string prop，slot 优先）；
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
import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { useZIndex } from '@apollo-design/portal';
import { isEmptyVNode, isNumber, isPlainObject, omit, pickAttrs } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  type VNodeChild,
} from 'vue';
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
  ModalProps,
  ModalSemanticType,
  ModalSemanticTypeInput,
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
    title: { type: String, default: undefined },
    okText: { type: String, default: undefined },
    cancelText: { type: String, default: undefined },
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
    closable: {
      type: [Boolean, Object] as unknown as PropType<ModalProps['closable']>,
      default: undefined,
    },
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
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /**
     * 语义槽类名。
     *
     * ⚠️ 运行时**同时接受函数形态**（`(info) => classNames`）—— `useMergeSemantic`
     *    的 `resolveSemantic` 会调用它。类型面按 D36 只声明对象形态，
     *    所以这里用 `[Object, Function]` 放行（同 `_internal/use-merge-semantic` 的约定）。
     */
    classNames: {
      type: [Object, Function] as unknown as PropType<ModalSemanticTypeInput['classNames']>,
      default: undefined,
    },
    /** 语义槽样式。⚠️ 同 `classNames`，运行时接受函数形态。 */
    styles: {
      type: [Object, Function] as unknown as PropType<ModalSemanticTypeInput['styles']>,
      default: undefined,
    },
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

    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    /**
     * 读一个 slot；「提供了但渲染为空」归一为 null（语义：隐藏），「未提供」为
     * undefined。判空必须走 `isEmptyVNode` —— Vue 会把 slot 返回的 null / 空数组
     * 归一成 comment vnode，不能比 `null` / `length`（is.ts §空渲染判据）。
     */
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? null : nodes;
    };

    // =========================== Closable =============================
    // 关闭按钮的可访问名来自 locale（antd 逐字：`useLocale('global').close`）
    const [globalLocale] = useLocale('global');
    const closableResult = useClosable(
      pickClosable(() => ({
        closable: props.closable as ClosableType,
        closeIcon: readSlot('closeIcon'),
      })),
      pickClosable(
        computed(() => ({
          closable: (config as { closable?: ClosableType }).closable,
          closeIcon: (config as { closeIcon?: unknown }).closeIcon,
        })),
      ),
      {
        closable: true,
        // ⚠️ antd 的 `useClosable` hook 内部读 locale 的 `global.close` 作为
        //    关闭按钮可访问名（en=`Close` / zh=`关闭`）；`'Close'` 只是纯函数
        //    `computeClosable` 的兜底 —— composable 消费方必须自己接 locale。
        closeLabel: (globalLocale as { close?: string }).close,
        // ⚠️ 兜底图标必须是**真的图标**（`CloseOutlined`），不是空 span ——
        //    `renderCloseIcon` 只在**没给** closeIcon 时才补图标，给一个空 span
        //    会得到一个「有按钮、没有 ×」的面板（L6 抓到：desktop 0.008% 全是这个 ×）
        closeIcon: h(CloseOutlined, { class: `${prefixCls}-close-icon` }),
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
            // ⚠️ 必须包成数组：`h` 的 children 重载不收 `null | undefined`
            //    （而 `VNodeChild` 含它们）—— 上游的 `createElement` 没这个限制
            h('div', { class: `${prefixCls}-render` }, [props.modalRender?.(node) as never])
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
      [
        () => config.classNames,
        // ⚠️ 收敛成对象形态：函数形态由 `resolveSemantic` 在**运行时**处理，
        //    而 `useMergeSemantic` 的 `SemanticInput` 对「参数逆变」很挑
        //    （`ModalSemanticTypeInput` 的入参是 `Record<string, unknown>`，仍不兼容）
        () => props.classNames as unknown as NonNullable<ModalSemanticType['classNames']>,
        () => mask.classNames.value,
      ],
      [
        () => config.styles,
        () => props.styles as unknown as NonNullable<ModalSemanticType['styles']>,
      ],
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

    // ============================ Title ==============================
    const mergedTitle = computed<unknown>(() => {
      const t = readSlot('title');
      if (t !== undefined) return t;
      return props.title;
    });

    // ============================ Footer ==============================
    const dialogFooter = computed<VNodeChild>(() => {
      if (props.loading) return null;
      // 有 `#footer` slot ⇒ 用 slot 内容；空 slot（comment/空数组）等价「隐藏」
      const footerSlot = readSlot('footer');
      if (footerSlot !== undefined) return footerSlot as VNodeChild;
      return h(ModalPanel, {
        okText: readSlot('okText') ?? props.okText,
        okType: props.okType,
        cancelText: readSlot('cancelText') ?? props.cancelText,
        confirmLoading: props.confirmLoading,
        okButtonProps: { ...config.okButtonProps, ...props.okButtonProps },
        cancelButtonProps: { ...config.cancelButtonProps, ...props.cancelButtonProps },
        onOk: handleOk,
        onCancel: handleCancel,
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
            // 根类名走 Vue 原生 `class`（Skeleton 已迁移：根 class 由 attrs 承接；
            // 其余多余属性仍按上游丢弃）
            class: `${prefixCls}-body-skeleton`,
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
          rootClassName: [config.className, cn.root].filter(Boolean).join(' ') || undefined,
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
          // 调用方原生 class（位置与原先的 props.className 一致）
          className: attrs.class,
          style: {
            ...((attrs.style as CSSProperties | undefined) ?? {}),
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
          title: mergedTitle.value,
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
