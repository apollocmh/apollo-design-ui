<script setup lang="ts">
/**
 * Badge —— 徽标数。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/Badge.js`。类名、判据、合并顺序逐条对齐，
 * 有意差异登记在 `packages/ui/src/badge/README.md`。
 *
 * ── 六条最容易写错的判据（docs/analysis/badge.md §2）─────────────────────────
 *
 *   1. **isZero**：`displayCount === '0' || displayCount === 0 || text === '0' || text === 0`
 *      （值与串都算；text 的 '0' 串也算）。
 *   2. **ignoreCount = count === null || (isZero && !showZero)** —— count 未传
 *      （null）即「忽略 count」，是状态点模式的前置条件（hasStatus）。
 *   3. **isStatusBadge**（独立渲染分支）：`!children && hasStatus && (text || hasStatusValue || !ignoreCount)`。
 *      该分支根元素与状态点分离渲染，状态文本颜色取 `styles.root.color`。
 *   4. **三组 ref 缓存**（livingCount / displayCount / isDot）：隐藏（离场动画）
 *      期间保持上一次的显示值 —— motion 撤场不闪变。
 *   5. **offset 的 px 补全**：`insetInlineEnd: -parseInt(offset[0])`（React 输出
 *      `-8px`）、`marginTop: offset[1]` 数字补 px —— Vue patchStyle 不转换（清单 #1）。
 *   6. **CSSMotion**：`motionName: ${prefixCls}-zoom`、`motionAppear: false`（挂载
 *      不动画）、`motionDeadline: 1000`；wrapper 与 not-a-wrapper 各有一组 zoom keyframes。
 */

