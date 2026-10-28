<script setup lang="ts">
import { Badge, Button, Flex, Ribbon } from '@apollo-design/ui';
import { computed, Fragment, h, ref } from 'vue';

const custom = ref(true);
const empty = ref(false);
const dot = ref(false);
const count = ref(5);
const label = ref('New');
const dataCount = computed(() =>
  empty.value ? null : h(Fragment, [h('strong', label.value), h('em', ' Data'), 0]),
);
</script>

<template>
  <Flex vertical gap="middle">
    <Flex wrap gap="small">
      <Button @click="custom = !custom">切换插槽 / Toggle content</Button>
      <Button @click="empty = !empty">切换空内容 / Toggle empty</Button>
      <Button @click="label = 'Updated'">更新内容 / Update content</Button>
      <Button @click="dot = !dot">切换圆点 / Toggle dot</Button>
      <Button @click="count = count === 0 ? 100 : 0">数字 0 / 100</Button>
    </Flex>
    <div><Badge :count="count" :dot="dot" :offset="[6, 2]">
      <input aria-label="Badge anchor state" placeholder="Inbox" style="width: 120px" />
      <template v-if="custom" #count><strong v-if="!empty">{{ label }}</strong><em v-if="!empty">!</em></template>
    </Badge></div>
    <div>VNode 数据 / VNode data: <Badge :count="dataCount" :styles="{ indicator: { paddingInline: '8px' } }" /></div>
    <Badge status="success" text="Prop status">
      <template v-if="custom" #text><strong v-if="!empty">{{ label }}</strong></template>
    </Badge>
    <Ribbon text="Prop ribbon" style="padding: 16px; max-width: 360px">
      <template v-if="custom" #text><strong v-if="!empty">{{ label }}</strong><em v-if="!empty">!</em></template>
      <input aria-label="Ribbon anchor state" placeholder="Draft" style="width: 120px" />
    </Ribbon>
  </Flex>
</template>
