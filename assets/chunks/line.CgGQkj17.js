const e=`<script setup lang="ts">
// 对齐 antd demo/line.tsx
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex gap="small" vertical>
    <Progress :percent="30" />
    <Progress :percent="50" status="active" />
    <Progress :percent="70" status="exception" />
    <Progress :percent="100" />
    <Progress :percent="50" :show-info="false" />
  </Flex>
</template>
`;export{e as default};
