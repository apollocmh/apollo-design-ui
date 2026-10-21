<script setup lang="ts">
// 嵌套页签：在页签内容中再放一组 Tabs
import { Tabs } from '@apollo-design/ui';
import { h } from 'vue';

const innerItems = [
  { key: '1', label: '接口文档', children: '接口文档：请求参数、响应示例与错误码。' },
  { key: '2', label: '变更日志', children: '变更日志：按版本记录 API 调整。' },
  { key: '3', label: '示例代码', children: '示例代码：Vue 3 + TypeScript 调用示例。' },
];

const innerTabs = h('div', { style: 'padding-top: 8px' }, [
  h(Tabs, { defaultActiveKey: '1', size: 'small', items: innerItems }),
]);

const outerItems = [
  { key: '1', label: '开发资源', children: innerTabs },
  { key: '2', label: '设计资源', children: '设计资源：组件规范、色彩与图标下载。' },
  {
    key: '3',
    label: '团队协作',
    children: '团队协作：需求评审、联调与发布流程。',
  },
];
</script>

<template>
  <Tabs default-active-key="1" :items="outerItems" />
</template>
