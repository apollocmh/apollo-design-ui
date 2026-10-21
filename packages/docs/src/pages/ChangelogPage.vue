<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSiteLocale } from '../composables/locale';
import { loadChangelog } from '../composables/manifest';
import { useTocState } from '../composables/toc';
import type { ChangelogDay } from '../types/manifest';

const { t } = useSiteLocale();
const { setToc } = useTocState();
onMounted(() => setToc([]));

const days = ref<ChangelogDay[]>([]);
const state = ref<'loading' | 'ready' | 'error'>('loading');

onMounted(async () => {
  try {
    days.value = (await loadChangelog()).days;
    state.value = 'ready';
  } catch {
    state.value = 'error';
  }
});

const TYPE_COLOR: Record<string, string> = {
  feat: 'var(--apollo-color-success)',
  fix: 'var(--apollo-color-error)',
  perf: 'var(--apollo-purple)',
  docs: 'var(--apollo-color-primary)',
  refactor: 'var(--apollo-cyan)',
  test: 'var(--apollo-color-warning)',
  build: 'var(--apollo-orange)',
  ci: 'var(--apollo-orange)',
  chore: '#8c8c8c',
  style: 'var(--apollo-magenta)',
  other: 'var(--apollo-color-text-tertiary)',
};
</script>

<template>
  <div>
    <h1 class="changelog-title">{{ t('changelog') }}</h1>
    <p class="changelog-lead">
      {{
        t('version') === '版本'
          ? '按提交日期分组的仓库更新历史（git log 真源，构建期生成）。'
          : 'Repository history grouped by commit date (generated from git log at build time).'
      }}
    </p>

    <div v-if="state === 'loading'" class="changelog-state">{{ t('loading') }}</div>
    <div v-else-if="state === 'error'" class="changelog-state">⚠️ {{ t('demoError') }}</div>
    <template v-else>
      <section v-for="day in days" :key="day.date" class="changelog-day">
        <h2 class="changelog-date">{{ day.date }}</h2>
        <ul class="changelog-list">
          <li v-for="c in day.commits" :key="c.hash" class="changelog-item">
            <span
              class="changelog-type"
              :style="{ color: TYPE_COLOR[c.type] ?? 'var(--apollo-color-text-tertiary)', borderColor: TYPE_COLOR[c.type] ?? 'var(--apollo-color-text-tertiary)' }"
            >
              {{ c.type }}{{ c.scope ? `(${c.scope})` : '' }}
            </span>
            <span class="changelog-subject">{{ c.subject.replace(/^\w+(\([^)]*\))?[:!]\s*/, '') }}</span>
            <a
              class="changelog-hash"
              :href="`https://github.com/apollocmh/apollo-design-ui/commit/${c.hash}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ c.hash.slice(0, 8) }}
            </a>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.changelog-title {
  font-size: 28px;
  font-weight: 600;
  margin: 4px 0 8px;
}

.changelog-lead {
  color: var(--site-text-secondary);
  margin-bottom: 24px;
}

.changelog-state {
  padding: 40px 0;
  color: var(--site-text-tertiary);
  text-align: center;
}

.changelog-date {
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 8px;
  font-family: var(--site-font-code);
}

.changelog-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 2px solid var(--site-border);
}

.changelog-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0 6px 16px;
  position: relative;
  font-size: 13.5px;
}

.changelog-item::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--site-border-strong);
  transform: translateY(-50%);
}

.changelog-type {
  font-size: 11px;
  font-family: var(--site-font-code);
  border: 1px solid;
  border-radius: 4px;
  padding: 0 6px;
  flex-shrink: 0;
}

.changelog-subject {
  flex: 1;
  min-width: 0;
}

.changelog-hash {
  font-family: var(--site-font-code);
  font-size: 12px;
  color: var(--site-text-tertiary);
  flex-shrink: 0;
}
</style>
