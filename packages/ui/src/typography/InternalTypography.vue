<script setup lang="ts">
/**
 * `InternalTypography` —— Typography 家族共用的**哑渲染器**。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Typography.js` 的 `InternalTypography`
 * （**逐条对齐**）。它只做三件事：
 *
 *   1. 拼根类名：`prefixCls` → `-rtl` → `className` → `rootClassName` → `classNames.root`
 *   2. 合根样式：`{...styles.root, ...style}` —— **`style` 在最后，覆盖 `styles.root`**
 *   3. 把其余属性（`title` / `aria-label` / `onClick` / `onMouseEnter` …）原样落到根元素
 *
 * ── 为什么单独一个组件而不是一个 composable ────────────────────────────────────
 *
 * `Typography`（本体）与 `Base`（Text/Title/Paragraph/Link 的共同底座）**各自**做一遍
 * 语义化合并，然后都渲染它。抽成 composable 会让两个调用点各自维护一份「拼类名 + 合样式」
 * 的逻辑，而这两处必须逐字一致（否则 `Typography` 与 `Text` 的根元素行为会分叉）。
 *
 * ── 与 antd 的差异 ────────────────────────────────────────────────────────────
 *
 *   - antd 在这里调 `useStyle(prefixCls)` 取 `hashId` / `cssVarCls` 挂到类名上。
 *     零运行时架构下没有 CSS-in-JS，两个类名都不存在（差异 D5）。
 *   - antd 的 `component` 默认值是 `'article'`，照搬。
 *
 * ── 这个组件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明调用方给的 `classNames` / `styles` 合并顺序对 —— 那是
 *     `hooks/use-typography-semantic.ts` 的职责。
 */

import { computed, ref, useAttrs } from 'vue';

import { styleAttrs } from '../_internal/use-merge-semantic';
import type { DirectionType } from '../config-provider/context';
import type { TypographySemanticClassNames, TypographySemanticStyles } from './interface';

defineOptions({ name: 'AInternalTypography', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    prefixCls: string;
    /** 渲染的标签。antd 的默认值是 `'article'`。 */
    component?: string;
    direction?: DirectionType;
    /** 已解析的语义化类名（调用方合并过）。 */
    classNames?: TypographySemanticClassNames;
    /** 已解析的语义化样式（调用方合并过）。 */
    styles?: TypographySemanticStyles;
    /**
     * 根元素的类名（`Typography` / `Base` 拼好的那份）。
     *
     * ⚠️ 刻意**不**叫 `class`：`class` 是 Vue 的保留属性名，声明成 prop 会与
     *    `$attrs.class` 的分发打架。用户直接写的 `class` 走 `$attrs`（见下）。
     */
    className?: string;
    /** 也落在根元素上，在 `className` **之后**。 */
    rootClassName?: string;
    /** 根元素内联样式。会**覆盖** `styles.root`（与 antd 的合并顺序一致）。 */
    style?: import('vue').CSSProperties;
  }>(),
  {
    component: 'article',
    direction: undefined,
    classNames: undefined,
    styles: undefined,
    className: undefined,
    rootClassName: undefined,
    style: undefined,
  },
);

const attrs = useAttrs();

const rootClass = computed(() => [
  props.prefixCls,
  { [`${props.prefixCls}-rtl`]: props.direction === 'rtl' },
  props.className,
  props.rootClassName,
  props.classNames?.root,
]);

/**
 * 根样式。
 *
 * ⚠️ 必须过 `styleAttrs()`：`{...styles.root, ...style}` 可能是空对象，直接绑 `:style`
 *    会让 SSR 渲染出 `style=""`，而 antd 在样式为空时**不输出该属性**。
 *    详见 `_internal/use-merge-semantic.ts` 的 `styleAttrs`。
 */
const rootStyleAttrs = computed(() => styleAttrs({ ...props.styles?.root, ...props.style }));

/**
 * 根元素的属性对象。
 *
 * ⚠️ 不能写成两个裸 `v-bind`（`v-bind="$attrs" v-bind="x"`）—— Vue 会报
 *    「Duplicate attribute」。所以把 `$attrs` 一起并进来。
 *    `$attrs` 里的 `class` 由模板上的 `:class` 与它经 `mergeProps` 合并。
 */
const rootAttrs = computed(() => ({ ...attrs, ...rootStyleAttrs.value }));

const rootRef = ref<HTMLElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <component :is="component" ref="rootRef" :class="rootClass" v-bind="rootAttrs">
    <slot />
  </component>
</template>
