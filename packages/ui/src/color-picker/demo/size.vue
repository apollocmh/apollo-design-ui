<script setup lang="ts">
// 对齐 antd 的 size demo：触发器大 / 中 / 小三档（含 `showText` 两列）。
import { ColorPicker, Space } from '@apollo-design/ui';
</script>

<template>
  <Space>
    <Space vertical>
      <ColorPicker default-value="#1677ff" size="small" />
      <ColorPicker default-value="#1677ff" />
      <ColorPicker default-value="#1677ff" size="large" />
    </Space>
    <Space vertical>
      <ColorPicker default-value="#1677ff" size="small" show-text />
      <ColorPicker default-value="#1677ff" show-text />
      <ColorPicker default-value="#1677ff" size="large" show-text />
    </Space>
  </Space>
</template>
