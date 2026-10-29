<script setup lang="ts">
// 校验状态：error / warning，输入框与文本域共用 status
import { Input, TextArea } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: 360px">
    <div style="display: flex; flex-direction: column; gap: 6px">
      <span style="color: var(--apollo-color-text-secondary); font-size: 12px">错误状态</span>
      <Input status="error" aria-label="错误状态输入框" placeholder="请输入有效邮箱" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px">
      <span style="color: var(--apollo-color-text-secondary); font-size: 12px">警告状态</span>
      <Input status="warning" aria-label="警告状态输入框" placeholder="该用户名即将过期" />
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px">
      <span style="color: var(--apollo-color-text-secondary); font-size: 12px">文本域错误状态</span>
      <TextArea
        status="error"
        aria-label="错误状态文本域"
        :rows="3"
        placeholder="请至少填写 20 个字符"
      />
    </div>
  </div>
</template>
