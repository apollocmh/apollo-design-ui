const n=`<script setup lang="ts">
// 对齐 antd 的 style-class demo（6.0 语义槽位）
import { Badge } from '@apollo-design/ui';
<\/script>

<template>
  <Badge
    :count="5"
    :class-names="{ indicator: 'demo-indicator-cls' }"
    :styles="{ indicator: { backgroundColor: '#52c41a' } }"
  >
    <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
  </Badge>
</template>
`;export{n as default};
