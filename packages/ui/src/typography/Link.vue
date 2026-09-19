<script setup lang="ts">
/**
 * `Link` —— 链接。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Link.js`（**逐条对齐**）。
 *
 * ── 三条必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **`ellipsis` 只接受布尔**。传对象时告警（`usage`），且**仍然按 `!!ellipsis` 处理**
 *      ⇒ 传 `{}` 会得到「启用省略号」。这是上游行为。
 *   2. **`rel` 的兜底**：`rel === undefined && target === '_blank'` 时补
 *      `noopener noreferrer`。判据是 `=== undefined`（不是真值）⇒ 显式传 `rel=""`
 *      时**不补** —— 用户显式关掉反向链接保护是允许的。
 *   3. **`navigate` 被剥掉**。它是 react-router 的 `Link` 上的属性，用户复制粘贴时
 *      很容易带进来；antd 显式丢弃它，否则会渲染成 `<a navigate="...">` 这样的
 *      非法 DOM 属性。
 *
 * ── 为什么这里不能像其他三个子组件那样只写 `v-bind="attrs"` ────────────────────
 *
 * 因为要**从 `$attrs` 里删掉 `navigate`**（第 3 条）。所以 `inheritAttrs: false`
 * 之后手动合并 —— `omit(attrs, ['navigate'])`。
 */

import { isPlainObject, omit, useDevWarning } from '@apollo-design/utils';
import { computed, useAttrs } from 'vue';

import Base from './Base';
import type { LinkProps } from './interface';

defineOptions({ name: 'ALink', inheritAttrs: false });

const props = defineProps<LinkProps>();
const attrs = useAttrs();

const warning = useDevWarning('Typography.Link');

warning(!isPlainObject(props.ellipsis), '`ellipsis` only supports boolean value.');

const mergedRel = computed(() =>
  props.rel === undefined && props.target === '_blank' ? 'noopener noreferrer' : props.rel,
);

const mergedProps = computed(() => ({
  // ⚠️ `navigate` 必须剥掉（见文件头第 3 条）
  ...omit(attrs as Record<string, unknown>, ['navigate']),
  ...omit(props, ['component', 'ellipsis']),
  component: 'a',
  ellipsis: !!props.ellipsis,
  rel: mergedRel.value,
}));
</script>

<template>
  <Base v-bind="mergedProps">
    <slot />
  </Base>
</template>
