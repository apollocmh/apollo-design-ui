<script setup lang="ts">
// 对齐 antd demo/component-token.tsx（含 wireframe 变体）
import { ConfigProvider, Modal } from '@apollo-design/ui';

/** Test usage. Do not use in your production. */
const InternalPanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const modalTheme = {
  components: {
    Modal: {
      footerBg:
        'color-mix(in srgb, var(--apollo-color-success) 10%, var(--apollo-color-bg-elevated))',
      contentBg: 'color-mix(in srgb, var(--apollo-color-info) 8%, var(--apollo-color-bg-elevated))',
      headerBg:
        'color-mix(in srgb, var(--apollo-color-primary) 12%, var(--apollo-color-bg-elevated))',
      titleLineHeight: 3,
      titleFontSize: 12,
      titleColor: 'var(--apollo-color-primary-text)',
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
      <InternalPanel type="success" :style="{ width: '200px', maxWidth: '100%' }">A good news!</InternalPanel>
      <InternalPanel title="Confirm This?" type="confirm" :style="{ width: '300px', maxWidth: '100%' }">
        Some descriptions.
      </InternalPanel>
    </div>
  </ConfigProvider>
</template>
