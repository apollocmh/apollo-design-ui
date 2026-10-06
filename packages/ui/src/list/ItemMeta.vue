<script setup lang="ts">
/**
 * `List.Item.Meta` —— 列表项的元信息（头像 + 标题 + 描述）。
 * 对应 antd 6.6.4 的 `es/list/Item.tsx` 的 `Meta`（53-79 行）。
 *
 * ── 四条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **三个判据各自独立**：`avatar` 单独判真值 ⇒ `-item-meta-avatar`；
 *    `(title || description)` ⇒ `-item-meta-content`（**外层**是 `||`）；
 *    里层 `title` 与 `description` **各自**再判一次（内层是两个独立的 `&&`）。
 *    ⇒ `title` 为 `''` 且 `description` 有值时会渲染 content，但**没有** `<h4>`。
 * 2. **`title` 渲染成 `<h4>`**（不是 `div`）—— 这是 antd 的选择，逐字保留。
 * 3. **`{...others}` 落在根 `div` 上**，`className` 与之**分开**合并
 *    （上游 `clsx(\`${prefixCls}-item-meta\`, className)`）。
 * 4. **`prefixCls` 是 `getPrefixCls('list', customizePrefixCls)`** —— 用的是
 *    **list** 的前缀，不是 `item-meta` 自己的。
 *
 * ── 平台差异（PLATFORM）──────────────────────────────────────────────────────
 *
 * `avatar` / `title` / `description` 是 `React.ReactNode`，在 `.vue` 模板里没有
 * 「渲染一个 VNodeChild 变量」的语法 ⇒ 一律经 `NodeRenderer`（它做 `cloneVNode`，
 * 避免同一个 VNode 被渲染两次时踩 Vue 的 VNode 可变坑）。
 */

import { type CSSProperties, computed, ref, useAttrs } from 'vue';
import { useConfigContext } from '../config-provider/context';
import { NodeRenderer } from '../empty/components/NodeRenderer';
import type { ListItemMetaProps } from './interface';

defineOptions({ name: 'AListItemMeta', inheritAttrs: false });

const props = defineProps<ListItemMetaProps>();
const attrs = useAttrs();

const { getPrefixCls } = useConfigContext();

/** 类名前缀。⚠️ 取的是 **list** 的前缀（与上游一致）。 */
const prefixCls = computed(() => getPrefixCls('list', props.prefixCls));
const cls = computed(() => `${prefixCls.value}-item-meta`);

/** 根类名。顺序逐字来自上游 `clsx(...)`。 */
const classString = computed(() => [
  cls.value,
  // 调用方原生 class（位置与原先的 props.className 一致）
  attrs.class,
]);

const rootAttrs = computed(() => {
  // ⚠️ `class` 已被 classString 显式消费；留在 rootAttrs 里会被 `v-bind` 二次合并（重复）。
  const { class: _attrsClass, ...restAttrs } = attrs;
  void _attrsClass;
  // 根 style 是 Vue 原生 attrs
  return { ...restAttrs, style: attrs.style as CSSProperties | undefined };
});

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="classString" v-bind="rootAttrs">
    <div v-if="props.avatar" :class="`${cls}-avatar`">
      <NodeRenderer :node="props.avatar" />
    </div>
    <div v-if="props.title || props.description" :class="`${cls}-content`">
      <h4 v-if="props.title" :class="`${cls}-title`">
        <NodeRenderer :node="props.title" />
      </h4>
      <div v-if="props.description" :class="`${cls}-description`">
        <NodeRenderer :node="props.description" />
      </div>
    </div>
  </div>
</template>