import { CSSMotion } from '@apollo-design/motion';
import {
  isNonNullable,
  isNumber,
  isRenderable,
  isString,
  useDevWarning,
} from '@apollo-design/utils';
import {
  type CSSProperties,
  cloneVNode,
  computed,
  ref,
  shallowRef,
  useAttrs,
  useSlots,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { isPresetColor } from '../_internal/preset-color';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { BadgeProps, BadgeSemanticClassNames, BadgeSemanticStyles } from './interface';
import ScrollNumber from './ScrollNumber';

defineOptions({ name: 'ABadge', inheritAttrs: false });

const props = withDefaults(defineProps<BadgeProps>(), {
  prefixCls: undefined,
  scrollNumberPrefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
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
});

const slots = useSlots();
const attrs = useAttrs();

const warning = useDevWarning('Badge');
warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');

const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<Record<string, never>>('badge');

const prefixCls = computed(() => getPrefixCls('badge', props.prefixCls));
const scrollNumberPrefixCls = computed(() =>
  getPrefixCls('scroll-number', props.scrollNumberPrefixCls),
);

// ---------------------------------------------------------------------------
// 判据链（顺序即契约，Badge.js 原样）
// ---------------------------------------------------------------------------

const numberedDisplayCount = computed<VNodeChild>(() => {
  const count = props.count;
  // `count > overflowCount` 只对数字有意义；字符串/VNode 不触发封顶
  return isNumber(count) && count > props.overflowCount ? `${props.overflowCount}+` : count;
});

const isZero = computed(
  () =>
    numberedDisplayCount.value === '0' ||
    numberedDisplayCount.value === 0 ||
    props.text === '0' ||
    props.text === 0,
);
const ignoreCount = computed(() => props.count === null || (isZero.value && !props.showZero));
const hasStatus = computed(
  () => (isNonNullable(props.status) || isNonNullable(props.color)) && ignoreCount.value,
);
const hasStatusValue = computed(() => isNonNullable(props.status) || !isZero.value);
const isStatusBadge = computed(
  () =>
    !!(
      !slots.default &&
      hasStatus.value &&
      (props.text || hasStatusValue.value || !ignoreCount.value)
    ),
);

// ---------------------------------------------------------------------------
// offset 样式（数字补 px —— Vue patchStyle 不转换）
// ---------------------------------------------------------------------------

const offsetStyle = computed<CSSProperties | undefined>(() => {
  if (!props.offset) return undefined;
  const [x, y] = props.offset;
  const horizontal = Number.parseInt(String(x), 10);
  return {
    marginTop: typeof y === 'number' ? `${y}px` : y,
    insetInlineEnd: `${-horizontal}px`,
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
  [() => contextClassNames, () => props.classNames],
  [
    () => contextStyles,
    // antd 的 useSemanticRootStyle：style prop 按 isStatusBadge 归入 root 或 indicator
    () => semanticRootStyle(contextStyle, isStatusBadge.value ? 'root' : 'indicator'),
    () => props.styles,
    () => semanticRootStyle(props.style, isStatusBadge.value ? 'root' : 'indicator'),
  ],
  props,
);

// ---------------------------------------------------------------------------
// 隐藏与三组缓存
// ---------------------------------------------------------------------------

const showAsDot = computed(() => props.dot && !isZero.value);
const mergedCount = computed(() => (showAsDot.value ? '' : numberedDisplayCount.value));

const isHidden = computed(() => {
  const isEmpty = !isRenderable(mergedCount.value) && !isRenderable(props.text);
  return (isEmpty || (isZero.value && !props.showZero)) && !showAsDot.value;
});

// Count should be cache in case hidden change it（antd 原注释）——离场动画期间保持旧值
// shallowRef：缓存的是「展示用的旧值」，不需要深层响应式（VNode 深代理也会炸类型实例化）
const livingCount = shallowRef(props.count);
const displayCount = shallowRef(mergedCount.value);
const isDotCache = shallowRef(showAsDot.value);
watchEffect(() => {
  if (!isHidden.value) {
    livingCount.value = props.count;
    displayCount.value = mergedCount.value;
    isDotCache.value = showAsDot.value;
  }
});

// ---------------------------------------------------------------------------
// 渲染产物
// ---------------------------------------------------------------------------

// >>> Title（title=null/false 显式禁用；不传回落 count）
const titleNode = computed<string | undefined>(() => {
  if (props.title === null || props.title === false) return undefined;
  const fallback =
    isString(livingCount.value) || isNumber(livingCount.value)
      ? String(livingCount.value)
      : undefined;
  return (props.title ?? fallback) as string | undefined;
});

// >>> Status Text（text === 0 受 showZero 控制；text === true 不渲染 —— antd 原样）
const showStatusTextNode = computed(
  () =>
    !isHidden.value && (props.text === 0 ? props.showZero : !!props.text && props.text !== true),
);

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

const badgeClassName = computed(() => {
  const cls = prefixCls.value;
  return [
    cls,
    {
      [`${cls}-status`]: hasStatus.value,
      [`${cls}-not-a-wrapper`]: !slots.default,
      [`${cls}-rtl`]: direction === 'rtl',
    },
    props.className,
    props.rootClassName,
    contextClassName,
    mergedClassNames.value.root,
  ];
});

const rootAttrs = computed(() => ({ ...attrs }));

// count 为 VNode 时（antd 的 displayNode）：合并 offset/indicator 样式后传给 ScrollNumber。
// ⚠️ 必须 cloneVNode 而不是 h(vnode, ...) —— h() 的第一参数是组件/标签**类型**，
// 把 VNode 当 type 造出的 vnode 会静默破坏 CSSMotion 的子树 patch（2026-09-22 实测）。
const displayNode = computed<VNode | undefined>(() => {
  const count = livingCount.value;
  if (count && typeof count === 'object' && '__v_isVNode' in (count as VNode)) {
    return cloneVNode(count as VNode, {
      style: { ...offsetStyle.value, ...mergedStyles.value.indicator },
    });
  }
  return undefined;
});
</script>

<template>
  <span v-if="isStatusBadge" v-bind="{ ...rootAttrs, ...styleAttrs({ ...offsetStyle, ...mergedStyles.root }) }" :class="badgeClassName">
    <span
      :class="[mergedClassNames.indicator, indicatorExtraClass]"
      v-bind="styleAttrs({ ...mergedStyles.indicator, ...statusStyle })"
    />
    <span
      v-if="showStatusTextNode"
      :class="`${prefixCls}-status-text`"
      :style="mergedStyles.root?.color ? { color: mergedStyles.root.color } : undefined"
    >
      <component :is="typeof text === 'object' ? text : undefined" v-if="typeof text === 'object'" />
      <template v-else>{{ text }}</template>
    </span>
  </span>

  <span v-else v-bind="{ ...rootAttrs, ...styleAttrs(mergedStyles.root) }" :class="badgeClassName">
    <slot />
    <CSSMotion :visible="!isHidden" :motion-name="`${prefixCls}-zoom`" :motion-appear="false" :motion-deadline="1000">
      <template #default="{ className: motionClassName }">
        <ScrollNumber
          :prefix-cls="scrollNumberPrefixCls"
          :show="!isHidden"
          :motion-class-name="motionClassName"
          :class-name="[mergedClassNames.indicator, indicatorExtraClass, { [`${prefixCls}-dot`]: isDotCache, [`${prefixCls}-count`]: !isDotCache, [`${prefixCls}-count-sm`]: size === 'small', [`${prefixCls}-multiple-words`]: !isDotCache && displayCount && String(displayCount).length > 1 }]"
          :count="displayCount"
          :title="titleNode"
          :style="{ ...offsetStyle, ...mergedStyles.indicator, ...(color && !isInternalColor ? { background: color } : {}) }"
        >
          <component :is="displayNode" v-if="displayNode" />
        </ScrollNumber>
      </template>
    </CSSMotion>
    <span v-if="showStatusTextNode" :class="`${prefixCls}-status-text`">
      <component :is="typeof text === 'object' ? text : undefined" v-if="typeof text === 'object'" />
      <template v-else>{{ text }}</template>
    </span>
  </span>
</template>
