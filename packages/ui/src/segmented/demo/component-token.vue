<script setup lang="ts">
// 对齐 antd 的 componentToken demo
import { ConfigProvider, Segmented } from '@apollo-design/ui';
</script>

<template>
  <ConfigProvider
    :theme="{
      components: {
        Segmented: {
          itemColor: 'var(--apollo-color-text)',
          itemHoverColor: 'var(--apollo-color-text)',
          itemHoverBg: 'var(--apollo-color-fill-secondary)',
          itemSelectedBg: 'linear-gradient(225deg, #722ed1 0%, #0958d9 100%)',
          itemActiveBg: 'var(--apollo-color-fill)',
          itemSelectedColor: '#fff',
        },
      },
    }"
  >
    <Segmented aria-label="周期" style="max-width: 100%; overflow-x: auto" :options="['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']" />
  </ConfigProvider>
</template>
