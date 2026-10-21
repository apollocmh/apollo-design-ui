<script setup lang="ts">
// 对齐 antd 的 demo/accept.tsx + 大小校验
import { UploadOutlined } from '@apollo-design/icons';
import { Button, message, Upload, type UploadProps } from '@apollo-design/ui';

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error(`${file.name} 不是图片文件`);
    return Upload.LIST_IGNORE;
  }
  const withinLimit = file.size / 1024 / 1024 < 1;
  if (!withinLimit) {
    message.error(`${file.name} 超过 1MB`);
    return Upload.LIST_IGNORE;
  }
  return true;
};

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload
    action="/upload.do"
    accept="image/*"
    :before-upload="beforeUpload"
    :custom-request="customRequest"
  >
    <Button>
      <template #icon><UploadOutlined /></template>
      Upload Image
    </Button>
  </Upload>
</template>
