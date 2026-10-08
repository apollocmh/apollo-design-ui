const n=`<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（上游用 antd-style；本 demo 用普通类名与内联样式表达同一意图）
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const footerEnabled = ref(true);

const classNames = { container: 'modal-custom-container' };

/** 函数形态：按 footer 开关决定样式 */
const stylesFn = () => {
  if (footerEnabled.value) {
    return {
      container: { borderRadius: '14px', border: '1px solid #ccc', padding: 0, overflow: 'hidden' },
      header: { padding: '16px' },
      body: { padding: '16px' },
      footer: { padding: '16px 10px', backgroundColor: '#fafafa' },
    };
  }
  return {};
};
<\/script>

<template>
  <Button type="primary" @click="open = true">Open Modal</Button>
  <Modal
    title="Custom Styles"
    :open="open"
    :class-names="classNames"
    :styles="stylesFn"
    @ok="open = false"
    @cancel="open = false"
  >
    <div style="line-height: 28px">🌈 Enterprise-class UI designed for web applications.</div>
    <div style="line-height: 28px">📦 A set of high-quality components out of the box.</div>
    <div style="line-height: 28px">🎨 Powerful theme customization in every detail.</div>
    <template #footer v-if="!footerEnabled"></template>
  </Modal>
</template>

<style>
.modal-custom-container {
  border-radius: 10px;
  padding: 10px;
}
</style>
`;export{n as default};
