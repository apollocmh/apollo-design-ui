<script setup lang="ts">
/**
 * DemoToolbar —— 示例操作入口。
 * 纯展示 + 事件上报，不持有业务状态（状态归 DemoPreview）。
 */
import {
  CheckOutlined,
  CodeOutlined,
  CopyOutlined,
  ExportOutlined,
  GithubOutlined,
  ReloadOutlined,
} from '@apollo-design/icons';
import { Button, Tooltip } from '@apollo-design/ui';
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
    <Button
      class="demo-tool-btn"
      type="text"
      size="small"
      :aria-expanded="expanded"
      @click="emit('toggleCode')"
    >
      <template #icon><CodeOutlined /></template>
      {{ expanded ? t('collapseCode') : t('expandCode') }}
    </Button>
    <span class="demo-toolbar-spacer" />
    <Button class="demo-tool-btn" type="text" size="small" @click="copy">
      <template #icon>
        <CheckOutlined v-if="copied" />
        <CopyOutlined v-else />
      </template>
      {{ copied ? t('copied') : t('copy') }}
    </Button>
    <Button class="demo-tool-btn" type="text" size="small" @click="emit('reset')">
      <template #icon><ReloadOutlined /></template>
      {{ t('reset') }}
    </Button>
    <Tooltip :title="t('openStandalone')">
      <Button
        class="demo-tool-btn demo-tool-btn-icon"
        type="text"
        size="small"
        :href="standaloneHref"
        target="_blank"
        rel="noopener"
        :aria-label="t('openStandalone')"
      >
        <template #icon><ExportOutlined /></template>
      </Button>
    </Tooltip>
    <Tooltip :title="t('editOnGithub')">
      <Button
        class="demo-tool-btn demo-tool-btn-icon"
        type="text"
        size="small"
        :href="githubHref"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('editOnGithub')"
      >
        <template #icon><GithubOutlined /></template>
      </Button>
    </Tooltip>
  </div>
</template>

<style scoped>
.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  border-top: 1px solid var(--site-border);
  padding: 4px 10px;
  flex-wrap: wrap;
}

.demo-toolbar-spacer {
  flex: 1;
}

/*
 * V3：工具栏不再自绘按钮视觉 —— 颜色 / 焦点 / hover / disabled 全部由
 * Apollo Button（text / small）承担。这里只保留布局类名（测试与旧样式锚点）。
 */
.demo-toolbar :deep(.demo-tool-btn) {
  font-size: 12.5px;
}

.demo-toolbar :deep(.demo-tool-btn-icon) {
  padding-inline: 8px;
}
</style>
