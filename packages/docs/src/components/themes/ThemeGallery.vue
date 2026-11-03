<script setup lang="ts">
import { defaultPreset } from '@apollo-design/theme/presets/default';
import { material3Preset } from '@apollo-design/theme/presets/material3';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { useSiteLocale } from '../../composables/locale';
import ThemePreview from './ThemePreview.vue';

const { locale } = useSiteLocale();
const presets = [
  { preset: defaultPreset, label: 'Default' },
  { preset: monoPreset, label: 'Mono' },
  { preset: material3Preset, label: 'Material' },
];
const appearances = ['light', 'dark'] as const;
</script>

<template>
  <section id="theme-previews" class="theme-gallery-section">
    <h2>{{ locale === 'zh-CN' ? '三套主题 · 亮暗预览' : 'Three themes · Light and dark' }}</h2>
    <div class="theme-gallery">
      <template v-for="appearance in appearances" :key="appearance">
        <ThemePreview v-for="item in presets" :key="`${item.preset.name}-${appearance}`" :preset="item.preset" :label="item.label" :appearance="appearance" />
      </template>
    </div>
  </section>
</template>

<style scoped>
.theme-gallery { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.theme-gallery-section { margin-top: 32px; }
@media (max-width: 1100px) { .theme-gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .theme-gallery { grid-template-columns: minmax(0, 1fr); } }
</style>
