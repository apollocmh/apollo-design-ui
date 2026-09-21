<script setup lang="ts">
/**
 * Affix 固钉 —— 移植自 antd 6.6.4 的 `es/affix/index.js`（204 行）。
 *
 * ⚠️ 判据在 `./utils.ts`（纯函数，已单独单测）；本文件只负责
 *    「测量 → 喂判据 → 应用结果 → 绑/解事件」。
 *
 * ── 结构（对照 antd `:186-203`）─────────────────────────────────────────────
 *
 * ```html
 * <div ref="placeholderNode" style="{...contextStyle, ...style}" class="{className, contextClassName}">
 *   <div v-if="affixStyle" style="{width, height}" aria-hidden="true"></div>   <!-- 占位 -->
 *   <div ref="fixedNode" class="{affixStyle ? prefixCls : ''}" style="{affixStyle}">
 *     <slot />
 *   </div>
 * </div>
 * ```
 *
 * ── 五条最容易写错的判据（对照 `docs/analysis/affix.md`）──────────────────────
 *
 * 1. **类名只在固钉时出现**（antd `:181-183` `mergedCls = clsx({ [rootCls]: affixStyle })`）
 *    ⇒ 未固钉时内层**没有** `apollo-affix`。
 * 2. **占位层只在固钉时渲染**（`:186`），且 `aria-hidden="true"`。
 * 3. **`internalOffsetTop` 互锁**（`:38`）：两者都未传时为 `0`；
 *    只传 `offsetBottom` 时 `getFixedTop` 仍因 `offsetTop === undefined` 而不触发
 *    ⇒ **两者都传时只有 `offsetTop` 生效**。
 * 4. **占位零矩形直接跳过**（`:48-50`）。
 * 5. **`onChange` 只在翻转时发**（`:63-65`）。
 *
 * ── 事件与生命周期（antd `:74-110`）────────────────────────────────────────
 * - `TRIGGER_EVENTS` 绑在 target 上，handler 是 `lazyUpdatePosition`（节流版）。
 * - mount 先 `setTimeout(addListeners)`（legacy：等父组件 ref 就绪）。
 * - 卸载时两个节流函数都 `cancel()`（防「卸载后仍触发」）。
 */

import { throttleByAnimationFrame, useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  watch,
  type CSSProperties,
  type VNodeChild,
} from 'vue';
import { useComponentConfig, useConfigContext } from '../config-provider/context';
import type { AffixConfig, AffixProps, AffixRef, AffixTarget } from './interface';
import { getFixedBottom, getFixedTop, getTargetRect } from './utils';

const TRIGGER_EVENTS = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load',
] as const;

/** 与 antd `:30-31` 对齐的状态机。 */
const AFFIX_STATUS_NONE = 0;
const AFFIX_STATUS_PREPARE = 1;

defineOptions({ name: 'AAffix', inheritAttrs: false });

const props = defineProps<AffixProps>();
const emit = defineEmits<{ change: [affixed: boolean] }>();
defineSlots<{ default?: () => VNodeChild }>();

/**
 * ⚠️ `inheritAttrs: false` + 显式把 `$attrs` 绑到**外层**（占位测量层）——
 *    antd 的 `...restProps` 落在外层（`index.js:190-195`），内层不落。
 *    漏了这一条，`data-*` / `id` / `aria-*` 等透传属性会静默丢失
 *    （这是我实现里的真 bug，L4 的 `attrs:passthrough` 用例抓出来的）。
 */
const attrs = useAttrs();

const { getPrefixCls, className: contextClassName, style: contextStyle } =
  useComponentConfig<AffixConfig>('affix');
// ⚠️ `getTargetContainer` 挂在 context **顶层**，不在 `components.affix` 里
//    （它是全局的浮层容器配置，不是组件配置）—— 所以单独取。
const { getTargetContainer } = useConfigContext();

const affixPrefixCls = computed(() => getPrefixCls('affix', props.prefixCls));

