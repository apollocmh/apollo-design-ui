const n=`<script setup lang="ts">
// 对齐 antd 的 custom-icon demo
import { SmileOutlined } from '@apollo-design/icons';
import { Alert } from '@apollo-design/ui';
<\/script>

<template>
  <div>
    <Alert title="showIcon = false" type="success">
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert title="Success Tips" type="success" show-icon>
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert title="Informational Notes" type="info" show-icon>
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert title="Warning" type="warning" show-icon>
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert title="Error" type="error" show-icon>
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert
      title="Success Tips"
      description="Detailed description and advice about successful copywriting."
      type="success"
      show-icon
    >
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert
      title="Informational Notes"
      description="Additional description and information about copywriting."
      type="info"
      show-icon
    >
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert
      title="Warning"
      description="This is a warning notice about copywriting."
      type="warning"
      show-icon
    >
      <template #icon><SmileOutlined /></template>
    </Alert>
    <br />
    <Alert
      title="Error"
      description="This is an error message about copywriting."
      type="error"
      show-icon
    >
      <template #icon><SmileOutlined /></template>
    </Alert>
  </div>
</template>
`;export{n as default};
