<script setup lang="ts">
import { Masonry, type MasonryLayoutItem } from '../../../index';

type Row = { id: number; name: string };
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
// Exact template inference: unknown/any or a wrong row/index type requires a
// second argument and fails vue-tsc at the actual slot consumer below.
const checkRow = <T>(row: T, ..._check: Equal<T, Row> extends true ? [] : [never]) => row;
const checkIndex = <T>(index: T, ..._check: Equal<T, number> extends true ? [] : [never]) => index;
const items = [{ key: 'a', data: { id: 1, name: 'Alpha' } }];
const onLayout = (rows: MasonryLayoutItem<Row>[]) => rows[0]?.data.name.toUpperCase();
</script>
<template>
  <Masonry :items="items" @layout-change="onLayout">
    <template #item="{ data, index, column, key }">
      <b>{{ checkRow(data).name.toUpperCase() }}:{{ checkIndex(index) }}:{{ checkIndex(column) }}:{{ key }}</b>
    </template>
  </Masonry>
</template>
