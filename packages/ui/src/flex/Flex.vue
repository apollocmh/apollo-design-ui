<script setup lang="ts">
/**
 * Flex —— 弹性布局容器。
 *
 * 契约来源：antd 6.6.4 的 `es/flex/index.js`。DOM 结构、类名、分支判据逐条对齐，
 * 有意差异登记在 `packages/ui/src/flex/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 五条最容易写错、且已被分析钉住的判据（docs/analysis/flex.md §2）────────────
 *
 *   1. **方向合并**：`orientation` > `vertical` > context.vertical > `'horizontal'`；
 *      `vertical` 的判据是 `typeof vertical === 'boolean'` —— 未传必须保持 `undefined`
 *      （D21，见 `withDefaults` 注释）。
 *   2. **语义类名吃 mergedVertical**：`-align-stretch` 看的是合并后的方向，
 *      不是裸 prop（antd 传 `{...props, vertical: mergedVertical}`）。
 *   3. **`isNonNullable` 判据**：`flex` / `gap` 用「非 null/undefined」判断 ——
 *      `gap: 0` **会**写内联 `gap`（与 Space 的 `isValidGapNumber` 不同！）。
 *   4. **gap 数字必须补 px**：Vue 的 `patchStyle` 不做数字→px 转换（PITFALLS 32），
 *      裸数字会被静默丢弃。`0` 输出 `'0'`（React 对 0 不补单位）。
 *   5. **`justify` / `wrap` / `align` 不透传 DOM**：antd 用 `omit`；
 *      Vue 侧它们是**声明过的 props**，天然不进 `attrs` —— 同一语义。
 */

import { isNonNullable } from '@apollo-design/utils';
import { type CSSProperties, computed, ref, useAttrs } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { isPresetSize } from '../space/gapSize';
import type { FlexConfig, FlexProps } from './interface';
import createFlexClassNames from './utils';

defineOptions({ name: 'AFlex', inheritAttrs: false });

/**
 * ⚠️⚠️ `vertical` 的 `undefined` 默认值**不是冗余的**（D21 / PITFALLS 46）。
 *
 * Vue 的 Boolean prop 转换会把未传的布尔 prop 赋成 `false`，而 `useOrientation`
 * 的第二级判据是 `typeof vertical === 'boolean'` —— 它把「未传」与「显式 false」
 * 当作两条不同的分支：
 *
 * ```
 * orientation 合法              → 用它
 * 否则 vertical 是布尔           → vertical ? 'vertical' : 'horizontal'
 * 否则 context.vertical 是布尔   → 同上（ConfigProvider 的 flex.vertical 全局配置）
 * 否则                           → 'horizontal'
 * ```
 *
 * 若 `vertical` 被转成 `false`，`<ConfigProvider><Flex /></ConfigProvider>` 的
 * **全局配置回落会静默失效**（context.vertical 被「显式 false」短路）。
 * 声明 default（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 */
const props = withDefaults(defineProps<FlexProps>(), {
  prefixCls: undefined,
  rootClassName: undefined,
  className: undefined,
  style: undefined,
  vertical: undefined,
  orientation: undefined,
  wrap: undefined,
  justify: undefined,
  align: undefined,
  flex: undefined,
  gap: undefined,
  component: undefined,
});

// context 的组件配置（antd 的 ctxFlex）。direction 的响应式边界见 D27 ——
// 与 divider 同一取舍（快照），登记在 README.md §7。
const {
  getPrefixCls,
  direction,
  className: contextClassName,
  style: contextStyle,
  vertical: contextVertical,
} = useComponentConfig<FlexConfig>('flex');

const attrs = useAttrs();

const prefixCls = computed(() => getPrefixCls('flex', props.prefixCls));

// ---------------------------------------------------------------------------
// 方向：orientation > vertical > context.vertical（复用三方共享的合并器）
// ---------------------------------------------------------------------------

const mergedOrientation = useOrientation(
  () => props.orientation,
  () => props.vertical ?? contextVertical,
  () => undefined,
);
const mergedVertical = computed(() => mergedOrientation.value[1]);

// ---------------------------------------------------------------------------
// 类名
//
// 顺序逐字来自 antd：className → rootClassName → ctxFlex.className → prefixCls
// → 语义类（吃 mergedVertical）→ gap / vertical / rtl。
// `attrs.class` 由 v-bind 的对象并进同一绑定（Vue 会合并 class），与 divider 同构。
// ---------------------------------------------------------------------------

const rootClass = computed(() => {
  const cls = prefixCls.value;
  return [
    props.className,
    props.rootClassName,
    contextClassName,
    cls,
    createFlexClassNames(cls, { ...props, vertical: mergedVertical.value }),
    {
      [`${cls}-gap-${props.gap}`]: isPresetSize(props.gap),
      [`${cls}-vertical`]: mergedVertical.value,
      [`${cls}-rtl`]: direction === 'rtl',
    },
  ];
});

// ---------------------------------------------------------------------------
// 样式
//
// 合并顺序逐字来自 antd：`{ ...ctxFlex?.style, ...style }`，然后：
//   - isNonNullable(flex)                    → style.flex
//   - isNonNullable(gap) && !isPresetSize(gap) → style.gap（**0 也算**）
//
// ⚠️ gap 数字必须转 px 字符串（Vue patchStyle 不做转换，PITFALLS 32）；
//    `0` 输出 `'0'`（React dangerousStyleValue 对 0 不补单位）。
// ---------------------------------------------------------------------------

/** 数字 → CSS 长度。与 divider 的 `toCssLength` 同一判据（0 → '0'）。 */
const toCssLength = (value: string | number): string =>
  typeof value === 'number' ? (value === 0 ? '0' : `${value}px`) : value;

const rootStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = { ...contextStyle, ...props.style };
  if (isNonNullable(props.flex)) {
    // ⚠️ `flex` 是 **unitless** 属性（React 的 unitlessNumbers 含 flex）：
    // `flex: 1` → `'1'`，不是 `'1px'`。基线用例 `flex:number` 钉死这一条。
    const flex = props.flex;
    style.flex = typeof flex === 'number' ? String(flex) : flex;
  }
  if (isNonNullable(props.gap) && !isPresetSize(props.gap)) {
    const gap = props.gap;
    style.gap = typeof gap === 'number' ? toCssLength(gap) : gap;
  }
  return style;
});

const rootStyleAttrs = computed(() => styleAttrs(rootStyle.value));

/**
 * 根元素的属性对象。
 *
 * ⚠️ `justify` / `wrap` / `align` 已声明为 props、天然不进 attrs，
 * 与 antd 的 `omit(othersProps, ['justify','wrap','align'])` 同一语义。
 * `attrs`（id / data-* / 其余 HTML 属性；`class` 由 Vue 与 `:class` 合并）原样透传。
 */
const rootAttrs = computed(() => ({
  ...attrs,
  ...rootStyleAttrs.value,
}));

// ---------------------------------------------------------------------------
// 暴露：与 antd 的 `RefAttributes<HTMLElement>` 对应
// ---------------------------------------------------------------------------

const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });

/** 根元素标签。antd 的 `component ?? 'div'`。 */
const rootTag = computed(() => props.component ?? 'div');
</script>

<template>
  <component :is="rootTag" ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <slot />
  </component>
</template>
