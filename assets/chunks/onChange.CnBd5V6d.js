const n=`<script setup lang="ts">
// 对齐 antd 的 onChange demo：滚动时回调**当前锚点**。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];

const current = ref('');
<\/script>

<template>
  <div>
    <div style="margin-bottom: 8px">当前锚点：{{ current || '（无）' }}</div>
    <div style="display: flex; gap: 16px">
      <Anchor :items="items" :affix="false" @change="(link: string) => (current = link)" />
      <div style="flex: 1; height: 240px; overflow: auto">
        <div
          v-for="id in ['a', 'b', 'c']"
          :id="\`anchor-demo-\${id}\`"
          :key="id"
          style="height: 200px; margin-bottom: 16px; background: #f5f5f5; padding: 8px"
        >
          Section {{ id.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>
`;export{n as default};
