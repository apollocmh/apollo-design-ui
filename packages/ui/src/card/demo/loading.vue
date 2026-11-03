<script setup lang="ts">
// 对齐 antd 的 loading demo。
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@apollo-design/icons';
import { Avatar, Card, CardMeta, Flex, Switch } from '@apollo-design/ui';
import { h, ref, type VNodeChild } from 'vue';

const loading = ref(true);

const actions = [
  h(EditOutlined, { key: 'edit' }),
  h(SettingOutlined, { key: 'setting' }),
  h(EllipsisOutlined, { key: 'ellipsis' }),
];

const avatar = (text: string): VNodeChild => h(Avatar, null, () => text);

const description = () => [
  h('p', null, 'This is the description'),
  h('p', null, 'This is the description'),
];
</script>

<template>
  <Flex gap="medium" align="start" vertical>
    <Switch
      aria-label="Show card content"
      :checked="!loading"
      @change="(checked: boolean) => (loading = !checked)"
    />
    <Card :loading="loading" :actions="actions" :style="{ width: '300px', maxWidth: '100%' }">
      <CardMeta :avatar="avatar('A')" title="Card title" :description="description()" />
    </Card>
    <Card :loading="loading" :actions="actions" :style="{ width: '300px', maxWidth: '100%' }">
      <CardMeta :avatar="avatar('B')" title="Card title" :description="description()" />
    </Card>
  </Flex>
</template>
