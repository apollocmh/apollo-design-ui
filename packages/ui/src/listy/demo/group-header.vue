<script setup lang="ts">
// 对齐 antd 的 `group` 用法：VNode 组头 + 吸顶 + 按 groupKey 滚动。
import type { ListyRef } from '@apollo-design/ui';
import { Button, Listy, Tag, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const groupNames = ['Group A', 'Group B', 'Group C'];

const items = Array.from({ length: 36 }, (_, i) => ({
  key: i,
  group: groupNames[i % groupNames.length] ?? 'Group A',
  content: `Item ${i + 1}`,
}));

const listyRef = ref<ListyRef>();

const group = { key: (item: (typeof items)[number]) => item.group };

const scrollToGroup = (key: string) => {
  listyRef.value?.scrollTo({ groupKey: key, align: 'top' });
};
</script>

<template>
  <div>
    <div style="display: flex; gap: 8px; margin-bottom: 12px">
      <Button v-for="name in groupNames" :key="name" size="small" @click="scrollToGroup(name)">
        {{ name }}
      </Button>
    </div>
    <Listy ref="listyRef" :items="items" row-key="key" :group="group" sticky :height="280">
      <template #groupHeader="{ groupKey, items: groupItems }">
        <div style="display: flex; align-items: center; gap: 8px">
          <Tag color="blue">{{ groupKey }}</Tag>
          <Text type="secondary">{{ groupItems.length }} items</Text>
        </div>
      </template>
      <template #default="{ item }">{{ item.content }}</template>
    </Listy>
  </div>
</template>
