const e=`<script setup lang="ts">
// 对齐 antd demo/circle.tsx
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex gap="small" wrap>
    <Progress type="circle" :percent="75" />
    <Progress type="circle" :percent="70" status="exception" />
    <Progress type="circle" :percent="100" />
  </Flex>
</template>
`;export{e as default};
