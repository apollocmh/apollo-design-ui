<script setup lang="ts">
// 对齐 antd demo/character-function.tsx（character fn → #character 作用域插槽）
import { FrownOutlined, MehOutlined, SmileOutlined } from '@apollo-design/icons';
import { Flex, Rate } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const customIcons: Record<number, VNodeChild> = {
  1: h(FrownOutlined),
  2: h(FrownOutlined),
  3: h(MehOutlined),
  4: h(SmileOutlined),
  5: h(SmileOutlined),
};
</script>

<template>
  <Flex vertical gap="medium">
    <Rate :default-value="2" #character="{ index }">
      {{ index + 1 }}
    </Rate>
    <Rate :default-value="3" #character="{ index }">
      <component :is="customIcons[index + 1]" />
    </Rate>
  </Flex>
</template>
