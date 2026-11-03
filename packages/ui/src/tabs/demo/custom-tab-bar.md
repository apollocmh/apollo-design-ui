---
order: 11
title:
  zh-CN: 自定义导航区
  en-US: Custom tab bar
---

`#tabBar` 槽整体替换导航区（替代 `renderTabBar`）。这里使用 Apollo `Button`，补齐 tablist / tab 语义、面板关联及方向键、Home、End 导航。

```vue
<script setup lang="ts">
// 对齐 antd `custom-tab-bar.tsx`。⚠️ Vue 侧是 **scoped slot**（C8），
// 槽参数 = 上游 `renderTabBar` 的第一个实参（含 activeKey / items / onTabClick / extra …）。
import { Button, Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];

function onKeydown(event: KeyboardEvent): void {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  if (!(event.currentTarget instanceof HTMLElement)) return;
  event.preventDefault();
  const tabs = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
  );
  const index = tabs.findIndex((tab) => tab === event.currentTarget);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next]?.focus();
  tabs[next]?.click();
}
</script>

<template>
  <Tabs default-active-key="1" :items="items">
    <template #tabBar="{ id, activeKey, onTabClick }">
      <div role="tablist" aria-label="Custom tab bar" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px">
        <Button
          v-for="item in items"
          :key="item.key"
          :id="`${id}-tab-${item.key}`"
          :type="item.key === activeKey ? 'primary' : 'default'"
          role="tab"
          :aria-selected="item.key === activeKey"
          :aria-controls="`${id}-panel-${item.key}`"
          :tabindex="item.key === activeKey ? 0 : -1"
          :style="{ fontWeight: item.key === activeKey ? 700 : 400 }"
          @click="(e: MouseEvent) => onTabClick(item.key, e)"
          @keydown="onKeydown"
        >
          {{ item.label }}
        </Button>
      </div>
    </template>
  </Tabs>
</template>
```
