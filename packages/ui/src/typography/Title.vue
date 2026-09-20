<script setup lang="ts">
/**
 * `Title` —— 标题（`h1`…`h5`）。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Title.js`（**逐条对齐**）。
 *
 * ── 两条必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **`level` 的默认值是 `1`**，且**非法 level 退回 `h1` 并告警**：
 *      `component = TITLE_ELE_LIST.includes(level) ? \`h${level}\` : 'h1'`。
 *      ⚠️ 「非法 level 也渲染 `h1`」而不是不渲染 —— 少了这条，`level={6}` 会渲染成
 *      `<h6>`（脱离组件样式体系）。
 *   2. **`strong` 不在 `TitleProps` 里**（antd 用 `Omit` 表达）：标题天然加粗。
 *      但**运行时**它仍然会被透传到 `Base`（antd 的 `{...restProps}` 也如此），
 *      所以 `strong` 落在 `$attrs` 里、由 `mergedProps` 一并传下去 —— 这不是漏洞，
 *      是上游的形状。
 *
 * ── 与 antd 的一处实现差异（PLATFORM，语义相同）─────────────────────────────────
 *
 * antd 在**每次渲染**里执行告警。这里用 `watchEffect` —— 只在 `level` 真的变化时
 * 重新判定。可观测差异仅存在于「先合法、后非法」的动态绑定场景，而那种场景下
 * 告警的内容完全一致。
 */

import { omit, useDevWarning } from '@apollo-design/utils';
import { computed, ref, useAttrs, watchEffect } from 'vue';

import Base from './Base';
import type { TitleProps } from './interface';

const TITLE_ELE_LIST = [1, 2, 3, 4, 5] as const;

defineOptions({ name: 'ATitle', inheritAttrs: false });

// ⚠️ `level` 必须有默认值：`defineProps<TitleProps>()` 不带默认时它是 `undefined`，
//    而 `TITLE_ELE_LIST.includes(undefined)` 为假 ⇒ 每次渲染都会误告警。
const props = withDefaults(defineProps<TitleProps>(), { level: 1 });
const attrs = useAttrs();

const warning = useDevWarning('Typography.Title');

watchEffect(() => {
  warning(
    TITLE_ELE_LIST.includes(props.level),
    'Title only accept `1 | 2 | 3 | 4 | 5` as `level` value. And `5` need 4.6.0+ version.',
  );
});

const component = computed(() => (TITLE_ELE_LIST.includes(props.level) ? `h${props.level}` : 'h1'));

/**
 * 转发 `Base` 的 `nativeElement`。
 *
 * ⚠️ 必须转发：antd 的 `Title` 是 `forwardRef`，`ref` 落在根 DOM 元素上。
 *    理由与判据见 `Text.vue` 里同名字段的说明。
 */
const baseRef = ref<{ nativeElement: HTMLElement | null } | null>(null);

defineExpose({ nativeElement: computed(() => baseRef.value?.nativeElement ?? null) });

const mergedProps = computed(() => ({
  ...attrs,
  ...omit(props, ['component', 'level']),
  component: component.value,
}));
</script>

<template>
  <Base ref="baseRef" v-bind="mergedProps">
    <slot />
  </Base>
</template>
