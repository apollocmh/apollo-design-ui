<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  type ConfigProviderThemeConfig,
  Image,
  ImagePreviewGroup,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const phase = ref(0);
const theme = computed<ConfigProviderThemeConfig | undefined>(() =>
  phase.value === 2
    ? undefined
    : {
        algorithm: phase.value === 1 ? [darkAlgorithm, compactAlgorithm] : undefined,
        token: { colorBgSpotlight: phase.value === 1 ? '#273047' : '#14213d' },
        components: {
          Image: {
            zIndexPopup: phase.value === 1 ? 2100 : 2000,
            previewOperationColor: '#ffffff',
            previewOperationHoverColor: '#fadb14',
            previewOperationColorDisabled: 'rgba(255,255,255,0.5)',
            previewOperationSize: phase.value === 1 ? 27 : 31,
            progressAnimationDuration: phase.value === 1 ? '2s' : '4s',
            imagePreviewSwitchSize: phase.value === 1 ? 64 : 52,
          },
        },
      },
);
const change = () => {
  phase.value = (phase.value + 1) % 3;
};
const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
</script>

<template>
  <section data-image-token-demo>
    <button type="button" @mousedown.prevent @click="change">Cycle component tokens</button>
    <ConfigProvider :theme="theme">
      <div class="image-token-examples">
        <Image :src="src" alt="Themed single image" :width="160" data-token-image>
          <template #previewActions="info"><component :is="info.originNode" /><div class="image-token-controls"><button type="button" @mousedown.prevent @click="change">Cycle component tokens</button><output>Phase {{ phase }}</output></div></template>
          <template #previewImage="info"><figure class="image-token-editor"><component :is="info.originNode" /><input aria-label="Token preview note" /></figure></template>
        </Image>
        <ImagePreviewGroup>
          <Image :src="src" alt="Themed group first" :width="120" data-token-group />
          <Image :src="src" alt="Themed group second" :width="120" />
          <template #previewActions="info"><component :is="info.originNode" /><div class="image-token-controls"><button type="button" @mousedown.prevent @click="change">Cycle component tokens</button><output>Phase {{ phase }}</output></div></template>
          <template #previewImage="info"><figure class="image-token-editor"><component :is="info.originNode" /><input aria-label="Token preview note" /></figure></template>
        </ImagePreviewGroup>
        <Image :width="160" :height="100" :placeholder="{ progress: { percent: 65 } }" />
      </div>
    </ConfigProvider>
  </section>
</template>

<style>
.image-token-examples { display: flex; flex-wrap: wrap; align-items: center; gap: var(--apollo-margin); margin-top: var(--apollo-margin-sm); }
.image-token-controls { display: flex; gap: var(--apollo-margin-xs); align-items: center; padding: var(--apollo-padding-xs); color: var(--apollo-color-text-light-solid); background: var(--apollo-color-bg-spotlight); }
.image-token-controls button, .image-token-editor input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
.image-token-editor { display: flex; flex-direction: column; align-items: center; gap: var(--apollo-margin-xs); margin: 0; }
</style>
