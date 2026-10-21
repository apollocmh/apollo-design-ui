<script setup lang="ts">
// 对齐 antd 的 demo/upload-list-actions：列表上的预览/下载动作
import { UploadOutlined } from '@apollo-design/icons';
import { Button, message, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#722ed1" opacity="0.15"/><rect x="26" y="26" width="68" height="68" rx="10" fill="#722ed1"/></svg>',
)}`;

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'report.png', status: 'done', url: thumbUrl, thumbUrl },
]);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};

const onPreview: UploadProps['onPreview'] = (file) => {
  message.info(`预览：${file.name}`);
};

const onDownload: UploadProps['onDownload'] = (file) => {
  message.info(`下载：${file.name}`);
};
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    action="/upload.do"
    :custom-request="customRequest"
    :show-upload-list="{
      showDownloadIcon: true,
      showPreviewIcon: true,
      showRemoveIcon: true,
    }"
    :on-preview="onPreview"
    :on-download="onDownload"
  >
    <Button>
      <template #icon><UploadOutlined /></template>
      Upload
    </Button>
  </Upload>
</template>
