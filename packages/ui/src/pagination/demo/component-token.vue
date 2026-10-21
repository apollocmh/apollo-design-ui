<script setup lang="ts">
// 组件 Token：在根元素覆写 `--apollo-pagination-*` 变量。
import { Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(2);

const tokenStyle = {
  '--apollo-pagination-item-size': '40px',
  '--apollo-pagination-item-bg': '#fafafa',
  '--apollo-pagination-item-active-bg': '#fff0f6',
  '--apollo-pagination-item-active-color': '#eb2f96',
};
</script>

<template>
  <Pagination
    v-model:current="current"
    :total="120"
    :page-size-options="[10, 20, 50]"
    show-size-changer
    :style="tokenStyle"
  />
</template>
