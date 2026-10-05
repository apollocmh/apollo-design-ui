<script setup lang="ts">
/**
 * Row —— 栅格行。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/row.js`。类名、判据、gutter 规则逐条对齐，
 * 有意差异登记在 `packages/ui/src/grid/README.md`。
 *
 * ── 四条最容易写错的判据（docs/analysis/grid.md §2）──────────────────────────
 *
 *   1. **justify/align 的响应式合并**：对象按 responsiveArray 从大到小找第一个
 *      `screens[bp] && value !== undefined`；jsdom/SSR（screens=null）→ 空串（无类名）。
 *   2. **gutter 的负 margin**：Row 拿 `-g/2`（数字补 px），Col 拿 `+g/2` ——
 *      两半拼回一个 gutter。字符串走 `calc(x / -2)`。
 *   3. **rowGap 数字必须补 px**（Vue patchStyle 不做转换，PITFALLS 32）。
 *   4. **wrap 判据是 `=== false`**：未传（undefined）与显式 false 是两条分支 ——
 *      `withDefaults` 必须给 `wrap: undefined`（D21）。
 */

import { isNumber } from '@apollo-design/utils';
import { type CSSProperties, computed, ref, useAttrs } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import useBreakpoint from './hooks/use-breakpoint';
import useGutter from './hooks/use-gutter';
import type { RowConfig, RowProps } from './interface';
import { provideRowContext } from './RowContext';
import { getMergedPropByScreen } from './utils';

defineOptions({ name: 'ARow', inheritAttrs: false });

const props = withDefaults(defineProps<RowProps>(), {
  prefixCls: undefined,
  gutter: 0,
  justify: undefined,
  align: undefined,
  wrap: undefined,
});

// antd 的 Row 只读 getPrefixCls / direction（ConfigContext 直取，无组件级 className/style）
const { getPrefixCls, direction } = useComponentConfig<RowConfig>('row');

const attrs = useAttrs();

const prefixCls = computed(() => getPrefixCls('row', props.prefixCls));

// antd: useBreakpoint(true, null) —— subscribe 会立即回调写入初值，
// ref 的 null 初始值只存在于「subscribe 前」的同步瞬间。
const screens = useBreakpoint(true, null);

const mergedJustify = computed(() => getMergedPropByScreen(props.justify, screens.value));
const mergedAlign = computed(() => getMergedPropByScreen(props.align, screens.value));

// ---------------------------------------------------------------------------
// 类名。顺序逐字来自 antd：prefixCls → 条件类 → className。
// ---------------------------------------------------------------------------

const rootClass = computed(() => {
  const cls = prefixCls.value;
  return [
    cls,
    {
      [`${cls}-no-wrap`]: props.wrap === false,
      [`${cls}-${mergedJustify.value}`]: mergedJustify.value,
      [`${cls}-${mergedAlign.value}`]: mergedAlign.value,
      [`${cls}-rtl`]: direction === 'rtl',
    },
  ];
});

// ---------------------------------------------------------------------------
// gutter
// ---------------------------------------------------------------------------

const gutters = computed(() => useGutter(props.gutter, screens.value));

/**
 * Row 的 gutter 样式。
 *
 * ⚠️ antd 用 `${g / -2}px`（数字，React 补 px 的形态一致）；字符串走 `calc(x / -2)`。
 * rowGap 数字必须补 px（Vue patchStyle 不转换，PITFALLS 32）；`0 → '0'`（React 对 0 不补单位）。
 */
const rowStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  const [gutterH, gutterV] = gutters.value;
  if (gutterH) {
    style.marginInline = isNumber(gutterH) ? `${gutterH / -2}px` : `calc(${gutterH} / -2)`;
  }
  style.rowGap = typeof gutterV === 'number' ? (gutterV === 0 ? '0' : `${gutterV}px`) : gutterV;
  // antd: style: { ...rowStyle, ...style } —— 调用方 style 在最后，覆盖 gutter 值。
  // 根 `style` 是 Vue 原生 attrs（不再是 prop），位置保持不变。
  return { ...style, ...((attrs.style as CSSProperties | undefined) ?? {}) };
});

const rootStyleAttrs = computed(() => styleAttrs(rowStyle.value));

/**
 * 根元素属性。`style`/`className` 已声明为 props；`attrs`（id / data-* /
 * `class` —— Vue 会与 `:class` 合并）原样透传（antd 的 `...others`）。
 */
const rootAttrs = computed(() => ({
  ...attrs,
  ...rootStyleAttrs.value,
}));

// provide（antd 的 useMemo(() => ({gutter, wrap}))) —— Vue 侧用 computed 包一层，
// gutter/wrap 变化时 Col 侧在 computed 里读 inject 值能重算。
provideRowContext({
  gutter: gutters,
  wrap: computed(() => props.wrap),
});

// ---------------------------------------------------------------------------
// 暴露
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <slot />
  </div>
</template>
