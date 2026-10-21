<script setup lang="ts">
// 对齐 antd 的 `itemRender` 用法：用 prop 渲染每一行，并用 onScroll 反馈滚动位置。
import type { ListyRef } from '@apollo-design/ui';
import { Button, Listy, Text } from '@apollo-design/ui';
import { h, ref } from 'vue';

const items = ref(
  Array.from({ length: 60 }, (_, i) => ({ key: i, content: `Item ${i + 1}`, done: i % 4 === 0 })),
);

const listyRef = ref<ListyRef>();
const scrollTop = ref(0);

const itemRender = (item: unknown, index: number) => {
  const row = item as (typeof items.value)[number];
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      },
    },
    [
      h(Text, { delete: row.done }, () => `${index + 1}. ${row.content}`),
      h(
        Button,
        {
          size: 'small',
          type: row.done ? 'default' : 'primary',
          onClick: () => {
            row.done = !row.done;
          },
        },
        () => (row.done ? 'Undo' : 'Done'),
      ),
    ],
  );
};

const onScroll = (event: Event) => {
  scrollTop.value = Math.round((event.target as HTMLElement).scrollTop);
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
      :item-render="itemRender"
      @scroll="onScroll"
    />
  </div>
</template>
