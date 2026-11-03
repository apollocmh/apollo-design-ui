<script setup lang="ts">
import { Button, ConfigProvider, Input, QrCode } from '@apollo-design/ui';
import { ref } from 'vue';

const themed = ref(true);
const draft = ref('Native token draft');
</script>

<template>
  <Button @click="themed = !themed">切换 QRCode 主题</Button>
  <ConfigProvider :theme="themed ? { components: { QRCode: { QRCodeCoverBackgroundColor: '#e8f4ec' } } } : undefined">
    <QrCode value="https://apollo.design/token" title="Themed access" status="scanned" :styles="themed ? { cover: { color: '#1f1f1f' } } : undefined" style="margin-top: 16px">
      <template #status>
        <strong>Current cover</strong>
        <Input v-model:value="draft" aria-label="QR token draft" style="width: 112px; max-width: 100%" />
      </template>
    </QrCode>
  </ConfigProvider>
</template>
