<script setup lang="ts">
// 对齐 antd demo/icon.tsx（items 数据 API 的 VNode 字段 —— 程序化上下文，C8-R2 豁免）
import { SmileOutlined, UserOutlined } from '@apollo-design/icons';
import { Steps } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { title: '登录', icon: h(UserOutlined), content: '使用账号登录' },
  { title: '人脸识别', icon: h(SmileOutlined), content: '进行人脸识别验证' },
];
</script>

<template>
  <Steps :items="items" :current="0" />
</template>
