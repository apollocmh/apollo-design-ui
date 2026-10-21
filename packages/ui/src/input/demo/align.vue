<script setup lang="ts">
// 对齐方式：通过根元素 style 的 text-align 控制输入文本对齐
import { Input } from '@apollo-design/ui';
import { ref } from 'vue';

const left = ref('left aligned');
const center = ref('center aligned');
const right = ref('right aligned');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; width: 280px; font-family: sans-serif">
    <Input v-model:value="left" aria-label="左对齐输入框" style="text-align: left" />
    <Input v-model:value="center" aria-label="居中对齐输入框" style="text-align: center" />
    <Input v-model:value="right" aria-label="右对齐输入框" style="text-align: right" />
    <div style="font-size: 12px; color: #999">继续输入可查看三种文本对齐效果</div>
  </div>
</template>
