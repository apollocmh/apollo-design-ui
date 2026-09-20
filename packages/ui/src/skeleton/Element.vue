<script setup lang="ts">
/**
 * Element —— 骨架屏的最小几何原语。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/Element.js`。它是 `Skeleton.Avatar` /
 * `Skeleton.Button` / `Skeleton.Input` 的内层 `<span>`，也是 `Skeleton` 内部头像的载体
 * （antd 的注释：`We direct use SkeletonElement as avatar in skeleton internal.`）。
 *
 * ── 三条必须逐字保留的判据 ───────────────────────────────────────────────────
 *
 * 1. **它只认五个 prop**：`prefixCls` / `className` / `style` / `size` / `shape`。
 *    `rootClassName` / `classNames` / `styles` / `active` 在类型里存在但**被忽略**
 *    —— 上游也是这样（它渲染一个写死形状的 `<span>`，不展开 rest）。
 *    所以「`active` 只靠根元素的 `-active` 类名生效」这条约定在 Element 上也是真的。
 * 2. **`size` 是数字时落三个内联样式**：`width` / `height` / `line-height`（后者带 `px`）。
 *    字符串（`small` / `medium` / `large` / `default`）只映射类名。
 * 3. **`style` 覆盖 `sizeStyle`**：展开顺序是 `{...sizeStyle, ...style}`。
 *
 * ── 一处有意差异（登记在 README §5）────────────────────────────────────────────
 *
 * 上游在 dev 下对 `size === 'default'` 发废弃告警。我们的告警写在 `watchEffect` 里
 * 而不是 setup 期求值一次 —— antd 的告警写在**渲染体**里，所以「挂载时合法、
 * 之后更新成非法」也会告警（`warning()` 自己按消息去重）。行为一致。
 */

import { isNumber, useDevWarning } from '@apollo-design/utils';
import { type CSSProperties, computed, watchEffect } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { SkeletonElementProps } from './interface';
import { toCssLength } from './styleLength';

defineOptions({ name: 'ASkeletonElement', inheritAttrs: false });

const props = withDefaults(defineProps<SkeletonElementProps>(), {
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  size: undefined,
  shape: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});

/** 父组件恒会传 `prefixCls`；兜底空串是为了让类名不出现 `undefined-lg` 这种脏值。 */
const prefix = computed(() => props.prefixCls ?? '');

const classList = computed(() => [
  props.prefixCls,
  {
    [`${prefix.value}-lg`]: props.size === 'large',
    [`${prefix.value}-sm`]: props.size === 'small',
    [`${prefix.value}-circle`]: props.shape === 'circle',
    [`${prefix.value}-square`]: props.shape === 'square',
    [`${prefix.value}-round`]: props.shape === 'round',
  },
  props.className,
]);

/**
 * `isNumber(size)` 分支：三个内联样式。
 *
 * ⚠️ `width` / `height` 走 `toCssLength`（等价 React 的 `dangerousStyleValue`），
 *    `lineHeight` 由 antd 自己拼 `px`（`lineHeight` 在 React 的 unitless 表里，
 *    React **不会**替它补单位）。实测上游产物：
 *    `size=40` → `style="width:40px;height:40px;line-height:40px"`；
 *    `size=0`  → `style="width:0;height:0;line-height:0px"`（三个值**不一致**，是上游原样）。
 */
const sizeStyle = computed<CSSProperties>(() =>
  isNumber(props.size)
    ? {
        width: toCssLength(props.size),
        height: toCssLength(props.size),
        lineHeight: `${props.size}px`,
      }
    : {},
);

const mergedStyle = computed<CSSProperties>(() => ({ ...sizeStyle.value, ...props.style }));

const warning = useDevWarning('Skeleton');
watchEffect(() => {
  warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
});
</script>

<template>
  <span :class="classList" v-bind="styleAttrs(mergedStyle)" />
</template>
