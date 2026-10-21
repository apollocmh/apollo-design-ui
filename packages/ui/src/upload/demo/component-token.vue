<script setup lang="ts">
// 组件 Token：覆盖 Upload 根节点上的 --apollo-upload-* 变量
import { PlusOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e6fffb"/><circle cx="60" cy="60" r="28" fill="#13c2c2"/></svg>',
)}`;

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'theme-cover.png', status: 'done', url: thumbUrl, thumbUrl },
]);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <div class="demo-upload-token">
    <Upload
      v-model:file-list="fileList"
      action="/upload.do"
      list-type="picture-card"
      :custom-request="customRequest"
    >
      <Button :icon="PlusOutlined" aria-label="上传图片">Upload</Button>
    </Upload>
    <p class="demo-upload-token__hint">
      卡片尺寸来自 --apollo-upload-picture-card-size，列表操作图标颜色来自
      --apollo-upload-actions-color。
    </p>
  </div>
</template>

<style>
.demo-upload-token .apollo-upload-wrapper {
  --apollo-upload-picture-card-size: 96px;
  --apollo-upload-actions-color: #08979c;
}

.demo-upload-token__hint {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
}
</style>
