<script setup lang="ts">
// 自定义页签节点：刻意保留原生 button，演示自建 tablist 的 ARIA 与焦点职责。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: '概览', forceRender: true, children: '概览面板：展示核心指标与最近动态。' },
  { key: '2', label: '成员', forceRender: true, children: '成员面板：管理团队成员与权限。' },
  {
    key: '3',
    label: '设置',
    forceRender: true,
    children: '设置面板：调整通知、主题与集成。',
  },
];

function onTabKeydown(
  event: KeyboardEvent,
  index: number,
  onTabClick: (key: string, event: KeyboardEvent) => void,
): void {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    return;
  }
  event.preventDefault();
  const current = event.currentTarget as HTMLElement | null;
  const buttons = current?.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  const list = buttons ? Array.from(buttons) : [];
  if (!list.length) {
    return;
  }
  let nextIndex = index;
  if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = list.length - 1;
  } else {
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    nextIndex = (index + offset + list.length) % list.length;
  }
  list[nextIndex]?.focus();
  const nextItem = items[nextIndex];
  if (nextItem) {
    onTabClick(nextItem.key, event);
  }
}
</script>

<template>
  <Tabs id="demo-custom-tab-bar-node" default-active-key="1" :items="items">
    <template #tabBar="{ id, activeKey, onTabClick }">
      <div role="tablist" aria-label="自定义页签导航" class="demo-tab-bar-node">
        <button
          v-for="(item, index) in items"
          :id="id ? `${id}-tab-${item.key}` : undefined"
          :key="item.key"
          type="button"
          role="tab"
          :aria-selected="item.key === activeKey"
          :aria-controls="id ? `${id}-panel-${item.key}` : undefined"
          :tabindex="item.key === activeKey ? 0 : -1"
          class="demo-tab-bar-node__tab"
          :class="{ 'demo-tab-bar-node__tab--active': item.key === activeKey }"
          @click="(event: MouseEvent) => onTabClick(item.key, event)"
          @keydown="(event: KeyboardEvent) => onTabKeydown(event, index, onTabClick)"
        >
          <span class="demo-tab-bar-node__dot" aria-hidden="true" />
          {{ item.label }}
        </button>
      </div>
    </template>
  </Tabs>
</template>

<style>
.demo-tab-bar-node {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px;
  border-radius: 999px;
  background: var(--apollo-color-fill-secondary);
}

.demo-tab-bar-node__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--apollo-color-text-secondary);
  font: inherit;
  cursor: pointer;
}

.demo-tab-bar-node__tab:hover {
  color: var(--apollo-color-primary);
}

.demo-tab-bar-node__tab--active {
  border-color: var(--apollo-color-primary-border);
  background: var(--apollo-color-bg-container);
  color: var(--apollo-color-primary-text);
  box-shadow: 0 2px 6px rgb(114 46 209 / 16%);
}

.demo-tab-bar-node__tab:focus-visible {
  outline: 2px solid var(--apollo-color-primary);
  outline-offset: 2px;
}

.demo-tab-bar-node__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
</style>
