<script setup lang="ts">
import { ConfigProvider, Image, type ConfigProviderProps, type ImageSemanticType } from '@apollo-design/ui';
import { ref } from 'vue';
import ImageSemanticDemo from '../../../packages/ui/src/image/demo/style-class.vue';

const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100" viewBox="0 0 180 100"><rect width="180" height="100" fill="${color}"/><text x="90" y="56" text-anchor="middle" font-family="sans-serif" font-size="18" fill="white">${label}</text></svg>`)}`;
const plainSource = svgSource('#38598b', 'Provider cover');
const richSource = svgSource('#297373', 'Provider rich');
const revision = ref(0);
const opacityAt = (current: number) => Number((0.35 + current * 0.05).toFixed(2));
const makeConfig = (current: number): ImageSemanticType => ({
  classNames: {
    root: `provider-${current}-root`,
    image: `provider-${current}-image`,
    cover: `provider-${current}-cover`,
  },
  styles: {
    root: { paddingTop: `${current + 5}px`, maxWidth: '210px' },
    image: { opacity: opacityAt(current), objectFit: 'cover' },
    cover: { paddingLeft: `${current + 2}px`, color: 'rgb(10, 20, 30)' },
  },
});
// Keep the inferred object shape indexable for the public component-config map.
const createImageConfig = (current: number) => ({ ...makeConfig(current) });
const imageConfig = ref(createImageConfig(0));
const components = ref<NonNullable<ConfigProviderProps['components']>>({ image: imageConfig.value });
const replaceFields = () => {
  const next = makeConfig(++revision.value);
  imageConfig.value.classNames = next.classNames;
  imageConfig.value.styles = next.styles;
};
const replaceImage = () => {
  imageConfig.value = createImageConfig(++revision.value);
  components.value.image = imageConfig.value;
};
const replaceMap = () => {
  imageConfig.value = createImageConfig(++revision.value);
  components.value = { image: imageConfig.value, button: { size: 'small' } };
};
const removeFields = () => {
  delete imageConfig.value.classNames;
  delete imageConfig.value.styles;
};
const removeImage = () => {
  delete components.value.image;
};
const mutateDeep = () => {
  const classes = imageConfig.value.classNames;
  const styles = imageConfig.value.styles;
  if (!classes || !styles?.root || !styles.image || !styles.cover) return;
  const current = ++revision.value;
  classes.root = `provider-${current}-root`;
  classes.image = `provider-${current}-image`;
  classes.cover = `provider-${current}-cover`;
  styles.root.paddingTop = `${current + 5}px`;
  styles.image.opacity = opacityAt(current);
  styles.cover.paddingLeft = `${current + 2}px`;
};
const classNames = { root: 'local-provider-root', image: 'local-provider-image', cover: 'local-provider-cover' };
const styles = {
  root: { maxWidth: '260px', minHeight: '31px' },
  image: { objectFit: 'contain' },
  cover: { paddingRight: '11px', color: 'rgb(70, 80, 90)' },
};
const nativeStyle = { maxWidth: '340px', paddingLeft: '9px' };
</script>

<template>
  <section data-image-provider-fixture>
    <p>
      <button type="button" @mousedown.prevent @click="replaceFields">Replace image semantic fields</button>
      <button type="button" @mousedown.prevent @click="replaceImage">Replace image provider</button>
      <button type="button" @mousedown.prevent @click="replaceMap">Replace image components map</button>
      <button type="button" @mousedown.prevent @click="removeFields">Remove image semantic fields</button>
      <button type="button" @mousedown.prevent @click="removeImage">Remove image provider</button>
      <button type="button" @mousedown.prevent @click="replaceImage">Add image provider</button>
      <button type="button" @mousedown.prevent @click="mutateDeep">Mutate image provider deep fields</button>
    </p>
    <output data-image-provider-revision>{{ revision }}</output>
    <ConfigProvider :components="components">
      <section data-image-provider-entry="cover">
        <Image :src="plainSource" alt="Provider cover image" :width="180" :height="100"
          class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles"
          :preview="{ cover: 'Preview provider image' }" />
      </section>
      <section data-image-provider-entry="rich">
        <Image :src="richSource" alt="Provider rich image" :width="180" :height="100" :preview="false"
          class="native-provider-root" :style="nativeStyle" :class-names="classNames" :styles="styles">
          <template #imageRender="info">
            <figure data-image-provider-slot :data-slot-src="info.src" :data-slot-image-class="info.classNames.image">
              <component :is="info.originNode" />
              <figcaption>Current provider revision {{ revision }}</figcaption>
              <input aria-label="Image provider draft" />
            </figure>
          </template>
        </Image>
      </section>
    </ConfigProvider>
  </section>
  <section data-image-provider-actual-demo>
    <ImageSemanticDemo />
  </section>
</template>
