<script setup lang="ts">
// 对齐 antd 的 max-count demo（「maxCount 包含溢出元素」）。
import { Avatar, AvatarGroup, Flex, InputNumber, Switch } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const avatarCount = ref(4);
const overflowInFinal = ref(true);

const mergedMaxCount = computed(() => (overflowInFinal.value ? 2 : 3));

const avatars = computed(() =>
  Array.from({ length: avatarCount.value }, (_, i) =>
    h(
      Avatar,
      { key: i, style: { backgroundColor: '#f56a00' } },
      { default: () => String.fromCharCode(65 + i) },
    ),
  ),
);
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
        @update:value="(v) => v != null && (avatarCount = v)"
      />
    </Flex>
    <Flex :gap="8">
      <span>overflowInFinal: </span>
      <Switch :checked="overflowInFinal" aria-label="overflowInFinal" @update:checked="(v) => (overflowInFinal = v)" />

      <AvatarGroup
        :max="{ count: mergedMaxCount, style: { backgroundColor: '#52c41a', color: '#fff' } }"
      >
        <component :is="() => avatars" />
      </AvatarGroup>
    </Flex>
  </Flex>
</template>
