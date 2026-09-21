<script setup lang="ts">
/**
 * Flex 主实现。对应 antd 6.6.4 的 es/flex。
 *
 * ⚠️ 骨架由 gen-component.mjs 生成 —— 依据 AGENTS.md §2，G1 的分析产物
 *    （docs/analysis/flex.md）必须先于本文件的实质实现存在。
 */
defineOptions({ name: 'AFlex' });

// TODO(G2): 依据 docs/analysis/flex.md 定义 withDefaults(defineProps<FlexProps>(), {...})
// TODO(G4): 对齐 antd 的 DOM 结构 / 语义类名 / ARIA；视觉值一律走 Token（H9）
</script>

<template>
  <!-- TODO(G4): 根类名走 getPrefixCls('flex') 的结果（默认 apollo-flex），不要写死 -->
  <div class="apollo-flex">
    <slot />
  </div>
</template>
