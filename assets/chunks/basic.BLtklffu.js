const t=`<script setup lang="ts">
// 对齐 antd 的 basic demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';
import { h } from 'vue';

const items: BreadcrumbItemInput[] = [
  { title: 'Home' },
  { title: h('a', { href: '' }, 'Application Center') },
  { title: h('a', { href: '' }, 'Application List') },
  { title: 'An Application' },
];
<\/script>

<template>
  <Breadcrumb :items="items" />
</template>
`;export{t as default};
