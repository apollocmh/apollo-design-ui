<script setup lang="ts">
/** Decorative paragraph geometry with finite row counts. */

import { computed } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { SkeletonParagraphProps, SkeletonWidthUnit } from './interface';
import { toCssLength } from './styleLength';

defineOptions({ name: 'ASkeletonParagraph', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonParagraphProps>(), {
  prefixCls: undefined,
  className: undefined,
  style: undefined,
  width: undefined,
  // ⚠️ 保持 `undefined`（不要写 0）—— 理由见文件头。
  rows: undefined,
});

/**
 * 行下标列表。`Array.from({length: n})` 与 antd **逐字同构**，因此
 * `undefined` / `NaN` / 负数都得到空数组、小数被 `ToLength` 截断 —— 两侧一致。
 */
const rowCount = computed(() =>
  typeof props.rows === 'number' && Number.isFinite(props.rows)
    ? Math.max(0, Math.trunc(props.rows))
    : 0,
);
const rowIndexes = computed(() => Array.from({ length: rowCount.value }, (_, index) => index));

/**
 * 第 `index` 行的宽度。逐字对应 antd 的 `getWidth(index, props)`。
 *
 * ⚠️ 非数组分支里 `rows` 的默认值是 **2**（不是组件的 0），见文件头。
 */
const getWidth = (index: number): SkeletonWidthUnit | undefined => {
  if (Array.isArray(props.width)) return props.width[index];
  if (rowCount.value - 1 === index) return props.width;
  return undefined;
};

/**
 * 每行 `<li>` 的属性。
 *
 * ⚠️ 走 `styleAttrs`：`width` 为 `undefined` 时**整条 `style` 属性都不输出**
 *    （实测 React 对「值为空串 / undefined」的声明同样不输出）。
 */
const rowAttrs = (index: number) => styleAttrs({ width: toCssLength(getWidth(index)) });
</script>

<template>
  <ul :class="[prefixCls, className]" v-bind="styleAttrs(props.style)">
    <li v-for="index in rowIndexes" :key="index" v-bind="rowAttrs(index)" />
  </ul>
</template>
