const n=`<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx
import { Button, Modal, Space } from '@apollo-design/ui';

/** Test usage. Do not use in your production. */
const InternalPanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;
<\/script>

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
    >
      <p>Custom footer content.</p>
      <template #footer>
        <Space>
          <Button>Cancel</Button>
          <Button danger type="primary">Custom</Button>
          <Button type="primary">OK</Button>
        </Space>
      </template>
    </InternalPanel>
  </div>
</template>
`;export{n as default};
