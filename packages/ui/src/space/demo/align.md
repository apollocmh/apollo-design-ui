---
order: 3
title:
  zh-CN: 对齐
  en-US: Align
---

设置对齐模式。`align` 只有 `start` / `end` / `center` / `baseline` 四个取值。

⚠️ 水平模式下不传 `align` 时**默认**是 `center`（不是 `start`）—— 与 antd 一致。

```vue
<script setup lang="ts">
import { Space } from '@apollo-design/ui';
import { ALIGN_BOX, BTN_PRIMARY, MOCK_BOX, ROW_WRAP } from './_standin';
</script>

<template>
  <div :style="ROW_WRAP">
    <div :style="ALIGN_BOX">
      <Space align="center">
        center
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="start">
        start
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="end">
        end
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
    <div :style="ALIGN_BOX">
      <Space align="baseline">
        baseline
        <button type="button" :style="BTN_PRIMARY">Primary</button>
        <span :style="MOCK_BOX">Block</span>
      </Space>
    </div>
  </div>
</template>
```