// ---------------------------------------------------------------------------
// 状态
// ---------------------------------------------------------------------------

const lastAffix = ref(false);
/** 固钉层的内联样式；`undefined` = 未固钉。 */
const affixStyle = shallowRef<CSSProperties | undefined>(undefined);
const placeholderStyle = shallowRef<CSSProperties | undefined>(undefined);
const statusRef = ref<number>(AFFIX_STATUS_NONE);

const placeholderNode = ref<HTMLElement | null>(null);
const fixedNode = ref<HTMLElement | null>(null);

/** antd `:38`：互锁推导 —— 两者都未传时为 0。 */
const internalOffsetTop = computed<number | undefined>(() =>
  props.offsetBottom === undefined && props.offsetTop === undefined ? 0 : props.offsetTop,
);

/** 解析顺序：props.target ?? ConfigProvider.getTargetContainer ?? window（antd `:36`）。 */
const targetFunc = computed<AffixTarget>(() => {
  const fn = (props.target ?? getTargetContainer ?? (typeof window !== 'undefined' ? () => window : () => null)) as AffixTarget;
  // ⚠️ `GetTargetContainer` 的返回类型比 `AffixTarget` 宽（还允许 `ShadowRoot`），
  //    而 antd 的 Affix 自己的类型就是 `HTMLElement | Window`（`ShadowRoot` 没有
  //    `getBoundingClientRect`，交给判据会拿到全 0 的矩形 ⇒ 走「零矩形跳过」分支，
  //    行为是安全的）。这里收窄对齐 antd 的类型面。
  return (): HTMLElement | Window | null => fn() as HTMLElement | Window | null;
});

// ---------------------------------------------------------------------------
// measure（antd `:40-71`）
// ---------------------------------------------------------------------------

const measure = (): void => {
  if (
    statusRef.value !== AFFIX_STATUS_PREPARE ||
    !fixedNode.value ||
    !placeholderNode.value
  ) {
    return;
  }
  const targetNode = targetFunc.value();
  if (!targetNode) return;

  const placeholderRect = getTargetRect(placeholderNode.value);
  // antd `:48-50`：零矩形 ⇒ 还没量到，放弃本次测量。
  if (
    placeholderRect.top === 0 &&
    (placeholderRect.left ?? 0) === 0 &&
    placeholderRect.width === 0 &&
    placeholderRect.height === 0
  ) {
    return;
  }
  const targetRect = getTargetRect(targetNode);
  const fixedTop = getFixedTop(placeholderRect, targetRect, internalOffsetTop.value);
  const fixedBottom = getFixedBottom(placeholderRect, targetRect, props.offsetBottom);

  let nextAffixStyle: CSSProperties | undefined;
  let nextPlaceholderStyle: CSSProperties | undefined;

  if (fixedTop !== undefined) {
    nextAffixStyle = {
      position: 'fixed',
      top: fixedTop,
      width: placeholderRect.width,
      height: placeholderRect.height,
    };
    nextPlaceholderStyle = { width: placeholderRect.width, height: placeholderRect.height };
  } else if (fixedBottom !== undefined) {
    nextAffixStyle = {
      position: 'fixed',
      bottom: fixedBottom,
      width: placeholderRect.width,
      height: placeholderRect.height,
    };
    nextPlaceholderStyle = { width: placeholderRect.width, height: placeholderRect.height };
  }

  const nextLastAffix = !!nextAffixStyle;
  if (lastAffix.value !== nextLastAffix) {
    emit('change', nextLastAffix);
  }
  statusRef.value = AFFIX_STATUS_NONE;
  affixStyle.value = nextAffixStyle;
  placeholderStyle.value = nextPlaceholderStyle;
  lastAffix.value = nextLastAffix;
};

const prepareMeasure = (): void => {
  statusRef.value = AFFIX_STATUS_PREPARE;
  measure();
};

// ---------------------------------------------------------------------------
// 节流（`utils` 已有 `throttleByAnimationFrame`，含 `cancel()`）
// ---------------------------------------------------------------------------

