/** Guided content owns its models; geometry is driven by the current target and open scope. */

import { useFocusRestore } from '@apollo-design/a11y';
import { useZIndex, ZINDEX_KEY } from '@apollo-design/portal';
import { getPlacements } from '@apollo-design/position';
import {
  containsComposed,
  getActiveElement,
  getElement,
  observeResize,
  useId,
} from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { contentProp } from './content-prop';
import type {
  TourAnimatedConfig,
  TourClosableConfig,
  TourPlacement,
  TourProps,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSlots,
  TourStepProps,
  TourType,
} from './interface';
import TourMask, { type TourMaskPos } from './Mask';
import TourPanel, { type TourPanelStep } from './panel';
import { useTourTheme } from './use-tour-theme';

// ---------------------------------------------------------------------------
// rc util.js（机械移植）
// ---------------------------------------------------------------------------

function isInViewPort(element: HTMLElement): boolean {
  const doc = element.ownerDocument;
  const viewWidth = doc.defaultView?.innerWidth ?? doc.documentElement.clientWidth;
  const viewHeight = doc.defaultView?.innerHeight ?? doc.documentElement.clientHeight;
  const { top, right, bottom, left } = element.getBoundingClientRect();
  return top >= 0 && left >= 0 && right <= viewWidth && bottom <= viewHeight;
}

/** rc `util.js#getPlacement` 逐字。 */
function getPlacement(
  targetElement: HTMLElement | null | undefined,
  placement: TourPlacement | undefined,
  stepPlacement: TourPlacement | undefined,
): TourPlacement {
  return stepPlacement ?? placement ?? (targetElement === null ? 'center' : 'bottom');
}

// ---------------------------------------------------------------------------
// rc hooks/useClosable（V3：与 antd _util 的 useClosable **不同源**，勿合并）
// ---------------------------------------------------------------------------

/**
 * rc useClosable 的返回面：合并后的配置对象 / `null`（强制关 + Esc 禁用）/ `'empty'`
 * （两层都没给 —— root 层补默认后不会出现在最终结果里）。
 * ⚠️ 永远不会是 `boolean` —— 布尔只在**输入面**，输出面已被折叠成对象或 null。
 */
type ClosableResolved = TourClosableConfig | null | 'empty';

function isConfigObj(closable: unknown): closable is TourClosableConfig {
  return closable !== null && typeof closable === 'object';
}

function getClosableConfig(
  closable: TourStepProps['closable'],
  closeIcon: VNodeChild,
  preset: boolean,
): ClosableResolved {
  if (
    closable === false ||
    (closeIcon === false && (!isConfigObj(closable) || closable.closeIcon === undefined))
  ) {
    return null;
  }
  const mergedCloseIcon = typeof closeIcon !== 'boolean' ? closeIcon : undefined;
  if (isConfigObj(closable)) {
    return {
      ...closable,
      closeIcon: closable.closeIcon !== undefined ? closable.closeIcon : mergedCloseIcon,
    };
  }
  // step 层（preset=false）不自动补默认；root 层（preset=true）要补
  return preset || closable || closeIcon ? { closeIcon: mergedCloseIcon } : 'empty';
}

/** rc `KeyCode.isEditableTarget`（`INPUT` / `TEXTAREA` / `SELECT` / contentEditable）。 */
function isEditableTarget(e: KeyboardEvent): boolean {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
}

const DEFAULT_SCROLL_INTO_VIEW_OPTIONS: ScrollIntoViewOptions = {
  block: 'center',
  inline: 'center',
};

/** rc `CENTER_PLACEHOLDER`（无 target 时的 1×1 视口中心占位）。 */
const CENTER_PLACEHOLDER = { left: '50%', top: '50%', width: '1px', height: '1px' };

// ---------------------------------------------------------------------------

type TourContext = ComponentStyleConfig & Pick<TourProps, 'classNames' | 'styles' | 'closeIcon'>;

