<script setup lang="ts">
// 对齐 antd 的 custom-container demo（任意可挂 ref 的宿主）
import { BorderBeam } from '@apollo-design/ui';
</script>

<template>
  <div style="border-radius: 16px">
    <BorderBeam :size="40" />
    <div style="height: 64px; display: flex; align-items: center; justify-content: center">Custom container</div>
  </div>
</template>
