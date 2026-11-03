<script setup lang="ts">
import './thumbnail-groups.css';
import { Button, Image } from '@apollo-design/ui';
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
  <section data-image-group-ownership style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
    <Button html-type="button" @click="reset">Reset group</Button>
    <PreviewGroup class="image-demo-thumbnails" v-model:current="current">
      <Image v-for="i in images" :key="i" :alt="`Group image ${i}`" :width="200" :src="src" />
      <template #previewImage="{ originNode }">
        <component :is="originNode" />
        <Button html-type="button" :disabled="images.length < 2" @click="removeCurrent">Remove current thumbnail</Button>
      </template>
    </PreviewGroup>
  </section>
</template>
