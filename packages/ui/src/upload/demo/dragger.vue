<script setup lang="ts">
// 对齐 antd 的 demo/drag.tsx
import { InboxOutlined } from '@apollo-design/icons';
import { UploadDragger, type UploadProps } from '@apollo-design/ui';

/** 本地 mock：拖入文件后 500ms 成功，不访问网络。 */
const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 500);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <UploadDragger
    action="/upload.do"
    name="file"
    multiple
    :custom-request="customRequest"
    :show-upload-list="{ showDownloadIcon: true, showPreviewIcon: true }"
  >
    <p class="demo-drag-icon"><InboxOutlined /></p>
    <p class="demo-drag-text">Click or drag file to this area to upload</p>
    <p class="demo-drag-hint">
      支持单个或批量拖入；示例使用本地 mock，不会把文件发到外网。
    </p>
  </UploadDragger>
</template>
