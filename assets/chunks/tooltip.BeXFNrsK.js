const n=`<script setup lang="ts">
// 对齐 antd demo/tooltip.tsx（折叠态 tooltip 标题 —— inline-collapsed 的tooltip 通道）

import { MailOutlined, PieChartOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Button, Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const collapsed = ref(true);
const current = ref<string[]>(['1']);

const items: ItemType[] = [
  { key: '1', label: 'Option 1', icon: h(PieChartOutlined) },
  { key: '2', label: 'Option 2', icon: h(MailOutlined) },
];
<\/script>

<template>
  <div style="width: 80px">
    <Button style="margin-bottom: 16px" @click="collapsed = !collapsed">
      {{ collapsed ? 'Expand' : 'Collapse' }}
    </Button>
    <Menu
      v-model:selectedKeys="current"
      mode="inline"
      :inline-collapsed="collapsed"
      :items="items"
    />
  </div>
</template>
`;export{n as default};
