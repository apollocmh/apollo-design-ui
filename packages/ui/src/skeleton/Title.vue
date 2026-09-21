<script setup lang="ts">
/**
 * Title —— 骨架屏的标题块。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Title.js`（全文只有 12 行）。
 *
 * 两条判据：
 *   1. 标签是 `<h3>`（不是 `<div>`）—— 这是 DOM 契约的一部分，不是随意选的。
 *   2. 内联样式的展开顺序是 `{width, ...style}` —— **`style.width` 覆盖 `width` prop**。
 *      antd 的 `style` 来自 `mergedStyles.title`（语义化合并的结果），所以
 *      「`styles.title.width` 能压过 `title={{ width }}`」是有意的。
 *
 * ⚠️ `width` 为 `undefined` 时**不输出** `style` 属性（`styleAttrs` 的作用）——
 *    SSR 下 `ssrRenderAttrs` 对 `style` 键是无条件输出的，不处理会多出 `style=""`。
 */

import { type CSSProperties, computed } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { SkeletonTitleProps } from './interface';
import { toCssLength } from './styleLength';

defineOptions({ name: 'ASkeletonTitle', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonTitleProps>(), {
  prefixCls: undefined,
  className: undefined,
  style: undefined,
  width: undefined,
});

/**
 * `width` 先过 `toCssLength`（React 的 `dangerousStyleValue`：`100` → `100px`、
 * `0` → `0`、`''` → 整条不输出），再让 `style` 覆盖它。
 *
 * ⚠️ 展开顺序是 `{width, ...style}` —— `style.width` **覆盖** `width` prop。
 *    这里的 `style` 来自 `mergedStyles.title`（语义化合并结果），所以
 *    「`styles.title.width` 压过 `title={{ width }}`」是有意的。
 */
const mergedStyle = computed<CSSProperties>(() => ({
  width: toCssLength(props.width),
  ...props.style,
}));
</script>

<template>
  <h3 :class="[prefixCls, className]" v-bind="styleAttrs(mergedStyle)" />
</template>
