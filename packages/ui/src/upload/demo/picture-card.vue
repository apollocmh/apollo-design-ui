<script setup lang="ts">
// 对齐 antd 的 demo/picture-card.tsx
import { PlusOutlined } from '@apollo-design/icons';
import { Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

/** 本地缩略图（data URL），不依赖外网图片。 */
const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#fa8c16" opacity="0.16"/><path d="M30 78l22-26 16 18 12-10 20 24z" fill="#fa8c16"/><circle cx="44" cy="40" r="9" fill="#fa8c16"/></svg>',
)}`;

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'image.png', status: 'done', url: thumbUrl, thumbUrl },
]);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 600);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    action="/upload.do"
    list-type="picture-card"
    :custom-request="customRequest"
  >
    <div>
      <PlusOutlined />
      <div style="margin-top: 8px">Upload</div>
    </div>
  </Upload>
</template>
