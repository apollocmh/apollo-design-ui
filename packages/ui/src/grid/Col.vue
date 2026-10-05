<script setup lang="ts">
/**
 * Col —— 栅格列。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/col.js`。类名、判据、gutter/flex 规则逐条对齐，
 * 有意差异登记在 `packages/ui/src/grid/README.md`。
 *
 * ── 五条最容易写错的判据（docs/analysis/grid.md §2）──────────────────────────
 *
 *   1. **响应式 size 类是「全量渲染」**：xs…xxxl 全部类名同时出现在 DOM 上，
 *      由 CSS media query 决定生效 —— SSR 无需 screens，天然水合一致。
 *   2. **isNonNullable 判据**：span 存在（含 0）即产生类名；order/offset/push/pull
 *      是 antd 的「真值 + 显式 === 0」判据（原样保留，不「顺手修」）。
 *   3. **flex 解析**：'auto' / 数字 / 长度串 / 原样（parseFlex，utils.ts）；
 *      `flex === 0` 也生效；`wrap === false` 时补 `minWidth: 0`（Firefox hack）。
 *   4. **gutter padding = +g/2**（Row 拿负半，Col 拿正半）。
 *   5. **响应式 flex 走 CSS 变量**：内联 `--apollo-col-{size}-flex` + 类
 *      `-{size}-flex`（规则 `flex: var(...)`）—— 这样 media query 才能切换 flex 值。
 *      Vue patchStyle 对 `--` 键走 setProperty；var 值不做 px 补全（React 同）。
 */

import { isNonNullable } from '@apollo-design/utils';
import { type CSSProperties, computed, ref, useAttrs } from 'vue';
import { responsiveArrayReversed } from '../_internal/responsive-observer';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { ColConfig, ColProps, ColSize } from './interface';
import { useRowContext } from './RowContext';
import { parseFlex } from './utils';

defineOptions({ name: 'ACol', inheritAttrs: false });

const props = withDefaults(defineProps<ColProps>(), {
  prefixCls: undefined,
  span: undefined,
  order: undefined,
  offset: undefined,
  push: undefined,
  pull: undefined,
  flex: undefined,
  xs: undefined,
  sm: undefined,
  md: undefined,
  lg: undefined,
  xl: undefined,
  xxl: undefined,
  xxxl: undefined,
});

const attrs = useAttrs();

const { getPrefixCls, direction } = useComponentConfig<ColConfig>('col');
const { gutter, wrap } = useRowContext();

const prefixCls = computed(() => getPrefixCls('col', props.prefixCls));
const rootPrefixCls = computed(() => getPrefixCls());

// ---------------------------------------------------------------------------
// 响应式 size（xs…xxxl）
//
// antd 用 responsiveArrayReversed（xs → xxxl）遍历；sizeClassObj 逐轮累加
// （键互不相同，仅 -rtl 重复出现，clsx 幂等）。类名是「全量渲染」——
// 生效与否交给 CSS media query。
// ---------------------------------------------------------------------------

const sizeClasses = computed(() => {
  let obj: Record<string, boolean | undefined> = {};
  responsiveArrayReversed.forEach((size) => {
    let sizeProps: ColSize = {};
    const propSize = props[size];
    if (typeof propSize === 'number') {
      sizeProps.span = propSize;
    } else if (propSize && typeof propSize === 'object') {
      sizeProps = propSize;
    }
    const cls = prefixCls.value;
    obj = {
      ...obj,
      [`${cls}-${size}-${sizeProps.span}`]: isNonNullable(sizeProps.span),
      [`${cls}-${size}-order-${sizeProps.order}`]: !!sizeProps.order || sizeProps.order === 0,
      [`${cls}-${size}-offset-${sizeProps.offset}`]: !!sizeProps.offset || sizeProps.offset === 0,
      [`${cls}-${size}-push-${sizeProps.push}`]: !!sizeProps.push || sizeProps.push === 0,
      [`${cls}-${size}-pull-${sizeProps.pull}`]: !!sizeProps.pull || sizeProps.pull === 0,
      [`${cls}-${size}-flex`]: !!(sizeProps.flex || sizeProps.flex === 0),
      [`${cls}-rtl`]: direction === 'rtl',
    };
  });
  return obj;
});

/** 响应式 flex 的 CSS 变量（`--{root}-col-{size}-flex`）—— 与 style/index.ts 的规则配对。 */
const sizeStyle = computed<CSSProperties>(() => {
  const style: Record<string, string | number> = {};
  responsiveArrayReversed.forEach((size) => {
    const propSize = props[size];
    let sizeProps: ColSize = {};
    if (typeof propSize === 'number') {
      sizeProps.span = propSize;
    } else if (propSize && typeof propSize === 'object') {
      sizeProps = propSize;
    }
    if (sizeProps.flex || sizeProps.flex === 0) {
      style[`--${rootPrefixCls.value}-col-${size}-flex`] = parseFlex(sizeProps.flex);
    }
  });
  return style;
});

// ---------------------------------------------------------------------------
// 基础类名。顺序逐字来自 antd：prefixCls → 条件类 → className → sizeClasses。
// ---------------------------------------------------------------------------

const rootClass = computed(() => {
  const cls = prefixCls.value;
  return [
    cls,
    {
      [`${cls}-${props.span}`]: props.span !== undefined,
      [`${cls}-order-${props.order}`]: props.order,
      [`${cls}-offset-${props.offset}`]: props.offset,
      [`${cls}-push-${props.push}`]: props.push,
      [`${cls}-pull-${props.pull}`]: props.pull,
    },
    sizeClasses.value,
  ];
});

// ---------------------------------------------------------------------------
// 样式。合并顺序逐字来自 antd：mergedStyle → style prop → sizeStyle（最后）。
// ---------------------------------------------------------------------------

const mergedStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  // Horizontal gutter use padding
  const gutterH = gutter?.value?.[0];
  if (gutterH) {
    style.paddingInline = typeof gutterH === 'number' ? `${gutterH / 2}px` : `calc(${gutterH} / 2)`;
  }
  const flex = props.flex;
  if (flex || flex === 0) {
    style.flex = parseFlex(flex);
    // Hack for Firefox to avoid size issue
    // https://github.com/ant-design/ant-design/pull/20023#issuecomment-564389553
    if (wrap?.value === false && !style.minWidth) {
      style.minWidth = 0;
    }
  }
  return style;
});

// 根 `style` 是 Vue 原生 attrs（不再是 prop），合并位置与原先的 `props.style` 一致：
// mergedStyle → 调用方 style → sizeStyle（响应式 sizeStyle 仍然最后胜出）。
const rootAttrs = computed(() => ({
  ...attrs,
  ...styleAttrs({
    ...mergedStyle.value,
    ...((attrs.style as CSSProperties | undefined) ?? {}),
    ...sizeStyle.value,
  }),
}));

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
