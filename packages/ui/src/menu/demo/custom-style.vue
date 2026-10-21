<script setup lang="ts">
// 自定义样式：组件 Token 变量 + `styles.itemContent` 语义槽。
import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref<string[]>(['1']);

const items: ItemType[] = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Projects' },
  { key: '3', label: 'Settings' },
];

const menuStyle = {
  width: '256px',
  '--apollo-menu-item-height': '44px',
  '--apollo-menu-item-border-radius': '10px',
  '--apollo-menu-item-margin-inline': '0px',
  '--apollo-menu-item-selected-bg': '#f0f5ff',
  '--apollo-menu-item-selected-color': '#2f54eb',
};

const styles = {
  itemContent: { fontWeight: 500 },
};
</script>

<template>
  <div class="demo-menu-custom-style">
    <Menu
      v-model:selectedKeys="current"
      mode="inline"
      :items="items"
      :styles="styles"
      :style="menuStyle"
    />
    <p class="demo-menu-custom-style-hint">当前选中：{{ current[0] }}</p>
  </div>
</template>

<style scoped>
.demo-menu-custom-style {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-menu-custom-style-hint {
  margin: 0;
  color: var(--apollo-color-text-secondary);
}
</style>
