const e=`<script setup lang="ts">
// 对齐 antd 的 status demo（expired + loading + scanned）
import { QrCode } from '@apollo-design/ui';
import { onMounted, ref } from 'vue';

const expired = ref(false);

onMounted(() => {
  setTimeout(() => {
    expired.value = true;
  }, 3000);
});
<\/script>

<template>
  <QrCode value="https://apollo.design" :status="expired ? 'expired' : 'loading'" :on-refresh="() => (expired = false)" />
</template>
`;export{e as default};
