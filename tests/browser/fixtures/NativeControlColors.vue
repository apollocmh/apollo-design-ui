<script setup lang="ts">
import { darkAlgorithm } from '@apollo-design/theme';
import { Button, ConfigProvider, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const draft = ref('Shared draft');
</script>

<template>
  <h1>Native control colors</h1>
  <ConfigProvider v-for="mode in ['light', 'dark']" :key="mode" :theme="mode === 'dark' ? { algorithm: darkAlgorithm } : undefined">
    <section :data-control-theme="mode" :aria-label="mode" style="padding: 16px; color: var(--apollo-color-text); background: var(--apollo-color-bg-container)">
      <h2>{{ mode }}</h2>
      <div style="display: grid; gap: 12px; grid-template-columns: 1fr 1fr">
        <button data-native="button" type="button">Native action</button>
        <button data-reference="button" type="button" style="all: revert">Browser action</button>
        <input data-native="input" :aria-label="`Native ${mode}`" value="Native text" />
        <input data-reference="input" :aria-label="`Reference ${mode}`" value="Browser text" style="all: revert" />
        <select data-native="select" :aria-label="`Native selection ${mode}`"><option>Native option</option></select>
        <select data-reference="select" :aria-label="`Reference selection ${mode}`" style="all: revert"><option>Browser option</option></select>
        <textarea data-native="textarea" :aria-label="`Native note ${mode}`">Native note</textarea>
        <textarea data-reference="textarea" :aria-label="`Reference note ${mode}`" style="all: revert">Browser note</textarea>
        <button data-native="disabled" type="button" disabled>Disabled</button>
        <button data-reference="disabled" type="button" disabled style="all: revert">Browser disabled</button>
      </div>
      <button data-custom type="button" style="color: rgb(10, 20, 30); background: rgb(245, 245, 245)">Consumer colors</button>
      <Button data-apollo-button>Component action</Button>
      <Input v-model:value="draft" :aria-label="`Component input ${mode}`" />
      <span data-theme-text style="color: var(--apollo-color-text)">Theme text</span>
    </section>
  </ConfigProvider>
</template>
