const n=`<script setup lang="ts">
// 对齐 antd 的 \`vertical\` demo。
import { List, ListItem, ListItemMeta, Space } from '@apollo-design/ui';
import { h } from 'vue';

const icon = () =>
  h('span', {
    style: { display: 'inline-block', width: '1em', height: '1em', background: '#999' },
  });
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

const data = Array.from({ length: 6 }).map((_, i) => ({
  href: '#title',
  title: \`ant design part \${i}\`,
  description: 'Ant Design, a design language for background applications.',
  content:
    'We supply a series of design principles, practical patterns and high quality design resources.',
}));

/** 图标 + 文字（对齐上游的 \`IconText\`）。 */
const iconText = (text: string) => h(Space, null, { default: () => [icon(), text] });

/** extra 用**本地纯色块**（外网图片会污染 L6 基线）。 */
const extra = () =>
  h('span', {
    style: { display: 'inline-block', width: '272px', height: '120px', background: '#eee' },
  });

const renderItem = (item: unknown) => {
  // ⚠️ 参数必须收 \`unknown\`（函数参数**逆变**）
  const it = item as (typeof data)[number];
  return h(
    ListItem,
    {
      key: it.title,
      actions: [iconText('156'), iconText('156'), iconText('2')],
      extra: extra(),
    },
    {
      default: () => [
        h(ListItemMeta, {
          avatar: avatar(),
          title: h('a', { href: it.href }, it.title),
          description: it.description,
        }),
        it.content,
      ],
    },
  );
};
<\/script>

<template>
  <List
    item-layout="vertical"
    size="large"
    :pagination="{ pageSize: 3 }"
    :data-source="data"
    :render-item="renderItem"
  >
    <template #footer>
      <div><b>ant design</b> footer part</div>
    </template>
  </List>
</template>
`;export{n as default};
