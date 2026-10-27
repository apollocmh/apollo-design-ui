<script setup lang="ts">
import { CheckableTag, CheckableTagGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const tagsData = ['Movies', 'Books', 'Music', 'Sports'];
const checked = ref(true);
const singleSelected = ref<string | null>('Books');
const multipleSelected = ref<string[]>(['Movies', 'Music']);
</script>

<template>
  <p>Checkable: <CheckableTag v-model:checked="checked">Yes</CheckableTag></p>
  <p>Single: <CheckableTagGroup v-model:value="singleSelected" :options="tagsData" aria-label="Single interest" /></p>
  <p>Multiple: <CheckableTagGroup v-model:value="multipleSelected" :options="tagsData" multiple aria-label="Multiple interests" /></p>
</template>
