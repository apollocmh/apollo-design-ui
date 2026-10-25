<script setup lang="ts">
import { Image, ImagePreviewGroup, type TransformInfo } from '../../../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactTransform = <T>(value: T, ..._check: Equal<T, TransformInfo> extends true ? [] : [never]) => value;

defineProps<{
  target: 'Image' | 'PreviewGroup';
  received: (info: TransformInfo) => void;
  once: (info: TransformInfo) => void;
}>();
</script>

<template>
  <Image v-if="target === 'Image'" src="first.png" alt="Typed transform image"
    @transform="info => received(exactTransform(info))" @transform.once="info => once(exactTransform(info))" />
  <ImagePreviewGroup v-else @transform="info => received(exactTransform(info))" @transform.once="info => once(exactTransform(info))">
    <Image src="first.png" alt="Typed transform group first" />
    <Image src="second.png" alt="Typed transform group second" />
  </ImagePreviewGroup>
</template>
