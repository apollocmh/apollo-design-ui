<script setup lang="ts">
// 对齐 antd 的 demo/before-upload.tsx（false / LIST_IGNORE 两种语义）
import { UploadOutlined } from '@apollo-design/icons';
import { Button, Space, Upload, type UploadProps } from '@apollo-design/ui';

/** 返回 false：进入列表但**不发起上传**（仍触发一次 change）。 */
const blockUpload: UploadProps['beforeUpload'] = () => false;

/** 返回 LIST_IGNORE：完全不进入列表，也不上传。 */
const ignoreUpload: UploadProps['beforeUpload'] = () => Upload.LIST_IGNORE;
</script>

<template>
  <Space wrap>
    <Upload action="/upload.do" :before-upload="blockUpload">
      <Button>
        <template #icon><UploadOutlined /></template>
        beforeUpload: false
      </Button>
    </Upload>
    <Upload action="/upload.do" :before-upload="ignoreUpload">
      <Button>
        <template #icon><UploadOutlined /></template>
        beforeUpload: LIST_IGNORE
      </Button>
    </Upload>
  </Space>
</template>
