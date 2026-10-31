<script setup lang="ts">
// Current component tokens are projected to the real Carousel root.
import { Carousel, ConfigProvider } from '@apollo-design/ui';
</script>

<template>
  <ConfigProvider :theme="{ components: { Carousel: { arrowSize: 24, arrowOffset: 12, dotWidth: 24, dotHeight: 6, dotActiveWidth: 48, dotOffset: 20, dotGap: 6 } } }">
    <Carousel arrows>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #364d79">1</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #626c91">2</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #1677ff">3</h3></div>
    </Carousel>
  </ConfigProvider>
</template>
