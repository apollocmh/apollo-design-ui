<script setup lang="ts">
import { ConfigProvider, Empty } from '../../index';
</script>

<template>
  <ConfigProvider prefix-cls="brand">
    <Empty description="brand-empty：本示例单独加载了对应静态 CSS" />
  </ConfigProvider>
</template>

<style src="./prefix-cls.css"></style>
