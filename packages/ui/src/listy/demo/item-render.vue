<script setup lang="ts">
// Scoped item content and the real native scroll notification.
import type { ListyRef } from '@apollo-design/ui';
import { Button, Listy, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const items = ref(
  Array.from({ length: 60 }, (_, i) => ({ key: i, content: `Item ${i + 1}`, done: i % 4 === 0 })),
);

const listyRef = ref<ListyRef>();
const scrollTop = ref(0);

const onScroll = (event: Event) => {
  if (event.target instanceof HTMLElement) scrollTop.value = Math.round(event.target.scrollTop);
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
      <Button size="small" @click="listyRef?.scrollTo({ key: 40, align: 'top' })">
        滚动到 Item 40
      </Button>
      <Text type="secondary">scrollTop: {{ scrollTop }}px</Text>
    </div>
    <Listy
      ref="listyRef"
      :items="items"
      row-key="key"
      :height="240"
      @scroll="onScroll"
    >
      <template #default="{ item, index }">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
          <Text :delete="item.done">{{ index + 1 }}. {{ item.content }}</Text>
          <Button size="small" :type="item.done ? 'default' : 'primary'" @click="item.done = !item.done">
            {{ item.done ? 'Undo' : 'Done' }}
          </Button>
        </div>
      </template>
    </Listy>
  </div>
</template>
