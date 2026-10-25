---
order: 5
title:
  zh-CN: 可编辑
  en-US: Editable
---

## zh-CN

`triggerType` 决定进入编辑态的方式：`['icon']`（默认，点铅笔图标）、`['text']`（点文字）。

编辑时 Enter 保存、Esc 取消、失焦保存，保存值会去掉首尾空格。输入法组合中，或带 Ctrl / Alt / Meta / Shift 的 Enter 不触发保存。

最后一个示例使用正常 Vue 模板的条件默认插槽。它最初没有正文；更新当前文本，再显示、编辑或复制正文，操作均读取当前内容。再次移除正文时，复制按钮恢复只有图标的状态。编辑态使用原生 `<textarea>`，示例显式提供可访问名。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Text } from '@apollo-design/ui';

const showContent = ref(false);
const currentText = ref('Current template text');
</script>

<template>
  <Text aria-label="Conditional editable text" copyable
    :editable="{ onChange: (value: string) => (currentText = value) }">
    <template v-if="showContent" #default>{{ currentText }}</template>
  </Text>
</template>
```

## en-US

`triggerType` chooses how editing starts: `['icon']` (the pencil button, by default) or `['text']` (the text itself).

Enter saves, Escape cancels and blur saves. Saved values are trimmed. Enter does not save during IME composition or while Ctrl, Alt, Meta or Shift is held.

The last example uses a conditional default slot in a normal Vue template. It initially has no body. Update the text, then reveal, edit or copy it: each operation reads the current content. Removing the body restores the copy button's icon-only state. Editing uses a native `<textarea>` with an explicit accessible name.
