---
order: 2
title:
  zh-CN: 固定在底部
  en-US: Offset bottom
---

`offsetBottom` 与 `offsetTop` **互斥**：两者都传时只有 `offsetTop` 生效
（antd 的 `internalOffsetTop` 互锁推导，见 `docs/analysis/affix.md` §3）。

```vue
<script setup lang="ts">
import { Affix, Button } from '@apollo-design/ui';
</script>

<template>
  <Affix :offset-bottom="80">
    <Button>固定在底部 80px</Button>
  </Affix>
</template>
```
