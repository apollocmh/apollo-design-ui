---
order: 5
title:
  zh-CN: 自定义指示符
  en-US: Custom spinning indicator
---

`indicator` 接收一个 **VNode**（antd 侧是 `React.ReactElement`），用来替换默认的四点转圈。
它的优先级是 `indicator` > ConfigProvider 的 `spin.indicator` > `Spin.setDefaultIndicator()`。

⚠️ 类型是 `VNode` 而不是「组件」：要传 `h(...)` 的**调用结果**，传函数式组件是类型错误。
上游 demo 用的 `<LoadingOutlined />` 来自图标库，这里用等价的内联 SVG 代替。

```vue
<script setup lang="ts">
import { h } from 'vue';
import { Spin } from '@apollo-design/ui';

const indicator = h(
  'svg',
  { width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none' },
  [
    h('circle', {
      cx: '12',
      cy: '12',
      r: '9',
      stroke: 'currentColor',
      'stroke-width': '3',
      'stroke-linecap': 'round',
      'stroke-dasharray': '42 14',
    }),
  ],
);
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center', gap: '16px' }">
    <Spin :indicator="indicator" size="small" />
    <Spin :indicator="indicator" />
    <Spin :indicator="indicator" size="large" />
  </div>
</template>
```
