<script setup lang="ts">
import { h } from 'vue';
import { Divider, Space } from '../../index';
import { LINK } from './_standin';
</script>

<template>
  <Space :separator="h(Divider, { orientation: 'vertical' })">
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
    <a href="#separator" :style="LINK">Link</a>
  </Space>
</template>
