<script setup lang="ts">
import { Space } from '../../index';
import { BTN_PRIMARY, BTN_TEXT } from './_standin';
</script>

<template>
  <Space>
    Space
    <button type="button" :style="BTN_PRIMARY">Button</button>
    <button type="button" :style="BTN_TEXT">Upload</button>
    <button type="button" :style="BTN_TEXT">Confirm</button>
  </Space>
</template>
