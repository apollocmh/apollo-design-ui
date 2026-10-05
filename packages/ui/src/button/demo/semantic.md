---
order: 11
title:
  zh-CN: 语义化 classNames / styles
  en-US: Semantic
---

`classNames` / `styles` 各有三个槽位：`root` / `icon` / `content`。

合并优先级（低 → 高）：

```
ConfigProvider.button.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

⚠️ 与 antd 的差异：本仓库**不支持函数式变体**（`classNames` / `styles` 只接受对象），
依据 `empty-semantic-fn` 开放决策的建议 B，与已完成的 divider / empty / space / spin 一致。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button :class-names="{ root: 'demo-btn-root' }" :styles="{ root: { borderRadius: '16px' } }">
    Semantic
  </Button>
</template>
```
