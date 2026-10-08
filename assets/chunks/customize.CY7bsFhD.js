const t=`<script setup lang="ts">
import { Empty } from '../../index';

/** 任意组件都可以作为插画 —— antd 那边是「传一个 React 元素」，Vue 这边是「传组件本身」。 */
const CustomImage = {
  name: 'ADemoCustomEmptyImage',
  template: \`
    <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
      <title>custom</title>
      <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7" />
      <text x="32" y="26" text-anchor="middle" font-size="12">custom</text>
    </svg>
  \`,
};
<\/script>

<template>
  <Empty :image="CustomImage" description="Custom image" />
</template>
`;export{t as default};
