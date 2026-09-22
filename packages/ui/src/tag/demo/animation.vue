<script setup lang="ts">
// 对齐 antd 的 animation demo（关闭后 -hidden 淡出隐藏；关闭动画由 transition 提供）

import { Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(true);
</script>

<template>
  <Tag v-if="visible" closable @close="visible = false">Tag 1</Tag>
  <button @click="visible = true">Reset</button>
</template>
