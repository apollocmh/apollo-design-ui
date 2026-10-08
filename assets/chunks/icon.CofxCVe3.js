const n=`<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button, Space } from '../../index';
<\/script>

<template>
  <Space wrap>
    <Button type="primary" :icon="SearchOutlined">Search</Button>
    <Button :icon="SearchOutlined" icon-placement="end">Search</Button>
    <Button type="primary" :icon="SearchOutlined" />
    <!-- 用插槽传图标 -->
    <Button type="primary">
      <template #icon><SearchOutlined /></template>
      Slot icon
    </Button>
  </Space>
</template>
`;export{n as default};
