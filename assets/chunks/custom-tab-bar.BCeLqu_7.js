const e=`<script setup lang="ts">
// 对齐 antd \`custom-tab-bar.tsx\`。⚠️ Vue 侧是 **scoped slot**（C8），
// 槽参数 = 上游 \`renderTabBar\` 的第一个实参（含 activeKey / items / onTabClick / extra …）。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
<\/script>

<template>
  <Tabs default-active-key="1" :items="items">
    <template #tabBar="{ activeKey, onTabClick }">
      <div style="display: flex; gap: 8px">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          :style="{ fontWeight: item.key === activeKey ? 700 : 400 }"
          @click="(e: MouseEvent) => onTabClick(item.key, e)"
        >
          {{ item.label }}
        </button>
      </div>
    </template>
  </Tabs>
</template>
`;export{e as default};
