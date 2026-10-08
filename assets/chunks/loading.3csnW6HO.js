const n=`<script setup lang="ts">
// 对齐 antd 的 loading demo。
// ⚠️ 三处 demo 级替换（见 README §5）：
//   ① \`Avatar\` **尚未落地** ⇒ 用原生等价物（圆形色块 + 文字）；
//   ② 上游用外网头像图 ⇒ 换成本地等价物（外网图片会污染 L6 基线）；
//   ③ 上游的 \`Flex\` 本仓已落地，直接用。
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@apollo-design/icons';
import { Card, CardMeta, Flex, Switch } from '@apollo-design/ui';
import { h, ref, type VNodeChild } from 'vue';

const loading = ref(true);

const actions = [
  h(EditOutlined, { key: 'edit' }),
  h(SettingOutlined, { key: 'setting' }),
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

const description = () => [
  h('p', null, 'This is the description'),
  h('p', null, 'This is the description'),
];
<\/script>

<template>
  <Flex gap="medium" align="start" vertical>
    <Switch
      aria-label="Show card content"
      :checked="!loading"
      @change="(checked: boolean) => (loading = !checked)"
    />
    <Card :loading="loading" :actions="actions" :style="{ minWidth: '300px' }">
      <CardMeta :avatar="avatar('A')" title="Card title" :description="description()" />
    </Card>
    <Card :loading="loading" :actions="actions" :style="{ minWidth: '300px' }">
      <CardMeta :avatar="avatar('B')" title="Card title" :description="description()" />
    </Card>
  </Flex>
</template>
`;export{n as default};
