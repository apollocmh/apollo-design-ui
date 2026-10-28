<script setup lang="ts">
/** Ribbon wrapper owns native attrs and its current element reference.
 * Text is complete Vue content; indicator/content semantics remain separate.
 * The original corner geometry reference is antd 6.6.4 es/badge/Ribbon.js.
 */

import { type CSSProperties, computed, mergeProps, ref, useAttrs } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { isPresetColor } from '../_internal/preset-color';
import { styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import type {
  RibbonProps,
  RibbonSemanticClassNames,
  RibbonSemanticStyles,
  RibbonSlots,
} from './interface';
import { useBadgeTheme } from './use-badge-theme';

defineOptions({ name: 'ARibbon', inheritAttrs: false });

const props = withDefaults(defineProps<RibbonProps>(), {
  prefixCls: undefined,
  className: undefined,
  color: undefined,
  text: undefined,
  placement: 'end',
  classNames: undefined,
  styles: undefined,
});

defineSlots<RibbonSlots>();
const attrs = useAttrs();

const context = useComponentConfig<RibbonProps & ComponentStyleConfig>('ribbon');

const prefixCls = computed(() => context.getPrefixCls('ribbon', props.prefixCls));
const wrapperCls = computed(() => `${prefixCls.value}-wrapper`);
const themeStyle = useBadgeTheme(() => context.getPrefixCls('badge'), false);

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  RibbonProps,
  RibbonSemanticClassNames,
  RibbonSemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    // antd 的 useSemanticRootStyle(contextStyle, 'indicator')：contextStyle 归 indicator
    () => (context.style ? { indicator: context.style } : undefined),
    () => props.styles,
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
      [`${cls}-rtl`]: context.direction === 'rtl',
      [`${cls}-color-${props.color}`]: colorInPreset.value,
    },
    props.className,
    context.className,
    mergedClassNames.value.indicator,
  ];
});

const colorStyle = computed(() => {
  const style: CSSProperties = {
    ...(props.color && !colorInPreset.value ? { background: props.color } : {}),
    ...mergedStyles.value.indicator,
  };
  const background = style.background ?? style.backgroundColor;
  return typeof background === 'string'
    ? { ...style, [`--${prefixCls.value}-background`]: background }
    : style;
});
const cornerColorStyle = computed(() =>
  props.color && !colorInPreset.value ? { color: props.color } : undefined,
);

const rootClass = computed(() => [wrapperCls.value, mergedClassNames.value.root]);

// 包裹层根属性：语义根样式 + 调用方原生 attrs（`class` / `style` 等）。
function rootAttrs() {
  return mergeProps(
    { dir: context.direction, style: [themeStyle.value, mergedStyles.value.root] },
    attrs,
  );
}

const rootRef = ref<HTMLElement | null>(null);
defineExpose({
  get nativeElement() {
    return rootRef.value;
  },
});
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs()">
    <slot />
    <div :class="ribbonClass" v-bind="styleAttrs(colorStyle)">
      <span :class="[`${prefixCls}-content`, mergedClassNames.content]" v-bind="styleAttrs(mergedStyles.content)">
        <NodeRenderer :node="$slots.text ? $slots.text() : text" />
      </span>
      <div :class="`${prefixCls}-corner`" :style="cornerColorStyle" />
    </div>
  </div>
</template>
