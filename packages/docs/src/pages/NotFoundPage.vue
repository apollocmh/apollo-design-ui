<script setup lang="ts">
import { onMounted } from 'vue';
import { useSiteLocale } from '../composables/locale';
import { useTocState } from '../composables/toc';

const { t } = useSiteLocale();
const { setToc } = useTocState();
onMounted(() => setToc([]));
</script>

<template>
  <div class="notfound">
    <h1 class="notfound-code">{{ t('notFoundTitle') }}</h1>
    <p class="notfound-text">{{ t('notFoundText') }}</p>
    <RouterLink class="notfound-home" to="/">{{ t('backHome') }}</RouterLink>
  </div>
</template>

<style scoped>
.notfound {
  text-align: center;
  padding: 96px 0;
}

.notfound-code {
  font-size: 72px;
  font-weight: 700;
  margin: 0;
  color: var(--site-brand);
}

.notfound-text {
  color: var(--site-text-secondary);
  margin: 8px 0 24px;
}

.notfound-home {
  display: inline-block;
  border: 1px solid var(--site-border-strong);
  border-radius: 8px;
  padding: 6px 20px;
}
</style>
