<script setup lang="ts">
// 上传前转换文件：beforeUpload 返回新的 File 替换原始文件
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const transformed = ref('尚未选择文件');

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
  const nextFile = new File([file], safeName, {
    type: file.type,
    lastModified: file.lastModified,
  });
  transformed.value = `${file.name} → ${nextFile.name}`;
  return nextFile;
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
    <Upload action="/upload.do" :before-upload="beforeUpload" :custom-request="customRequest">
      <Button>
        <template #icon><UploadOutlined /></template>
        选择文件并转换名称
      </Button>
    </Upload>
    <p aria-live="polite" style="margin: 0; color: #999; font-size: 12px">
      转换结果：{{ transformed }}
    </p>
  </div>
</template>
