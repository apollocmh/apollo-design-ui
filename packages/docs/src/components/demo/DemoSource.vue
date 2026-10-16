<script setup lang="ts">
/**
 * DemoSource —— 源码展示。
 *
 * - 多文件（demo 引了辅助模块）⇒ tab 切换，主文件排第一；
 * - 高亮 HTML 由构建期 shiki 生成（双主题变量），客户端零高亮成本；
 * - 同时保留纯文本 `code` 供复制（DemoToolbar 消费）。
 */
import { computed, ref } from 'vue';
import type { SourceFile } from '../../types/manifest';

const props = defineProps<{ sources: SourceFile[] }>();

const activePath = ref(props.sources.find((s) => s.main)?.path ?? props.sources[0]?.path ?? '');

const active = computed(
  () => props.sources.find((s) => s.path === activePath.value) ?? props.sources[0],
);
</script>

<template>
  <div class="demo-source">
    <div v-if="sources.length > 1" class="demo-source-tabs" role="tablist">
      <button
        v-for="s in sources"
        :key="s.path"
        type="button"
        role="tab"
        class="demo-source-tab"
        :class="{ active: s.path === active?.path }"
        :aria-selected="s.path === active?.path"
        @click="activePath = s.path"
      >
        {{ s.label }}<span v-if="!s.main" class="demo-source-tab-badge">辅助</span>
      </button>
    </div>
    <!-- v-html 内容是构建期 shiki 产物（第一方生成，非用户输入） -->
    <div class="demo-source-code" v-html="active?.codeHtml" />
  </div>
</template>

<style scoped>
.demo-source {
  border-top: 1px solid var(--site-border);
  background: var(--site-pre-bg);
}

.demo-source-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 10px 0;
  border-bottom: 1px solid var(--site-border);
  overflow-x: auto;
}

.demo-source-tab {
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--site-text-secondary);
  font-size: 12px;
  font-family: var(--site-font-code);
  padding: 4px 10px;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
}

.demo-source-tab.active {
  background: var(--site-code-bg);
  border-color: var(--site-border);
  color: var(--site-text);
}

.demo-source-tab-badge {
  margin-left: 6px;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 4px;
  background: var(--site-bg-soft);
  border: 1px solid var(--site-border);
  color: var(--site-text-tertiary);
}

.demo-source-code :deep(pre) {
  margin: 0;
  padding: 14px 18px;
  overflow-x: auto;
  font-size: 12.5px;
  line-height: 1.7;
  font-family: var(--site-font-code);
  background: transparent !important;
  border: none;
}

.demo-source-code :deep(code) {
  font-family: var(--site-font-code);
}

/* shiki 双主题（与 markdown.css 同规则，作用到源码面板） */
:global([data-apollo-theme='dark']) .demo-source-code :deep(.shiki),
:global([data-apollo-theme='dark']) .demo-source-code :deep(.shiki span) {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
}
</style>
