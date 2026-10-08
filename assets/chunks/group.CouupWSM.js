const a=`<script setup lang="ts">
// 对齐 antd 的 group demo。⚠️ 图片用 **data URI**（外网图片会污染 L6 基线）
import { Avatar, AvatarGroup, Divider, Tooltip } from '@apollo-design/ui';
import { h } from 'vue';

const url =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const icon = () =>
  h('span', {
    style: { display: 'inline-block', width: '1em', height: '1em', background: '#999' },
  });
const maxStyle = { color: '#f56a00', backgroundColor: '#fde3cf' };
<\/script>

<template>
  <AvatarGroup>
    <Avatar :src="url" alt="a" />
    <a href="https://ant.design">
      <Avatar :style="{ backgroundColor: '#f56a00' }">K</Avatar>
    </a>
    <Tooltip title="Ant User" placement="top">
      <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
    </Tooltip>
    <Avatar :style="{ backgroundColor: '#1677ff' }" :icon="icon()" />
  </AvatarGroup>
  <Divider />
  <AvatarGroup :max="{ count: 2, style: maxStyle }">
    <Avatar :src="url" alt="a" />
    <Avatar :style="{ backgroundColor: '#f56a00' }">K</Avatar>
    <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
    <Avatar :style="{ backgroundColor: '#1677ff' }" :icon="icon()" />
  </AvatarGroup>
  <Divider />
  <AvatarGroup size="large" :max="{ count: 2, style: maxStyle }">
    <Avatar :src="url" alt="a" />
    <Avatar :style="{ backgroundColor: '#f56a00' }">K</Avatar>
    <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
    <Avatar :style="{ backgroundColor: '#1677ff' }" :icon="icon()" />
  </AvatarGroup>
  <Divider />
  <AvatarGroup shape="square">
    <Avatar :style="{ backgroundColor: '#fde3cf' }">A</Avatar>
    <Avatar :style="{ backgroundColor: '#f56a00' }">K</Avatar>
    <Avatar :style="{ backgroundColor: '#87d068' }" :icon="icon()" />
    <Avatar :style="{ backgroundColor: '#1677ff' }" :icon="icon()" />
  </AvatarGroup>
</template>
`;export{a as default};
