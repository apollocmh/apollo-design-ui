<script setup lang="ts">
// 受控展开：expanded + onExpand
import type { EllipsisConfig } from '@apollo-design/ui';
import { Button, Paragraph } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const expanded = ref(false);
const longText =
  'Ant Design, a design language for background applications, is refined by Ant UED Team. ' +
  'This sentence is intentionally long enough to overflow a narrow box, so the component has ' +
  'to decide where to cut it.';

function onExpand(_event: MouseEvent, info: { expanded: boolean }): void {
  expanded.value = info.expanded;
}

function toggle(): void {
  expanded.value = !expanded.value;
}

const symbol = (isExpanded: boolean): string => (isExpanded ? '收起' : '展开');

const ellipsisConfig = computed<EllipsisConfig>(() => ({
  rows: 2,
  expandable: true,
  expanded: expanded.value,
  onExpand,
  symbol,
}));
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 280px; font-family: sans-serif"
  >
    <Paragraph :ellipsis="ellipsisConfig">{{ longText }}</Paragraph>
    <div>
      <Button size="small" @click="toggle">切换 expanded</Button>
      <span style="margin-left: 8px; color: #999; font-size: 12px">
        当前：{{ expanded ? '展开' : '收起' }}
      </span>
    </div>
  </div>
</template>
