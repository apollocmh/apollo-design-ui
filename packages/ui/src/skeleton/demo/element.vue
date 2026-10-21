<script setup lang="ts">
// 对齐 antd 的 element demo：五个骨架元素独立组合
import { Button, Flex, Skeleton } from '@apollo-design/ui';
import { ref } from 'vue';

const active = ref(true);
</script>

<template>
  <Flex vertical gap="middle">
    <Button size="small" style="width: 140px" @click="active = !active">
      {{ active ? '关闭微光动画' : '开启微光动画' }}
    </Button>
    <Flex gap="large" align="center" wrap>
      <Skeleton.Avatar :active="active" size="large" shape="circle" />
      <Skeleton.Avatar :active="active" size="large" shape="square" />
      <Skeleton.Button :active="active" size="large" />
      <Skeleton.Input :active="active" size="large" />
      <Skeleton.Image :active="active" />
    </Flex>
    <Skeleton.Button :active="active" block />
  </Flex>
</template>
