<script setup lang="ts">
/**
 * Button —— `Skeleton.Button`，按钮占位。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Button.js`。
 *
 * ── 结构 ──────────────────────────────────────────────────────────────────────
 *
 * ```html
 * <div class="{prefixCls} {prefixCls}-element [-active] [-block] [classNames.root] [className] [rootClassName]"
 *      style="[styles.root]">
 *   <span class="{prefixCls}-button [-lg|-sm] [classNames.content]"
 *         style="[styles.content 与 style 的合并]"></span>
 * </div>
 * ```
 *
 * ── 三条必须逐字保留的判据 ───────────────────────────────────────────────────
 *
 * 1. **`-block` 类名落在外层 `<div>` 上**（不是内层 span），与 `-active` 同级。
 * 2. **不传 `shape`**：`Element` 的 `shape` 默认 `undefined` ⇒ 一个形状类名都不产生。
 *    （`Skeleton.Avatar` 才给 `'circle'` 默认值。）
 * 2b. 🚨 **`shape` 必须透传给 `Element`**（antd `Button.tsx:56` 的 `{...rest}`）——
 *     漏传会让 `Skeleton.Button shape="circle" / "round"` 少一个形状类名
 *     （dom-probe 全变体扫描 skeleton/element 抓出；像素上看不出来）。
 *     `Skeleton.Input` **没有**这个字段（上游 `Omit<..., 'size' | 'shape'>`）。
 * 3. **`size` 走 `useSize(ctx => size ?? ctx)`**（理由见 `Avatar.vue` 的第 2 条）。
 *    这里 `size` 的类型是 `SizeType | 'default'`（**不含数字**）——
 *    `SkeletonElementProps` 的 `number` 被 `Omit` 掉了，逐字对齐上游 `Button.d.ts`。
 *
 * ── 与 antd 的平台差异 ────────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 *   - 多余属性**不透传**（同 `Avatar.vue`，实测上游会丢掉 `data-testid`）。
 */

import { computed, useAttrs } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonButtonProps } from './interface';

defineOptions({ name: 'ASkeletonButton', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonButtonProps>(), {
  prefixCls: undefined,
  className: undefined,
  style: undefined,
  size: undefined,
  // antd 的默认值是字面量 `false`（`Button.js:23`）—— 逐字对齐。
  block: false,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});

const { getPrefixCls } = useConfigContext();

const attrs = useAttrs();
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
  // 调用方原生 class（替代上游的 rootClassName）
  attrs.class,
]);

const elementCls = computed(() => `${prefixCls.value}-button`);

/** 内层样式：`styles.content` 在前、`style` 在后（`style` 覆盖）。 */
const contentStyle = computed(() => ({ ...props.styles?.content, ...props.style }));
</script>

<template>
  <div :class="rootClass" v-bind="styleAttrs(props.styles?.root)">
    <Element
      :prefix-cls="elementCls"
      :class-name="props.classNames?.content"
      :style="contentStyle"
      :shape="props.shape"
      :size="mergedSize"
    />
  </div>
</template>
