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
import { computed, useAttrs } from 'vue';

import Base from './Base';
import type { ParagraphProps } from './interface';

defineOptions({ name: 'AParagraph', inheritAttrs: false });

const props = defineProps<ParagraphProps>();
const attrs = useAttrs();

const mergedProps = computed(() => ({
  ...attrs,
  ...omit(props, ['component']),
  component: 'div',
}));
</script>

<template>
  <Base v-bind="mergedProps">
    <slot />
  </Base>
</template>
