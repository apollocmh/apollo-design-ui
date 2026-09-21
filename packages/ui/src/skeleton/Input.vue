<script setup lang="ts">
/**
 * Input —— `Skeleton.Input`，输入框占位。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Input.js`。
 *
 * ── 结构 ──────────────────────────────────────────────────────────────────────
 *
 * ```html
 * <div class="{prefixCls} {prefixCls}-element [-active] [-block] [classNames.root] [className] [rootClassName]"
 *      style="[styles.root]">
 *   <span class="{prefixCls}-input [-lg|-sm] [classNames.content]"
 *         style="[styles.content 与 style 的合并]"></span>
 * </div>
 * ```
 *
 * ── 与 `Skeleton.Button` 的**唯一**结构差异 ────────────────────────────────────
 *
 *   1. 内层类名是 `-input` 而不是 `-button`；
 *   2. `block` **没有默认值**（Button 是 `block = false`）—— 两者都是 falsy，
 *      所以可观测行为一致，但类型面不同（逐字对齐上游的 `Input.d.ts` / `Button.d.ts`）。
 *
 * 其余判据（`-block` 落外层、不给 `shape`、`useSize(ctx => size ?? ctx)`、
 * 多余属性不透传）与 `Button.vue` 完全相同，理由见那个文件的文件头。
 */

import { computed } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonInputProps } from './interface';

defineOptions({ name: 'ASkeletonInput', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonInputProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  size: undefined,
  // ⚠️ 上游**没有**给默认值（`Input.js:17` 只解构 `block`）—— 逐字对齐，
  //    不要「顺手」写成 `false`：那会让 `Input.d.ts` 与 `Button.d.ts` 的差异消失。
  block: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});

const { getPrefixCls } = useConfigContext();

const prefixCls = computed(() => getPrefixCls('skeleton', props.prefixCls));

const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

const rootClass = computed(() => [
  prefixCls.value,
  `${prefixCls.value}-element`,
  {
    [`${prefixCls.value}-active`]: props.active,
    [`${prefixCls.value}-block`]: props.block,
  },
  props.classNames?.root,
  props.className,
  props.rootClassName,
]);

const elementCls = computed(() => `${prefixCls.value}-input`);

/** 内层样式：`styles.content` 在前、`style` 在后（`style` 覆盖）。 */
const contentStyle = computed(() => ({ ...props.styles?.content, ...props.style }));
</script>

<template>
  <div :class="rootClass" v-bind="styleAttrs(props.styles?.root)">
    <Element
      :prefix-cls="elementCls"
      :class-name="props.classNames?.content"
      :style="contentStyle"
      :size="mergedSize"
    />
  </div>
</template>
