<script setup lang="ts">
import { ref } from 'vue';
import { createFromIconfontCN, HomeOutlined, IconProvider } from '../../index';

const controls = { HomeOutlined, IconProvider, Font: createFromIconfontCN() };
const clicks = ref(0);
const context = ref({ prefixCls: 'apollo-icon', rootClassName: 'configured-icon' });
</script>

<template>
  <controls.IconProvider :value="context">
    <controls.HomeOutlined id="native-icon" tabindex="0" @click.once="clicks++" />
    <controls.Font id="font-icon" type="native-font" aria-label="Custom icon" spin :rotate="45" />
  </controls.IconProvider>
  <output>{{ clicks }}</output>
</template>
