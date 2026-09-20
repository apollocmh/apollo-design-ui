<script setup lang="ts">
/**
 * `Paragraph` —— 段落（块级）。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Paragraph.js`（**逐条对齐**）。
 * 它**没有任何自己的逻辑** —— 只是以 `component="div"` 渲染 `Base`。
 *
 * ⚠️ 标签是 `div` 而**不是** `p`。antd 从 5.0 起把 `Paragraph` 的默认标签改成 `div`
 *    （`p` 不能嵌套块级内容）。CSS 里 `-typography p` 的规则仍然存在，是为了兼容
 *    用户自己写的 `<p>` 内容 —— 两者不是一回事。
 */

import { omit } from '@apollo-design/utils';
import { computed, ref, useAttrs } from 'vue';

import Base from './Base';
import type { ParagraphProps } from './interface';

defineOptions({ name: 'AParagraph', inheritAttrs: false });

const props = defineProps<ParagraphProps>();
const attrs = useAttrs();

/**
 * 转发 `Base` 的 `nativeElement`。
 *
 * ⚠️ 必须转发：antd 的 `Paragraph` 是 `forwardRef`，`ref` 落在根 DOM 元素上。
 *    理由与判据见 `Text.vue` 里同名字段的说明。
 */
const baseRef = ref<{ nativeElement: HTMLElement | null } | null>(null);

defineExpose({ nativeElement: computed(() => baseRef.value?.nativeElement ?? null) });

const mergedProps = computed(() => ({
  ...attrs,
  ...omit(props, ['component']),
  component: 'div',
}));
</script>

<template>
  <Base ref="baseRef" v-bind="mergedProps">
    <slot />
  </Base>
</template>
