<script setup lang="ts">
// 对齐 antd 的 responsive demo。
import { Avatar } from '@apollo-design/ui';

const responsiveSize = { xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 };
</script>

<template>
  <Avatar :size="responsiveSize" />
</template>
