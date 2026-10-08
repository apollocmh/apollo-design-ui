const e=`<script setup lang="ts">
// 对齐 antd 的 flexible-content demo。
// ⚠️ 封面用 **data URI**（外网图片会污染 L6 基线，与 image/avatar 的 demo 同判）。
import { Card, CardMeta } from '@apollo-design/ui';
import { h } from 'vue';

const COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const cover = () => h('img', { draggable: false, alt: 'example', src: COVER });
<\/script>

<template>
  <Card hoverable variant="borderless" :style="{ width: '240px' }" :cover="cover()">
    <CardMeta title="Europe Street beat" description="www.instagram.com" />
  </Card>
</template>
`;export{e as default};
