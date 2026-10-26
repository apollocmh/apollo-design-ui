<script setup lang="ts">
import { Button, Timeline } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const empty = ref(false);
const reverse = ref(false);
const items = ref([
  { key: 'created', title: '2026-10-24', content: 'Created' },
  { key: 'reviewed', title: '2026-10-25', content: 'Reviewed' },
]);
const update = () => {
  items.value = items.value.map((item) => ({ ...item, content: `${item.content}!` }));
};
</script>

<template>
  <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap">
    <Button @click="custom = !custom">Toggle item slots</Button>
    <Button @click="empty = !empty">Toggle empty content</Button>
    <Button @click="reverse = !reverse">Reverse items</Button>
    <Button @click="update">Update item data</Button>
  </div>
  <Timeline :items="items" :reverse="reverse">
    <template v-if="custom" #itemTitle="{ item }">
      <time v-if="!empty" :datetime="String(item.title)">{{ item.title }}</time>
    </template>
    <template v-if="custom" #itemContent="{ item, index }">
      <div v-if="!empty">
        <strong>{{ item.content }} · {{ index }}</strong>
        <input :aria-label="`Note ${item.key}`" placeholder="Type, then reverse or update" />
      </div>
    </template>
    <template v-if="custom" #itemIcon="{ index }">
      <span v-if="!empty" aria-hidden="true">{{ index + 1 }}</span>
    </template>
  </Timeline>
</template>
