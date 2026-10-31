<script setup lang="ts">
import { VirtualList } from '../../index';

const data = [1];
const itemKey = (item: number) => item;
</script>
<template>
  <VirtualList :data="data" :item-key="itemKey" :height="100" :item-height="20">
    <template #default>
      <div data-static-single>
        <span>One</span><span>Two</span><span>Three</span><span>Four</span><span>Five</span>
        <span>Six</span><span>Seven</span><span>Eight</span><span>Nine</span><span>Ten</span>
        <span>Eleven</span><span>Twelve</span><span>Thirteen</span><span>Fourteen</span><span>Fifteen</span>
        <span>Sixteen</span><span>Seventeen</span><span>Eighteen</span><span>Nineteen</span><span>Twenty</span>
      </div>
    </template>
  </VirtualList>
</template>
