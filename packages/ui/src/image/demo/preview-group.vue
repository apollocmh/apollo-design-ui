<script setup lang="ts">
import { Image } from '@apollo-design/ui';
import { ref } from 'vue';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PreviewGroup = Image.PreviewGroup;
const images = ref([1, 2, 3]);
const current = ref(0);
const removeCurrent = () => {
  images.value.splice(current.value, 1);
};
const reset = () => {
  images.value = [1, 2, 3];
  current.value = 0;
};
</script>

<template>
  <section data-image-group-ownership>
    <button type="button" @click="reset">Reset group</button>
    <PreviewGroup v-model:current="current">
      <Image v-for="i in images" :key="i" :alt="`Group image ${i}`" :width="200" :src="src" />
      <template #previewImage="{ originNode }">
        <component :is="originNode" />
        <button type="button" :disabled="images.length < 2" @click="removeCurrent">Remove current thumbnail</button>
      </template>
    </PreviewGroup>
  </section>
</template>
