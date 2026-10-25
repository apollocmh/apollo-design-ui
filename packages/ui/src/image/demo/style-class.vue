<script setup lang="ts">
// 语义化 classNames / styles：root / image / cover 三个槽位。
import { ConfigProvider, Image, type ConfigProviderProps, type ImageSemanticType } from '@apollo-design/ui';
import { computed, ref, shallowRef, type StyleValue } from 'vue';

const src = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1677ff"/>
        <stop offset="1" stop-color="#eb2f96"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#g)"/>
    <circle cx="500" cy="96" r="56" fill="rgba(255,255,255,0.28)"/>
    <circle cx="96" cy="280" r="92" fill="rgba(255,255,255,0.14)"/>
    <text x="40" y="320" fill="#ffffff" font-family="sans-serif" font-size="28">
      Apollo Design
    </text>
  </svg>`,
)}`;

const classNames = {
  root: 'demo-image-style-root',
  image: 'demo-image-style-img',
  cover: 'demo-image-style-cover',
};

const styles = {
  root: { borderRadius: '12px', overflow: 'hidden' },
  cover: {
    background: 'rgba(22, 119, 255, 0.4)',
    color: '#ffffff',
    fontSize: '14px',
  },
};

const preview = { cover: '点击预览' };

const phase = ref(0);
const nativeClass = computed(() => phase.value < 3 ? ['native-demo-root', `native-demo-phase-${phase.value}`] : undefined);
const nativeStyle = computed<StyleValue>(() => {
  if (phase.value === 0) return 'padding-top:var(--apollo-padding-xs);--native-demo-phase:string';
  if (phase.value === 1) return ['padding-top:var(--apollo-padding-sm);--native-demo-phase:array', { paddingInlineEnd: 'var(--apollo-padding-xs)' }];
  if (phase.value === 2) return { paddingTop: 'var(--apollo-padding-md)', paddingInlineStart: 'var(--apollo-padding-xs)', '--native-demo-phase': 'object' };
  return undefined;
});
const nativeSemanticStyles = {
  root: { height: 'auto', paddingTop: 'var(--apollo-padding-xxs)', '--semantic-demo-root': 'kept' },
  image: { objectFit: 'cover', paddingTop: 'var(--apollo-padding-xxs)', boxSizing: 'border-box' },
};
const progressSemanticStyles = {
  root: { paddingTop: 'var(--apollo-padding-xxs)', '--semantic-demo-root': 'kept' },
  placeholder: { progress: { root: { paddingTop: 'var(--apollo-padding-xxs)' } } },
};

const providerStage = ref(0);
const providerStateLabels = ['empty', 'A', 'B', 'removed'];
const makeImageProvider = (variant: 'A' | 'B'): ImageSemanticType => {
  const color = variant === 'A' ? 'var(--apollo-color-primary-border)' : 'var(--apollo-color-success-border)';
  return {
    classNames: {
      root: `provider-image-root-${variant}`,
      image: `provider-image-img-${variant}`,
      cover: `provider-image-cover-${variant}`,
      placeholder: { progress: {
        root: `provider-image-progress-root-${variant}`,
        content: `provider-image-progress-content-${variant}`,
        rail: `provider-image-progress-rail-${variant}`,
        indicator: `provider-image-progress-indicator-${variant}`,
      } },
    },
    styles: {
      root: { '--provider-image-root': variant, outlineColor: color, outlineStyle: 'solid', outlineWidth: 'var(--apollo-line-width)', paddingTop: 'var(--apollo-padding-lg)' },
      image: { '--provider-image-img': variant, outlineColor: color, outlineStyle: 'solid', outlineWidth: 'var(--apollo-line-width)', paddingTop: 'var(--apollo-padding-lg)' },
      cover: { '--provider-image-cover': variant, outlineColor: color, outlineStyle: 'solid', outlineWidth: 'var(--apollo-line-width)' },
      placeholder: { progress: {
        root: { '--provider-image-progress-root': variant, outlineColor: color, outlineStyle: 'solid', outlineWidth: 'var(--apollo-line-width)', paddingTop: 'var(--apollo-padding-lg)' },
        content: { '--provider-image-progress-content': variant },
        rail: { '--provider-image-progress-rail': variant },
        indicator: { '--provider-image-progress-indicator': variant, fontWeight: 'var(--apollo-font-weight-strong)' },
      } },
    },
  };
};
const imageProviderComponents = shallowRef<NonNullable<ConfigProviderProps['components']>>({});
const cycleImageProvider = () => {
  providerStage.value = (providerStage.value + 1) % 4;
  const variant = providerStage.value === 1 ? 'A' : providerStage.value === 2 ? 'B' : undefined;
  imageProviderComponents.value = variant ? { image: { ...makeImageProvider(variant) } } : {};
};
</script>

<template>
  <ConfigProvider :components="imageProviderComponents">
    <div class="demo-image-style-wrap" data-image-provider-demo>
      <p>
        <button type="button" @mousedown.prevent @click="cycleImageProvider">Cycle image provider configuration</button>
        <output data-image-provider-state>{{ providerStateLabels[providerStage] }}</output>
      </p>
      <Image
        :width="320"
        :src="src"
        alt="Gradient artwork"
        :preview="preview"
        :class-names="classNames"
        :styles="styles"
      />
      <p class="demo-image-style-hint">悬停查看自定义遮罩，点击打开预览。</p>
      <section data-image-native-style-demo>
        <p><button type="button" @mousedown.prevent @click="phase = (phase + 1) % 4">Cycle native image styles</button></p>
        <Image data-image-native-style :width="280" :height="160" :src="src" alt="Native image style example" :preview="false"
          :class="nativeClass" :style="nativeStyle" :class-names="{ root: 'semantic-demo-image-root' }" :styles="nativeSemanticStyles">
          <template #imageRender="{ originNode }">
            <figure class="demo-native-image-frame">
              <component :is="originNode" />
              <figcaption>Native style: {{ ['string', 'array', 'object', 'removed'][phase] }}</figcaption>
              <input aria-label="Native image style draft" @click.stop @keydown.stop />
            </figure>
          </template>
        </Image>
        <p id="native-image-style-help">Progress retains the same native root class, style and description.</p>
        <Image id="native-image-progress" data-image-native-progress-style :width="280" :height="100"
          :placeholder="{ progress: { percent: 50 } }" aria-label="Native image loading progress" aria-describedby="native-image-style-help"
          :class="nativeClass" :style="nativeStyle" :class-names="{ root: 'semantic-demo-progress-root', placeholder: { progress: { root: 'semantic-demo-progress-content' } } }" :styles="progressSemanticStyles" />
      </section>
    </div>
  </ConfigProvider>
</template>

<style>
.demo-image-style-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-image-style-root {
  border: 1px solid var(--apollo-color-border);
  box-shadow: var(--apollo-box-shadow-tertiary);
}

.demo-image-style-img {
  display: block;
}

.demo-image-style-cover {
  backdrop-filter: blur(2px);
}

.demo-native-image-frame {
  display: flex;
  flex-direction: column;
  gap: var(--apollo-margin-xs);
  margin: 0;
}
.demo-native-image-frame input {
  box-sizing: border-box;
  width: 100%;
}
</style>
