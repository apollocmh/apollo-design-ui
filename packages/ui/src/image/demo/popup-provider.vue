<script setup lang="ts">
import { ConfigProvider, type ConfigProviderProps, Image, ImagePreviewGroup, type ImageSemanticType } from '@apollo-design/ui';
import { ref, shallowRef } from 'vue';

const phase = ref(0);
const labels = ['empty', 'A', 'B', 'removed'];
const components = shallowRef<NonNullable<ConfigProviderProps['components']>>({});
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
function cycle() {
  phase.value = (phase.value + 1) % labels.length;
  const mode = phase.value === 1 ? 'A' : phase.value === 2 ? 'B' : undefined;
  const image: ImageSemanticType = {
    classNames: { popup: { root: `popup-demo-${mode}`, mask: `popup-demo-${mode}-mask`, close: `popup-demo-${mode}-close` } },
    styles: { popup: {
      root: { '--popup-demo-mode': mode ?? '', boxShadow: `inset 0 0 0 var(--apollo-line-width-bold) var(--apollo-color-${mode === 'A' ? 'primary' : 'success'}-border)` },
      mask: { '--popup-demo-mask': mode ?? '' },
      close: { outline: `var(--apollo-line-width) solid var(--apollo-color-${mode === 'A' ? 'primary' : 'success'}-border)` },
    } },
  };
  components.value = mode ? { image: { ...image } } : {};
}
</script>

<template>
  <section data-image-popup-provider-demo>
    <button type="button" @mousedown.prevent @click="cycle">Cycle popup provider</button>
    <p>Current provider: <output data-popup-demo-mode>{{ labels[phase] }}</output>. Open either preview; its toolbar can update the same provider while it stays open.</p>
    <ConfigProvider :components="components">
      <Image :src="source" alt="Provider standalone preview" :width="160" :height="94"
        :class-names="{ popup: { root: 'popup-demo-local' } }" data-popup-demo-image>
        <template #previewActions="info">
          <div class="popup-demo-toolbar"><component :is="info.originNode" /><button type="button" @click="cycle">Cycle popup provider</button></div>
        </template>
      </Image>
      <ImagePreviewGroup :class-names="{ popup: { root: 'popup-demo-local' } }">
        <Image :src="source" alt="Provider group first" :width="140" :height="82" data-popup-demo-group />
        <Image :src="source" alt="Provider group second" :width="140" :height="82" />
        <template #previewActions="info">
          <div class="popup-demo-toolbar"><component :is="info.originNode" /><button type="button" @click="cycle">Cycle popup provider</button></div>
        </template>
      </ImagePreviewGroup>
    </ConfigProvider>
  </section>
</template>

<style scoped>
.popup-demo-toolbar { display: flex; align-items: center; gap: var(--apollo-margin-xs); }
.popup-demo-toolbar > button { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
