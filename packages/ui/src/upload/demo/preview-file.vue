<script setup lang="ts">
// 文件预览：点击列表预览图标后在页面内展示本地图片
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#f9f0ff"/><circle cx="70" cy="70" r="34" fill="#722ed1" opacity="0.8"/><rect x="120" y="50" width="80" height="60" rx="10" fill="#9254de" opacity="0.7"/></svg>',
)}`;

const defaultFileList: UploadFile[] = [
  { uid: '-1', name: 'dashboard-preview.svg', status: 'done', url: thumbUrl, thumbUrl },
];

const preview = ref<{ url: string; name: string } | null>(null);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};

const onPreview: UploadProps['onPreview'] = (file) => {
  preview.value = { url: file.thumbUrl || file.url || '', name: file.name };
};

const closePreview = (): void => {
  preview.value = null;
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 420px">
    <Upload
      action="/upload.do"
      list-type="picture"
      :default-file-list="defaultFileList"
      :custom-request="customRequest"
      :on-preview="onPreview"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        上传图片
      </Button>
    </Upload>

    <div v-if="preview" class="demo-upload-preview" aria-live="polite">
      <img :src="preview.url" :alt="`预览：${preview.name}`" class="demo-upload-preview__image" />
      <div class="demo-upload-preview__meta">
        <span>{{ preview.name }}</span>
        <Button html-type="button" size="small" @click="closePreview">关闭预览</Button>
      </div>
    </div>
    <p v-else style="margin: 0; color: #999; font-size: 12px">
      点击文件列表中的预览图标查看本地图片。
    </p>
  </div>
</template>

<style>
.demo-upload-preview {
  padding: 12px;
  border: 1px solid #d3adf7;
  border-radius: 8px;
  background: #f9f0ff;
}

.demo-upload-preview__image {
  display: block;
  max-width: 100%;
  border-radius: 4px;
}

.demo-upload-preview__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}
</style>
