<script setup lang="ts">
// 当前 Provider 的 Upload Token 驱动实际卡片尺寸与操作图标颜色
import { PlusOutlined } from '@apollo-design/icons';
import {
  Button,
  ConfigProvider,
  Upload,
  type UploadFile,
  type UploadProps,
} from '@apollo-design/ui';
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
    <ConfigProvider
      :theme="{ components: { Upload: { pictureCardSize: 96, actionsColor: '#08979c' } } }"
    >
      <Upload
        v-model:file-list="fileList"
        action="/upload.do"
        list-type="picture-card"
        :custom-request="customRequest"
      >
        <Button :icon="PlusOutlined" aria-label="上传图片">Upload</Button>
      </Upload>
      <Upload
        v-model:file-list="fileList"
        :show-upload-list="{ showDownloadIcon: true }"
        :custom-request="customRequest"
      />
    </ConfigProvider>
    <p class="demo-upload-token__hint">
      卡片尺寸来自 --apollo-upload-picture-card-size，列表操作图标颜色来自
      --apollo-upload-actions-color。
    </p>
  </div>
</template>

<style>
.demo-upload-token__hint {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
}
</style>
