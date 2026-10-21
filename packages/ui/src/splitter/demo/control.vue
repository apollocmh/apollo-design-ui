<script setup lang="ts">
// 对齐 antd 的 control demo：size 受控 + resize 事件同步
import { Button, Flex, Splitter } from '@apollo-design/ui';
import { ref } from 'vue';

const sizes = ref<(number | string)[]>(['30%', '70%']);
const presets = [20, 30, 50];

const onResize = (next: number[]) => {
  sizes.value = next.map((size) => Math.round(size));
};

const applyPreset = (left: number) => {
  sizes.value = [`${left}%`, `${100 - left}%`];
};

const formatSize = (size: number | string | undefined): string => {
  if (typeof size === 'number') return `${Math.round(size)}px`;
  return size ?? '-';
};
</script>

<template>
  <Flex vertical gap="middle">
    <Flex gap="small" wrap>
      <Button v-for="preset in presets" :key="preset" @click="applyPreset(preset)">
        {{ preset }} / {{ 100 - preset }}
      </Button>
    </Flex>
    <Splitter style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9" @resize="onResize">
      <Splitter.Panel :size="sizes[0]">左侧（受控 size）</Splitter.Panel>
      <Splitter.Panel :size="sizes[1]">右侧（受控 size）</Splitter.Panel>
    </Splitter>
    <p>当前受控尺寸：{{ formatSize(sizes[0]) }} / {{ formatSize(sizes[1]) }}</p>
  </Flex>
</template>
