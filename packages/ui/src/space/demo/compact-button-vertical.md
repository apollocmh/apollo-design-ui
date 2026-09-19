---
order: 8
title:
  zh-CN: 垂直紧凑按钮组
  en-US: Compact Button Vertical
---

垂直方向的紧凑布局，目前仅支持 Button 组合。

⚠️ 垂直模式目前**只有 Button 实现了对应的边框合并样式** —— 这是上游的现状，不是我们的缺口。
其它表单组件的垂直紧凑拼接样式尚未落地，所以这里只演示 Button。

```vue
<script setup lang="ts">
import { Space, SpaceCompact } from '@apollo-design/ui';
import { BTN_DASHED, BTN_DEFAULT, BTN_PRIMARY } from './_standin';

/** `variant="outlined"` 是 antd 6 的新写法，等价于默认的 `BTN_DEFAULT`。 */
const BTN_OUTLINED = BTN_DEFAULT;
</script>

<template>
  <Space>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_DEFAULT">Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_DASHED">Button 1</button>
      <button type="button" :style="BTN_DASHED">Button 2</button>
      <button type="button" :style="BTN_DASHED">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_PRIMARY">Button 1</button>
      <button type="button" :style="BTN_PRIMARY">Button 2</button>
      <button type="button" :style="BTN_PRIMARY">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_OUTLINED">Button 1</button>
      <button type="button" :style="BTN_OUTLINED">Button 2</button>
      <button type="button" :style="BTN_OUTLINED">Button 3</button>
    </SpaceCompact>
  </Space>
</template>
```
