## zh-CN

点击锚点不记录历史（回调里 `preventDefault()` 可以进一步阻止组件接管 history）。

```vue
<script setup lang="ts">
// 对齐 antd 的 onClick demo：点击链接的回调（**自定义签名**，不是 DOM 事件）。
// ⚠️ 在回调里 `preventDefault()` 可以让组件**不接管 history**。
import { Anchor, type AnchorLinkInfo, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
];

const clicked = ref('');

const handleClick = (e: MouseEvent, link: AnchorLinkInfo): void => {
  clicked.value = `${link.href}`;
  // 这里**不** preventDefault ⇒ 组件照常接管 history
  void e;
};
</script>

<template>
  <div>
    <div style="margin-bottom: 8px">最近点击：{{ clicked || '（无）' }}</div>
    <Anchor :items="items" :affix="false" :on-click="handleClick" />
  </div>
</template>
```

## en-US

Clicking on an anchor does not record history (call `preventDefault()` in the callback to stop the component from touching history).

```vue
<script setup lang="ts">
// 对齐 antd 的 onClick demo：点击链接的回调（**自定义签名**，不是 DOM 事件）。
// ⚠️ 在回调里 `preventDefault()` 可以让组件**不接管 history**。
import { Anchor, type AnchorLinkInfo, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
];

const clicked = ref('');

const handleClick = (e: MouseEvent, link: AnchorLinkInfo): void => {
  clicked.value = `${link.href}`;
  // 这里**不** preventDefault ⇒ 组件照常接管 history
  void e;
};
</script>

<template>
  <div>
    <div style="margin-bottom: 8px">最近点击：{{ clicked || '（无）' }}</div>
    <Anchor :items="items" :affix="false" :on-click="handleClick" />
  </div>
</template>
```
