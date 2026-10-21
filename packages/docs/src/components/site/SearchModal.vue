<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import { useSearch } from '../../composables/search';

const emit = defineEmits<{ close: []; navigate: [path: string] }>();

const { query, grouped, ensureIndex, loading, error } = useSearch();
const { t, pick, locale } = useSiteLocale();

const input = ref<HTMLInputElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const activeIndex = ref(0);
let previousFocus: HTMLElement | null = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(): HTMLElement[] {
  return panel.value ? Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

const flatResults = computed(() => grouped.value.flatMap((g) => g.items));

// 分组标题占位后，扁平列表里每项的真实序号
function flatIndexOf(groupType: string, i: number): number {
  let n = 0;
  for (const g of grouped.value) {
    if (g.type === groupType) return n + i;
    n += g.items.length;
  }
  return n;
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    emit('close');
    return;
  }
  if (e.key === 'Tab') {
    const list = focusables();
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (!first || !last) return;
    const active = document.activeElement as HTMLElement | null;
    const inside = active ? panel.value?.contains(active) : false;
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const total = flatResults.value.length;
    if (total === 0) return;
    if (e.key === 'ArrowDown') activeIndex.value = (activeIndex.value + 1) % total;
    else activeIndex.value = (activeIndex.value - 1 + total) % total;
    void nextTick(() => {
      document.querySelector('.site-search-item.active')?.scrollIntoView({ block: 'nearest' });
    });
    return;
  }
  if (e.key === 'Enter') {
    const hit = flatResults.value[activeIndex.value];
    if (hit) {
      const lang = locale.value === 'zh-CN' ? 'zh' : 'en';
      let path = hit.route[lang === 'zh' ? 'zh' : 'en'];
      if (hit.anchor) path += hit.anchor;
      emit('navigate', path);
    }
  }
}

async function retry(): Promise<void> {
  try {
    await ensureIndex();
  } catch {
    // 错误态由 useSearch().error 驱动；这里只负责不让 rejection 逃逸
  }
}

onMounted(() => {
  previousFocus = document.activeElement as HTMLElement | null;
  input.value?.focus();
  void retry();
});

onBeforeUnmount(() => {
  previousFocus?.focus();
  previousFocus = null;
});

const GROUP_LABEL = {
  component: () => t('groupComponent'),
  demo: () => t('groupDemo'),
  guide: () => t('groupGuide'),
} as const;
</script>

<template>
  <Teleport to="body">
    <div class="site-search-mask" @click.self="emit('close')">
      <div
        ref="panel"
        class="site-search-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="t('search')"
        @keydown="onKeydown"
      >
        <input
          ref="input"
          v-model="query"
          class="site-search-input"
          type="text"
          role="combobox"
          :aria-expanded="flatResults.length > 0"
          aria-controls="site-search-listbox"
          :aria-activedescendant="
            flatResults[activeIndex] ? `search-opt-${activeIndex}` : undefined
          "
          :placeholder="t('search')"
        />
        <div v-if="error" class="site-search-empty" role="alert">
          {{ t('searchError') }}
          <button type="button" class="site-search-retry" @click="retry">{{ t('retry') }}</button>
        </div>
        <div v-else-if="loading" class="site-search-empty">{{ t('loading') }}</div>
        <div v-else-if="flatResults.length === 0" class="site-search-empty">
          {{ t('noResults') }}
        </div>
        <div v-else id="site-search-listbox" class="site-search-list" role="listbox">
          <template v-for="g in grouped" :key="g.type">
            <div class="site-search-group">{{ GROUP_LABEL[g.type]() }}</div>
            <button
              v-for="(item, i) in g.items"
              :id="`search-opt-${flatIndexOf(g.type, i)}`"
              :key="item.id"
              class="site-search-item"
              :class="{ active: flatIndexOf(g.type, i) === activeIndex }"
              role="option"
              :aria-selected="flatIndexOf(g.type, i) === activeIndex"
              type="button"
              @mouseenter="activeIndex = flatIndexOf(g.type, i)"
              @click="
                emit('navigate', item.route[locale === 'zh-CN' ? 'zh' : 'en'] + (item.anchor ?? ''))
              "
            >
              <span class="site-search-item-title">{{ pick(item.title).text }}</span>
              <span v-if="item.component" class="site-search-item-meta">{{ item.component }}</span>
              <span class="site-search-item-desc">{{ pick(item.text).text.slice(0, 60) }}</span>
            </button>
          </template>
        </div>
        <div class="site-search-hint">{{ t('searchHint') }}</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.site-search-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}

.site-search-panel {
  width: min(620px, 92vw);
  max-height: 68vh;
  background: var(--site-bg-elevated);
  border: 1px solid var(--site-border);
  border-radius: 12px;
  box-shadow: var(--site-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.site-search-input {
  border: none;
  outline: none;
  padding: 14px 18px;
  font-size: 15px;
  background: transparent;
  color: var(--site-text);
  border-bottom: 1px solid var(--site-border);
}

.site-search-list {
  overflow-y: auto;
  padding: 6px;
}

.site-search-group {
  padding: 8px 12px 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--site-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.site-search-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--site-text);
  font-size: 13.5px;
}

.site-search-item.active {
  background: color-mix(in srgb, var(--site-brand) 10%, transparent);
}

.site-search-item-title {
  font-weight: 500;
}

.site-search-item-meta {
  color: var(--site-text-tertiary);
  font-size: 12px;
}

.site-search-item-desc {
  grid-column: 1 / -1;
  color: var(--site-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-search-empty {
  padding: 28px;
  text-align: center;
  color: var(--site-text-tertiary);
}

.site-search-retry {
  margin-left: 8px;
  border: 1px solid var(--site-border-strong);
  background: transparent;
  color: var(--site-brand);
  border-radius: 6px;
  padding: 2px 10px;
  cursor: pointer;
}

.site-search-hint {
  border-top: 1px solid var(--site-border);
  padding: 8px 16px;
  font-size: 11.5px;
  color: var(--site-text-tertiary);
}
</style>
