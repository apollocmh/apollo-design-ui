<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { TocItem } from '../../types/manifest';
import { useSiteLocale } from '../../composables/locale';

const props = defineProps<{ items: TocItem[] }>();
const { t } = useSiteLocale();

const activeId = ref('');
let observer: IntersectionObserver | null = null;

function setupSpy(): void {
  observer?.disconnect();
  observer = null;
  if (typeof IntersectionObserver !== 'function') return;
  const ids = props.items.map((i) => i.id);
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-72px 0px -70% 0px', threshold: 0 },
  );
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}

watch(
  () => props.items.map((i) => i.id).join('|'),
  () => setupSpy(),
  { immediate: false },
);

onMounted(setupSpy);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <nav v-if="items.length > 0" class="site-toc" aria-label="本页目录">
    <div class="site-toc-title">{{ t('onThisPage') }}</div>
    <a
      v-for="item in items"
      :key="item.id"
      class="site-toc-link"
      :class="{ active: activeId === item.id, l3: item.level === 3 }"
      :href="`#${item.id}`"
    >
      {{ item.text }}
    </a>
  </nav>
</template>
