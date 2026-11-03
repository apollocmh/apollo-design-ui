<script setup lang="ts">
// 对齐 antd 的 badge demo。

import { UserOutlined } from '@apollo-design/icons';
import { Avatar, Badge, Space } from '@apollo-design/ui';
import { h } from 'vue';

const icon = () => h(UserOutlined);
</script>

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
