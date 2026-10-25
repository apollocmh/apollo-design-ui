---
order: 6
title:
  zh-CN: 语义化 classNames / styles
  en-US: Semantic classNames / styles
---

## zh-CN

四个语义槽位：`root`（根元素）、`actions`（操作区）、`action`（每个操作按钮）、`textarea`（仅编辑态的输入框）。`classNames` 拼接类名，`styles` 合并同名区域的样式。函数式配置收到 `{ props }`，其中 `prefixCls` / `direction` 是解析后的值。

保留对象式、函数式和操作区示例，最后演示 Vue 原生 `class` / `style`：动态字符串 → 混合数组 → 对象 → 移除。原生 style 优先于 `styles.root`；移除后恢复语义根样式。输入草稿和焦点随样式切换保留。

```vue
<script setup lang="ts">
import { ref, type StyleValue } from 'vue';
import { Text } from '@apollo-design/ui';

const nativeStyle = ref<StyleValue>('color:var(--apollo-color-primary)');
</script>

<template>
  <Text :style="nativeStyle" :styles="{ root: { color: 'var(--apollo-color-text-secondary)' } }">
    Native style overrides the semantic root; undefined restores it.
  </Text>
</template>
```

## en-US

The four semantic regions are `root`, `actions`, `action` and the editing-only `textarea`. `classNames` joins classes, while `styles` merges styles for the same region. Function configs receive `{ props }` with the resolved `prefixCls` and `direction`.

The object, function and action examples are preserved. The final example cycles native Vue `class` / `style` through a dynamic string, mixed array, object and removal. Native style overrides `styles.root`; removing it restores the semantic root. Style updates preserve the input's draft and focus.
