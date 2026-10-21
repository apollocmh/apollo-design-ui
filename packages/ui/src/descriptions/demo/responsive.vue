<script setup lang="ts">
// 对齐 antd 的 responsive demo：column 断点映射
import { Descriptions, useBreakpoint } from '@apollo-design/ui';
import { computed } from 'vue';

const screens = useBreakpoint();

const activeBreakpoint = computed(() => {
  const current = screens.value ?? {};
  return (
    (['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const).find(
      (breakpoint) => current[breakpoint],
    ) ?? '未命中'
  );
});

const items = [
  { key: '1', label: '产品', children: '云数据库' },
  { key: '2', label: '计费方式', children: '预付费' },
  { key: '3', label: '可用区', children: '华东 1' },
  { key: '4', label: '到期时间', children: '2026-12-31' },
  { key: '5', label: '实例规格', children: '4 核 8 GB' },
  { key: '6', label: '状态', children: '运行中' },
];
</script>

<template>
  <p>当前命中断点：<strong>{{ activeBreakpoint }}</strong>（调整浏览器宽度观察列数变化）</p>
  <Descriptions bordered :column="{ xs: 1, sm: 2, md: 3 }" :items="items" />
</template>
