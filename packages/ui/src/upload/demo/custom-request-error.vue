<script setup lang="ts">
// 对齐 antd 的上传失败态：onError 驱动列表的 error 状态
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadProps } from '@apollo-design/ui';

const customRequest: UploadProps['customRequest'] = ({ onProgress, onError }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    const error = new Error('模拟上传失败');
    (error as Error & { status?: number }).status = 500;
    onError?.(error);
  }, 600);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload action="/upload.do" :custom-request="customRequest">
    <Button danger>
      <template #icon><UploadOutlined /></template>
      Upload (will fail)
    </Button>
  </Upload>
</template>
