const t=`<script setup lang="ts">
// 对齐 antd demo/basic.tsx（最简用法）
import { Button, Popover } from '@apollo-design/ui';
<\/script>

<template>
  <Popover title="Title">
    <template #content>
      <p style="margin: 0">Content</p>
      <p style="margin: 0">Content</p>
    </template>
    <Button type="primary">Hover me</Button>
  </Popover>
</template>
`;export{t as default};
