const e=`<script setup lang="ts">
// 对齐 antd demo/info-position.tsx
import { Flex, Progress } from '@apollo-design/ui';
<\/script>

<template>
  <Flex gap="small" vertical>
    <Progress :percent="0" :percent-position="{ align: 'center', type: 'inner' }" :size="[200, 20]" stroke-color="#E6F4FF" />
    <Progress :percent="10" :percent-position="{ align: 'center', type: 'inner' }" :size="[300, 20]" />
    <Progress :percent="50" :percent-position="{ align: 'start', type: 'inner' }" :size="[300, 20]" stroke-color="#B7EB8F" />
    <Progress :percent="60" :percent-position="{ align: 'end', type: 'inner' }" :size="[300, 20]" stroke-color="#001342" />
    <Progress :percent="100" :percent-position="{ align: 'center', type: 'inner' }" :size="[400, 20]" />
    <Progress :percent="60" :percent-position="{ align: 'start', type: 'outer' }" />
    <Progress :percent="100" :percent-position="{ align: 'start', type: 'outer' }" />
    <Progress :percent="60" :percent-position="{ align: 'center', type: 'outer' }" size="small" />
    <Progress :percent="100" :percent-position="{ align: 'center', type: 'outer' }" />
  </Flex>
</template>
`;export{e as default};
