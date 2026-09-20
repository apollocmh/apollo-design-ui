---
order: 3
title:
  zh-CN: 不可用状态
  en-US: Disabled
---

⚠️ 两个分支的 disabled 表达**不对称**，这是上游真实行为（不是笔误）：

| 分支 | 表现 |
|---|---|
| `<button>`（无 `href`） | 原生 `disabled` 属性 |
| `<a>`（有 `href`） | 移除 `href` + `tabindex="-1"` + `aria-disabled` |

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" disabled>Primary(disabled)</Button>
  <Button type="primary" href="https://example.com" disabled>Href(disabled)</Button>
</template>
```
