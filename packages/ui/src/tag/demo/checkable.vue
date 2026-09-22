<script setup lang="ts">
// 对齐 antd 的 checkable demo（Form 标签用文字等价替换 —— Form 未落地）

import { CheckableTag, CheckableTagGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const tagsData = ['Movies', 'Books', 'Music', 'Sports'];
const checked = ref(true);
const singleSelected = ref<string | null>('Books');
const multipleSelected = ref<string[]>(['Movies', 'Music']);
</script>

<template>
  <p>Checkable: <CheckableTag :checked="checked" @change="(c: boolean) => (checked = c)">Yes</CheckableTag></p>
  <p>Single: <CheckableTagGroup :options="tagsData" :value="singleSelected" @change="(v: any) => (singleSelected = v)" /></p>
  <p>Multiple: <CheckableTagGroup :options="tagsData" :value="multipleSelected" multiple @change="(v: any) => (multipleSelected = v)" /></p>
</template>
