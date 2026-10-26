<script setup lang="ts">
import { Timeline, type TimelineItemType } from '../../../index';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const checkItem = <T>(item: T, ..._check: Equal<T, TimelineItemType> extends true ? [] : [never]) =>
  item;
const checkIndex = <T>(index: T, ..._check: Equal<T, number> extends true ? [] : [never]) => index;
const items = [{ key: 'a', title: 'Alpha', content: 'Ready' }];
</script>

<template>
  <Timeline :items="items">
    <template #itemTitle="{ item, index }">{{ checkItem(item).title }} · {{ checkIndex(index) }}</template>
    <template #itemContent="{ item, index }"><input :aria-label="`${checkItem(item).key}-${checkIndex(index)}`" /></template>
    <template #itemIcon="{ item, index }"><b>{{ checkItem(item).key }} · {{ checkIndex(index) }}</b></template>
  </Timeline>
</template>
