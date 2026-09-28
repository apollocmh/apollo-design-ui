<script setup lang="ts">
// 对齐 antd demo/gradient-line.tsx

import type { ProgressProps } from '@apollo-design/ui';
import { Flex, Progress } from '@apollo-design/ui';

const twoColors: ProgressProps['strokeColor'] = {
  '0%': '#108ee9',
  '100%': '#87d068',
};

const conicColors: ProgressProps['strokeColor'] = {
  '0%': '#87d068',
  '50%': '#ffe58f',
  '100%': '#ffccc7',
};
</script>

<template>
  <Flex vertical gap="medium">
    <Progress :percent="99.9" :stroke-color="twoColors" />
    <Progress :percent="50" status="active" :stroke-color="{ from: '#108ee9', to: '#87d068' }" />
    <Flex gap="small" wrap>
      <Progress type="circle" :percent="90" :stroke-color="twoColors" />
      <Progress type="circle" :percent="100" :stroke-color="twoColors" />
      <Progress type="circle" :percent="93" :stroke-color="conicColors" />
    </Flex>
    <Flex gap="small" wrap>
      <Progress type="dashboard" :percent="90" :stroke-color="twoColors" />
      <Progress type="dashboard" :percent="100" :stroke-color="twoColors" />
      <Progress type="dashboard" :percent="93" :stroke-color="conicColors" />
    </Flex>
  </Flex>
</template>
