<script setup lang="ts">
// 对齐 antd 的 scrollTo 用法
import { Listy, type ListyRef } from '@apollo-design/ui';
import { ref } from 'vue';

const items = Array.from({ length: 100 }, (_, i) => ({ key: i, content: `Item ${i}` }));
const listyRef = ref<ListyRef>();
</script>

<template>
  <div>
    <div style="margin-bottom: 12px">
      <button type="button" @click="listyRef?.scrollTo(0)">到顶部</button>
      <button type="button" style="margin-left: 8px" @click="listyRef?.scrollTo({ key: 80, align: 'top' })">
        滚到 Item 80
      </button>
    </div>
    <Listy ref="listyRef" :items="items" row-key="key" :height="240">
      <template #default="{ item }">{{ item.content }}</template>
    </Listy>
  </div>
</template>
