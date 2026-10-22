<script setup lang="ts">
/**
 * 单个图标瓦片：按需加载对应的生成组件（848 个模块，不在首屏全量 import）。
 */
import type { Component } from 'vue';
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

const props = defineProps<{
  name: string;
  copyLabel: string;
}>();
const emit = defineEmits<{ copy: [name: string] }>();

type IconModule = Record<string, Component>;

const loaders = import.meta.glob<IconModule>('../../../../icons/src/icons/*.ts');
const Comp = shallowRef<Component | null>(null);
let token = 0;

async function load(): Promise<void> {
  const id = ++token;
  const key = `../../../../icons/src/icons/${props.name}.ts`;
  const loader = loaders[key];
  if (!loader) {
    Comp.value = null;
    return;
  }
  try {
    const mod = await loader();
    if (id !== token) return;
    Comp.value = mod[props.name] ?? null;
  } catch {
    if (id !== token) return;
    Comp.value = null;
  }
}

onBeforeUnmount(() => {
  token++;
});
onMounted(() => {
  void load();
});
watch(
  () => props.name,
  () => {
    void load();
  },
);
</script>

<template>
  <button
    type="button"
    class="icon-tile"
    :title="name"
    :aria-label="`${copyLabel}: ${name}`"
    @click="emit('copy', name)"
  >
    <span class="icon-tile-glyph" aria-hidden="true">
      <component :is="Comp" v-if="Comp" />
      <span v-else class="icon-tile-placeholder" />
    </span>
    <span class="icon-tile-name">{{ name }}</span>
  </button>
</template>

<style scoped>
.icon-tile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--apollo-margin-sm);
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: var(--apollo-padding-sm) var(--apollo-padding-xs);
  border: 0;
  border-radius: var(--apollo-border-radius);
  background: transparent;
  color: var(--site-text);
  cursor: pointer;
  transition:
    background var(--apollo-motion-duration-mid),
    color var(--apollo-motion-duration-mid);
}
.icon-tile:hover {
  background: var(--site-brand);
  color: var(--apollo-color-text-light-solid);
}
.icon-tile:focus-visible {
  outline: var(--apollo-line-width-bold) solid var(--site-brand);
  outline-offset: calc(-1 * var(--apollo-line-width-bold));
  background: var(--site-preview-fill);
}
.icon-tile-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--apollo-control-height-lg);
  height: var(--apollo-control-height-lg);
  font-size: var(--apollo-font-size-heading-2);
}
.icon-tile-placeholder {
  width: var(--apollo-font-size-heading-3);
  height: var(--apollo-font-size-heading-3);
  border-radius: var(--apollo-border-radius-sm);
  background: var(--site-bg-soft);
}
.icon-tile-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--site-font);
  font-size: var(--apollo-font-size-sm);
}
</style>
