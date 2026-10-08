<script setup lang="ts">
// 对齐 antd 的 duration demo
import { BorderBeam } from '@apollo-design/ui';
</script>

<template>
  <BorderBeam :duration="12">
    <div style="position: relative; border: 1px solid #ddd; border-radius: 8px; padding: 24px">Slower</div>
  </BorderBeam>
</template>
