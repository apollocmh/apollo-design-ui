<script setup lang="ts">
// 对齐 antd 的 demo/custom-request.tsx（本地模拟进度，不访问网络）
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadProps } from '@apollo-design/ui';

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  let percent = 0;
  const timer = window.setInterval(() => {
    percent = Math.min(100, percent + 20);
    onProgress?.({ percent });
    if (percent >= 100) {
      window.clearInterval(timer);
      onSuccess?.({ ok: true });
    }
  }, 200);
  return { abort: () => window.clearInterval(timer) };
};
</script>

<template>
  <Upload action="/upload.do" :custom-request="customRequest">
    <Button>
      <template #icon><UploadOutlined /></template>
      Upload with Progress
    </Button>
  </Upload>
</template>
