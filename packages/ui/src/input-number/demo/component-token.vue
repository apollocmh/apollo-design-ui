<script setup lang="ts">
// 组件 Token：覆盖 InputNumber 根节点上的 --apollo-input-number-* 变量
import { InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-input-number-token">
    <span class="demo-input-number-token__label">紫色聚焦态与更宽的步进按钮</span>
    <InputNumber
      aria-label="自定义令牌数字输入框"
      :default-value="5"
      :min="0"
      :max="20"
      style="width: 200px"
    />
    <p class="demo-input-number-token__hint">
      覆盖 --apollo-input-number-control-width / handle-width / handle-bg /
      active-border-color 等组件 token。
    </p>
  </div>
</template>

<style>
.demo-input-number-token {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 360px;
}

.demo-input-number-token__label {
  color: #595959;
  font-size: 12px;
}

.demo-input-number-token .apollo-input-number {
  --apollo-input-number-control-width: 36px;
  --apollo-input-number-handle-width: 28px;
  --apollo-input-number-handle-font-size: 14px;
  --apollo-input-number-padding-inline: 18px;
  --apollo-input-number-handle-bg: #f9f0ff;
  --apollo-input-number-handle-hover-color: #722ed1;
  --apollo-input-number-hover-border-color: #9254de;
  --apollo-input-number-active-border-color: #722ed1;
  --apollo-input-number-active-shadow: 0 0 0 2px rgb(114 46 209 / 18%);
}

.demo-input-number-token__hint {
  margin: 0;
  color: #999;
  font-size: 12px;
}
</style>
