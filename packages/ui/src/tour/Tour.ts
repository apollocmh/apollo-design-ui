/**
 * Tour —— 引导遮罩。rc-tour 2.4.0（状态机 / 定位 / 蒙层）+ antd 6.6.4 `es/tour/index.js`
 * （薄壳）的 Vue 版。逐条判据的行号/源码出处见 `docs/analysis/tour.md`（§9 V1–V8）。
 *
 * ── 组装关系 ─────────────────────────────────────────────────────────────────
 *
 *   | rc / antd 侧                      | 本仓承接 |
 *   |---|---|---|
 *   | rc-trigger 的 Placeholder（占位）  | 本文件内联渲染的 div（Trigger 对齐其 slot 首个 vnode） |
 *   | rc `hooks/useTarget`              | 本文件 `updatePos` + window resize/scroll 监听 |
 *   | rc `Mask.js`                      | `./Mask`（独立 Portal + SVG 挖洞） |
 *   | antd `panelRender.js`（自研面板）  | `./panel`（TourPanel） |
 *   | antd `_util/placements`           | `@apollo-design/position` 的 `getPlacements` |
 *   | rc `useControlledState`           | 手写受控/非受控 ref（**不用** useControlledValue —— 重开归零需要「静默 set」，见下） |
 *   | rc Portal 的 Esc 栈               | `@apollo-design/portal` 的 `Portal onEsc`（经 Mask） |
 *
 * ── 六条最容易写错的判据（全部有源码出处，勿「顺手修」）────────────────────────
 *
 *   1. `mergedOpen = current 越界 ? false : (internalOpen ?? true)` —— 不传
 *      open/defaultOpen 且 current 合法时**默认打开**（rc `?? true`，§9-V6）；
 *      open 翻 true 且之前是关的 ⇒ `current` **静默归零**（不 emit change ——
 *      rc 的 useControlledState setter 不触发 onChange）。
 *   2. `mergedPlacement = step ?? global ?? (无 target ? 'center' : 'bottom')` ——
 *      'center' 是兜底值而非 placements 条目；查表落空 ⇒ 空 align ⇒
 *      position 包 splitPoints 兜底 'c' ⇒ 居中（§9-V1，已对拍 rc getAlignPoint）。
 *   3. 无 target 时箭头恒 `false`（rc：`mergedArrow = targetElement ? ... : false`）。
 *   4. antd 在 `arrowPointAtCenter` / `current` 变化后 `forceAlign()`（index.js 的
 *      useLayoutEffect）—— 本仓 Trigger expose 了同名方法，照做。
 *   5. Esc 条件是 `keyboard && mergedClosable !== null`；closable 合并是 rc
 *      `useClosable` 的『step 层不补默认、root 层补（preset=true）』双层语义（§9-V3）。
 *   6. `animated: true` 是 antd 运行时强制（index.js restProps 后覆盖）；本仓按 G2
 *      的 API 面保留用户 `animated`，`-placeholder-animated` 判据取
 *      `typeof animated === 'object' ? animated.placeholder : (animated ?? true)`。
 */

import type { GetContainer } from '@apollo-design/portal';
import { useZIndex } from '@apollo-design/portal';
import { getPlacements } from '@apollo-design/position';
import { getDesignToken } from '@apollo-design/theme';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { clsx } from '../tooltip/util';
import type {
  TourAnimatedConfig,
  TourClosableConfig,
  TourPlacement,
  TourProps,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourStepProps,
  TourType,
} from './interface';
import TourMask, { type TourMaskPos } from './Mask';
import TourPanel, { type TourPanelStep } from './panel';
import { tourTokenValues } from './style/token';

// ---------------------------------------------------------------------------
// rc util.js（机械移植）
// ---------------------------------------------------------------------------

