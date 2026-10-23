<script setup lang="ts">
import { siteManifest } from '../../composables/manifest';
</script>

<template>
  <footer class="site-footer">
    <span>Powered by Vue 3 + Vite</span>
    <span>{{ siteManifest.designSystem }} · Vue Native</span>
    <a :href="siteManifest.repoUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
  </footer>
</template>
