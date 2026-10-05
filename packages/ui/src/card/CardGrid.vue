<script setup lang="ts">
/**
 * Card.Grid —— 卡片内容区隔网格。对应 antd 6.6.4 的 `es/card/CardGrid.js`（38 行）。
 *
 * ── 三条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **`hoverable` 默认 `true`**（`const { hoverable = true } = props`）——
 *    与 `Card` 的 `hoverable` 默认 `false` **不同**，是本组件最容易写错的一条。
 * 2. 前缀取自 **ConfigContext**（`getPrefixCls('card', prefixCls)`），
 *    有 `prefixCls` prop（与 `BreadcrumbSeparator` 不同，那个连 prop 都没有）。
 * 3. **不读 `direction`** —— 根上**没有** `-rtl` 类名（`Card` 有，`Card.Grid` 没有）。
 *
 * ── 平台差异（PLATFORM）──────────────────────────────────────────────────────
 *
 * 上游的 `extends React.HTMLAttributes<HTMLDivElement>` + `{...rest}` 在 Vue 侧
 * 由 `inheritAttrs` 承担：`class` / `style` / `data-*` / `onXxx` 等未声明属性
 * 自动落到根 `<div>`（单根组件，无需显式绑定）。
 *
 * ⚠️ `<template>` 里**不能**留注释 —— 注释也是一个根节点，会把组件变成**多根**，
 *    Vue 随即关闭 attrs 自动透传（`class` / `style` 静默丢失）。注释写在这里。
 */

import { computed, ref, type VNodeChild } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import type { CardGridProps } from './interface';

defineOptions({ name: 'ACardGrid' });

/** 默认插槽 = 上游的 `children`（规则 C19）。 */
defineSlots<{ default?: () => VNodeChild }>();

/**
 * ⚠️ `hoverable: true` **必须**写在这里：Vue 对未传的 Boolean prop 会赋 `false`，
 * 而本组件的默认值是 `true`（上游 `hoverable = true`）。漏掉它 ⇒
 * `<Card.Grid>` 永远拿不到 `-grid-hoverable` 类名（悬浮高亮静默消失）。
 */
const props = withDefaults(defineProps<CardGridProps>(), {
  prefixCls: undefined,
  hoverable: true,
});

const { getPrefixCls } = useComponentConfig('card');

const prefixCls = computed(() => getPrefixCls('card', props.prefixCls));

/** `clsx(`${prefix}-grid`, className, { [`${prefix}-grid-hoverable`]: hoverable })`。 */
const classString = computed(() => [
  `${prefixCls.value}-grid`,
  { [`${prefixCls.value}-grid-hoverable`]: props.hoverable },
]);

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="classString"><slot /></div>
</template>
