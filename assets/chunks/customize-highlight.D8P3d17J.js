const n=`<script setup lang="ts">
// 对齐 antd 的 customizeHighlight demo：\`getCurrentAnchor\` **改写高亮**
// （⚠️ 只改高亮，\`onChange\` 收到的仍是**原始 link**）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];

/** 永远把 \`#anchor-demo-b\` 显示为高亮。 */
const getCurrentAnchor = (): string => '#anchor-demo-b';
<\/script>

<template>
  <Anchor :items="items" :affix="false" :get-current-anchor="getCurrentAnchor" />
</template>
`;export{n as default};
