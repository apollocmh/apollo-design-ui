<script setup lang="ts">
// 线性渐变：用类名覆盖主按钮背景
import { Button, Space } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-button-gradient-wrap">
    <Space wrap>
      <Button class="demo-button-gradient" type="primary" size="large">Linear Gradient</Button>
      <Button class="demo-button-gradient demo-button-gradient--warm" type="primary">
        Warm Gradient
      </Button>
      <Button class="demo-button-gradient" type="primary" disabled>Disabled Gradient</Button>
    </Space>
    <p class="demo-button-gradient__hint">
      渐变只覆盖背景图像，悬停与按下状态保持同色系，并为白色文字配对足够深的渐变端点。
    </p>
  </div>
</template>

<style>
.demo-button-gradient.apollo-btn {
  color: #fff;
  border: 0;
  background-image: linear-gradient(135deg, #0958d9 0%, #531dab 100%);
  box-shadow: 0 6px 16px rgb(22 119 255 / 28%);
}

.demo-button-gradient.apollo-btn:not(:disabled):hover {
  color: #fff;
  background-image: linear-gradient(135deg, #0958d9 0%, #722ed1 100%);
  box-shadow: 0 8px 20px rgb(114 46 209 / 30%);
}

.demo-button-gradient.apollo-btn:not(:disabled):active {
  color: #fff;
  background-image: linear-gradient(135deg, #0958d9 0%, #531dab 100%);
}

.demo-button-gradient--warm.apollo-btn {
  background-image: linear-gradient(135deg, #b33a00 0%, #a8071a 100%);
  box-shadow: 0 6px 16px rgb(245 34 45 / 26%);
}

.demo-button-gradient--warm.apollo-btn:not(:disabled):hover {
  background-image: linear-gradient(135deg, #c43d00 0%, #a8071a 100%);
}

.demo-button-gradient.apollo-btn:disabled {
  background-image: none;
  color: var(--apollo-color-text-disabled);
}

.demo-button-gradient-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-button-gradient__hint {
  margin: 0;
  color: var(--apollo-color-text-secondary);
  font-size: 12px;
}
</style>
