<script setup lang="ts">
// 对齐 antd 的 demo/avatar.tsx：头像即上传触发器
import { UserOutlined } from '@apollo-design/icons';
import { Avatar, Upload, type UploadProps } from '@apollo-design/ui';
import { h } from 'vue';

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};
</script>

<template>
  <Upload action="/upload.do" :show-upload-list="false" :custom-request="customRequest">
    <Avatar :size="64" :icon="h(UserOutlined)" style="cursor: pointer" />
  </Upload>
</template>
