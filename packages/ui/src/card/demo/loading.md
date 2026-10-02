---
order: 5
title:
  zh-CN: 预加载的卡片
  en-US: Loading card
---

数据读入前会有文本块样式。

`loading` 时 body 里的内容被替换成 `Skeleton`（`active` + 4 行段落 + **无标题行**）。

⚠️ 两处 demo 级替换：`Avatar` **尚未落地** ⇒ 用原生等价物；上游的外网头像图换成同形状的色块
（外网图片会污染 L6 基线）。

```vue
<script setup lang="ts">
// 对齐 antd 的 loading demo。
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@apollo-design/icons';
import { Card, CardMeta, Flex, Switch } from '@apollo-design/ui';
import { h, ref, type VNodeChild } from 'vue';

const loading = ref(true);

const actions = [
  h(EditOutlined, { key: 'edit' }),
  h(SettingOutlined, { key: 'setting' }),
  h(EllipsisOutlined, { key: 'ellipsis' }),
];

/** `Avatar` 尚未落地 ⇒ 原生等价物（圆形色块 + 文字）。 */
const avatar = (text: string): VNodeChild =>
  h(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#d9d9d9',
      },
    },
    text,
  );
</script>

<template>
  <Flex gap="medium" align="start" vertical>
    <Switch
      aria-label="Show card content"
      :checked="!loading"
      @change="(checked: boolean) => (loading = !checked)"
    />
    <Card :loading="loading" :actions="actions" :style="{ minWidth: '300px' }">
      <CardMeta :avatar="avatar('A')" title="Card title" />
    </Card>
  </Flex>
</template>
```
