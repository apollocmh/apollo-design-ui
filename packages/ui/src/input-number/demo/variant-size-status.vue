<script setup lang="ts">
// variant + size + status 的组合矩阵
import { InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-input-number-matrix">
    <label class="demo-input-number-matrix__item">
      <span>large / filled</span>
      <InputNumber
        aria-label="大号填充数字输入框"
        size="large"
        variant="filled"
        :default-value="8"
        :min="0"
        :max="20"
      />
    </label>
    <label class="demo-input-number-matrix__item">
      <span>medium / outlined</span>
      <InputNumber
        aria-label="中号描边数字输入框"
        size="medium"
        variant="outlined"
        :default-value="12"
        :min="0"
        :max="20"
      />
    </label>
    <label class="demo-input-number-matrix__item">
      <span>small / borderless + error</span>
      <InputNumber
        aria-label="小号无边框错误数字输入框"
        size="small"
        variant="borderless"
        status="error"
        :default-value="25"
        :min="0"
        :max="20"
      />
    </label>
    <label class="demo-input-number-matrix__item">
      <span>large / underlined + warning</span>
      <InputNumber
        aria-label="大号下划线警告数字输入框"
        size="large"
        variant="underlined"
        status="warning"
        :default-value="18"
        :min="0"
        :max="20"
      />
    </label>
  </div>
</template>

<style>
.demo-input-number-matrix {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 520px;
}

.demo-input-number-matrix__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #595959;
  font-size: 12px;
}
</style>
