<script setup lang="ts">
// 对齐 antd 的 component-token demo
// ⚠️ PLATFORM 等价替换：antd 用 `ConfigProvider theme.components.Carousel` 注入
//    Component Token；本仓零运行时 —— Component Token 就是 CSS 变量
//    （`--apollo-carousel-*`），在容器上覆盖同名变量即可（完整清单见
//    index.zh-CN.md 的 Design Token 表）。
import { Carousel } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-carousel-token">
    <Carousel>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #364d79">1</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #626c91">2</h3></div>
      <div><h3 style="height: 160px; color: #fff; line-height: 160px; text-align: center; background: #1677ff">3</h3></div>
    </Carousel>
  </div>
</template>

<style>
/* 覆盖圆点尺寸与激活宽度（antd demo 对应 dotWidth / dotHeight / dotActiveWidth /
   dotOffset / dotGap / arrowSize / arrowOffset / dotWidthActive）。 */
.demo-carousel-token .apollo-carousel {
  --apollo-carousel-dot-width: 24px;
  --apollo-carousel-dot-height: 6px;
  --apollo-carousel-dot-active-width: 48px;
  --apollo-carousel-dot-offset: 20px;
}
</style>
