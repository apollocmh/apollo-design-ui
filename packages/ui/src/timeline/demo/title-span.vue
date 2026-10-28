<script setup lang="ts">
// 对齐 antd 的 `title-span` demo。
import { Flex, Text, Timeline } from '@apollo-design/ui';

const items = [
  { title: '05:10', content: 'Create a services' },
  { title: '09:03', content: 'Solve initial network problems' },
  { content: 'Technical testing' },
  { title: '11:28', content: 'Network problems being solved' },
];
</script>

<template>
  <Flex vertical :gap="16">
    <Text strong :style="{ fontSize: 'var(--apollo-font-size-lg)' }">titleSpan = 100px</Text>
    <Timeline :items="items" title-span="100px" />
    <Text strong :style="{ fontSize: 'var(--apollo-font-size-lg)' }">titleSpan = 25%</Text>
    <Timeline :items="items" title-span="25%" />
    <Text strong :style="{ fontSize: 'var(--apollo-font-size-lg)' }">titleSpan = 18, mode = end</Text>
    <Timeline :items="items" :title-span="18" mode="end" />
  </Flex>
</template>
