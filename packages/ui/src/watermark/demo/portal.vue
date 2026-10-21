<script setup lang="ts">
// 对齐 antd 的 portal demo：水印通过 context 继承到 Teleport 出去的 Modal 面板。
import { Button, Modal, Watermark } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Watermark content="Apollo Design">
    <div
      style="
        padding: 24px;
        border: 1px dashed var(--apollo-color-border);
        border-radius: var(--apollo-border-radius-lg);
      "
    >
      <p style="margin-top: 0">
        页面区域带有水印；打开弹窗后，水印会继续覆盖 Teleport 出去的面板。
      </p>
      <Button type="primary" @click="open = true">Open Modal</Button>
    </div>
    <Modal
      :open="open"
      title="Watermark in Modal"
      @ok="open = false"
      @cancel="open = false"
    >
      <p>这个弹窗挂载在 body 上，仍然继承外层 Watermark。</p>
      <p>调整窗口大小后水印会重新绘制。</p>
    </Modal>
  </Watermark>
</template>
