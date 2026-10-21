<script setup lang="ts">
// 语义化样式与类：root / list / item 三个槽位
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'semantic-list.md', status: 'done' },
  { uid: '-2', name: 'semantic-preview.pdf', status: 'done' },
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
  <div style="width: 420px">
    <Upload
      v-model:file-list="fileList"
      action="/upload.do"
      :custom-request="customRequest"
      :class-names="{
        root: 'demo-upload-style',
        list: 'demo-upload-style__list',
        item: 'demo-upload-style__item',
      }"
      :styles="{
        list: { backgroundColor: '#f9f0ff', padding: '8px', borderRadius: '8px' },
        item: { paddingInline: '8px' },
      }"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        上传文件
      </Button>
    </Upload>
    <p style="margin: 12px 0 0; color: #999; font-size: 12px">
      classNames 负责拼接类名，styles 负责覆盖列表与条目的内联样式。
    </p>
  </div>
</template>

<style>
.demo-upload-style__list {
  border: 1px dashed #d3adf7;
}

.demo-upload-style__item {
  color: #531dab;
}
</style>
