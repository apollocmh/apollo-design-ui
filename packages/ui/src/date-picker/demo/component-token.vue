<script setup lang="ts">
// 组件 Token：在 DatePicker 根元素上覆写真实的 `--apollo-date-picker-*` 变量。
// `ConfigProvider theme.components` 尚未产出组件 CSS 变量，故采用与 alert 等组件
// component-token demo 相同的直接覆写方式。
import { DatePicker } from '@apollo-design/ui';

const pickerTokenStyle = {
  '--apollo-date-picker-active-border-color': '#722ed1',
  '--apollo-date-picker-hover-border-color': '#9254de',
  '--apollo-date-picker-active-shadow': '0 0 0 2px rgb(114 46 209 / 20%)',
  '--apollo-date-picker-input-font-size': '15px',
};

const panelTokenStyle = {
  '--apollo-date-picker-cell-hover-bg': '#f9f0ff',
  '--apollo-date-picker-presets-width': '140px',
};
</script>

<template>
  <div class="demo-picker-token-list">
    <DatePicker
      :style="pickerTokenStyle"
      placeholder="自定义激活边框与阴影"
      aria-label="自定义激活边框与阴影"
    />
    <DatePicker
      :style="panelTokenStyle"
      placeholder="打开面板查看单元格悬浮色"
      aria-label="打开面板查看单元格悬浮色"
    />
    <DatePicker.RangePicker
      :style="pickerTokenStyle"
      :placeholder="['开始日期', '结束日期']"
    />
  </div>
</template>

<style scoped>
.demo-picker-token-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
</style>
