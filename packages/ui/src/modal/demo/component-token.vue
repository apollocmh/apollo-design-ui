<script setup lang="ts">
// 对齐 antd demo/component-token.tsx（含 wireframe 变体）
import { ConfigProvider, Modal } from '@apollo-design/ui';

/** Test usage. Do not use in your production. */
const InternalPanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const modalTheme = {
  components: {
    Modal: {
      footerBg: '#f6ffed',
      contentBg: '#e6fffb',
      headerBg: '#f9f0ff',
      titleLineHeight: 3,
      titleFontSize: 12,
      titleColor: '#1d39c4',
    },
  },
};
</script>

<template>
  <ConfigProvider :theme="modalTheme">
    <div style="display: flex; flex-direction: column; row-gap: 16px">
      <InternalPanel title="Hello World!" :style="{ width: '100%' }">
        Hello World?!
      </InternalPanel>
      <ConfigProvider :theme="{ token: { wireframe: true } }">
        <InternalPanel title="Hello World!" :style="{ width: '100%' }">
          Hello World?!
        </InternalPanel>
      </ConfigProvider>
      <InternalPanel type="success" :style="{ width: '200px' }">A good news!</InternalPanel>
      <InternalPanel title="Confirm This?" type="confirm" :style="{ width: '300px' }">
        Some descriptions.
      </InternalPanel>
    </div>
  </ConfigProvider>
</template>
