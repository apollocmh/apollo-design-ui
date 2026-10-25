---
order: 6
title:
  zh-CN: 语义化 classNames / styles
  en-US: Semantic classNames / styles
---

## zh-CN

四个语义槽位：`root`（根元素）、`actions`（操作区）、`action`（每个操作按钮）、`textarea`（仅编辑态的输入框）。`classNames` 拼接类名，`styles` 合并同名区域的样式。函数式配置收到 `{ props }`，其中 `prefixCls` / `direction` 是解析后的值。

保留对象式、函数式和操作区示例，最后演示 Vue 原生 `class` / `style`：动态字符串 → 混合数组 → 对象 → 移除。原生 style 优先于 `styles.root`；移除后恢复语义根样式。输入草稿和焦点随样式切换保留。

局部 ConfigProvider 示例进一步替换整个 `components.typography` 配置：对象 → 新对象 → 捕获当前普通值的新函数 → 移除。根、操作区、按钮和编辑输入的类名/样式同步更新；函数只读取既有 `props.prefixCls`，可看到解析后的前缀。原生根 style 和本地 `styles.root` 的覆盖顺序保持，输入草稿和焦点不被配置替换重置。

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

The scoped ConfigProvider example also replaces the whole `components.typography` configuration: object, new object, new functions that capture current plain values, then removal. Root, action group, buttons and editing input update together. Callbacks read the existing `props.prefixCls` field and receive its resolved value. Native root style and local `styles.root` keep their priority; replacing configuration preserves drafts and focus.
