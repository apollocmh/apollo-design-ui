<script setup lang="ts">
// 对齐 antd 的 flexible-content demo。
// ⚠️ 封面用 **data URI**（外网图片会污染 L6 基线，与 image/avatar 的 demo 同判）。
import { Card, CardMeta } from '@apollo-design/ui';
import { h } from 'vue';

// Original vector illustration; no third-party image or network dependency.
const COVER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#cce5f0"/><circle cx="370" cy="70" r="38" fill="#fff0bf"/><path d="M0 205L115 88l115 117 95-75 155 140v30H0z" fill="#477f96"/><path d="M0 250l155-110 95 110 100-58 130 88v20H0z" fill="#244e67"/></svg>')}`;

const cover = () => h('img', { draggable: false, alt: 'Original mountain landscape', src: COVER });
</script>

<template>
  <Card hoverable variant="borderless" :style="{ width: '240px', maxWidth: '100%' }" :cover="cover()">
    <CardMeta title="Europe Street beat" description="www.instagram.com" />
  </Card>
</template>
