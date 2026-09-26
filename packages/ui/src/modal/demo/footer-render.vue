<script setup lang="ts">
// 对齐 antd demo/footer-render.tsx：footer 的函数形态拿到 (originNode, { OkBtn, CancelBtn })
import { Button, Modal, Space } from '@apollo-design/ui';
import { h, ref } from 'vue';

const open = ref(false);

const customFooter = (originNode: unknown, extra: { OkBtn: unknown; CancelBtn: unknown }) =>
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
  <Button type="primary" @click="open = true">Open Modal with customized footer</Button>
  <Modal
    title="Custom Footer Render"
    :open="open"
    :footer="customFooter"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Some contents...</p>
  </Modal>
</template>
