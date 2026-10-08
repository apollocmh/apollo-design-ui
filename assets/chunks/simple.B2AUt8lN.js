const e=`<script setup lang="ts">
// 对齐 antd 的 \`simple\` demo。
import { Divider, List, ListItem, Text } from '@apollo-design/ui';
import { h } from 'vue';

const data = [
  'Racing car sprays burning fuel into crowd.',
  'Japanese princess to wed commoner.',
  'Australian walks 100km after outback crash.',
  'Man charged over missing wedding girl.',
  'Los Angeles battles huge wildfires.',
];

/** 三档尺寸共用的列表（\`size\` 为 \`undefined\` 时是第一档）。 */
const list = (size?: 'small' | 'large') =>
  h(List, {
    size,
    header: h('div', 'Header'),
    footer: h('div', 'Footer'),
    bordered: true,
    dataSource: data,
    renderItem: (item: unknown) =>
      h(ListItem, null, {
        default: () =>
          size === undefined
            ? [h(Text, { mark: true }, () => '[ITEM]'), \` \${String(item)}\`]
            : String(item),
      }),
  });
<\/script>

<template>
  <Divider title-placement="start">Default Size</Divider>
  <component :is="list()" />
  <Divider title-placement="start">Small Size</Divider>
  <component :is="list('small')" />
  <Divider title-placement="start">Large Size</Divider>
  <component :is="list('large')" />
</template>
`;export{e as default};
