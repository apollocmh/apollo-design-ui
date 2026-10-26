<script setup lang="ts">
import { List, ListItem, ListItemMeta } from '../../../index';

type Row = { id: number; name: string };
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
// Exact template inference: unknown/any or a wrong row/index type requires a
// second argument and fails vue-tsc at the actual slot consumer below.
const checkRow = <T>(row: T, ..._check: Equal<T, Row> extends true ? [] : [never]) => row;
const checkIndex = <T>(index: T, ..._check: Equal<T, number> extends true ? [] : [never]) => index;
const rows: Row[] = [{ id: 1, name: 'Alpha' }];
const describe = (name: string, index: number) => `${index}:${name.toUpperCase()}`;
</script>

<template>
  <List :data-source="rows" row-key="id">
    <template #item="{ item, index }">
      <ListItem>
        {{ describe(checkRow(item).name, checkIndex(index)) }}
        <ListItemMeta>
          <template #avatar>Avatar</template>
          <template #title>{{ checkRow(item).name }}</template>
          <template #description>Description</template>
        </ListItemMeta>
        <template #extra>Extra</template>
        <template #actions><button>Edit</button><button>More</button></template>
      </ListItem>
    </template>
    <template #header>Header</template>
    <template #extra><button type="button">List detail</button></template>
    <template #footer>Footer</template>
    <template #loadMore>More</template>
  </List>
</template>
