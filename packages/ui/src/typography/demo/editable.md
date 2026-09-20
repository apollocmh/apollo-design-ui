---
order: 5
title:
  zh-CN: 可编辑
  en-US: Editable
---

`triggerType` 决定进入编辑态的方式：`['icon']`（默认，点铅笔图标）、`['text']`（点文字）。

编辑态的三条行为契约：

1. **Enter 保存、Esc 取消、失焦保存**；
2. **保存的值会 `trim()`**（`onChange` 收到的已是去掉首尾空格的值）；
3. **输入法组合中、或带修饰键（`Ctrl`/`Alt`/`Meta`/`Shift`）的 Enter 不触发保存** ——
   否则中文选词与 `Ctrl+Enter` 会误提交。

⚠️ 本阶段编辑态用**原生 `<textarea>`** 承载（antd 用的是 `Input.TextArea`，Input 组件尚未落地）。
DOM 与视觉都与 antd **不一致**，差异登记为 D-typography-2，见 `README.md` §7。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Text } from '@apollo-design/ui';

const editableText = ref('Click the icon to edit');
</script>

<template>
  <Text :editable="true">Click the icon to edit</Text>
  <Text :editable="{ text: editableText, onChange: (v: string) => (editableText = v) }">
    {{ editableText }}
  </Text>
  <Text :editable="{ triggerType: ['text'] }">Click the text to edit</Text>
  <Text :editable="{ tooltip: false }">No tooltip on the edit icon</Text>
</template>
```
