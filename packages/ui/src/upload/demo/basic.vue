<script setup lang="ts">
// 对齐 antd 的 demo/basic.tsx
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

/** 本地缩略图（data URL），示例不依赖外网图片。 */
const thumbUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#1677ff" opacity="0.14"/><circle cx="60" cy="60" r="26" fill="#1677ff"/></svg>',
)}`;

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'demo.png', status: 'done', url: thumbUrl, thumbUrl },
]);

/**
 * 示例用可控 mock：不访问网络，400ms 后上传成功。
 * 真实项目把 customRequest 换成 `action` 或自己的请求函数即可。
 */
const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setInterval(() => {
    onProgress?.({ percent: 100 });
    if (timer) {
      window.clearInterval(timer);
      onSuccess?.({ ok: true });
    }
  }, 400);
  return {
    abort: () => window.clearInterval(timer),
  };
};

const handleChange: UploadProps['onChange'] = (info) => {
  fileList.value = info.fileList;
};
</script>

<template>
  <Upload
    v-model:file-list="fileList"
    action="/upload.do"
    :custom-request="customRequest"
    @change="handleChange"
  >
    <Button>
      <template #icon><UploadOutlined /></template>
      Click to Upload
    </Button>
  </Upload>
</template>
