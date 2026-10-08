const n=`<script setup lang="ts">
// 对齐 antd 的 badge demo。
import { Avatar, Badge, Space } from '@apollo-design/ui';
import { h } from 'vue';

const icon = () =>
  h('span', {
    style: { display: 'inline-block', width: '1em', height: '1em', background: '#999' },
  });
<\/script>

<template>
  <Space :size="24">
    <Badge :count="1">
      <Avatar shape="square" :icon="icon()" />
    </Badge>
    <Badge dot>
      <Avatar shape="square" :icon="icon()" />
    </Badge>
  </Space>
</template>
`;export{n as default};