const updatePosition = throttleByAnimationFrame((): void => {
  prepareMeasure();
});

/** 懒更新：已固钉且位置没变 ⇒ 不重算（性能契约，antd `:58-70`）。 */
const lazyUpdatePosition = throttleByAnimationFrame((): void => {
  if (targetFunc.value && affixStyle.value) {
    const targetNode = targetFunc.value();
    if (targetNode && placeholderNode.value) {
      const targetRect = getTargetRect(targetNode);
      const placeholderRect = getTargetRect(placeholderNode.value);
      const fixedTop = getFixedTop(placeholderRect, targetRect, internalOffsetTop.value);
      const fixedBottom = getFixedBottom(placeholderRect, targetRect, props.offsetBottom);
      const style = affixStyle.value as { top?: number; bottom?: number };
      if (
        (fixedTop !== undefined && style.top === fixedTop) ||
        (fixedBottom !== undefined && style.bottom === fixedBottom)
      ) {
        return;
      }
    }
  }
  prepareMeasure();
});

// ---------------------------------------------------------------------------
// 事件绑定（antd `:74-92`）
// ---------------------------------------------------------------------------

const prevTargetRef = shallowRef<HTMLElement | Window | null>(null);
const prevListenerRef = shallowRef<EventListener | null>(null);

const addListeners = (): void => {
  const listenerTarget = targetFunc.value();
  if (!listenerTarget) return;
  for (const eventName of TRIGGER_EVENTS) {
    if (prevListenerRef.value) {
      prevTargetRef.value?.removeEventListener(eventName, prevListenerRef.value);
    }
    listenerTarget.addEventListener(eventName, lazyUpdatePosition as EventListener);
  }
  prevTargetRef.value = listenerTarget;
  prevListenerRef.value = lazyUpdatePosition as unknown as EventListener;
};

const removeListeners = (): void => {
  const newTarget = targetFunc.value();
  for (const eventName of TRIGGER_EVENTS) {
    newTarget?.removeEventListener(eventName, lazyUpdatePosition as EventListener);
    if (prevListenerRef.value) {
      prevTargetRef.value?.removeEventListener(eventName, prevListenerRef.value);
    }
  }
  updatePosition.cancel();
  lazyUpdatePosition.cancel();
};

// ---------------------------------------------------------------------------
// 生命周期（antd `:95-110`）
// ---------------------------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  // legacy：等父组件 ref 就绪（antd `:97-99`）。
  timer = setTimeout(addListeners);
});

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  removeListeners();
});

// 依赖变化 ⇒ 重新绑事件（antd `:104-107`）。⚠️ 固钉状态翻转也会重绑。
watch(
  [
    () => props.target,
    affixStyle,
    lastAffix,
    () => props.offsetTop,
    () => props.offsetBottom,
  ],
  () => {
    addListeners();
  },
);

watch([() => props.target, () => props.offsetTop, () => props.offsetBottom], () => {
  updatePosition();
});

// ResizeObserver：外层占位 + children（固钉层）两处（antd `:175` / `:200`）。
useResizeObserver({ target: placeholderNode, onResize: updatePosition });
useResizeObserver({ target: fixedNode, onResize: updatePosition });

defineExpose<AffixRef>({
  updatePosition: () => updatePosition(),
});
</script>

<template>
  <div
    ref="placeholderNode"
    :style="{ ...contextStyle, ...style }"
    :class="[className, contextClassName]"
    v-bind="attrs"
  >
    <!-- ① 占位层：只在固钉时渲染（antd `:186`） -->
    <div v-if="affixStyle" :style="placeholderStyle" aria-hidden="true"></div>

    <!-- ② 固钉层：类名只在固钉时出现（antd `:181-183`） -->
    <div ref="fixedNode" :class="affixStyle ? affixPrefixCls : ''" :style="affixStyle">
      <slot></slot>
    </div>
  </div>
</template>
