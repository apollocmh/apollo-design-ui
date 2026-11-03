<script setup lang="ts">
// 对齐 antd 的 scrollTo 用法
import { Button, Listy, type ListyRef, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const items = Array.from({ length: 100 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const listyRef = ref<ListyRef>();
</script>

<template>
  <div>
    <Space wrap style="margin-bottom: 12px">
      <Button @click="listyRef?.scrollTo(0)">到顶部</Button>
      <Button @click="listyRef?.scrollTo({ key: 80, align: 'top' })">
        滚到 Item 80
      </Button>
    </Space>
    <Listy ref="listyRef" :items="items" row-key="key" :height="240">
      <template #default="{ item }">{{ item.content }}</template>
    </Listy>
  </div>
</template>
