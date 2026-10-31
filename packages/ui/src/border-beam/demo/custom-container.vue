<script setup lang="ts">
// 原生 class/style 修饰宿主；styles.effect 只修饰装饰层。
import { BorderBeam } from '@apollo-design/ui';
</script>

<template>
  <BorderBeam :size="40" class="custom-beam-host" :style="{ padding: '8px' }" :styles="{ effect: { opacity: 0.8 } }">
    <div
      style="position: relative; border-radius: 16px; height: 64px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd"
    >
      Custom container
    </div>
  </BorderBeam>
</template>
