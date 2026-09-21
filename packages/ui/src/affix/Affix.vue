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
  type CSSProperties,
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useAttrs,
  type VNodeChild,
  watch,
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

const {
  getPrefixCls,
  className: contextClassName,
  style: contextStyle,
} = useComponentConfig<AffixConfig>('affix');
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
  const fn = (props.target ??
    getTargetContainer ??
    (typeof window !== 'undefined' ? () => window : () => null)) as AffixTarget;
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
  if (statusRef.value !== AFFIX_STATUS_PREPARE || !fixedNode.value || !placeholderNode.value) {
    return;
  }
  const targetNode = targetFunc.value();
  if (!targetNode) return;

  // ⚠️ 量外层（与 antd 一致）。曾试过「已固钉时改量占位层本身」以掐断增长循环——
  //    实测 style 变体的差异率从 0.013-0.048% 恶化到 0.796-3.68% ⇒ 已回退。
  //    （React 基线定格的就是「测量时的外层高度」，改量占位层反而偏离。）
  const placeholderRect = getTargetRect(placeholderNode.value);
  // eslint-disable-next-line no-console
  console.log(
    '[affix-probe] measure h=',
    placeholderRect.height,
    'w=',
    placeholderRect.width,
    'top=',
    placeholderRect.top,
    '| lastAffix=',
    lastAffix.value,
    '| 现affixStyle=',
    JSON.stringify(affixStyle.value),
  );
  // antd `:48-50`：零矩形 ⇒ 还没量到，放弃本次测量。
  if (
    placeholderRect.top === 0 &&
    (placeholderRect.left ?? 0) === 0 &&
    placeholderRect.width === 0 &&
    placeholderRect.height === 0
  ) {
    return;
  }
  // ⚠️⚠️ **占位塌缩保护**（L6 3/15 的根因，measure 日志实测：60 → 0 → 0 自锁）：
  //    已固钉时，外层（placeholderNode）的高度就是占位层撑起来的；
  //    若此时量到高度 0，说明量的是「内容已出文档流之后」的塌缩态——
  //    把它写回 placeholderStyle 会让占位层变 0 → 外层更塌 → 再触发重测 ⇒ 自锁。
  //    已固钉 + 高度 0 ⇒ 跳过本次测量，保住第一次的正确占位尺寸。
  if (lastAffix.value && placeholderRect.height === 0) {
    return;
  }
  const targetRect = getTargetRect(targetNode);
  // eslint-disable-next-line no-console
  const fixedTop = getFixedTop(placeholderRect, targetRect, internalOffsetTop.value);
  const fixedBottom = getFixedBottom(placeholderRect, targetRect, props.offsetBottom);

  let nextAffixStyle: CSSProperties | undefined;
  let nextPlaceholderStyle: CSSProperties | undefined;

  // ⚠️⚠️ **数字必须转成带 px 的字符串**（L6 3/15 的根因）：
  //    Vue 的 patchStyle 直接 `el.style[key] = value`，**不做数字 → px 的转换**
  //    （React 才有 dangerousStyleValue 的自动补全）。数字赋给 CSSOM 是非法值，
  //    会被**静默丢弃** —— 实测 `top: 80`、`width: 343` 全丢，只剩字符串的
  //    `position: 'fixed'`。antd 侧是 React，数字自动转 px，所以两边看起来差一大截。
  const px = (v: number | undefined): string | undefined =>
    v === undefined ? undefined : `${v}px`;

  if (fixedTop !== undefined) {
    nextAffixStyle = {
      position: 'fixed',
      top: px(fixedTop),
      width: px(placeholderRect.width),
      height: px(placeholderRect.height),
    };
    nextPlaceholderStyle = {
      width: px(placeholderRect.width),
      height: px(placeholderRect.height),
    };
  } else if (fixedBottom !== undefined) {
    nextAffixStyle = {
      position: 'fixed',
      bottom: px(fixedBottom),
      width: px(placeholderRect.width),
      height: px(placeholderRect.height),
    };
    nextPlaceholderStyle = {
      width: px(placeholderRect.width),
      height: px(placeholderRect.height),
    };
  }

  const nextLastAffix = !!nextAffixStyle;
  if (lastAffix.value !== nextLastAffix) {
    emit('change', nextLastAffix);
  }
  statusRef.value = AFFIX_STATUS_NONE;
  // eslint-disable-next-line no-console
  // eslint-disable-next-line no-console
  console.log(
    '[affix-probe] affixStyle=',
    JSON.stringify(nextAffixStyle),
    '| placeholderStyle=',
    JSON.stringify(nextPlaceholderStyle),
  );
  // ⚠️⚠️ **直接赋值，不要包一层对象**：
  //    曾在这里做过 `Object.freeze({ ...nextAffixStyle })` 的「诊断实验」——
  //    当 nextAffixStyle 为 **undefined** 时，`{ ...undefined }` 的结果是 **`{}`（真值！）**，
  //    导致 v-if 渲染占位层、`apollo-affix` 类名被套上（CSS 的 position:fixed 生效）⇒
  //    内容出文档流 ⇒ 外层塌成 0 ⇒ offset-bottom 变体整组 size-mismatch。
  //    **教训：把「可能为 undefined 的值」展开进新对象，会把 undefined 变成真值空对象。**
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
  [() => props.target, affixStyle, lastAffix, () => props.offsetTop, () => props.offsetBottom],
  () => {
    addListeners();
  },
);

watch(
  [() => props.target, () => props.offsetTop, () => props.offsetBottom],
  () => {
    updatePosition();
  },
  // ⚠️ **必须 `immediate: true`**：antd 的 `useEffect([target, offsetTop, offsetBottom])`
  //    在**挂载时就会跑一次** `updatePosition()` —— 这是首次测量的唯一入口。
  //    Vue 的 `watch` 默认不立即执行 ⇒ 永远不测量 ⇒ **永不固钉**（占位层也不渲染）。
  //    视觉比对抓出来的：React 侧页面比我们高 60px（差的就是那层占位）。
  { immediate: true },
);

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
