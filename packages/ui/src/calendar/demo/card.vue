<script setup lang="ts">
// 对齐 antd 的 card demo：迷你日历 + 自绘边框容器。
//
// 边框与圆角直接消费 CSS 变量，跟随当前亮暗主题。

import type { CalendarEmits } from '@apollo-design/ui';
import { Calendar } from '@apollo-design/ui';

const onPanelChange: CalendarEmits['panelChange'] = (value, mode) => {
  console.log(value.format('YYYY-MM-DD'), mode);
};

const wrapperStyle = {
  width: '300px',
  maxWidth: '100%',
  boxSizing: 'border-box' as const,
  border: '1px solid var(--apollo-color-border-secondary)',
  borderRadius: 'var(--apollo-border-radius-lg)',
};
</script>

<template>
  <div :style="wrapperStyle">
    <Calendar :fullscreen="false" @panel-change="onPanelChange" />
  </div>
</template>
