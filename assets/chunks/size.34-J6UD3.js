const e=`<script setup lang="ts">
// 对齐 antd 的 size demo
import { Badge, Space } from '@apollo-design/ui';
<\/script>

<template>
  <Space wrap>
    <Badge :count="5">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
    <Badge :count="5" size="small">
      <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
  </Space>
</template>
`;export{e as default};
