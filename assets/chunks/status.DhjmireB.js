const t=`<script setup lang="ts">
// 对齐 antd 的 status demo
import { Badge, Space } from '@apollo-design/ui';
<\/script>

<template>
  <Space wrap>
    <Badge status="success" text="Success" />
    <Badge status="error" text="Error" />
    <Badge status="default" text="Default" />
    <Badge status="processing" text="Processing" />
    <Badge status="warning" text="Warning" />
  </Space>
</template>
`;export{t as default};
