<script setup lang="ts">
/**
 * DemoToolbar —— 示例操作入口。
 * 纯展示 + 事件上报，不持有业务状态（状态归 DemoPreview）。
 */
import { computed, ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import type { DemoMeta } from '../../types/manifest';

const props = defineProps<{
  demo: DemoMeta;
  expanded: boolean;
  standaloneHref: string;
}>();

const emit = defineEmits<{
  toggleCode: [];
  reset: [];
  copied: [ok: boolean];
}>();

const { t } = useSiteLocale();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

const githubHref = computed(
  () => `https://github.com/apollocmh/apollo-design-ui/blob/master/${props.demo.githubPath}`,
);

async function copy(): Promise<void> {
  const code = props.demo.sources.map((s) => s.code).join('\n\n');
  let ok = false;
  try {
    await navigator.clipboard.writeText(code);
    ok = true;
  } catch {
    // clipboard API 不可用（http / 旧浏览器）⇒ 退化 execCommand
    try {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      ta.remove();
    } catch {
      ok = false;
    }
  }
  copied.value = ok;
  emit('copied', ok);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <div class="demo-toolbar" role="toolbar" :aria-label="t('api')">
    <button
      type="button"
      class="demo-tool-btn"
      :aria-expanded="expanded"
      @click="emit('toggleCode')"
    >
      {{ expanded ? t('collapseCode') : t('expandCode') }}
    </button>
    <span class="demo-toolbar-spacer" />
    <button type="button" class="demo-tool-btn" @click="copy">
      {{ copied ? `✓ ${t('copied')}` : t('copy') }}
    </button>
    <button type="button" class="demo-tool-btn" @click="emit('reset')">{{ t('reset') }}</button>
    <a class="demo-tool-btn" :href="standaloneHref" target="_blank" rel="noopener">
      {{ t('openStandalone') }} ↗
    </a>
    <a class="demo-tool-btn" :href="githubHref" target="_blank" rel="noopener noreferrer">
      {{ t('editOnGithub') }} ↗
    </a>
  </div>
</template>

<style scoped>
.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  border-top: 1px solid var(--site-border);
  padding: 5px 12px;
  flex-wrap: wrap;
}

.demo-toolbar-spacer {
  flex: 1;
}

.demo-tool-btn {
  border: none;
  background: transparent;
  color: var(--site-text-secondary);
  font-size: 12.5px;
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
}

.demo-tool-btn:hover {
  color: var(--site-brand);
  background: var(--site-bg-soft);
}
</style>
