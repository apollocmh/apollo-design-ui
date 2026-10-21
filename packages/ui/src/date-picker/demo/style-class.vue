<script setup lang="ts">
// 对齐 antd 的 demo/style-class.tsx：root / input / suffix / popup 语义槽。
import type { DatePickerSemanticClassNames, DatePickerSemanticStyles } from '@apollo-design/ui';
import { DatePicker } from '@apollo-design/ui';

const classNames: DatePickerSemanticClassNames = {
  root: 'demo-picker-root',
  input: 'demo-picker-input',
  suffix: 'demo-picker-suffix',
  popup: {
    root: 'demo-picker-popup',
    header: 'demo-picker-popup-header',
  },
};

const styles: DatePickerSemanticStyles = {
  input: { fontWeight: 500 },
  suffix: { color: '#722ed1' },
};
</script>

<template>
  <div class="demo-picker-style-list">
    <DatePicker
      :class-names="classNames"
      :styles="styles"
      placeholder="自定义语义样式"
      aria-label="自定义语义样式的日期选择器"
    />
    <DatePicker.RangePicker
      :class-names="classNames"
      :styles="styles"
      :placeholder="['开始日期', '结束日期']"
    />
    <div class="demo-picker-hint">
      打开面板可看到 popup.root / popup.header 两个浮层语义槽上的类名。
    </div>
  </div>
</template>

<style scoped>
.demo-picker-style-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>

<style>
.demo-picker-root {
  border-radius: 10px;
}

.demo-picker-input {
  letter-spacing: 0.2px;
}

.demo-picker-suffix {
  opacity: 0.9;
}

.demo-picker-popup {
  border: 1px solid #d3adf7;
  border-radius: 10px;
}

.demo-picker-popup-header {
  background: #f9f0ff;
}
</style>
