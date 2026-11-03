<script setup lang="ts">
// 对齐 antd 的 basic demo。

import { UserOutlined } from '@apollo-design/icons';
import { Avatar, Space } from '@apollo-design/ui';
import { h } from 'vue';

// 本地图标随库发布，不依赖外链资源。
const icon = () => h(UserOutlined);
</script>

<template>
  <Space vertical :size="16">
    <Space wrap :size="16">
      <Avatar :size="64" :icon="icon()" />
      <Avatar size="large" :icon="icon()" />
      <Avatar :icon="icon()" />
      <Avatar size="small" :icon="icon()" />
      <Avatar :size="14" :icon="icon()" />
    </Space>
    <Space wrap :size="16">
      <Avatar shape="square" :size="64" :icon="icon()" />
      <Avatar shape="square" size="large" :icon="icon()" />
      <Avatar shape="square" :icon="icon()" />
      <Avatar shape="square" size="small" :icon="icon()" />
      <Avatar shape="square" :size="14" :icon="icon()" />
    </Space>
  </Space>
</template>
