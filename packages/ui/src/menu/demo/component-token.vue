<script setup lang="ts">
import { Button, ConfigProvider, type ItemType, Menu } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const current = ref<string[]>(['1']);
const alternate = ref(false);
const theme = computed(() => ({
  components: {
    Menu: alternate.value
      ? { itemBorderRadius: 2, activeBarWidth: 8, itemMarginInline: 2 }
      : { itemBorderRadius: 12, activeBarWidth: 4, itemMarginInline: 8 },
  },
}));
const items: ItemType[] = [
  { key: '1', label: 'Option 1' },
  { key: '2', label: 'Option 2' },
];
</script>

<template>
  <section>
    <Button style="margin-bottom: 12px" @click="alternate = !alternate">Switch Menu tokens</Button>
    <ConfigProvider :theme="theme">
      <Menu v-model:selectedKeys="current" mode="inline" :items="items" style="width: min(256px, 100%)" />
    </ConfigProvider>
  </section>
</template>
