<script setup lang="ts">
// 对齐 antd 的 demo/upload-manually.tsx —— 先选文件，点按钮才开始上传
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Space, Upload, type UploadProps } from '@apollo-design/ui';
import { ref } from 'vue';

type PendingRequest = Parameters<NonNullable<UploadProps['customRequest']>>[0];
const pending = ref<PendingRequest[]>([]);
const timers = new Map<PendingRequest, number>();

/** 只登记请求，不调用 onSuccess ⇒ 文件停在 uploading，等待手动触发。 */
const customRequest: UploadProps['customRequest'] = (options) => {
  pending.value.push(options);
  return {
    abort: () => {
      window.clearInterval(timers.get(options));
      timers.delete(options);
      pending.value = pending.value.filter((item) => item !== options);
    },
  };
};

const startUpload = () => {
  const queue = pending.value;
  pending.value = [];
  for (const options of queue) {
    let percent = 0;
    const timer = window.setInterval(() => {
      percent = Math.min(100, percent + 25);
      options.onProgress?.({ percent });
      if (percent >= 100) {
        window.clearInterval(timer);
        timers.delete(options);
        options.onSuccess?.({ ok: true });
      }
    }, 200);
    timers.set(options, timer);
  }
};
</script>

<template>
  <Space orientation="vertical">
    <Upload action="/upload.do" multiple :custom-request="customRequest">
      <Button>
        <template #icon><UploadOutlined /></template>
        Select Files
      </Button>
    </Upload>
    <Button type="primary" :disabled="pending.length === 0" @click="startUpload">
      Start Upload ({{ pending.length }})
    </Button>
  </Space>
</template>
