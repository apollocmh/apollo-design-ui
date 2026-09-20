<script setup lang="ts">
/**
 * `Typography` —— 排版容器（不带装饰、不带 `ellipsis` / `copyable` / `editable`）。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Typography.js`（**逐条对齐**）。
 *
 * ── 与 `Text` / `Title` / `Paragraph` / `Link` 的分工 ─────────────────────────
 *
 * antd 里有两层：
 *
 * ```
 * Typography（本体）  ──┐
 *                      ├──> InternalTypography（哑渲染器）
 * Base（四个子组件）  ──┘
 * ```
 *
 * `Typography` 本体**只**支持 `prefixCls` / `className` / `rootClassName` / `style` /
 * `classNames` / `styles` / `direction` / `component`，**没有** `type` / `disabled` /
 * `ellipsis` / `copyable` / `editable` / 七个装饰开关。这些都在 `Base` 上。
 * 所以 `<Typography strong>` 在 antd 里**没有任何效果**（`strong` 会作为未知属性透传到
 * 根元素上）—— 这不是我们漏了，是上游的形状。
 *
 * ── 与 antd 的一处细节差异（等价改写）────────────────────────────────────────
 *
 * antd 把 `rootClassName` 折进 `className` 再传给 `InternalTypography`
 * （`className={clsx(className, rootClassName)}`），而 `InternalTypography` 自己的
 * `rootClassName` prop 恒为 `undefined`。我们直接分别传两个 prop ——
 * `InternalTypography` 拼类名的顺序是 `className` 在前、`rootClassName` 在后，
 * 与 `clsx(className, rootClassName)` 逐字相同。
 */

import { computed, ref } from 'vue';

import { useTypographySemantic } from './hooks/use-typography-semantic';
import InternalTypography from './InternalTypography.vue';
import type { TypographyProps } from './interface';

defineOptions({ name: 'ATypography', inheritAttrs: false });

const props = withDefaults(defineProps<TypographyProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  classNames: undefined,
  styles: undefined,
  direction: undefined,
  component: undefined,
});

const { classNames, styles, prefixCls, direction } = useTypographySemantic(
  props,
  () => props.prefixCls,
  () => props.classNames,
  () => props.styles,
  () => props.direction,
);

/**
 * `InternalTypography` 的实例（它 `defineExpose({ nativeElement })`）。
 *
 * ⚠️ 这里**不能**声明成 `ref<HTMLElement>`：模板里的 `ref="rootRef"` 落在**组件**上，
 *    Vue 给的是那个组件的**暴露对象**（`{ nativeElement }`），不是 DOM 元素。
 *    声明成 `HTMLElement` 会让 `defineExpose` 把 `nativeElement` 暴露成一个
 *    「装着暴露对象的 ref」—— 类型在撒谎，`<Typography ref="x">` 的
 *    `x.nativeElement` 拿到的不是元素（实测踩过）。见 `interface.ts` 的 `TypographyRef`。
 */
const rootRef = ref<{ nativeElement: HTMLElement | null } | null>(null);

/** antd 的 `forwardRef` 直接落到根 DOM 元素；Vue 里对应物就是这个 `nativeElement`。 */
defineExpose({ nativeElement: computed(() => rootRef.value?.nativeElement ?? null) });
</script>

<template>
  <InternalTypography
    ref="rootRef"
    :prefix-cls="prefixCls"
    :component="props.component"
    :direction="direction"
    :class-names="classNames"
    :styles="styles"
    :class-name="props.className"
    :root-class-name="props.rootClassName"
    :style="props.style"
    v-bind="$attrs"
  >
    <slot />
  </InternalTypography>
</template>
