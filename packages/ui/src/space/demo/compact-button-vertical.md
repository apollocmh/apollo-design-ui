---
order: 8
title:
  zh-CN: 垂直紧凑按钮组
  en-US: Compact Button Vertical
---

纵向紧凑按钮支持默认、虚线、主按钮和 outlined 外观。

Vertical compact Buttons with default, dashed, primary and outlined appearances.

```vue
<script setup lang="ts">
import { Button, Space, SpaceCompact } from '@apollo-design/ui';
</script>
<template>
  <Space align="start" wrap>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" type="dashed">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" type="primary">Button {{ i }}</Button></SpaceCompact>
    <SpaceCompact orientation="vertical"><Button v-for="i in 3" :key="i" variant="outlined">Button {{ i }}</Button></SpaceCompact>
  </Space>
</template>
```
