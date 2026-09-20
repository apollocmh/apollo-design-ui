---
order: 0
title:
  zh-CN: 按钮类型
  en-US: Type
---

`type` 是 v5 及更早版本的「糖」写法，v6 里会被解析成 `color` + `variant`：

| type | color | variant |
|---|---|---|
| `primary` | `primary` | `solid` |
| `default` | `default` | `outlined` |
| `dashed` | `default` | `dashed` |
| `text` | `default` | `text` |
| `link` | `link` | `link` |

最后一颗按钮演示「两个中文字符自动插空格」：`autoInsertSpace` 默认为 `true`。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary">Primary</Button>
  <Button>Default</Button>
  <Button type="dashed">Dashed</Button>
  <Button type="text">Text</Button>
  <Button type="link">Link</Button>
  <Button type="primary">确定</Button>
</template>
```
