---
order: 8
title:
  zh-CN: 自定义样式与类名
  en-US: Custom styles and classNames
---

## zh-CN

`styles` / `classNames` 支持对象与函数两种形态；`styles` 传函数时入参含 `props`，可按组件形态（如 `type="primary"`）返回不同样式。

## en-US

`styles` / `classNames` accept both object and function forms. When `styles` is a function, the argument contains `props`, so you can return different styles by component props (e.g. `type="primary"`).

```vue
<script setup lang="ts">
import { Button, Divider, Flex, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';
// steps / stylesObject / stylesFunction 定义见上方完整示例
</script>

<template>
  <Flex vertical gap="medium">
    <Flex gap="medium">
      <Button type="primary" @click="open = true">Begin Tour Object</Button>
      <Button type="primary" @click="openFn = true">Begin Tour Function</Button>
    </Flex>
    <Divider />
    <Tour :steps="steps" :class-names="classNames" :arrow="false" :open="open" :styles="stylesObject" @close="open = false" />
    <Tour
      :steps="steps.map((s) => ({ ...s, ...btnProps }))"
      :class-names="classNames"
      :arrow="false"
      type="primary"
      :open="openFn"
      :styles="stylesFunction"
      @close="openFn = false"
    />
    <Space>
      <Button ref="ref1" type="primary">Upload</Button>
      <Button ref="ref2">Save</Button>
      <Button ref="ref3" type="dashed">Other Actions</Button>
    </Space>
  </Flex>
</template>
```
