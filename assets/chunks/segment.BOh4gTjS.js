const e=`<script setup lang="ts">
// 对齐 antd demo/segment.tsx（success 分段）
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex gap="small" vertical>
    <Progress :percent="60" :success="{ percent: 30 }" title="3 done / 3 in progress / 4 to do" />
    <Flex gap="small" wrap>
      <Progress :percent="60" :success="{ percent: 30 }" type="circle" />
      <Progress :percent="60" :success="{ percent: 30 }" type="dashboard" />
    </Flex>
  </Flex>
</template>
`;export{e as default};
