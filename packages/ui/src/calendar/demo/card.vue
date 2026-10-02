<script setup lang="ts">
// 对齐 antd 的 card demo：迷你日历 + 自绘边框容器。
//
// ⚠️ **两处 demo 级替换**（不是能力缺口）：
//   1. 上游用 `theme.useToken()` 取 `lineWidth` / `lineType` / `colorBorderSecondary` /
//      `borderRadiusLG` —— 本仓是**零运行时**架构，**没有** `theme.useToken()` 这个 hook
//      （token 是构建期产物）⇒ 这里写**等值字面量**（与默认主题的解析值一致）。
//   2. 上游的 `onPanelChange` 只 `console.log`，本仓同。

import type { CalendarEmits } from '@apollo-design/ui';
import { Calendar } from '@apollo-design/ui';

const onPanelChange: CalendarEmits['panelChange'] = (value, mode) => {
  console.log(value.format('YYYY-MM-DD'), mode);
};

/** `lineWidth: 1` / `lineType: 'solid'` / `colorBorderSecondary: '#f0f0f0'` / `borderRadiusLG: 8`。 */
const wrapperStyle = {
  width: '300px',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
};
</script>

<template>
  <div :style="wrapperStyle">
    <Calendar :fullscreen="false" @panel-change="onPanelChange" />
  </div>
</template>
