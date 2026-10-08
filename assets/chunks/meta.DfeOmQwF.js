const n=`<script setup lang="ts">
// 对齐 antd 的 meta demo。
// ⚠️ 三处 demo 级替换（见 README §5）：封面用 **data URI**、\`Avatar\` **尚未落地** ⇒
//    用原生等价物、外网头像图换成本地色块。
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@apollo-design/icons';
import { Card, CardMeta } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const cover = () => h('img', { draggable: false, alt: 'example', src: COVER });

const actions = [
  h(SettingOutlined, { key: 'setting' }),
  h(EditOutlined, { key: 'edit' }),
  h(EllipsisOutlined, { key: 'ellipsis' }),
];

/** \`Avatar\` 尚未落地 ⇒ 原生等价物（圆形色块 + 文字）。 */
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
<\/script>

<template>
  <Card :style="{ width: '300px' }" :cover="cover()" :actions="actions">
    <CardMeta :avatar="avatar('A')" title="Card title" description="This is the description" />
  </Card>
</template>
`;export{n as default};
