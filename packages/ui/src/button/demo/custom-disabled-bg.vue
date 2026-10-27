<script setup lang="ts">
// 自定义禁用态背景 / 边框 / 文字色（ConfigProvider theme.token）
import { Button, ConfigProvider, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const clicks = ref(0);
</script>

<template>
  <div style="font-family: sans-serif">
    <ConfigProvider
      :theme="{
        token: {
          colorBgContainerDisabled: '#e6f4ff',
          colorBorderDisabled: '#91caff',
          colorTextDisabled: '#1677ff',
        },
      }"
    >
      <Space wrap>
        <Button disabled>Default(disabled)</Button>
        <Button type="primary" disabled>Primary(disabled)</Button>
        <Button danger disabled>Danger(disabled)</Button>
        <Button type="primary" @click="clicks++">可点击 {{ clicks }}</Button>
      </Space>
    </ConfigProvider>
    <div style="margin-top: 12px; font-size: 12px; color: var(--apollo-color-text-secondary)">
      上方禁用按钮的背景 / 边框 / 文字来自 ConfigProvider 的 theme.token 覆盖
    </div>
  </div>
</template>
