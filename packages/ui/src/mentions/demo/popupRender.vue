<script setup lang="ts">
// 对齐 antd demo/popupRender.tsx
// ⚠️ demo 级替换：antd 用 `theme.useToken()` 取 paddingXS/paddingSM/fontWeightStrong/
//    colorTextDescription/marginXXS ⇒ 本仓用等值字面量（与默认主题的解析值一致，
//    见 README §5）。
import { Divider, Mentions } from '@apollo-design/ui';
import { h } from 'vue';

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];

const popupRender = (menu: unknown) =>
  h('div', null, [
    h(
      'div',
      {
        style: {
          padding: '8px 12px',
          fontWeight: 600,
          color: 'rgba(0,0,0,0.45)',
        },
      },
      'Custom Header',
    ),
    h(Divider, { style: { margin: '4px 0' } }),
    menu as never,
  ]);
</script>

<template>
  <Mentions style="width: 100%" :popup-render="popupRender" :options="options" />
</template>
