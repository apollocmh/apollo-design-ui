const e=`<script setup lang="ts">
// 对齐 antd 的 useBreakpoint demo
import { useBreakpoint } from '@apollo-design/ui';

const screens = useBreakpoint();
const items = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const;
<\/script>

<template>
  <div>
    当前命中的断点：
    <ul>
      <li v-for="item in items" :key="item">{{ item }}: {{ screens?.[item] ? 'true' : 'false' }}</li>
    </ul>
  </div>
</template>
`;export{e as default};
