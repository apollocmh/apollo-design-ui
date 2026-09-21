<script setup lang="ts">
// 对齐 antd 的 line-width demo
import { BorderBeam } from '@apollo-design/ui';
</script>

<template>
  <div style="position: relative; border: 8px solid #ddd; border-radius: 8px; padding: 24px">
    <BorderBeam :line-width="8" />
    Thick border
  </div>
</template>
