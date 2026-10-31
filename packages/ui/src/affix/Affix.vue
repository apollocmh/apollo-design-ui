<script setup lang="ts">
/** Affix keeps the existing geometry and frame-coalesced fast path. */
import { useTheme } from '@apollo-design/theme';
import { isWindow, throttleByAnimationFrame, useResizeObserver } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  mergeProps,
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
import { prepareComponentToken } from './style/token';
import { getFixedBottom, getFixedTop, getTargetRect, hasSameFixedPosition } from './utils';

const TRIGGER_EVENTS = [
  'resize',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pageshow',
  'load',
] as const;
defineOptions({ name: 'AAffix', inheritAttrs: false });
const props = defineProps<AffixProps>();
const emit = defineEmits<{ change: [affixed: boolean] }>();
defineSlots<{ default?: () => VNodeChild }>();
const attrs = useAttrs();
const config = useComponentConfig<AffixConfig>('affix');
const globalConfig = useConfigContext();
const theme = useTheme();
const rootAttrs = () => mergeProps({ class: config.className, style: config.style }, attrs);
const affixPrefixCls = computed(() => config.getPrefixCls('affix', props.prefixCls));
const fixedThemeStyle = computed<CSSProperties | undefined>(() => {
  if (theme.sourceActive?.value === false) return undefined;
  const custom = theme.config.value.components?.Affix?.zIndexPopup;
  return {
    zIndex:
      typeof custom === 'number' && Number.isFinite(custom)
        ? custom
        : prepareComponentToken(theme.token.value).zIndexPopup,
  };
});

const mounted = ref(false);
const lastAffix = ref(false);
const affixStyle = shallowRef<CSSProperties>();
const placeholderStyle = shallowRef<CSSProperties>();
const placeholderNode = ref<HTMLElement | null>(null);
const fixedNode = ref<HTMLElement | null>(null);
const internalOffsetTop = computed(() =>
  props.offsetBottom === undefined && props.offsetTop === undefined ? 0 : props.offsetTop,
);
const targetFunc = computed<AffixTarget>(
  () =>
    props.target ??
    globalConfig.getTargetContainer ??
    (() => (typeof window === 'undefined' ? null : window)),
);
const resolveTarget = () => (mounted.value ? (targetFunc.value() ?? null) : null);
const currentTarget = computed(resolveTarget);

const applyPosition = (next: CSSProperties | undefined, placeholder: CSSProperties | undefined) => {
  const affixed = next !== undefined;
  affixStyle.value = next;
  placeholderStyle.value = placeholder;
  if (lastAffix.value !== affixed) emit('change', affixed);
  lastAffix.value = affixed;
};
const measure = () => {
  if (!mounted.value || !fixedNode.value || !placeholderNode.value) return;
  const target = resolveTarget();
  if (!target) {
    applyPosition(undefined, undefined);
    return;
  }
  const rect = getTargetRect(placeholderNode.value);
  // Hidden/unmeasurable nodes retain the last valid geometry, including the existing
  // fixed-placeholder collapse protection (s54).
  if (rect.top === 0 && (rect.left ?? 0) === 0 && rect.width === 0 && rect.height === 0) return;
  if (lastAffix.value && rect.height === 0) return;
  const targetRect = getTargetRect(target);
  const top = getFixedTop(rect, targetRect, internalOffsetTop.value);
  const bottom = getFixedBottom(rect, targetRect, props.offsetBottom);
  const px = (value: number | undefined) => (value === undefined ? undefined : `${value}px`);
  // The fixed content keeps its natural height, so its existing ResizeObserver
  // can update the spacer after either growth or shrinkage.
  const width = px(rect.width);
  const size = { width, height: px(fixedNode.value.getBoundingClientRect().height) };
  if (top !== undefined) applyPosition({ position: 'fixed', top: px(top), width }, size);
  else if (bottom !== undefined)
    applyPosition({ position: 'fixed', bottom: px(bottom), width }, size);
  else applyPosition(undefined, undefined);
};

let attachedTarget: HTMLElement | Window | null = null;
let attachedWindow: Window | null = null;
const resizeTarget = shallowRef<HTMLElement | null>(null);
const detach = () => {
  for (const event of TRIGGER_EVENTS) attachedTarget?.removeEventListener(event, listener);
  attachedWindow?.removeEventListener('resize', listener);
  attachedTarget = null;
  attachedWindow = null;
  resizeTarget.value = null;
};
const syncListeners = () => {
  const target = resolveTarget();
  if (target === attachedTarget) return;
  detach();
  attachedTarget = target;
  for (const event of TRIGGER_EVENTS) target?.addEventListener(event, listener);
  if (target && !isWindow(target)) {
    resizeTarget.value = target;
    attachedWindow = target.ownerDocument.defaultView;
    attachedWindow?.addEventListener('resize', listener);
  }
};
const prepareMeasure = () => {
  syncListeners();
  measure();
};
const scheduledUpdate = throttleByAnimationFrame(prepareMeasure);
const updatePosition = () => {
  if (mounted.value) scheduledUpdate();
};
const lazyUpdatePosition = throttleByAnimationFrame(() => {
  if (affixStyle.value) {
    const target = resolveTarget();
    if (target && placeholderNode.value) {
      const targetRect = getTargetRect(target);
      const rect = getTargetRect(placeholderNode.value);
      if (
        hasSameFixedPosition(
          affixStyle.value,
          getFixedTop(rect, targetRect, internalOffsetTop.value),
          getFixedBottom(rect, targetRect, props.offsetBottom),
        )
      )
        return;
    }
  }
  prepareMeasure();
});
const listener: EventListener = () => lazyUpdatePosition();
watch(
  [currentTarget, () => props.offsetTop, () => props.offsetBottom],
  () => {
    syncListeners();
    updatePosition();
  },
  { flush: 'post' },
);
onMounted(() => {
  mounted.value = true;
  syncListeners();
  updatePosition();
});
onBeforeUnmount(() => {
  mounted.value = false;
  detach();
  scheduledUpdate.cancel();
  lazyUpdatePosition.cancel();
});
useResizeObserver({ target: placeholderNode, onResize: updatePosition });
useResizeObserver({ target: fixedNode, onResize: updatePosition });
useResizeObserver({ target: resizeTarget, onResize: updatePosition });
defineExpose<AffixRef>({ updatePosition });
</script>

<template>
  <div ref="placeholderNode" v-bind="rootAttrs()">
    <!-- ① 占位层：只在固钉时渲染（antd `:186`） -->
    <div v-if="affixStyle" :style="placeholderStyle" aria-hidden="true"></div>

    <!-- ② 固钉层：类名只在固钉时出现（antd `:181-183`） -->
    <div ref="fixedNode" :class="affixStyle ? affixPrefixCls : ''" :style="[affixStyle, affixStyle ? fixedThemeStyle : undefined]">
      <slot></slot>
    </div>
  </div>
</template>
