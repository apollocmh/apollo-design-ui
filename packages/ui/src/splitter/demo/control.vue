<script setup lang="ts">
// 接受 resize 提议、显式重置与撤回 size 控制。
import { Button, Flex, Splitter } from '@apollo-design/ui';
import { ref } from 'vue';

const sizes = ref<(number | string)[] | undefined>(['30%', '70%']);
const presets = [20, 30, 50];

const onResize = (next: number[]) => {
  if (sizes.value !== undefined) sizes.value = next.map((size) => Math.round(size));
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
      <Button @click="sizes = undefined">撤回控制</Button>
      <Button @click="applyPreset(30)">重置为 30 / 70</Button>
    </Flex>
    <Splitter style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9" @resize="onResize">
      <Splitter.Panel :size="sizes?.[0]">左侧（受控 size）</Splitter.Panel>
      <Splitter.Panel :size="sizes?.[1]">右侧（受控 size）</Splitter.Panel>
    </Splitter>
    <p>当前受控尺寸：{{ sizes ? `${formatSize(sizes[0])} / ${formatSize(sizes[1])}` : '非受控，保留最后接受的比例' }}</p>
  </Flex>
</template>
