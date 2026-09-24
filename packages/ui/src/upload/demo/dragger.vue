<script setup lang="ts">
// 对齐 antd 的 demo/drag.tsx
import { InboxOutlined } from '@apollo-design/icons';
import { UploadDragger } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <UploadDragger
      action="/upload.do"
      name="file"
      :show-upload-list="{ showDownloadIcon: true, showPreviewIcon: true }"
    >
      <p class="demo-drag-icon"><InboxOutlined /></p>
      <p class="demo-drag-text">Click or drag file to this area to upload</p>
    </UploadDragger>
  </div>
</template>
