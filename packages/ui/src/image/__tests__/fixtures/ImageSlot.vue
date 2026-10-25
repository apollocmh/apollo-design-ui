<script setup lang="ts">
import { ref } from 'vue';
import { Image, type ImageRenderInfo } from '../../../index';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exact = <T>(info: T, ..._check: Equal<T, ImageRenderInfo> extends true ? [] : [never]) => info;
const show = ref(true);
const empty = ref(false);
const source = ref<string | undefined>();
</script>
<template>
  <Image :src="source" alt="Typed thumbnail" :preview="false">
    <template v-if="show" #imageRender="info">
      <figure v-if="!empty">
        <component :is="exact(info).originNode" />
        <figcaption>{{ info.src ?? 'No source' }} {{ info.alt }} {{ info.width }} {{ info.height }} {{ info.title }} {{ info.classNames.image }}</figcaption>
      </figure>
    </template>
  </Image>
  <Image>
    <!-- @vue-expect-error Only implemented content slots are exposed. -->
    <template #unknownImage>Unsupported</template>
  </Image>
</template>
