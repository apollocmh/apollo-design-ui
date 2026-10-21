<script setup lang="ts">
// 对齐 antd 的 demo/max-count.tsx
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadProps } from '@apollo-design/ui';

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload action="/upload.do" multiple :max-count="2" :custom-request="customRequest">
    <Button>
      <template #icon><UploadOutlined /></template>
      Upload (Max: 2)
    </Button>
  </Upload>
</template>
