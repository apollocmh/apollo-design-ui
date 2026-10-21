<script setup lang="ts">
/**
 * 单个图标瓦片：按需加载对应的生成组件（848 个模块，不在首屏全量 import）。
 */
import type { Component } from 'vue';
import { onMounted, shallowRef, watch } from 'vue';

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
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 14px 6px 10px;
  border: 1px solid var(--site-border);
  border-radius: 10px;
  background: var(--site-bg);
  color: var(--site-text);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.icon-tile:hover,
.icon-tile:focus-visible {
  border-color: var(--site-brand);
  box-shadow: var(--site-shadow);
  transform: translateY(-1px);
  outline: none;
}

.icon-tile-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 24px;
}

.icon-tile-placeholder {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--site-bg-soft);
}

.icon-tile-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--site-font-code);
  font-size: 11px;
  color: var(--site-text-tertiary);
}
</style>
