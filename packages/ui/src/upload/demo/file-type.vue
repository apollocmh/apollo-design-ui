<script setup lang="ts">
// 文件类型：通过 #iconRender 为不同扩展名渲染不同图标
import {
  FileExcelOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileZipOutlined,
  UploadOutlined,
} from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { type Component, ref } from 'vue';

const iconMap: Record<string, Component> = {
  pdf: FilePdfOutlined,
  md: FileMarkdownOutlined,
  zip: FileZipOutlined,
  xlsx: FileExcelOutlined,
  docx: FileWordOutlined,
  png: FileImageOutlined,
  jpg: FileImageOutlined,
};

const iconFor = (name: string): Component => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return iconMap[ext] ?? FileTextOutlined;
};

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'quarterly-report.pdf', status: 'done' },
  { uid: '-2', name: 'release-notes.md', status: 'done' },
  { uid: '-3', name: 'assets.zip', status: 'done' },
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
      list-type="picture"
      :custom-request="customRequest"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        上传任意文件
      </Button>
      <template #iconRender="{ file }">
        <component :is="iconFor(file.name)" aria-hidden="true" />
      </template>
    </Upload>
    <p style="margin: 12px 0 0; color: #999; font-size: 12px">
      列表图标由 #iconRender 根据文件扩展名选择；示例文件没有缩略图。
    </p>
  </div>
</template>
