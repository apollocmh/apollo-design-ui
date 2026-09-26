<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx
import { Button, Modal, Space } from '@apollo-design/ui';
import { h } from 'vue';

/** Test usage. Do not use in your production. */
const InternalPanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const customFooterFn = (originNode: unknown, extra: { OkBtn: unknown; CancelBtn: unknown }) =>
  h(Space, { orientation: 'vertical' }, () => [
    h(Space, null, () => [originNode as never]),
    h(Space, null, () => [
      h(extra.CancelBtn as never),
      h(Button, { danger: true, type: 'primary' }, () => 'Custom'),
      h(extra.OkBtn as never),
    ]),
  ]);
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 16px">
    <InternalPanel title="Hello World!" :style="{ width: '100%', height: '200px' }">
      Hello World?!
    </InternalPanel>
    <InternalPanel type="success" :style="{ width: '200px', height: '150px' }">
      A good news!
    </InternalPanel>
    <InternalPanel title="Confirm This?" type="confirm" :style="{ width: '300px', height: '200px' }">
      Some descriptions.
    </InternalPanel>
    <InternalPanel
      title="Custom Footer Render"
      :style="{ width: '380px', height: '200px' }"
      :footer="customFooterFn"
    >
      <p>Custom footer content.</p>
    </InternalPanel>
  </div>
</template>
