<script setup lang="ts">
import { ConfigProvider, Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(2);

const paginationTokens = {
  itemSize: 40,
  itemBg: '#fafafa',
  itemActiveBg: '#fff0f6',
  itemActiveColor: '#eb2f96',
};
</script>

<template>
  <ConfigProvider :theme="{ components: { Pagination: paginationTokens } }">
    <Pagination
      v-model:current="current"
      :total="120"
      :page-size-options="[10, 20, 50]"
      show-size-changer
    />
  </ConfigProvider>
</template>
