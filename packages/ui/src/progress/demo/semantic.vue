<script setup lang="ts">
// 对齐 antd demo/semantic.tsx（语义面函数式 styles）

import type { ProgressProps } from '@apollo-design/ui';
import { Flex, Progress } from '@apollo-design/ui';

const classNames: ProgressProps['classNames'] = {
  root: 'demo-progress-root',
  rail: 'demo-progress-rail',
  track: 'demo-progress-track',
};

const stylesFn: ProgressProps['styles'] = (info) => {
  const percent = info?.props?.percent ?? 0;
  const hue = 200 - (200 * percent) / 100;
  return {
    track: {
      backgroundImage: `linear-gradient(to right, hsla(${hue}, 85%, 65%, 1), hsla(${hue + 30}, 90%, 55%, 0.95))`,
      borderRadius: '8px',
      transition: 'all 0.3s ease',
    },
    rail: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
    },
  };
};
</script>

<template>
  <Flex gap="small" vertical style="width: 300px">
    <Progress :percent="50" :class-names="classNames" :styles="stylesFn" />
    <Progress :percent="80" :class-names="classNames" :styles="stylesFn" />
    <Progress :percent="100" :class-names="classNames" :styles="stylesFn" />
  </Flex>
</template>