function isInViewPort(element: HTMLElement): boolean {
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;
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
    (closeIcon === false && (!isConfigObj(closable) || !closable.closeIcon))
  ) {
    return null;
  }
  const mergedCloseIcon = typeof closeIcon !== 'boolean' ? closeIcon : undefined;
  if (isConfigObj(closable)) {
    return { ...closable, closeIcon: closable.closeIcon ?? mergedCloseIcon };
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

type StyleLike = Record<string, string | number>;

/** ConfigProvider 的 tour 段（antd `useComponentConfig('tour')` 的解构面）。 */
interface TourContext {
  className?: string;
  style?: VueCSSProperties;
  classNames?: TourSemanticClassNames;
  styles?: TourSemanticStyles;
  closeIcon?: VNodeChild;
}
type VueCSSProperties = CSSProperties;

const Tour = defineComponent({
  name: 'ATour',
  inheritAttrs: false,
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
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<TourProps['closable']>,
      default: undefined,
    },
    zIndex: { type: Number, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    builtinPlacements: {
      type: Object as PropType<Record<string, TriggerAlign>>,
      default: undefined,
    },
    disabledInteraction: { type: Boolean, default: undefined },
    onPopupAlign: {
      type: Function as PropType<(element: HTMLElement, align: TriggerAlign) => void>,
      default: undefined,
    },
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
  },
  setup(props, { slots, attrs, emit }) {
    const context = useComponentConfig<TourContext>('tour');
    const direction = useDirection();
    const { getPrefixCls } = context;

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

    const prefixCls = computed(() => props.prefixCls ?? getPrefixCls('tour'));

    // ====================== Controlled State ========================
    // ⚠️ 不用 useControlledValue：rc useControlledState 的 setter **不触发**
    //    onChange —— 「重开归零」是静默 set，而 useControlledValue.setValue
    //    恒走 onChange。两个状态都手写（watch 同步受控值的行为与其一致）。
    const currentInner = ref(props.defaultCurrent ?? 0);
    const mergedCurrent = computed(() =>
      props.current !== undefined ? props.current : currentInner.value,
    );
    watch(
      () => props.current,
      (v) => {
        if (v !== undefined) currentInner.value = v;
      },
    );

    const openInner = ref<boolean | undefined>(props.defaultOpen);
    const internalOpen = computed(() => (props.open !== undefined ? props.open : openInner.value));
    watch(
      () => props.open,
      (v) => {
        openInner.value = v;
      },
    );

    /** rc：`current 越界 ⇒ false`，否则 `internalOpen ?? true`（V6）。 */
    const mergedOpen = computed(() => {
      if (mergedCurrent.value < 0 || mergedCurrent.value >= mergedSteps.value.length) {
        return false;
      }
      return internalOpen.value ?? true;
    });

    /** 「曾经打开过」标志（rc hasOpened：渲染门，once true 恒 true）。 */
    const hasOpened = ref(mergedOpen.value);
    const openRef = ref(mergedOpen.value);
    watch(mergedOpen, (open) => {
      if (open) {
        if (!openRef.value) {
          // 静默归零（rc setMergedCurrent(0)，不发 change）
          currentInner.value = 0;
        }
        hasOpened.value = true;
      }
      openRef.value = open;
    });

    const setCurrent = (next: number): void => {
      currentInner.value = next;
      emit('update:current', next);
      emit('change', next);
    };

    const setClosed = (): void => {
      openInner.value = false;
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
    const updatePos = (): void => {
      const el = targetElement.value;
      if (el) {
        if (!isInViewPort(el) && mergedOpen.value) {
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

    watch([targetElement, mergedOpen], () => updatePos());
    onMounted(() => {
      updatePos();
      window.addEventListener('resize', updatePos);
      // rc：只监听 window 的 scroll（元素级滚动不触发 —— 上游真实行为）
      window.addEventListener('scroll', updatePos);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos);
    });

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
        ? (mergedArrow.value as { pointAtCenter: boolean }).pointAtCenter
        : false,
    );

    // ====================== builtinPlacements =======================
    // antd：getPlacements({ arrowPointAtCenter ?? true, autoAdjustOverflow: true,
    // offset: marginXXS, arrowWidth: sizePopupArrow, borderRadius })
    const seed = getDesignToken() as unknown as {
      marginXXS: number;
      sizePopupArrow: number;
      borderRadius: number;
    };
    const mergedBuiltinPlacements = computed<Record<string, TriggerAlign>>(() => {
      if (props.builtinPlacements) return props.builtinPlacements;
      return getPlacements({
        arrowPointAtCenter: arrowPointAtCenter.value,
        autoAdjustOverflow: true,
        offset: seed.marginXXS,
        arrowWidth: seed.sizePopupArrow,
        borderRadius: seed.borderRadius,
      });
    });

    // ========================= closable =============================
    const mergedCloseIcon = computed<VNodeChild>(
      () => slots.closeIcon?.() ?? props.closeIcon ?? context.closeIcon,
    );
    const mergedClosable = computed<ClosableResolved>(() => {
      const stepCfg = getClosableConfig(
        currentStep.value.closable,
        currentStep.value.closeIcon,
        false,
      );
      const rootCfg = getClosableConfig(props.closable, mergedCloseIcon.value, true);
      return stepCfg !== 'empty' ? stepCfg : rootCfg;
    });

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
    const zIndex = useZIndex('Tour', () => props.zIndex, {
      zIndexPopupBase: tourTokenValues().zIndexPopup,
    });

    // ===================== Merged Semantic ==========================
    // antd：4 处 root 值经 useSemanticRootStyle(..., 'mask') 同时落到 mask（§2.3）
    const mergedProps = computed<TourProps>(() => ({
      ...props,
      steps: mergedSteps.value,
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
    const contextStyles = computed(() => context.styles);
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
        () => semanticRootStyle(contextStyle.value, 'mask'),
        () => semanticRootStyle(resolvedPropsStyles.value?.root, 'mask'),
        resolvedPropsStyles,
        () => semanticRootStyle(attrs.style as VueCSSProperties | undefined, 'mask'),
      ],
      mergedProps.value,
    );

    // antd mergedRootClassName：rtl + rootClassName + ctx className + semantic
    // root + className（hashId / cssVarCls 静态移植无 —— tooltip 同判）
    const mergedRootClassName = computed(() =>
      clsx(
        direction.value === 'rtl' && `${prefixCls.value}-rtl`,
        context.className,
        mergedClassNames.value.root,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class as string | undefined,
      ),
    );

    // ========================= keyboard =============================
    const onInternalChange = (next: number): void => setCurrent(next);
    const keyboardHandler = (e: KeyboardEvent): void => {
      if (isEditableTarget(e)) return;
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
    watch(
      mergedOpen,
      (open, _prev, onCleanup) => {
        if (!open) return;
        window.addEventListener('keydown', keyboardHandler);
        onCleanup(() => window.removeEventListener('keydown', keyboardHandler));
      },
      { immediate: true },
    );

    // ====================== Esc（经 Mask Portal）====================
    // rc：`keyboard && mergedClosable !== null` 时 preventDefault + handleClose
    //（不判 top —— 上游 Mask 的 Portal 是唯一带 onEsc 的栈项，逐字保留）
    const handleEscClose = ({ event }: { top: boolean; event: KeyboardEvent }): void => {
      if (props.keyboard !== false && mergedClosable.value !== null) {
        event.preventDefault();
        handleClose();
      }
    };

    // ===================== forceAlign（V8）==========================
    // antd：arrowPointAtCenter / mergedCurrent 变化后 triggerRef.forceAlign()
    const triggerRef = shallowRef<{ forceAlign: () => void } | null>(null);
    watch([arrowPointAtCenter, mergedCurrent], () => {
      triggerRef.value?.forceAlign();
    });

    // ========================== Render ==============================
    return () => {
      // 渲染门（rc）：target 未解析 / 从未打开过 ⇒ null
      if (targetElement.value === undefined || !hasOpened.value) {
        return null;
      }

      const step = currentStep.value;
      const p = prefixCls.value;

      // ── Placeholder（rc Trigger 的 child）：挖洞位 / 中心占位 ──
      // 数字必须转 px 字符串（PITFALLS 1：Vue patchStyle 不做转换）
      const pos = mergedPosInfo.value;
      const placeholderStyle: StyleLike = {
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
        // 根 style 是 Vue 原生 attrs
        ...(attrs.style as StyleLike),
      };
      const placeholder = h('div', {
        class: clsx(
          typeof attrs.class === 'string' ? attrs.class : undefined,
          `${p}-target-placeholder`,
        ),
        style: placeholderStyle,
      });

      // ── 面板注入位（rc TourStep 的 props 装配）──────────────────
      // slot 优先（C8-R2）：title/description/cover/按钮文案在这里解析
      const total = mergedSteps.value.length;
      const panelStep: TourPanelStep = {
        ...step,
        prefixCls: p,
        total,
        current: mergedCurrent.value,
        title: slots.title?.({ step, current: mergedCurrent.value, total }) ?? step.title,
        description:
          slots.description?.({ step, current: mergedCurrent.value, total }) ?? step.description,
        cover: slots.cover?.({ step, current: mergedCurrent.value, total }) ?? step.cover,
        nextButtonProps: {
          ...step.nextButtonProps,
          children:
            slots.nextButton?.({ step, current: mergedCurrent.value, total }) ??
            step.nextButtonProps?.children,
        },
        prevButtonProps: {
          ...step.prevButtonProps,
          children:
            slots.prevButton?.({ step, current: mergedCurrent.value, total }) ??
            step.prevButtonProps?.children,
        },
        closable: mergedClosable.value === 'empty' ? undefined : mergedClosable.value,
        onClose: handleClose,
        onPrev: () => onInternalChange(mergedCurrent.value - 1),
        onNext: () => onInternalChange(mergedCurrent.value + 1),
        onFinish: () => {
          handleClose();
          emit('finish');
        },
      };

      const popup = () =>
        h(TourPanel, {
          prefixCls: p,
          stepProps: panelStep,
          current: mergedCurrent.value,
          type: props.type,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          // #indicators / #actions → antd 两个 render prop 的桥接（C8-R2）
          indicatorsRender: slots.indicators
            ? (current: number, total: number) => slots.indicators?.({ current, total })
            : undefined,
          actionsRender: slots.actions
            ? (originNode: VNodeChild, info: { current: number; total: number }) =>
                slots.actions?.({ ...info, originNode })
            : undefined,
        });

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
        // antd：Mask 的 rootClassName = mergedRootClassName（含 classNames.root /
        // ctx className / className），再加语义槽 mask —— 逐字同构
        maskClassName: clsx(mergedRootClassName.value, mergedClassNames.value.mask),
        maskStyle: mergedStyles.value.mask,
        getContainer: props.getPopupContainer as unknown as GetContainer | undefined,
        onEsc: handleEscClose,
      });

      const trigger = h(
        Trigger,
        {
          ref: triggerRef as never,
          prefixCls: p,
          popup,
          // rc：无 action（占位 pointer-events:none，开合只走受控 open）
          open: mergedOpen.value,
          placement: mergedPlacement.value,
          builtinPlacements: mergedBuiltinPlacements.value,
          getPopupContainer: props.getPopupContainer,
          popupStyle: step.style as StyleLike,
          popupClassName: clsx(mergedRootClassName.value, step.className),
          // rc：forceRender: false + autoDestroy: true
          destroyOnHidden: true,
          zIndex: zIndex.value,
          arrow: mergedArrow.value ? {} : undefined,
          onPopupAlign: props.onPopupAlign,
          ...attrs,
        },
        { default: () => [placeholder] },
      );

      // rc 返回 Fragment [Mask, Trigger] —— Vue 数组同构
      return [mask, trigger] as unknown as VNode;
    };
  },
});

export default Tour;
