<script setup lang="ts">
import { Carousel } from '../../index';

const invalidBefore = (_current: string, _next: string) => {};
</script>
<template>
  <!-- @vue-expect-error owned beforeChange has two numeric slide indices -->
  <Carousel @before-change="invalidBefore"><div>Content</div></Carousel>
  <Carousel arrows>
    <div>One</div><div>Two</div>
    <template #next-arrow="{ currentSlide }">
      <!-- @vue-expect-error currentSlide is a number in the actual native arrow slot -->
      <span :data-invalid="currentSlide.toUpperCase()">Invalid</span>
    </template>
  </Carousel>
  <!-- @vue-expect-error semantic slider styles use CSSProperties -->
  <Carousel :styles="{ slider: { textAlign: 123 } }"><div>Content</div></Carousel>
</template>
