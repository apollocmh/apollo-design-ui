const n=`<script setup lang="ts">
// 对齐 antd 的 \`basic\` demo。
import { List, ListItem, ListItemMeta } from '@apollo-design/ui';
import { h } from 'vue';

const avatar = () =>
  h('span', {
    style: {
      display: 'inline-block',
      width: '32px',
      height: '32px',
      background: '#999',
      borderRadius: '50%',
    },
  });

const data = [
  { title: 'Ant Design Title 1' },
  { title: 'Ant Design Title 2' },
  { title: 'Ant Design Title 3' },
  { title: 'Ant Design Title 4' },
];

const renderItem = (item: unknown) => {
  // ⚠️ 参数必须收 \`unknown\`（\`renderItem\` 的签名如此，函数参数**逆变**）
  const { title } = item as { title: string };
  return h(ListItem, null, {
    default: () =>
      h(ListItemMeta, {
        avatar: avatar(),
        title: h('a', { href: '#title' }, title),
        description: 'Ant Design, a design language for background applications.',
      }),
  });
};
<\/script>

<template>
  <List item-layout="horizontal" :data-source="data" :render-item="renderItem" />
</template>
`;export{n as default};
