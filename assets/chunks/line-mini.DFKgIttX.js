const e=`<script setup lang="ts">
// 对齐 antd demo/line-mini.tsx
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex vertical gap="small" style="width: 180px">
    <Progress :percent="30" size="small" />
    <Progress :percent="50" size="small" status="active" />
    <Progress :percent="70" size="small" status="exception" />
    <Progress :percent="100" size="small" />
  </Flex>
</template>
`;export{e as default};
