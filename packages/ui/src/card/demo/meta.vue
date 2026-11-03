<script setup lang="ts">
// 对齐 antd 的 meta demo。
// 本地原创 SVG 封面可离线展示。
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@apollo-design/icons';
import { Avatar, Card, CardMeta } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

// Original vector illustration; no third-party image or network dependency.
const COVER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#cce5f0"/><circle cx="370" cy="70" r="38" fill="#fff0bf"/><path d="M0 205L115 88l115 117 95-75 155 140v30H0z" fill="#477f96"/><path d="M0 250l155-110 95 110 100-58 130 88v20H0z" fill="#244e67"/></svg>')}`;

const cover = () => h('img', { draggable: false, alt: 'Original mountain landscape', src: COVER });

const actions = [
  h(SettingOutlined, { key: 'setting' }),
  h(EditOutlined, { key: 'edit' }),
  h(EllipsisOutlined, { key: 'ellipsis' }),
];

const avatar = (text: string): VNodeChild => h(Avatar, null, () => text);
</script>

<template>
  <Card :style="{ width: '300px', maxWidth: '100%' }" :cover="cover()" :actions="actions">
    <CardMeta :avatar="avatar('A')" title="Card title">This is the description</CardMeta>
  </Card>
</template>
