<script setup lang="ts">
// 仅允许 PNG：beforeUpload 校验类型并拒绝其他文件
import { UploadOutlined } from '@apollo-design/icons';
import { Button, message, Upload, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const lastResult = ref('尚未选择文件');

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (file.type !== 'image/png') {
    message.error(`${file.name} 不是 PNG 文件`);
    lastResult.value = `${file.name}：已拒绝（仅支持 PNG）`;
    return Upload.LIST_IGNORE;
  }
  lastResult.value = `${file.name}：类型校验通过`;
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
  <div style="display: flex; flex-direction: column; gap: 12px; width: 420px">
    <Upload
      action="/upload.do"
      accept="image/png"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        选择 PNG 图片
      </Button>
    </Upload>
    <p aria-live="polite" style="margin: 0; color: #999; font-size: 12px">
      {{ lastResult }}
    </p>
  </div>
</template>
