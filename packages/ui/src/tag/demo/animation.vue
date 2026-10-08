<script setup lang="ts">
// 对齐 antd 的 animation demo（关闭后 -hidden 淡出隐藏；关闭动画由 transition 提供）

import { Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(true);
</script>

<template>
  <!-- antd 6 的 Tag 无默认外边距（间距由 Tag.Group/Space 提供）；demo 里与裸 button
       相邻会贴死，这里与 antd 站点一致给出 8px 间距 -->
  <Tag v-if="visible" closable :style="{ marginInlineEnd: '8px' }" @close="visible = false"
    >Tag 1</Tag
  >
  <button @click="visible = true">Reset</button>
</template>
