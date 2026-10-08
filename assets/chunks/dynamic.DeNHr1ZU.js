const n=`<script setup lang="ts">
// 对齐 antd demo/dynamic.tsx
import { MinusOutlined, PlusOutlined } from '@apollo-design/icons';
import { Button, Flex, Progress, SpaceCompact } from '@apollo-design/ui';
import { ref } from 'vue';

const percent = ref<number>(0);

const increase = () => {
  percent.value = Math.min(100, percent.value + 10);
};
const decline = () => {
  percent.value = Math.max(0, percent.value - 10);
};
<\/script>

<template>
  <Flex vertical gap="small">
    <Flex vertical gap="small">
      <Progress :percent="percent" type="line" />
      <Progress :percent="percent" type="circle" />
    </Flex>
    <SpaceCompact>
      <Button @click="decline"><MinusOutlined /></Button>
      <Button @click="increase"><PlusOutlined /></Button>
    </SpaceCompact>
  </Flex>
</template>
`;export{n as default};
