const n=`<script setup lang="ts">
// 对齐 antd 的 loop-banner demo
// ⚠️ antd 用 react-fast-marquee —— 我们用等价的 CSS 跑马灯动画（PLATFORM 替换，
//    见 README §5），API 面（banner + title 插槽）逐字对齐。
import { Alert } from '@apollo-design/ui';
<\/script>

<template>
  <Alert banner>
    <template #title>
      <div class="demo-alert-marquee">
        <span class="demo-alert-marquee-inner">
          I can be a Vue component, multiple Vue components, or just some text.&nbsp;&nbsp;&nbsp;&nbsp;I
          can be a Vue component, multiple Vue components, or just some
          text.&nbsp;&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    </template>
  </Alert>
</template>

<style scoped>
.demo-alert-marquee {
  overflow: hidden;
  white-space: nowrap;
}
.demo-alert-marquee-inner {
  display: inline-block;
  animation: demo-alert-marquee-scroll 20s linear infinite;
}
@keyframes demo-alert-marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
`;export{n as default};
