---
order: 6
title:
  zh-CN: 语义化 classNames / styles
  en-US: Semantic classNames / styles
---

四个语义槽位：`root`（根元素）、`actions`（操作区 `span`）、`action`（每个操作按钮）、
`textarea`（**仅编辑态**的输入框）。

`classNames` 是**拼接**，`styles` 是**覆盖**（后者与 `style` prop 的优先级见
`README.md` 的 API 表）。函数式形态收到 `{ props }`，其中的 `prefixCls` / `direction`
是**解析后**的值。

```vue
<script setup lang="ts">
import type { TypographyProps } from '@apollo-design/ui';
import { Paragraph, Text } from '@apollo-design/ui';

const classNamesObject: TypographyProps['classNames'] = {
  root: 'demo-typography-root',
  actions: 'demo-typography-actions',
  action: 'demo-typography-action',
};

const stylesObject: TypographyProps['styles'] = {
  root: { backgroundColor: '#fafafa' },
  actions: { marginInlineStart: '8px' },
};

const classNamesFn: TypographyProps['classNames'] = (info) =>
  info.props.disabled ? { root: 'demo-typography-root--disabled' } : { root: 'demo-typography-root' };
</script>

<template>
  <Paragraph :class-names="classNamesObject" :styles="stylesObject" :copyable="true">
    Object form: classNames / styles
  </Paragraph>
  <Paragraph :class-names="classNamesFn">Function form: classNames</Paragraph>
  <Paragraph :class-names="classNamesFn" disabled>Function form, disabled</Paragraph>
  <Text :class-names="classNamesObject" :styles="stylesObject" :copyable="true" />
</template>
```
