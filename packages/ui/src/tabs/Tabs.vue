<script setup lang="ts">
/**
 * Tabs 主实现。对应 antd 6.6.4 的 es/tabs。
 *
 * ⚠️ 骨架由 gen-component.mjs 生成 —— 依据 AGENTS.md §2，G1 的分析产物
 *    （docs/analysis/tabs.md）必须先于本文件的实质实现存在。
 */
defineOptions({ name: 'ATabs' });

// TODO(G2): 依据 docs/analysis/tabs.md 定义 withDefaults(defineProps<TabsProps>(), {...})
// TODO(G4): 对齐 antd 的 DOM 结构 / 语义类名 / ARIA；视觉值一律走 Token（H9）
</script>

<template>
  <!-- TODO(G4): 根类名走 getPrefixCls('tabs') 的结果（默认 apollo-tabs），不要写死 -->
  <div class="apollo-tabs">
    <slot />
  </div>
</template>
