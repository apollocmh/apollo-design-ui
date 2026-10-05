<script setup lang="ts">
/**
 * Ribbon —— 缎带徽标（Badge.Ribbon）。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/Ribbon.js`（逐条对齐）。
 *
 * ── 判据 ─────────────────────────────────────────────────────────────────────
 *
 *   1. **预设色走类名**（`-color-{key}`：CSS 同时设 background 与 color ——
 *      color 给 corner 三角消费）；**自定义色走内联**（本体 background +
 *      corner 的 color，corner 经 `filter: brightness(75%)` 变暗）。
 *   2. **nativeElement 指向 wrapper**（外层 div），不是丝带本体。
 *   3. 结构：wrapper > children + ribbon > (content, corner)。
 */

import { computed, mergeProps, ref, useAttrs, useSlots } from 'vue';
import { isPresetColor } from '../_internal/preset-color';
import { styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { RibbonProps, RibbonSemanticClassNames, RibbonSemanticStyles } from './interface';

defineOptions({ name: 'ARibbon', inheritAttrs: false });

const props = withDefaults(defineProps<RibbonProps>(), {
  prefixCls: undefined,
  className: undefined,
  style: undefined,
  color: undefined,
  text: undefined,
  placement: 'end',
  classNames: undefined,
  styles: undefined,
});

const slots = useSlots();
const attrs = useAttrs();

const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  classNames: contextClassNames,
  styles: contextStyles,
} = useComponentConfig<Record<string, never>>('ribbon');

const prefixCls = computed(() => getPrefixCls('ribbon', props.prefixCls));
const wrapperCls = computed(() => `${prefixCls.value}-wrapper`);

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  RibbonProps,
  RibbonSemanticClassNames,
  RibbonSemanticStyles
>(
  [() => contextClassNames, () => props.classNames],
  [
    () => contextStyles,
    // antd 的 useSemanticRootStyle(contextStyle, 'indicator')：contextStyle 归 indicator
    () => (contextStyle ? { indicator: contextStyle } : undefined),
    () => props.styles,
    () => (props.style ? { indicator: props.style } : undefined),
  ],
  props,
);

const colorInPreset = computed(() => isPresetColor(props.color, false));

const ribbonClass = computed(() => {
  const cls = prefixCls.value;
  return [
    cls,
    `${cls}-placement-${props.placement}`,
    {
      [`${cls}-rtl`]: direction === 'rtl',
      [`${cls}-color-${props.color}`]: colorInPreset.value,
    },
    props.className,
    contextClassName,
    mergedClassNames.value.indicator,
  ];
});

const colorStyle = computed(() =>
  props.color && !colorInPreset.value ? { background: props.color } : undefined,
);
const cornerColorStyle = computed(() =>
  props.color && !colorInPreset.value ? { color: props.color } : undefined,
);

const rootClass = computed(() => [wrapperCls.value, mergedClassNames.value.root]);

// 包裹层根属性：语义根样式 + 调用方原生 attrs（`class` / `style` 等）。
const rootAttrs = computed(() => mergeProps(styleAttrs(mergedStyles.value.root), attrs));

const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <slot />
    <div :class="ribbonClass" v-bind="styleAttrs({ ...colorStyle, ...mergedStyles.indicator })">
      <span :class="[`${prefixCls}-content`, mergedClassNames.content]" v-bind="styleAttrs(mergedStyles.content)">
        <component :is="typeof text === 'object' ? text : undefined" v-if="typeof text === 'object' && text !== null" />
        <template v-else>{{ text }}</template>
      </span>
      <div :class="`${prefixCls}-corner`" :style="cornerColorStyle" />
    </div>
  </div>
</template>
