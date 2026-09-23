<script setup lang="ts">
// 对齐 antd 的 autoplay demo（含圆点进度动画的对象形态）
import { Carousel } from '@apollo-design/ui';
</script>

<template>
  <Carousel :autoplay="{ dotDuration: true }" :autoplay-speed="3000">
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #364d79">1</h3></div>
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #626c91">2</h3></div>
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #1677ff">3</h3></div>
  </Carousel>
</template>
