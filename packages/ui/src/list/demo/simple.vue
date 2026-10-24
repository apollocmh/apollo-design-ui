<script setup lang="ts">
// 对齐 antd 的 `simple` demo。
import { Divider, List, ListItem, Text } from '@apollo-design/ui';

const data = [
  'Racing car sprays burning fuel into crowd.',
  'Japanese princess to wed commoner.',
  'Australian walks 100km after outback crash.',
  'Man charged over missing wedding girl.',
  'Los Angeles battles huge wildfires.',
];

const sizes = [undefined, 'small', 'large'] as const;
</script>

<template>
  <template v-for="size in sizes" :key="size ?? 'default'">
    <Divider title-placement="start">
      {{ size === undefined ? 'Default' : size === 'small' ? 'Small' : 'Large' }} Size
    </Divider>
    <List :size="size" bordered :data-source="data">
      <template #header><div>Header</div></template>
      <template #footer><div>Footer</div></template>
      <template #item="{ item }">
        <ListItem><template v-if="size === undefined"><Text mark>[ITEM]</Text> </template>{{ item }}</ListItem>
      </template>
    </List>
  </template>
</template>
