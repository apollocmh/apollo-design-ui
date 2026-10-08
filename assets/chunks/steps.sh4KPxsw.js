const e=`<script setup lang="ts">
// 对齐 antd demo/steps.tsx（antd colors green[6]=#52c41a / red[5]=#ff7875）
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex gap="small" vertical>
    <Progress :percent="50" :steps="3" />
    <Progress :percent="30" :steps="5" />
    <Progress :percent="100" :steps="5" size="small" stroke-color="#52c41a" />
    <Progress :percent="60" :steps="5" :stroke-color="['#52c41a', '#52c41a', '#ff7875']" />
  </Flex>
</template>
`;export{e as default};
