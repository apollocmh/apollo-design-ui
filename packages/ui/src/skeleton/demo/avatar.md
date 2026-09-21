---
order: 2
title:
  zh-CN: 带头像
  en-US: With avatar
---

`avatar` 为真时多出一个 `-header` 容器（与 `-section` **并列**，不是嵌套）。

⚠️ 头像的形状由**另外两项**推导：`hasTitle && !hasParagraph` 时是**方形**，
否则是圆形；`size` 恒为 `large`。本示例关掉了段落，所以是方形。

```vue
<script setup lang="ts">
import { Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Skeleton avatar :paragraph="false" />
</template>
```
