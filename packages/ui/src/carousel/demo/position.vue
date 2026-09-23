<script setup lang="ts">
// 对齐 antd 的 Position demo：dotPlacement 四向（deprecated 的 dotPosition 同样可用）
import { Carousel } from '@apollo-design/ui';
</script>

<template>
  <Carousel dots-class="custom-dots" dot-placement="start" style="height: 160px">
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #364d79">1</h3></div>
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #626c91">2</h3></div>
    <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #1677ff">3</h3></div>
  </Carousel>
</template>
