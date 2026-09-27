<script setup lang="ts">
// 对齐 antd demo/character.tsx（C8-R2：character ReactNode → #character 插槽）
import { HeartOutlined } from '@apollo-design/icons';
import { Flex, Rate } from '@apollo-design/ui';
import { h } from 'vue';
</script>

<template>
  <Flex vertical gap="medium">
    <Rate allow-half #character>
      <HeartOutlined />
    </Rate>
    <Rate allow-half style="font-size: 36px" #character>A</Rate>
    <Rate allow-half #character>好</Rate>
  </Flex>
</template>
