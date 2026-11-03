<script setup lang="ts">
/** Independent columns without moving cards: DOM, keyboard order and component state stay stable. */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { resolveDemoLayout } from '../../composables/demo-layout';
import type { DemoMeta } from '../../types/manifest';
import DemoPreview from './DemoPreview.vue';

const props = defineProps<{ demos: DemoMeta[]; fullWidth: boolean }>();
const emit = defineEmits<{ ready: [] }>();
const grid = ref<HTMLElement | null>(null);
const enhanced = ref(false);
let observer: ResizeObserver | null = null;
let pendingFrame = 0;
let readyPending = false;

function arrange(): void {
  pendingFrame = 0;
  if (!grid.value) return;
  const columns = props.fullWidth || matchMedia('(max-width: 1080px)').matches ? 1 : 2;
  const gap = Number.parseFloat(getComputedStyle(grid.value).columnGap);
  const bottoms = [0, 0];
  let nextColumn = 0;
  const children = Array.from(grid.value.children);
  // Apply all new column widths before measuring after a responsive/layout change.
  let assignedColumn = 0;
  for (const [index, child] of children.entries()) {
    const demo = props.demos[index];
    if (!(child instanceof HTMLElement) || !demo) continue;
    const span = resolveDemoLayout(demo).span;
    const full = columns === 1 || span === 'full' || span === 2;
    child.style.gridColumn = full ? '1 / -1' : String(assignedColumn + 1);
    assignedColumn = full ? 0 : 1 - assignedColumn;
  }
  for (const [index, child] of children.entries()) {
    if (!(child instanceof HTMLElement)) continue;
    const demo = props.demos[index];
    if (!demo) continue;
    const span = resolveDemoLayout(demo).span;
    const full = columns === 1 || span === 'full' || span === 2;
    const column = full ? 0 : nextColumn;
    const top = full ? Math.max(...bottoms) : (bottoms[column] ?? 0);
    const height = Math.ceil(child.getBoundingClientRect().height);
    child.style.gridColumn = full ? '1 / -1' : String(column + 1);
    child.style.gridRow = `${top + 1} / span ${Math.max(1, height)}`;
    if (full) {
      bottoms.fill(top + height + gap);
      nextColumn = 0;
    } else {
      bottoms[column] = top + height + gap;
      nextColumn = 1 - column;
    }
  }
  enhanced.value = true;
  if (readyPending) {
    readyPending = false;
    emit('ready');
  }
}

function schedule(): void {
  if (!pendingFrame) pendingFrame = requestAnimationFrame(arrange);
}

async function observeCards(): Promise<void> {
  await nextTick();
  observer?.disconnect();
  if (!grid.value) return;
  if (!observer) {
    emit('ready');
    return;
  }
  readyPending = true;
  observer.observe(grid.value);
  for (const card of grid.value.children) observer.observe(card);
  schedule();
}

onMounted(() => {
  if (typeof ResizeObserver === 'function') observer = new ResizeObserver(schedule);
  void observeCards();
});
watch(() => props.demos, observeCards);
watch(() => props.fullWidth, schedule);
onBeforeUnmount(() => {
  observer?.disconnect();
  if (pendingFrame) cancelAnimationFrame(pendingFrame);
});
</script>

<template>
  <div ref="grid" class="demos-grid" :class="{ 'full-width': fullWidth, 'demos-grid--masonry': enhanced }">
    <DemoPreview v-for="demo in demos" :key="demo.id" :demo="demo" :full-width="fullWidth" />
  </div>
</template>

<style scoped>
/* SSR and browsers without ResizeObserver keep a complete, readable grid. */
.demos-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}
.demos-grid :deep(.demo-preview--span-2) { grid-column: 1 / -1; }
.demos-grid--masonry {
  grid-auto-rows: 1px;
  row-gap: 0;
}
.demos-grid.full-width {
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 1080px) {
  .demos-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
