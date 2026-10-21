<script setup lang="ts">
// expandable：展开后是否还能收起，以及自定义展开文案
import type { EllipsisConfig } from '@apollo-design/ui';
import { Paragraph } from '@apollo-design/ui';
import { ref } from 'vue';

const longText =
  'Ant Design, a design language for background applications, is refined by Ant UED Team. ' +
  'This sentence is intentionally long enough to overflow a narrow box, so the component has ' +
  'to decide where to cut it.';

const lastAction = ref('');

function onExpand(_event: MouseEvent, info: { expanded: boolean }): void {
  lastAction.value = info.expanded ? '展开' : '收起';
}

const symbol = (isExpanded: boolean): string => (isExpanded ? '收起' : '展开更多');

const basicConfig: EllipsisConfig = { rows: 2, expandable: true };
const collapsibleConfig: EllipsisConfig = {
  rows: 2,
  expandable: 'collapsible',
  symbol,
  onExpand,
};
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 16px; width: 300px; font-family: sans-serif"
  >
    <Paragraph :ellipsis="basicConfig">{{ longText }}</Paragraph>
    <Paragraph :ellipsis="collapsibleConfig">{{ longText }}</Paragraph>
    <div style="font-size: 12px; color: #999">最近一次操作：{{ lastAction || '-' }}</div>
  </div>
</template>
