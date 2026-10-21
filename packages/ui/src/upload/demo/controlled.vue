<script setup lang="ts">
// 对齐 antd 的 demo/controlled.tsx
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Space, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const fileList = ref<UploadFile[]>([]);
const count = computed(() => fileList.value.length);

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  const timer = window.setTimeout(() => {
    onProgress?.({ percent: 100 });
    onSuccess?.({ ok: true });
  }, 500);
  return { abort: () => window.clearTimeout(timer) };
};

const clear = () => {
  fileList.value = [];
};
</script>

<template>
  <Space orientation="vertical">
    <Upload
      v-model:file-list="fileList"
      action="/upload.do"
      :custom-request="customRequest"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        Upload
      </Button>
    </Upload>
    <Space>
      <span>文件数：{{ count }}</span>
      <Button size="small" :disabled="count === 0" @click="clear">清空列表</Button>
    </Space>
  </Space>
</template>
