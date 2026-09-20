---
order: 2
title:
  zh-CN: 文本与装饰
  en-US: Text & decorations
---

`type` 是语义色（`secondary` / `success` / `warning` / `danger`），`disabled` 是禁用态。

七个装饰开关（`code` / `mark` / `underline` / `delete` / `strong` / `keyboard` / `italic`）
的**嵌套顺序是契约**：由内到外依次是 `strong → u → del → code → mark → kbd → i`。

```vue
<script setup lang="ts">
import { Text } from '@apollo-design/ui';
</script>

<template>
  <Text>Apollo Design</Text>
  <br />
  <Text type="secondary">Secondary</Text>
  <br />
  <Text type="success">Success</Text>
  <br />
  <Text type="warning">Warning</Text>
  <br />
  <Text type="danger">Danger</Text>
  <br />
  <Text disabled>Disabled</Text>
  <br />
  <Text mark>Marked text</Text>
  <br />
  <Text code>code</Text>
  <br />
  <Text keyboard>Ctrl + C</Text>
  <br />
  <Text underline>Underline</Text>
  <br />
  <Text delete>Deleted</Text>
  <br />
  <Text strong>Strong</Text>
  <br />
  <Text italic>Italic</Text>
</template>
```
