const e=`<script setup lang="ts">
// 对齐 antd demo/linecap.tsx
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex vertical gap="small">
    <Progress stroke-linecap="butt" :percent="75" />
    <Flex wrap gap="small">
      <Progress stroke-linecap="butt" type="circle" :percent="75" />
      <Progress stroke-linecap="butt" type="dashboard" :percent="75" />
    </Flex>
  </Flex>
</template>
`;export{e as default};
