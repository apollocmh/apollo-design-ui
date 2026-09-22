<script setup lang="ts">
// 对齐 antd 的 custom-icon demo
import { SmileOutlined } from '@apollo-design/icons';
import { Alert } from '@apollo-design/ui';
import { h } from 'vue';

const icon = h(SmileOutlined);
</script>

<template>
  <div>
    <Alert :icon="icon" title="showIcon = false" type="success" />
    <br />
    <Alert :icon="icon" title="Success Tips" type="success" show-icon />
    <br />
    <Alert :icon="icon" title="Informational Notes" type="info" show-icon />
    <br />
    <Alert :icon="icon" title="Warning" type="warning" show-icon />
    <br />
    <Alert :icon="icon" title="Error" type="error" show-icon />
    <br />
    <Alert
      :icon="icon"
      title="Success Tips"
      description="Detailed description and advice about successful copywriting."
      type="success"
      show-icon
    />
    <br />
    <Alert
      :icon="icon"
      title="Informational Notes"
      description="Additional description and information about copywriting."
      type="info"
      show-icon
    />
    <br />
    <Alert
      :icon="icon"
      title="Warning"
      description="This is a warning notice about copywriting."
      type="warning"
      show-icon
    />
    <br />
    <Alert
      :icon="icon"
      title="Error"
      description="This is an error message about copywriting."
      type="error"
      show-icon
    />
  </div>
</template>
