<script setup lang="ts">
import { Image } from '@apollo-design/ui';
import { computed, h, ref, shallowRef } from 'vue';

const svgSource = (color: string, label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect width="240" height="140" fill="${color}"/><text x="120" y="76" text-anchor="middle" font-family="sans-serif" font-size="22" fill="white">${label}</text></svg>`)}`;
const firstSource = svgSource('#38598b', 'First image');
const nextSource = svgSource('#297373', 'Current image');
const revision = ref(0);
const show = ref(true);
const empty = ref(false);
const loads = ref(0);
const errors = ref(0);
const clicks = ref(0);
const clickOnce = ref(0);
const keydowns = ref(0);
const keydownOnce = ref(0);
const errorOnce = ref(0);
const openUpdates = ref(0);
const richOpened = ref(false);
const richDraft = ref('Editable caption');
const richSaved = ref(0);
const richCover = ref(false);
const artworkDraft = ref('Custom artwork note');
const richPreview = computed(() => ({
  cover: richCover.value
    ? h(
        'button',
        {
          type: 'button',
          style: {
            color: 'var(--apollo-color-text)',
            backgroundColor: 'var(--apollo-color-bg-container)',
          },
          onClick: () => richSaved.value++,
        },
        'Save cover caption',
      )
    : undefined,
}));
const lastClick = shallowRef<MouseEvent>();
const lastKeydown = shallowRef<KeyboardEvent>();
const lastError = shallowRef<Event>();
const lastOpen = ref<boolean>();
const src = computed(() => (revision.value % 2 === 0 ? firstSource : nextSource));
const alt = computed(() => `Custom image ${revision.value}`);
const width = computed(() => 200 + revision.value * 20);
const height = computed(() => 120 + revision.value * 10);
const eventState = computed(() => ({
  clicks: clicks.value,
  clickOnce: clickOnce.value,
  keydowns: keydowns.value,
  keydownOnce: keydownOnce.value,
  errors: errors.value,
  errorOnce: errorOnce.value,
  openUpdates: openUpdates.value,
  lastOpen: lastOpen.value ?? null,
  lastClickType: lastClick.value?.constructor.name ?? 'none',
  lastClickNative: lastClick.value ? lastClick.value instanceof MouseEvent : null,
  lastKeydownType: lastKeydown.value?.constructor.name ?? 'none',
  lastKeydownNative: lastKeydown.value ? lastKeydown.value instanceof KeyboardEvent : null,
  lastKey: lastKeydown.value?.key ?? 'none',
  lastErrorType: lastError.value?.constructor.name ?? 'none',
  lastErrorNative: lastError.value ? lastError.value instanceof Event : null,
}));

function onImageClick(event: MouseEvent) {
  clicks.value++;
  lastClick.value = event;
}

function onImageKeydown(event: KeyboardEvent) {
  keydowns.value++;
  lastKeydown.value = event;
}

function onImageError(event: Event) {
  errors.value++;
  lastError.value = event;
}

function onImageOpenUpdate(open: boolean) {
  openUpdates.value++;
  lastOpen.value = open;
}
</script>

<template>
  <section data-image-render-demo :data-image-event-state="JSON.stringify(eventState)">
    <p>
      <button type="button" @mousedown.prevent @click="revision++">Update image content</button>
      <button type="button" @mousedown.prevent @click="empty = !empty">Empty image render slot</button>
      <button type="button" @mousedown.prevent @click="show = !show">Toggle image render slot</button>
    </p>
    <Image :alt="alt" :width="width" :height="height" :src="src" :title="`Image title ${revision}`" :preview="false"
      data-image-event-root role="group" aria-label="Custom image event group" :tabindex="0"
      :class-names="{ image: `native-render-image-${revision}` }"
      :styles="{ root: { height: 'auto' }, image: { objectFit: 'cover' } }"
      @click="onImageClick" @click.once="clickOnce++"
      @keydown="onImageKeydown" @keydown.once="keydownOnce++"
      @error="onImageError" @error.once="errorOnce++" @update:open="onImageOpenUpdate">
      <template v-if="show" #imageRender="info">
        <figure v-if="!empty" class="image-render-frame" data-native-image-render
          :data-image-src="info.src" :data-image-title="info.title" :data-image-class="info.classNames.image">
          <component :is="info.originNode" @load="loads++" />
          <figcaption data-native-image-caption>Caption {{ revision }} · {{ info.alt }} · {{ info.width }} × {{ info.height }}</figcaption>
          <input aria-label="Image render note" @click.stop @keydown.stop />
        </figure>
      </template>
    </Image>
    <p>Native load events: <output data-image-render-loads>{{ loads }}</output>; errors: <output data-image-render-errors>{{ errors }}</output> (<output data-image-event-error-once>{{ errorOnce }}</output> once); last error: <output data-image-event-error-type>{{ eventState.lastErrorType }}</output>.</p>
    <p>Clicks: <output data-image-event-clicks>{{ clicks }}</output> (<output data-image-event-click-once>{{ clickOnce }}</output> once); last event: <output data-image-event-click-type>{{ eventState.lastClickType }}</output>.</p>
    <p>Keydowns: <output data-image-event-keydowns>{{ keydowns }}</output> (<output data-image-event-keydown-once>{{ keydownOnce }}</output> once); last event: <output data-image-event-keydown-type>{{ eventState.lastKeydownType }}</output>, key: <output data-image-event-key>{{ eventState.lastKey }}</output>.</p>
    <p>Preview open updates: <output data-image-event-open-updates>{{ openUpdates }}</output>. Preview is disabled; the input keeps its own click and keyboard events.</p>
    <section data-image-rich-preview>
      <p><button type="button" @click="richCover = !richCover">Toggle interactive cover</button></p>
      <Image v-model:open="richOpened" :src="firstSource" alt="Rich preview image" :width="200" :preview="richPreview">
        <template #imageRender="{ originNode }">
          <figure class="image-render-frame">
            <component :is="originNode" />
            <figcaption>Preview the image and edit its caption.</figcaption>
            <input v-model="richDraft" aria-label="Preview thumbnail caption" />
            <button type="button" @click="richSaved++">Save thumbnail caption</button>
          </figure>
        </template>
      </Image>
      <p>Saved: <output data-image-rich-saved>{{ richSaved }}</output>; preview open: <output data-image-rich-open>{{ richOpened }}</output>.</p>
    </section>
    <section data-image-custom-preview>
      <Image :src="firstSource" alt="Custom artwork preview" :width="200">
        <template #imageRender>
          <div class="image-render-frame">
            <p>Custom artwork replaces the thumbnail.</p>
            <input v-model="artworkDraft" aria-label="Custom artwork note" />
          </div>
        </template>
      </Image>
    </section>
  </section>
</template>

<style scoped>
.image-render-frame {
  display: flex;
  flex-direction: column;
  gap: var(--apollo-margin-xs);
  margin: 0;
}
.image-render-frame figcaption {
  color: var(--apollo-color-text-secondary);
}
.image-render-frame input {
  box-sizing: border-box;
  width: 100%;
}
</style>