const Tour = defineComponent({
  name: 'ATour',
  inheritAttrs: false,
  slots: Object as SlotsType<TourSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    current: { type: Number, default: undefined },
    defaultCurrent: { type: Number, default: undefined },
    steps: { type: Array as PropType<TourStepProps[]>, default: undefined },
    type: { type: String as PropType<TourType>, default: undefined },
    keyboard: { type: Boolean, default: undefined },
    mask: { type: [Boolean, Object] as PropType<TourProps['mask']>, default: undefined },
    arrow: { type: [Boolean, Object] as PropType<TourProps['arrow']>, default: undefined },
    placement: { type: String as PropType<TourPlacement>, default: undefined },
    gap: { type: Object as PropType<TourProps['gap']>, default: undefined },
    animated: {
      type: [Boolean, Object] as PropType<boolean | TourAnimatedConfig>,
      default: undefined,
    },
    scrollIntoViewOptions: {
      type: [Boolean, Object] as PropType<TourProps['scrollIntoViewOptions']>,
      default: undefined,
    },
    closeIcon: contentProp,
    closable: {
      type: [Boolean, Object] as PropType<TourProps['closable']>,
      default: undefined,
    },
    zIndex: { type: Number, default: undefined },
    getPopupContainer: {
      type: Function as PropType<NonNullable<TourProps['getPopupContainer']>>,
      default: undefined,
    },
    builtinPlacements: {
      type: Object as PropType<Record<string, TriggerAlign>>,
      default: undefined,
    },
    disabledInteraction: { type: Boolean, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<TourProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<TourProps['styles']>, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
    'update:current': (_current: number) => true,
    change: (_current: number) => true,
    close: (_current: number) => true,
    finish: () => true,
    popupAlign: (_element: HTMLElement, _align: TriggerAlign) => true,
  },
  setup(props, { slots, attrs, emit }) {
    const context = useComponentConfig<TourContext>('tour');
    const direction = useDirection();
    const tourTheme = useTourTheme();
    const mounted = ref(false);
    onMounted(() => {
      mounted.value = true;
    });
    const placeholderRef = shallowRef<HTMLDivElement | null>(null);
    const popupElement = shallowRef<HTMLElement | null>(null);
    const maskReadyContainer = shallowRef<HTMLElement | ShadowRoot | null>(null);
    const titleId = `tour-title-${useId()}`;

    // ============================ Steps =============================
    // antd index.js：steps 逐条补 `-primary`（`(step.type ?? type) === 'primary'`）
    const mergedSteps = computed<TourStepProps[]>(() =>
      (props.steps ?? []).map((step) => ({
        ...step,
        className: clsx(
          step.className,
          (step.type ?? props.type) === 'primary' ? `${prefixCls.value}-primary` : undefined,
        ),
      })),
    );

    const prefixCls = computed(() => context.getPrefixCls('tour', props.prefixCls));

    // ====================== Controlled State ========================
    // ⚠️ 不用 useControlledValue：rc useControlledState 的 setter **不触发**
    //    onChange —— 「重开归零」是静默 set，而 useControlledValue.setValue
    //    恒走 onChange。两个状态都手写（watch 同步受控值的行为与其一致）。
    const currentInner = ref(props.current ?? props.defaultCurrent ?? 0);
    const mergedCurrent = computed(() =>
      props.current !== undefined ? props.current : currentInner.value,
    );
    watch(
      () => props.current,
      (v) => {
        if (v !== undefined) currentInner.value = v;
      },
      { flush: 'sync' },
    );

    const openInner = ref(props.open ?? props.defaultOpen ?? true);
    const internalOpen = computed(() => (props.open !== undefined ? props.open : openInner.value));
    watch(
      () => props.open,
      (v) => {
        if (v !== undefined) openInner.value = v;
      },
      { flush: 'sync' },
    );

    /** rc：`current 越界 ⇒ false`，否则 `internalOpen ?? true`（V6）。 */
    const mergedOpen = computed(() => {
      if (mergedCurrent.value < 0 || mergedCurrent.value >= mergedSteps.value.length) {
        return false;
      }
      return internalOpen.value ?? true;
    });

    // Only an accepted opening resets an uncontrolled step. Step-list validity is separate.
    watch(
      internalOpen,
      (open, previous) => {
        if (open && !previous && props.current === undefined) currentInner.value = 0;
      },
      { flush: 'pre' },
    );

    const setCurrent = (next: number): void => {
      if (props.current === undefined) currentInner.value = next;
      emit('update:current', next);
      emit('change', next);
    };

    const setClosed = (): void => {
      if (props.open === undefined) openInner.value = false;
      emit('update:open', false);
    };

    const handleClose = (): void => {
      setClosed();
      emit('close', mergedCurrent.value);
    };

    // ======================== Current Step ==========================
    const currentStep = computed<TourStepProps>(() => mergedSteps.value[mergedCurrent.value] ?? {});

    // ======================= Align Target ===========================
    // rc useTarget：`undefined` = 还没解析（渲染门），`null` = 无 target（居中）
    const targetElement = shallowRef<HTMLElement | null | undefined>(undefined);
    watchEffect(
      () => {
        if (!mounted.value || !mergedOpen.value) {
          targetElement.value = undefined;
          return;
        }
        const target = currentStep.value.target;
        const nextElement = typeof target === 'function' ? target() : target;
        targetElement.value = nextElement || null;
      },
      { flush: 'post' },
    );

    // rc `defaultScrollIntoViewOptions`；步骤级覆盖全局
    const mergedScrollIntoViewOptions = computed<boolean | ScrollIntoViewOptions>(
      () =>
        currentStep.value.scrollIntoViewOptions ??
        props.scrollIntoViewOptions ??
        DEFAULT_SCROLL_INTO_VIEW_OPTIONS,
    );

    // ========================== posInfo =============================
    // rc useTarget：getBoundingClientRect 视口坐标；gap 外扩在 mergedPosInfo。
    // inlineMode（getPopupContainer === false）不在公开面，不实现（§9-V5）。
    const posInfo = ref<TourMaskPos | null>(null);
    const updatePos = (reveal = false): void => {
      const el = targetElement.value;
      if (el) {
        if (reveal && !isInViewPort(el) && mergedOpen.value) {
          const options = mergedScrollIntoViewOptions.value;
          if (typeof options === 'boolean') {
            if (options) el.scrollIntoView();
          } else {
            el.scrollIntoView(options);
          }
        }
        const { left, top, width, height } = el.getBoundingClientRect();
        const next: TourMaskPos = { left, top, width, height, radius: 0 };
        // rc：JSON 串比对去重（避免 setState 循环）
        if (JSON.stringify(posInfo.value) !== JSON.stringify(next)) {
          posInfo.value = next;
        }
      } else if (posInfo.value !== null) {
        posInfo.value = null;
      }
    };

    // ==================== 异步布局同步（Issue #53 · 优于上游）====================
    //
    // rc `useTarget` 的触发集只有 `[targetElement, open]` + window 的 resize/scroll，
    // 于是两类**很常见**的场景下遮罩挖洞与浮层会停在旧位置：
    //   ① 目标被异步内容推移（上方图片加载、手风琴展开、异步列表插入）；
    //   ② 目标位于可滚动容器内，容器滚动（scroll **不冒泡**，挂在 window 冒泡阶段收不到）。
    //
    // 本仓补齐三类信号，**全部是事件驱动**（没有轮询 / setInterval）：
    //   1. 目标自身尺寸变化 —— ResizeObserver（内容展开直接撑大目标时命中）
    //   2. 祖先链尺寸变化   —— ResizeObserver（「纯位置变化」的主要来源：祖先变高 ⇒ 目标被推走）
    //   3. 任意滚动祖先滚动 —— document 上 **capture 阶段**的 scroll（捕获不冒泡的滚动）
    //
    // ⚠️ 已知边界（**故意不做**，代价与收益不成比例）：
    //   ResizeObserver 捕获不到「祖先尺寸没变、目标位置却变了」的场景（如目标自身
    //   position 变化、同胞重排但父尺寸不变）。那需要 MutationObserver 或轮询，
    //   而它们会在任意 DOM 变动时高频触发 ⇒ 与「避免高频无效测量」冲突。见 README §7。
    //
    // 抗抖动三道闸：
    //   · 所有外部信号走 rAF 合并 —— 同一帧内的多个回调只测量一次；
    //   · `updatePos` 内部已有 JSON 去重 —— 位置没变就不写状态、不触发重渲染
    //     （也切断了「RO 回调 → 重排 → 再 RO」的自激）；
    //   · 只在打开时注册，关闭 / 切步 / 卸载时全部注销。

    let pendingFrame: number | null = null;
    let activeWindow: Window | null = null;
    let activeDocument: Document | null = null;
    let unobserveFns: Array<() => void> = [];
    const scheduleUpdatePos = () => {
      if (!mergedOpen.value) return;
      if (!activeWindow?.requestAnimationFrame) {
        updatePos();
        return;
      }
      if (pendingFrame !== null) return;
      pendingFrame = activeWindow.requestAnimationFrame(() => {
        pendingFrame = null;
        updatePos();
      });
    };
    const stopObserving = () => {
      for (const off of unobserveFns) off();
      unobserveFns = [];
      activeWindow?.removeEventListener('resize', scheduleUpdatePos);
      activeDocument?.removeEventListener('scroll', scheduleUpdatePos, true);
      if (pendingFrame !== null) activeWindow?.cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
      activeWindow = null;
      activeDocument = null;
    };
    onMounted(() => {
      watch(
        [targetElement, mergedOpen, mergedCurrent, mergedScrollIntoViewOptions],
        () => {
          stopObserving();
          if (!mergedOpen.value) return;
          const target = targetElement.value;
          activeDocument = target?.ownerDocument ?? placeholderRef.value?.ownerDocument ?? document;
          activeWindow = activeDocument.defaultView;
          updatePos(true);
          if (target) {
            unobserveFns.push(observeResize(target, scheduleUpdatePos));
            let ancestor = target.parentElement;
            while (ancestor && ancestor !== activeDocument.documentElement) {
              unobserveFns.push(observeResize(ancestor, scheduleUpdatePos));
              ancestor = ancestor.parentElement;
            }
          }
          activeWindow?.addEventListener('resize', scheduleUpdatePos);
          activeDocument.addEventListener('scroll', scheduleUpdatePos, true);
        },
        { immediate: true, flush: 'post' },
      );
    });
    onBeforeUnmount(stopObserving);

    // gap 外扩：offset 默认 6、radius 默认 2；二元组是 [水平, 垂直]
    const getGapOffset = (index: 0 | 1): number => {
      const offset = props.gap?.offset;
      return (Array.isArray(offset) ? offset[index] : offset) ?? 6;
    };
    const mergedPosInfo = computed<TourMaskPos | null>(() => {
      const pos = posInfo.value;
      if (!pos) return pos;
      const gapOffsetX = getGapOffset(0);
      const gapOffsetY = getGapOffset(1);
      const gapRadius = typeof props.gap?.radius === 'number' ? props.gap.radius : 2;
      return {
        left: pos.left - gapOffsetX,
        top: pos.top - gapOffsetY,
        width: pos.width + gapOffsetX * 2,
        height: pos.height + gapOffsetY * 2,
        radius: gapRadius,
      };
    });

    // ========================= placement ============================
    const mergedPlacement = computed<TourPlacement>(() =>
      getPlacement(targetElement.value, props.placement, currentStep.value.placement),
    );

    // =========================== arrow ==============================
    // rc：`arrow = true` 是解构默认值（缺省即显示箭头）
    const mergedArrow = computed<boolean | TourStepProps['arrow']>(() =>
      targetElement.value
        ? currentStep.value.arrow === undefined
          ? (props.arrow ?? true)
          : currentStep.value.arrow
        : false,
    );
    const arrowPointAtCenter = computed<boolean>(() =>
      typeof mergedArrow.value === 'object' && mergedArrow.value !== null
        ? mergedArrow.value.pointAtCenter
        : false,
    );

    // ====================== builtinPlacements =======================
    // antd：getPlacements({ arrowPointAtCenter ?? true, autoAdjustOverflow: true,
    // offset: marginXXS, arrowWidth: sizePopupArrow, borderRadius })
    const mergedBuiltinPlacements = computed<Record<string, TriggerAlign>>(() => {
      if (props.builtinPlacements) return props.builtinPlacements;
      return getPlacements({
        arrowPointAtCenter: arrowPointAtCenter.value,
        autoAdjustOverflow: true,
        offset: tourTheme.theme.token.value.marginXXS,
        arrowWidth: tourTheme.theme.token.value.sizePopupArrow,
        borderRadius: tourTheme.theme.token.value.borderRadius,
      });
    });

    // ========================= closable =============================
    const resolveClosable = (icon: VNodeChild): ClosableResolved => {
      const step = getClosableConfig(
        currentStep.value.closable,
        currentStep.value.closeIcon,
        false,
      );
      return step !== 'empty' ? step : getClosableConfig(props.closable, icon, true);
    };
    const isClosable = () =>
      resolveClosable(slots.closeIcon ? undefined : (props.closeIcon ?? context.closeIcon)) !==
      null;

    // =========================== mask ===============================
    // rc：`mask = true` 是解构默认值（缺省即显示蒙层）
    const mergedMask = computed<TourProps['mask']>(
      () => mergedOpen.value && (currentStep.value.mask ?? props.mask ?? true),
    );
    const mergedShowMask = computed(() =>
      typeof mergedMask.value === 'boolean' ? mergedMask.value : !!mergedMask.value,
    );
    const mergedMaskConfig = computed(() =>
      typeof mergedMask.value === 'boolean' ? undefined : mergedMask.value,
    );
    const placeholderAnimated = computed<boolean>(() =>
      typeof props.animated === 'object' ? props.animated.placeholder : (props.animated ?? true),
    );

    // =========================== zIndex =============================
    const parentZIndex = inject(ZINDEX_KEY, null);
    const zIndex = useZIndex(
      'Tour',
      () =>
        props.zIndex ??
        (parentZIndex?.value === undefined
          ? tourTheme.componentToken.value.zIndexPopup
          : undefined),
      {
        get zIndexPopupBase() {
          return tourTheme.theme.token.value.zIndexPopupBase;
        },
      },
    );

    // ===================== Merged Semantic ==========================
    // antd：4 处 root 值经 useSemanticRootStyle(..., 'mask') 同时落到 mask（§2.3）
    const mergedProps = computed<TourProps>(() => ({
      ...props,
      steps: mergedSteps.value,
      current: mergedCurrent.value,
      open: mergedOpen.value,
    }));
    const resolvedPropsClassNames = computed(() =>
      typeof props.classNames === 'function'
        ? props.classNames({ props: mergedProps.value })
        : props.classNames,
    );
    const resolvedPropsStyles = computed(() =>
      typeof props.styles === 'function'
        ? props.styles({ props: mergedProps.value })
        : props.styles,
    );
    const contextClassNames = computed(() => context.classNames);
    const contextStyles = computed(() =>
      typeof context.styles === 'function'
        ? context.styles({ props: mergedProps.value })
        : context.styles,
    );
    const contextStyle = computed(() => context.style);

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TourProps,
      TourSemanticClassNames,
      TourSemanticStyles
    >(
      [contextClassNames, resolvedPropsClassNames],
      [
        () => semanticRootStyle(contextStyles.value?.root, 'mask'),
        contextStyles,
        () => (contextStyle.value ? { root: contextStyle.value } : undefined),
        () => semanticRootStyle(resolvedPropsStyles.value?.root, 'mask'),
        resolvedPropsStyles,
      ],
      // ⚠️ 传 **computed 本身**（不是 `.value`）：函数式变体每次重算都要看到当前
      //    props；传 setup 期快照会让后续 props 变化在函数式里不可见（Issue #26.3）。
      mergedProps,
    );

    // antd mergedRootClassName：rtl + rootClassName + ctx className + semantic
    // root + className（hashId / cssVarCls 静态移植无 —— tooltip 同判）
    const mergedRootClassName = computed(() =>
      clsx(
        direction.value === 'rtl' && `${prefixCls.value}-rtl`,
        context.className,
        mergedClassNames.value.root,
        currentStep.value.classNames?.root,
        currentStep.value.className,
      ),
    );

    // ========================= keyboard =============================
    const onInternalChange = (next: number): void => setCurrent(next);
    const keyboardHandler = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.isComposing || isEditableTarget(e)) return;
      if (props.keyboard !== false && e.key === 'ArrowLeft') {
        if (mergedCurrent.value > 0) {
          e.preventDefault();
          onInternalChange(mergedCurrent.value - 1);
        }
        return;
      }
      if (props.keyboard !== false && e.key === 'ArrowRight') {
        if (mergedCurrent.value < mergedSteps.value.length - 1) {
          e.preventDefault();
          onInternalChange(mergedCurrent.value + 1);
        }
      }
    };
    // ====================== Esc（经 Mask Portal）====================
    // rc：`keyboard && mergedClosable !== null` 时 preventDefault + handleClose
    //（不判 top —— 上游 Mask 的 Portal 是唯一带 onEsc 的栈项，逐字保留）
    const handleEscClose = ({ top, event }: { top: boolean; event: KeyboardEvent }): void => {
      if (top && props.keyboard !== false && isClosable()) {
        event.preventDefault();
        handleClose();
      }
    };

    // ===================== forceAlign（V8）==========================
    // antd：arrowPointAtCenter / mergedCurrent 变化后 triggerRef.forceAlign()
    const triggerRef = shallowRef<{ forceAlign: () => void } | null>(null);
    watch(
      [arrowPointAtCenter, mergedCurrent, mergedPosInfo],
      () => {
        triggerRef.value?.forceAlign();
      },
      { flush: 'post' },
    );

    const focusRestore = useFocusRestore(() => popupElement.value);
    const restoreOwnedFocus = () => {
      const element = popupElement.value;
      const active = element ? getActiveElement(element) : null;
      if (
        element &&
        (!active || active === element.ownerDocument.body || containsComposed(element, active))
      )
        focusRestore.restore();
      else focusRestore.save(null);
    };
    onMounted(() => {
      watch(
        mergedOpen,
        (open) => {
          if (open) focusRestore.save();
          else {
            restoreOwnedFocus();
            popupElement.value = null;
          }
        },
        { immediate: true, flush: 'sync' },
      );
      watch(
        popupElement,
        (element) => {
          if (element && mergedOpen.value) {
            focusRestore.save();
            if (!containsComposed(element, getActiveElement(element)))
              element.focus({ preventScroll: true });
          }
        },
        { flush: 'post' },
      );
    });
    onBeforeUnmount(restoreOwnedFocus);

    const resolveContainer = (node: HTMLElement): HTMLElement | ShadowRoot | null => {
      const custom = props.getPopupContainer ?? context.getPopupContainer;
      if (custom) return custom(node);
      const root = node.getRootNode();
      return typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot
        ? root
        : node.ownerDocument.body;
    };
    const currentContainer = computed(() =>
      placeholderRef.value ? resolveContainer(placeholderRef.value) : null,
    );
    const maskContainer = () => currentContainer.value;
    const onPopupAlign = (element: HTMLElement, align: TriggerAlign) => {
      emit('popupAlign', element, align);
    };

    return () => {
      if (!mounted.value || !mergedOpen.value || targetElement.value === undefined) return null;
      const step = currentStep.value;
      const p = prefixCls.value;
      const pos = mergedPosInfo.value;
      const placeholder = h('div', {
        ref: placeholderRef,
        class: `${p}-target-placeholder`,
        style: {
          ...(pos
            ? {
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                width: `${pos.width}px`,
                height: `${pos.height}px`,
              }
            : CENTER_PLACEHOLDER),
          position: 'fixed',
          pointerEvents: 'none',
        },
      });
      const closeIcon = slots.closeIcon
        ? slots.closeIcon()
        : (props.closeIcon ?? context.closeIcon);
      const closable = resolveClosable(closeIcon);
      const panelStep: TourPanelStep = {
        ...step,
        prefixCls: p,
        total: mergedSteps.value.length,
        current: mergedCurrent.value,
        closable: closable === 'empty' ? undefined : closable,
        onClose: handleClose,
        onPrev: () => onInternalChange(mergedCurrent.value - 1),
        onNext: () => onInternalChange(mergedCurrent.value + 1),
        onFinish: () => {
          handleClose();
          emit('finish');
        },
      };
      const popup = () =>
        h(
          TourPanel,
          {
            prefixCls: p,
            stepProps: panelStep,
            slotStep: step,
            current: mergedCurrent.value,
            type: props.type,
            classNames: mergedClassNames.value,
            styles: mergedStyles.value,
            titleId,
          },
          slots,
        );
      const mask = h(TourMask, {
        prefixCls: p,
        pos: mergedPosInfo.value,
        showMask: mergedShowMask.value,
        style: mergedMaskConfig.value?.style,
        fill: mergedMaskConfig.value?.color,
        open: mergedOpen.value,
        placeholderAnimated: placeholderAnimated.value,
        zIndex: zIndex.value,
        disabledInteraction: props.disabledInteraction,
        maskClassName: clsx(
          mergedClassNames.value.root,
          step.classNames?.root,
          mergedClassNames.value.mask,
          step.classNames?.mask,
        ),
        maskStyle: { ...mergedStyles.value.mask, ...step.styles?.root, ...step.styles?.mask },
        getContainer: maskContainer,
        onEsc: handleEscClose,
        onReady: (container: HTMLElement | ShadowRoot | null) => {
          maskReadyContainer.value = container;
        },
      });
      const popupAttrs = mergeProps(
        {
          class: mergedRootClassName.value,
          style: [tourTheme.style.value, mergedStyles.value.root, step.styles?.root, step.style],
          role: 'dialog',
          dir: context.direction,
          tabindex: -1,
          onVnodeMounted: (node: VNode) => {
            const element = getElement(node);
            if (element instanceof HTMLElement) popupElement.value = element;
          },
          onVnodeBeforeUnmount: () => {
            restoreOwnedFocus();
            popupElement.value = null;
          },
          ...(attrs['aria-label'] === undefined && attrs['aria-labelledby'] === undefined
            ? { 'aria-labelledby': titleId }
            : {}),
        },
        attrs,
        { onKeydown: keyboardHandler },
      );
      const trigger = h(
        Trigger,
        {
          ref: triggerRef,
          prefixCls: p,
          popup,
          open: mergedOpen.value && maskReadyContainer.value !== null,
          placement: mergedPlacement.value,
          builtinPlacements: mergedBuiltinPlacements.value,
          getPopupContainer: maskContainer,
          destroyOnHidden: true,
          zIndex: zIndex.value,
          arrow: mergedArrow.value ? {} : undefined,
          onPopupAlign,
          popupAttrs,
        },
        { default: () => [placeholder] },
      );
      return [mask, trigger];
    };
  },
});

export default Tour;
