<script setup lang="ts">
import { ConfigProvider, Flex, Rate } from '@apollo-design/ui';
</script>

<template>
  <ConfigProvider
    :theme="{
      components: {
        Rate: {
          starColor: '#1677ff',
          starBg: '#d9d9d9',
          starSize: 32,
          starSizeSM: 24,
          starSizeLG: 40,
          starHoverScale: 'scale(1.2)',
        },
      },
    }"
  >
    <Flex vertical gap="small">
      <Rate :default-value="2.5" allow-half aria-label="Standard token rating" />
      <Rate size="small" :default-value="2.5" allow-half aria-label="Small token rating" />
      <Rate size="large" :default-value="2.5" allow-half aria-label="Large token rating" />
    </Flex>
  </ConfigProvider>
</template>
