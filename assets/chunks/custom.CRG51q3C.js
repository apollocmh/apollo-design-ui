const o=`<script setup lang="ts">
// 对齐 antd 的 customColor / customSize demo
import { QrCode } from '@apollo-design/ui';
<\/script>

<template>
  <QrCode value="https://apollo.design" color="#1677ff" style="margin-bottom: 16px" />
  <QrCode value="https://apollo.design" color="#1677ff" bg-color="#f0f5ff" :size="96" bordered />
</template>
`;export{o as default};
