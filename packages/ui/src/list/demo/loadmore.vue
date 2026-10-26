<script setup lang="ts">
// 对齐 antd 的 `loadmore` demo。
import { Button, List, ListItem } from '@apollo-design/ui';
import { computed, onScopeDispose, ref } from 'vue';

const ALL = [
  'Racing car sprays burning fuel into crowd.',
  'Japanese princess to wed commoner.',
  'Australian walks 100km after outback crash.',
  'Man charged over missing wedding girl.',
  'Los Angeles battles huge wildfires.',
];

const loading = ref(false);
const count = ref(2);
const data = computed(() => ALL.slice(0, count.value));
let pending: ReturnType<typeof setTimeout> | undefined;
onScopeDispose(() => clearTimeout(pending));

const loadMore = () => {
  if (loading.value || count.value >= ALL.length) return;
  loading.value = true;
  // ⚠️ 上游 demo 用 `setTimeout` 模拟请求；这里保留同样的形态（固定 500ms，可复现）
  pending = setTimeout(() => {
    count.value = Math.min(count.value + 2, ALL.length);
    loading.value = false;
  }, 500);
};
</script>

<template>
  <List :loading="loading" :data-source="data">
    <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
    <template #loadMore>
      <div style="text-align: center; margin-top: 12px">
        <Button v-if="data.length < ALL.length" :loading="loading" @click="loadMore">
          loading more
        </Button>
        <span v-else>没有更多了</span>
      </div>
    </template>
  </List>
</template>
