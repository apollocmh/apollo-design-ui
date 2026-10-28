<script setup lang="ts">
/** Private Badge display engine. Public slots are evaluated by Badge.vue; this
 * engine keeps the last visible count for leave motion and reads current configuration.
 * The original digit/motion algorithm reference is antd 6.6.4 es/badge/Badge.js.
 * Current native contracts and finite reference differences are documented by this unit.
 */

import { CSSMotion } from '@apollo-design/motion';
import {
  isEmptyVNode,
  isNonNullable,
  isNumber,
  isString,
  useDevWarning,
} from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  isVNode,
  mergeProps,
  onMounted,
  onScopeDispose,
  ref,
  shallowRef,
  useAttrs,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { isPresetColor } from '../_internal/preset-color';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import type { BadgeProps, BadgeSemanticClassNames, BadgeSemanticStyles } from './interface';
import ScrollNumber from './ScrollNumber';
import { useBadgeTheme } from './use-badge-theme';

defineOptions({ name: 'ApolloBadgeIndicator', inheritAttrs: false });

const props = withDefaults(
  defineProps<BadgeProps & { customCount?: boolean; hasWrapper?: boolean }>(),
  {
    prefixCls: undefined,
    scrollNumberPrefixCls: undefined,
    count: null,
    overflowCount: 99,
    dot: false,
    showZero: false,
    status: undefined,
    color: undefined,
    text: undefined,
    size: 'medium',
    title: undefined,
    offset: undefined,
    classNames: undefined,
    styles: undefined,
  },
);

const attrs = useAttrs();

const warning = useDevWarning('Badge');
warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');

const context = useComponentConfig<BadgeProps & ComponentStyleConfig>('badge');

const prefixCls = computed(() => context.getPrefixCls('badge', props.prefixCls));
const scrollNumberPrefixCls = computed(() =>
  context.getPrefixCls('scroll-number', props.scrollNumberPrefixCls),
);
const themeStyle = useBadgeTheme(() => prefixCls.value);
const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });
const reducedMotion = ref(false);
let media: MediaQueryList | undefined;
const updateMotion = () => {
  reducedMotion.value = media?.matches ?? false;
};
onMounted(() => {
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  updateMotion();
  media?.addEventListener('change', updateMotion);
});
onScopeDispose(() => media?.removeEventListener('change', updateMotion));

// ---------------------------------------------------------------------------
// Numeric visibility, status and independent text have separate ownership.
// ---------------------------------------------------------------------------

const numberedDisplayCount = computed<VNodeChild>(() => {
  const count = props.count;
  // `count > overflowCount` 只对数字有意义；字符串/VNode 不触发封顶
  return isNumber(count) && count > props.overflowCount ? `${props.overflowCount}+` : count;
});

const isZero = computed(
  () =>
    !props.customCount && (numberedDisplayCount.value === '0' || numberedDisplayCount.value === 0),
);
const ignoreCount = computed(() => isEmptyVNode(props.count) || (isZero.value && !props.showZero));
const showStatusTextNode = computed(
  () => !isEmptyVNode(props.text) && (props.text !== 0 || props.showZero),
);
const hasStatus = computed(
  () => (isNonNullable(props.status) || isNonNullable(props.color)) && ignoreCount.value,
);
const hasStatusValue = computed(() => isNonNullable(props.status) || !isZero.value);
const isStatusBadge = computed(
  () =>
    !!(
      !props.hasWrapper &&
      hasStatus.value &&
      (showStatusTextNode.value || hasStatusValue.value || !ignoreCount.value)
    ),
);

// ---------------------------------------------------------------------------
// offset 样式（数字补 px —— Vue patchStyle 不转换）
// ---------------------------------------------------------------------------

const offsetStyle = computed<CSSProperties | undefined>(() => {
  if (!props.offset) return undefined;
  const [x, y] = props.offset;
  const horizontal =
    typeof x === 'number' || /^[-+]?\d*\.?\d+$/.test(x.trim())
      ? `${-Number(x)}px`
      : `calc(-1 * ${x})`;
  return {
    marginTop: typeof y === 'number' ? `${y}px` : y,
    insetInlineEnd: horizontal,
  };
});

// ---------------------------------------------------------------------------
// 语义槽位合并（root / indicator）
// ---------------------------------------------------------------------------

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  BadgeProps,
  BadgeSemanticClassNames,
  BadgeSemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    // antd 的 useSemanticRootStyle：style prop 按 isStatusBadge 归入 root 或 indicator
    () => semanticRootStyle(context.style, isStatusBadge.value ? 'root' : 'indicator'),
    () => props.styles,
  ],
  props,
);

// ---------------------------------------------------------------------------
// 隐藏与三组缓存
// ---------------------------------------------------------------------------

const showAsDot = computed(() => props.dot);
const mergedCount = computed(() => (showAsDot.value ? '' : numberedDisplayCount.value));

const isHidden = computed(
  () => !showAsDot.value && (isEmptyVNode(mergedCount.value) || (isZero.value && !props.showZero)),
);
const richCount = computed(
  () =>
    !showAsDot.value &&
    (props.customCount || isVNode(mergedCount.value) || Array.isArray(mergedCount.value)),
);

