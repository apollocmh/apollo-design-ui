<script setup lang="ts">
// 对齐 antd 的 `title-span` demo。
import { Flex, Timeline, Title } from '@apollo-design/ui';

const items = [
  { title: '05:10', content: 'Create a services' },
  { title: '09:03', content: 'Solve initial network problems' },
  { content: 'Technical testing' },
  { title: '11:28', content: 'Network problems being solved' },
];
</script>

<template>
  <Flex vertical :gap="16">
    <Title :level="5" :style="{ margin: 0 }">titleSpan = 100px</Title>
    <Timeline :items="items" title-span="100px" />
    <Title :level="5" :style="{ margin: 0 }">titleSpan = 25%</Title>
    <Timeline :items="items" title-span="25%" />
    <Title :level="5" :style="{ margin: 0 }">titleSpan = 18, mode = end</Title>
    <Timeline :items="items" :title-span="18" mode="end" />
  </Flex>
</template>
