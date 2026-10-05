<script setup lang="ts">
/**
 * Space.Addon —— 紧凑布局里的自定义单元格。
 *
 * 契约来源：antd 6.6.4 的 `es/space/Addon.js`（60 行）。自 antd@5.29.0 起提供。
 *
 * ── 它的类名结构有三层 ─────────────────────────────────────────────────────────
 *
 * ```
 * {prefix}-space-addon                         ← 基座
 * {prefix}-space-addon-variant-{variant}       ← 外观（默认 outlined）
 * {prefix}-space-addon-{status}                ← 校验状态（error / warning / …）
 * {prefix}-space-addon-{compactSize}           ← 在 Compact 里时的尺寸（small / large）
 * {prefix}-space-addon-disabled                ← 禁用
 * {prefix}-space-addon-compact-item            ← 由 useCompactItemContext 拼（含 first/last）
 * ```
 *
 * ⚠️ 注意 `prefixCls` 的后缀是 **`'space-addon'`**（不是 `'addon'`），
 *    所以不传时兜底是 `apollo-space-addon`；紧凑项类名也因此是
 *    `apollo-space-addon-compact-item`（而不是 `apollo-space-compact-item`）。
 *    CSS 侧的选择器同样长在 `-space-addon` 上 —— 见 `style/index.ts`。
 *
 * ── 类名顺序（逐字对齐 `Addon.tsx:38-50`）─────────────────────────────────────
 *
 * `prefixCls` → 紧凑项类名 → `-variant-{variant}` → 状态类 → `-{size}`? →
 * `-disabled`? → `className`。
 *
 * ⚠️ `-{size}` 的键是 `compactSize`（可能为 `undefined`）—— 用**真值**判断，
 *    所以 `compactSize` 为空时**不产生**键（`clsx` 会跳过 `undefined` 键，
 *    但 Vue 的 `:class` 对象里值为 `undefined` 同样会被跳过，两者等价）。
 *
 * ── 与 antd 的差异 ─────────────────────────────────────────────────────────────
 *
 *   - 无 CSS-in-JS 的 hashId / cssVarCls（D5）。
 *   - `direction` 走 `useDirection()`（D27）。
 */

import { computed, ref, useAttrs, useSlots, type VNodeChild } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useConfigContext, useDirection } from '../config-provider/context';
import { useCompactItemContext } from './Compact';
import type { SpaceAddonProps } from './interface';
import { getStatusClassNames } from './statusUtils';

defineOptions({ name: 'ASpaceAddon', inheritAttrs: false });

const props = withDefaults(defineProps<SpaceAddonProps>(), {
  prefixCls: undefined,
  // antd 的默认值是字面量 `'outlined'`（`Addon.tsx:25`）—— 逐字对齐。
  variant: 'outlined',
  disabled: undefined,
  status: undefined,
});

const slots = useSlots();
const attrs = useAttrs();
defineSlots<{ default?: () => VNodeChild }>();

const { getPrefixCls } = useConfigContext();
const direction = useDirection();

const prefixCls = computed(() => getPrefixCls('space-addon', props.prefixCls));

/**
 * 紧凑上下文。
 *
 * ⚠️ 传的是**自己的** `prefixCls`（`apollo-space-addon`）—— 与 antd 一致
 *    （`Addon.tsx:34`）。所以 Addon 的紧凑类名长在自己的前缀上，
 *    而 Button / Input 的长在它们自己的前缀上。同一个协议，不同的落点。
 */
const { compactSize, compactItemClassnames } = useCompactItemContext(prefixCls, direction);

const statusClass = computed(() => getStatusClassNames(prefixCls.value, props.status));

const rootClass = computed(() => [
  prefixCls.value,
  compactItemClassnames.value,
  `${prefixCls.value}-variant-${props.variant}`,
  statusClass.value,
  {
    [`${prefixCls.value}-${compactSize.value}`]: compactSize.value,
    [`${prefixCls.value}-disabled`]: props.disabled,
  },
]);

/** 根 `class` / `style` 是 Vue 原生 attrs（上游随 `{...restProps}` 落根）。 */
const rootAttrs = computed(() => ({ ...attrs }));

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <slot />
  </div>
</template>
