<script setup lang="ts">
// 对齐 antd 的 max-count demo（「maxCount 包含溢出元素」）。
import { Avatar, AvatarGroup, Flex, InputNumber, Switch } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const avatarCount = ref(4);
const overflowInFinal = ref(true);

const mergedMaxCount = computed(() => (overflowInFinal.value ? 2 : 3));
</script>

<template>
  <Flex vertical gap="middle">
    <Flex :gap="24">
      <span>Avatar count: </span>
      <InputNumber
        :style="{ width: '120px' }"
        :min="2"
        :max="10"
        :value="avatarCount"
        aria-label="Avatar count"
        @update:value="(v) => typeof v === 'number' && (avatarCount = v)"
      />
    </Flex>
    <Flex :gap="8">
      <span>overflowInFinal: </span>
      <Switch :checked="overflowInFinal" aria-label="overflowInFinal" @update:checked="(v) => (overflowInFinal = v)" />

      <AvatarGroup
        :max="{ count: mergedMaxCount, style: { backgroundColor: '#52c41a', color: '#1f1f1f' } }"
      >
        <Avatar v-for="i in avatarCount" :key="i" style="background: #f56a00; color: #1f1f1f">{{ String.fromCharCode(64 + i) }}</Avatar>
      </AvatarGroup>
    </Flex>
  </Flex>
</template>
