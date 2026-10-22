<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { iconWindowRange } from '../../composables/icon-window';
import type { IconMeta } from '../../types/manifest';
import IconTile from './IconTile.vue';

const props = defineProps<{ items: readonly IconMeta[]; copyLabel: string; label: string }>();
const emit = defineEmits<{ copy: [name: string] }>();
const root = ref<HTMLElement>();
// SSR and hydration start with six normalized rows; CSS tokens determine their physical size.
const columns = ref(6);
const rowHeight = ref(1);
const scroll = ref(0);
const top = ref(0);
const viewport = ref(6);
const active = ref(0);
let mounted = false;
let frame = 0;
let observer: ResizeObserver | undefined;
const range = computed(() =>
  iconWindowRange({
    columns: columns.value,
    rowHeight: rowHeight.value,
    itemCount: props.items.length,
    top: top.value,
    scroll: scroll.value,
    viewport: viewport.value,
  }),
);
const rows = computed(() =>
  Array.from({ length: range.value.end - range.value.start }, (_, offset) => {
    const index = range.value.start + offset;
    return { index, items: props.items.slice(index * columns.value, (index + 1) * columns.value) };
  }),
);

function measure(): void {
  if (!root.value) return;
  const rect = root.value.getBoundingClientRect();
  const style = getComputedStyle(root.value);
  rowHeight.value = Number.parseFloat(style.getPropertyValue('--site-icon-row-height'));
  columns.value = Math.max(
    1,
    Math.floor(rect.width / Number.parseFloat(style.getPropertyValue('--site-icon-min-width'))),
  );
  top.value = rect.top + window.scrollY;
  scroll.value = window.scrollY;
  viewport.value = window.innerHeight;
}
function schedule(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    measure();
  });
}
onMounted(() => {
  mounted = true;
  measure();
  observer = new ResizeObserver(schedule);
  if (root.value) observer.observe(root.value);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
});
watch(
  () => props.items,
  async () => {
    active.value = 0;
    if (!mounted) return;
    await nextTick();
    if (window.scrollY > top.value) {
      const style = getComputedStyle(root.value ?? document.documentElement);
      const inset =
        Number.parseFloat(style.getPropertyValue('--site-header-height')) +
        Number.parseFloat(style.getPropertyValue('--apollo-margin'));
      window.scrollTo({ top: Math.max(0, top.value - inset), behavior: 'instant' });
    }
    measure();
  },
);
watch(
  () => props.label,
  () => {
    if (mounted) schedule();
  },
  { flush: 'post' },
);

function tileTabIndex(index: number): number {
  if (index === active.value) return 0;
  const first = range.value.start * columns.value;
  const last = Math.min(props.items.length, range.value.end * columns.value) - 1;
  return (active.value < first && index === first) || (active.value > last && index === last)
    ? 0
    : -1;
}

async function navigate(event: KeyboardEvent): Promise<void> {
  const col = columns.value;
  let index = active.value;
  switch (event.key) {
    case 'ArrowRight':
      index++;
      break;
    case 'ArrowLeft':
      index--;
      break;
    case 'ArrowDown':
      index += col;
      break;
    case 'ArrowUp':
      index -= col;
      break;
    case 'Home':
      index = event.ctrlKey || event.metaKey ? 0 : Math.floor(index / col) * col;
      break;
    case 'End':
      index =
        event.ctrlKey || event.metaKey
          ? props.items.length - 1
          : Math.floor(index / col) * col + col - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  active.value = Math.max(0, Math.min(props.items.length - 1, index));
  const y = top.value + Math.floor(active.value / col) * rowHeight.value;
  const header = Number.parseFloat(
    getComputedStyle(root.value ?? document.documentElement).getPropertyValue(
      '--site-header-height',
    ),
  );
  if (y < window.scrollY + header) window.scrollTo({ top: y - header, behavior: 'instant' });
  else if (y + rowHeight.value > window.scrollY + window.innerHeight)
    window.scrollTo({ top: y + rowHeight.value - window.innerHeight, behavior: 'instant' });
  measure();
  await nextTick();
  root.value
    ?.querySelector<HTMLButtonElement>(`[data-icon-index="${active.value}"]`)
    ?.focus({ preventScroll: true });
}
onBeforeUnmount(() => {
  mounted = false;
  observer?.disconnect();
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
});
</script>

<template>
  <div
    ref="root"
    class="virtual-icon-grid"
    role="grid"
    :aria-label="label"
    :aria-rowcount="range.rows"
    :aria-colcount="columns"
    :style="{ height: `calc(var(--site-icon-row-height) * ${range.rows})` }"
    @keydown="navigate"
  >
    <div
      v-for="row in rows"
      :key="row.index"
      class="virtual-icon-row"
      role="row"
      :aria-rowindex="row.index + 1"
      :style="{
        top: `calc(var(--site-icon-row-height) * ${row.index})`,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }"
    >
      <div v-for="(icon, column) in row.items" :key="icon.name" role="gridcell" :aria-colindex="column + 1">
        <IconTile
          :name="icon.name"
          :copy-label="copyLabel"
          :data-icon-index="row.index * columns + column"
          :tabindex="tileTabIndex(row.index * columns + column)"
          @focus="active = row.index * columns + column"
          @copy="emit('copy', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-icon-grid {
  position: relative;
  width: 100%;
  overflow-anchor: none;
}
.virtual-icon-row {
  height: var(--site-icon-row-height);
  position: absolute;
  inset-inline: 0;
  display: grid;
}
.virtual-icon-row > div {
  min-width: 0;
}
</style>
