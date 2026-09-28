---
order: 7
title:
  zh-CN: 面板预览
  en-US: Panel preview
---

## zh-CN

静态面板（debug 用，`TourPurePanel` = antd 的 `_InternalPanelDoNotUseOrYouWillBeFired`）。

## en-US

Pure panel preview (debug usage, `TourPurePanel` = antd's `_InternalPanelDoNotUseOrYouWillBeFired`).

```vue
<script setup lang="ts">
import { TourPurePanel } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 16px; background: rgba(50,0,0,0.65); padding: 8px;">
    <TourPurePanel title="Hello World!" description="Hello World?!" />
    <TourPurePanel title="Hello World!" description="Hello World?!" :current="5" :total="7">
      <template #cover>
        <img draggable="false" alt="tour.png" src="https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png" />
      </template>
    </TourPurePanel>
    <TourPurePanel title="Hello World!" description="Hello World?!" type="primary" :current="4" :total="5" />
  </div>
</template>
```
