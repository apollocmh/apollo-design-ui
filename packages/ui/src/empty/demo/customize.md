---
order: 2
title:
  zh-CN: 自定义插画
  en-US: Customize
---

`image` 接受**字符串**（渲染成 `<img draggable="false">`）、**VNode** 或**组件**。

⚠️ 与 antd 的一处平台差异：antd 传的是「React 元素」（`<MyImage />` 的求值结果），
Vue 没有等价的元素概念，对应物是**组件本身**。

```vue
<script setup lang="ts">
import { Empty } from '@apollo-design/ui';
import CustomImage from './CustomImage.vue';
</script>

<template>
  <Empty :image="CustomImage" description="Custom image" />
</template>
```
