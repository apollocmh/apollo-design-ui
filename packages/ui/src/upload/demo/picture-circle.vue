<script setup lang="ts">
// 对齐 antd 的 demo/picture-circle.tsx
import { PlusOutlined } from '@apollo-design/icons';
import { Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#52c41a" opacity="0.16"/><path d="M28 80l20-24 14 16 10-8 20 24z" fill="#52c41a"/><circle cx="45" cy="42" r="8" fill="#52c41a"/></svg>',
)}`;

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'circle.png', status: 'done', url: thumbUrl, thumbUrl },
]);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 500);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    action="/upload.do"
    list-type="picture-circle"
    :custom-request="customRequest"
  >
    <PlusOutlined />
  </Upload>
</template>
