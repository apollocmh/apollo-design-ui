<script setup lang="ts">
// 自定义进度条：渐变、线宽、百分比信息与可访问名称
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Upload, type UploadFile, type UploadProps } from '@apollo-design/ui';
import { onMounted, onUnmounted, ref } from 'vue';

const fileList = ref<UploadFile[]>([
  { uid: '-1', name: 'uploading-report.pdf', status: 'uploading', percent: 30 },
]);

let demoTimer: number | undefined;

const customRequest: UploadProps['customRequest'] = ({ onProgress, onSuccess }) => {
  let percent = 0;
  const uploadTimer = window.setInterval(() => {
    percent = Math.min(100, percent + 20);
    onProgress?.({ percent });
    if (percent >= 100) {
      window.clearInterval(uploadTimer);
      onSuccess?.({ ok: true });
    }
  }, 300);
  return { abort: () => window.clearInterval(uploadTimer) };
};

onMounted(() => {
  demoTimer = window.setInterval(() => {
    const first = fileList.value[0];
    if (first?.status !== 'uploading') {
      if (demoTimer !== undefined) window.clearInterval(demoTimer);
      demoTimer = undefined;
      return;
    }
    const nextPercent = Math.min(100, (first.percent ?? 0) + 10);
    const nextStatus: UploadFile['status'] = nextPercent >= 100 ? 'done' : 'uploading';
    fileList.value = fileList.value.map((file) =>
      file.uid === first.uid ? { ...file, percent: nextPercent, status: nextStatus } : file,
    );
    if (nextPercent >= 100 && demoTimer !== undefined) {
      window.clearInterval(demoTimer);
      demoTimer = undefined;
    }
  }, 500);
});

onUnmounted(() => {
  if (demoTimer !== undefined) window.clearInterval(demoTimer);
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 420px">
    <Upload
      v-model:file-list="fileList"
      action="/upload.do"
      :custom-request="customRequest"
      :progress="{
        strokeWidth: 4,
        showInfo: true,
        strokeColor: { '0%': '#108ee9', '100%': '#87d068' },
        'aria-label': '文件上传进度',
      }"
    >
      <Button>
        <template #icon><UploadOutlined /></template>
        上传新文件
      </Button>
    </Upload>
    <p style="margin: 0; color: #999; font-size: 12px">
      渐变进度条显示当前百分比，线宽为 4px；初始文件会自动从 30% 演示到 100%。
    </p>
  </div>
</template>
