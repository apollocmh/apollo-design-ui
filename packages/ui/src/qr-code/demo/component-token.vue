<script setup lang="ts">
import { ref } from 'vue';
import { ConfigProvider, QrCode } from '../../index';

const themed = ref(true);
const draft = ref('Native token draft');
</script>

<template>
  <button type="button" @click="themed = !themed">切换 QRCode 主题</button>
  <ConfigProvider :theme="themed ? { components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } } : undefined">
    <QrCode value="https://apollo.design/token" title="Themed access" status="scanned" style="margin-top: 16px">
      <template #status>
        <strong>Current cover</strong>
        <input v-model="draft" aria-label="QR token draft" style="width: 112px; max-width: 100%" />
      </template>
    </QrCode>
  </ConfigProvider>
</template>
