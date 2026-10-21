<script setup lang="ts">
// 对齐 antd 的 component-token demo：覆盖轨迹与节点的尺寸、颜色。
import type { TimelineItemType } from '@apollo-design/ui';
import { Timeline } from '@apollo-design/ui';

const items: TimelineItemType[] = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01', color: 'blue' },
  { content: 'Technical testing 2015-09-01', color: 'green' },
  { content: 'Network problems being solved 2015-09-01' },
];
</script>

<template>
  <div class="demo-timeline-token">
    <Timeline :items="items" />
  </div>
</template>

<style>
.demo-timeline-token .apollo-timeline {
  --apollo-timeline-tail-color: #91caff;
  --apollo-timeline-tail-width: 3px;
  --apollo-timeline-dot-size: 14px;
  --apollo-timeline-dot-bg: #e6f4ff;
  --apollo-timeline-dot-border-width: 3px;
  --apollo-timeline-item-padding-bottom: 28px;
}
</style>
