<script setup lang="ts">
import { Image, ImagePreviewGroup, type PreviewActionsInfo, type PreviewCountInfo, type PreviewImageInfo } from '../../../index';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactImage = <T>(info: T, ..._check: Equal<T, PreviewImageInfo> extends true ? [] : [never]) => info;
const exactActions = <T>(info: T, ..._check: Equal<T, PreviewActionsInfo> extends true ? [] : [never]) => info;
const exactCount = <T>(info: T, ..._check: Equal<T, PreviewCountInfo> extends true ? [] : [never]) => info;
withDefaults(defineProps<{ target: 'Image' | 'PreviewGroup'; show?: boolean; empty?: boolean }>(), { show: true, empty: false });
</script>

<template>
  <Image v-if="target === 'Image'" src="typed-first.png" alt="Typed preview image">
    <template v-if="show" #previewImage="info">
      <figure v-if="!empty" data-typed-preview-image>
        <component :is="exactImage(info).originNode" />
        <input aria-label="Typed preview note" />
        <figcaption>{{ info.src ?? 'No source' }} {{ info.current + 1 }} / {{ info.total }} {{ info.transform.rotate }}</figcaption>
      </figure>
    </template>
    <template v-if="show" #previewActions="info">
      <section v-if="!empty" data-typed-preview-actions>
        <component :is="exactActions(info).originNode" />
        <button type="button" @click="info.actions.reset">Typed reset</button>
        <button type="button" :disabled="info.disabled.zoomOut" @click="info.actions.zoomOut">Typed zoom out</button>
      </section>
    </template>
  </Image>
  <ImagePreviewGroup v-else>
    <Image src="typed-first.png" alt="Typed group first" />
    <Image src="typed-second.png" alt="Typed group second" />
    <template v-if="show" #previewImage="info">
      <figure v-if="!empty" data-typed-preview-image><component :is="exactImage(info).originNode" /><input aria-label="Typed group note" /></figure>
    </template>
    <template v-if="show" #previewActions="info">
      <section v-if="!empty" data-typed-preview-actions><component :is="exactActions(info).originNode" /><button type="button" @click="info.actions.reset">Typed reset</button></section>
    </template>
    <template v-if="show" #previewCount="info">
      <span v-if="!empty" data-typed-preview-count>{{ exactCount(info).current + 1 }} / {{ info.total }}</span>
    </template>
  </ImagePreviewGroup>
  <Image :preview="false">
    <!-- @vue-expect-error Count is owned by PreviewGroup, not an individual Image. -->
    <template #previewCount>Unsupported</template>
  </Image>
  <ImagePreviewGroup :preview="false">
    <!-- @vue-expect-error Group does not own the individual thumbnail imageRender slot. -->
    <template #imageRender>Unsupported</template>
  </ImagePreviewGroup>
</template>
