<script setup lang="ts">
// 拨轮形态的三种尺寸
import { InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-input-number-spinner">
    <label class="demo-input-number-spinner__item">
      <span>大号拨轮</span>
      <InputNumber
        aria-label="大号拨轮数字输入框"
        mode="spinner"
        size="large"
        :default-value="3"
        :min="0"
        :max="10"
      />
    </label>
    <label class="demo-input-number-spinner__item">
      <span>中号拨轮</span>
      <InputNumber
        aria-label="中号拨轮数字输入框"
        mode="spinner"
        size="medium"
        :default-value="5"
        :min="0"
        :max="10"
      />
    </label>
    <label class="demo-input-number-spinner__item">
      <span>小号拨轮</span>
      <InputNumber
        aria-label="小号拨轮数字输入框"
        mode="spinner"
        size="small"
        :default-value="7"
        :min="0"
        :max="10"
      />
    </label>
  </div>
</template>

<style>
.demo-input-number-spinner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 280px;
}

.demo-input-number-spinner__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #595959;
  font-size: 12px;
}
</style>
