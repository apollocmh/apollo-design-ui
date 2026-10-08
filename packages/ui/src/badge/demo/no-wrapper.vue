<script setup lang="ts">
// 对齐 antd 的 no-wrapper demo（独立使用）
import { Badge, Space } from '@apollo-design/ui';
</script>

<template>
  <Space wrap>
    <Badge :count="25" />
    <Badge
      :count="4"
      :styles="{ indicator: { backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset' } }"
    />
    <Badge class="demo-cls" :styles="{ indicator: { backgroundColor: '#52c41a' } }" :count="54" />
  </Space>
</template>
