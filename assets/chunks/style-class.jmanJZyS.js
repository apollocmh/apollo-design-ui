const s=`<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（对象式语义面）

import type { ProgressProps } from '@apollo-design/ui';
import { Flex, Progress } from '@apollo-design/ui';

const classNames: ProgressProps['classNames'] = {
  root: 'demo-sc-root',
  indicator: 'demo-sc-indicator',
};

const styles: ProgressProps['styles'] = {
  rail: { backgroundColor: '#f5f5f5' },
  track: { borderRadius: '8px' },
};
<\/script>

<template>
  <Flex gap="small" vertical style="width: 300px">
    <Progress :percent="50" :class-names="classNames" :styles="styles" />
  </Flex>
</template>
`;export{s as default};
