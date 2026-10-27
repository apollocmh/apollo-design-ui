<script setup lang="ts">
// 默认文件列表：通过 defaultFileList 提供初始文件
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const defaultFileList: UploadFile[] = [
  { uid: '-1', name: 'annual-report-2025.pdf', status: 'done', size: 328_000 },
  { uid: '-2', name: 'brand-guidelines.md', status: 'done', size: 12_400 },
  { uid: '-3', name: 'design-assets.zip', status: 'done', size: 8_600_000 },
];

const lastChange = ref('尚未新增文件');

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 400);
  return { abort: () => window.clearTimeout(timer) };
};

const onChange: UploadProps['onChange'] = (info) => {
  lastChange.value = `${info.file.name}：${info.file.status ?? 'unknown'}`;
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 420px">
    <Upload
      action="/upload.do"
      :default-file-list="defaultFileList"
      :custom-request="customRequest"
      @change="onChange"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        继续上传
      </Button>
    </Upload>
    <p aria-live="polite" style="margin: 0; color: #999; font-size: 12px">
      最近变化：{{ lastChange }}
    </p>
  </div>
</template>
