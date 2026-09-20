<script setup lang="ts">
/**
 * `Text` —— 行内文本。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Text.js`（**逐条对齐**）。
 *
 * ── 它只做三件事 ──────────────────────────────────────────────────────────────
 *
 *   1. 把 `ellipsis` 里的 `expandable` / `rows` **剥掉**再往下传（行内文本没有多行概念）；
 *   2. 传了这两个键时**告警**（`usage`）；
 *   3. 以 `component="span"` 渲染 `Base`。
 *
 * ── 三处必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **剥离的判据是 `isPlainObject(ellipsis)`**，而它是**宽松**判定（数组也通过）。
 *      ⇒ `ellipsis={[]}` 会走剥离分支。这是上游行为，别「顺手修」成严格判定。
 *   2. **告警的判据是 `'expandable' in ellipsis` / `'rows' in ellipsis`**（`in` 运算符），
 *      不是「值非空」⇒ `ellipsis={{ rows: undefined }}` **也会告警**。
 *   3. **`component="span"` 写在 `{...restProps}` 之后**（antd 的 JSX 顺序），
 *      所以用户传的 `component` 会被覆盖 —— 这里同样显式覆盖。
 *
 * ── 为什么用 `v-bind="mergedProps"` 而不是逐个 prop 传递 ────────────────────────
 *
 * `BlockProps` 有 20 个字段，逐个写既冗长又容易漏。`props` 里除了 `component`
 * 之外**全部**都是 `Base` 的 prop，所以「整体透传 + 单独覆盖」是最不容易漂移的写法。
 * `inheritAttrs: false` 是为了把用户直接写的 `class` / `onClick` / `aria-label`
 * 等 `$attrs` 一起并进来（`Base` 再原样落到根元素上）。
 */

import { isPlainObject, omit, useDevWarning } from '@apollo-design/utils';
import { computed, ref, useAttrs } from 'vue';

import Base from './Base';
import type { EllipsisConfig, TextProps } from './interface';

defineOptions({ name: 'AText', inheritAttrs: false });

const props = defineProps<TextProps>();
const attrs = useAttrs();

/**
 * `Base` 的实例（它 `defineExpose({ nativeElement })`）。
 *
 * ⚠️ 必须**转发**，不能省：antd 的 `Text` 是 `forwardRef`，`ref` 直接落到根 DOM
 *    元素上（`<Base ref={ref} …/>` ⇒ `InternalTypography` 的 `ref`）。Vue 的等价物
 *    是「在 `Base` 上挂模板 ref，再把它暴露的 `nativeElement` 原样暴露出去」。
 *    少了这一步 `<Text ref="x">` 拿不到任何东西 —— 那是**契约缺失**（实测踩过）。
 *    声明成 `{ nativeElement }` 而不是 `HTMLElement`：模板 ref 落在**组件**上，
 *    Vue 给的是组件的暴露对象，不是元素（见 `Typography.vue` 的同类说明）。
 */
const baseRef = ref<{ nativeElement: HTMLElement | null } | null>(null);

defineExpose({ nativeElement: computed(() => baseRef.value?.nativeElement ?? null) });

const warning = useDevWarning('Typography.Text');

const mergedEllipsis = computed(() => {
  const { ellipsis } = props;
  if (isPlainObject(ellipsis)) {
    return omit(ellipsis as EllipsisConfig, ['expandable', 'rows']);
  }
  return ellipsis;
});

// ⚠️ 判据用 `in` 而不是「真值」：`{rows: undefined}` 也要告警（antd 的行为）
warning(
  !isPlainObject(props.ellipsis) ||
    (!('expandable' in props.ellipsis) && !('rows' in props.ellipsis)),
  '`ellipsis` do not support `expandable` or `rows` props.',
);

const mergedProps = computed(() => ({
  ...attrs,
  ...omit(props, ['component']),
  component: 'span',
  ellipsis: mergedEllipsis.value,
}));
</script>

<template>
  <Base ref="baseRef" v-bind="mergedProps">
    <slot />
  </Base>
</template>
