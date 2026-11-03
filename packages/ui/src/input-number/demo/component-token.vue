<script setup lang="ts">
import { ConfigProvider, InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-input-number-token">
    <span class="demo-input-number-token__label">紫色聚焦态与更宽的步进按钮</span>
    <ConfigProvider
      :theme="{
        token: { colorPrimary: '#722ed1', colorPrimaryHover: '#9254de', controlOutline: 'rgba(114,46,209,0.18)' },
        components: { InputNumber: { controlWidth: 200, handleWidth: 28, handleFontSize: 14, handleVisible: true, paddingInline: 18, handleBg: 'color-mix(in srgb, #722ed1 10%, var(--apollo-color-bg-container))', handleHoverColor: 'var(--apollo-color-primary-text)' } },
      }"
    >
      <InputNumber
        aria-label="自定义令牌数字输入框"
        :default-value="5"
        :min="0"
        :max="20"
      />
    </ConfigProvider>
    <p class="demo-input-number-token__hint">
      通过 theme.components.InputNumber 配置宽度、步进按钮与背景，通过当前主题配置聚焦色。
    </p>
  </div>
</template>

<style>
.demo-input-number-token {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(100%, 360px);
}

.demo-input-number-token__label {
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}

.demo-input-number-token__hint {
  margin: 0;
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}
</style>
