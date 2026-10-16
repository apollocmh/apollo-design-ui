<script setup lang="ts">
import { siteManifest } from '../../composables/manifest';
</script>

<template>
  <footer class="site-footer">
    <span>Powered by Vue 3 + Vite</span>
    <span>兼容目标：Ant Design {{ siteManifest.antdTarget }}</span>
    <a :href="siteManifest.repoUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
  </footer>
</template>
