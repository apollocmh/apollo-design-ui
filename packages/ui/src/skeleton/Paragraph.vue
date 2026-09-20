<script setup lang="ts">
/**
 * Paragraph —— 骨架屏的段落块（`<ul>` + 每行一个 `<li>`）。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Paragraph.js`。
 *
 * ── 两条必须逐字保留的判据 ───────────────────────────────────────────────────
 *
 * 1. **标签是 `<ul>` / `<li>`**（不是 `<div>`）—— DOM 契约的一部分。
 * 2. **`getWidth(index)` 的取值规则**（见下）—— 单值 `width` 只作用在**最后一行**。
 *
 * ── `getWidth` 里那个「两个不同默认值」的陷阱 ─────────────────────────────────
 *
 * antd 的写法是：
 *
 * ```js
 * const getWidth = (index, props) => {
 *   const { width, rows = 2 } = props;   // ← 这里默认 2
 *   ...
 * };
 * const Paragraph = props => {
 *   const { prefixCls, className, style, rows = 0 } = props;  // ← 这里默认 0
 *   ...
 * };
 * ```
 *
 * 同一个 `rows` 在**两个函数里默认值不同**（2 / 0）。这不是笔误 —— 它决定了
 * 「只传 `width` 不传 `rows`」时的行为：渲染 0 行（组件侧），`getWidth` 的默认值
 * 根本走不到。我们逐字复刻：渲染用 `props.rows ?? 0`，取值用 `props.rows ?? 2`。
 *
 * ⚠️ 所以 `withDefaults` 里**不能**给 `rows` 声明 `0` —— 那会让 `?? 2` 永远不生效，
 *    与上游在「`rows` 为 `undefined` 但 `width` 是数组」这类输入上分叉。
 *
 * ── `width` 的两种形态 ──────────────────────────────────────────────────────
 *
 *   - **数组**：第 `index` 行的宽度；**不看 `rows`** —— 比 `rows` 短时后几行
 *     `undefined`（退回 CSS 的 `width:100%`），比 `rows` 长时多出的项被忽略。
 *   - **单值**：只有最后一行（`rows - 1 === index`）用它，其余行 `undefined`。
 *     实测上游产物：`rows=2, width=120` → `<li></li><li style="width:120px"></li>`。
 */

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
const rowIndexes = computed(() => Array.from({ length: props.rows ?? 0 }, (_, index) => index));

/**
 * 第 `index` 行的宽度。逐字对应 antd 的 `getWidth(index, props)`。
 *
 * ⚠️ 非数组分支里 `rows` 的默认值是 **2**（不是组件的 0），见文件头。
 */
const getWidth = (index: number): SkeletonWidthUnit | undefined => {
  if (Array.isArray(props.width)) return props.width[index];
  if ((props.rows ?? 2) - 1 === index) return props.width;
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