// Count should be cache in case hidden change it（antd 原注释）——离场动画期间保持旧值
// shallowRef：缓存的是「展示用的旧值」，不需要深层响应式（VNode 深代理也会炸类型实例化）
const livingCount = shallowRef(props.count);
const displayCount = shallowRef(mergedCount.value);
const isDotCache = shallowRef(showAsDot.value);
const customCountCache = shallowRef(richCount.value);
watchEffect(() => {
  if (!isHidden.value) {
    livingCount.value = props.count;
    displayCount.value = mergedCount.value;
    isDotCache.value = showAsDot.value;
    customCountCache.value = richCount.value;
  }
});

// ---------------------------------------------------------------------------
// 渲染产物
// ---------------------------------------------------------------------------

// >>> Title（title=null/false 显式禁用；不传回落 count）
const titleNode = computed<string | undefined>(() => {
  if (props.title === null || props.title === false) return undefined;
  const count = isStatusBadge.value ? props.count : livingCount.value;
  const fallback = isString(count) || isNumber(count) ? String(count) : undefined;
  return props.title ?? fallback;
});

const isInternalColor = computed(() => isPresetColor(props.color, false));

/** 共享的指示器类（状态点 / ScrollNumber 两侧同构，Badge.js 的 statusCls）。 */
const indicatorExtraClass = computed(() => {
  const cls = prefixCls.value;
  return {
    [`${cls}-status-dot`]: hasStatus.value,
    [`${cls}-status-${props.status}`]: !!props.status,
    [`${cls}-color-${props.color}`]: isInternalColor.value,
  };
});

const statusStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.color && !isInternalColor.value) {
    style.color = props.color;
    style.background = props.color;
  }
  return style;
});

const indicatorStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    ...offsetStyle.value,
    ...mergedStyles.value.indicator,
    ...(props.color && !isInternalColor.value ? { background: props.color } : {}),
  };
  const background = style.background ?? style.backgroundColor;
  if (typeof background === 'string')
    style[`--${prefixCls.value}-indicator-background`] = background;
  return style;
});

const badgeClassName = computed(() => {
  const cls = prefixCls.value;
  return [
    cls,
    {
      [`${cls}-status`]: hasStatus.value,
      [`${cls}-not-a-wrapper`]: !props.hasWrapper,
      [`${cls}-rtl`]: context.direction === 'rtl',
    },
    context.className,
    mergedClassNames.value.root,
  ];
});

// 根 `class` / `style` 是 Vue 原生 attrs（`class` 经此透传到根 span）。
function rootAttrs() {
  return mergeProps(
    {
      dir: context.direction,
      style: [
        themeStyle.value,
        isStatusBadge.value ? offsetStyle.value : undefined,
        mergedStyles.value.root,
      ],
    },
    attrs,
  );
}
</script>

<template>
  <span ref="rootRef" v-bind="rootAttrs()" :class="badgeClassName">
    <template v-if="isStatusBadge">
    <span
      :class="[mergedClassNames.indicator, indicatorExtraClass]"
      v-bind="styleAttrs({ ...mergedStyles.indicator, ...statusStyle })"
      :title="titleNode"
    />
    <span
      v-if="showStatusTextNode"
      :class="`${prefixCls}-status-text`"
      :style="mergedStyles.root?.color ? { color: mergedStyles.root.color } : undefined"
    >
      <NodeRenderer :node="text" />
    </span>
    </template>
    <template v-else>
    <slot />
    <CSSMotion :visible="!isHidden" :motion-name="`${prefixCls}-zoom`" :motion-appear="false" :motion-deadline="1000" :support-motion="reducedMotion ? false : undefined">
      <template #default="{ className: motionClassName }">
        <sup
          v-if="customCountCache"
          :data-show="!isHidden"
          :class="[scrollNumberPrefixCls, `${scrollNumberPrefixCls}-custom-component`, mergedClassNames.indicator, indicatorExtraClass, `${prefixCls}-count`, { [`${prefixCls}-count-sm`]: size === 'small' }, motionClassName]"
          :title="titleNode"
          :style="indicatorStyle"
        ><NodeRenderer :node="displayCount" /></sup>
        <ScrollNumber
          v-else
          :prefix-cls="scrollNumberPrefixCls"
          :show="!isHidden"
          :motion-class-name="motionClassName"
          :class-name="[mergedClassNames.indicator, indicatorExtraClass, { [`${prefixCls}-dot`]: isDotCache, [`${prefixCls}-count`]: !isDotCache, [`${prefixCls}-count-sm`]: size === 'small', [`${prefixCls}-multiple-words`]: !isDotCache && displayCount && String(displayCount).length > 1 }]"
          :count="displayCount"
          :title="titleNode"
          :style="indicatorStyle"
        />
      </template>
    </CSSMotion>
    <span v-if="showStatusTextNode" :class="`${prefixCls}-status-text`">
      <NodeRenderer :node="text" />
    </span>
    </template>
  </span>
</template>
