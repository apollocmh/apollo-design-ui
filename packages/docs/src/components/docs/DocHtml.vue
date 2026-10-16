<script setup lang="ts">
/**
 * DocHtml —— 预渲染文档 HTML 的注入容器。
 *
 * 为什么不用「markdown 编译成 Vue 模板」：任意 Markdown 文本都不应作为模板执行
 * （内容里可能有看似指令的文本）。这里只注入构建期 markdown-it 产出的静态 HTML，
 * 链接交互通过事件代理接管（站内 → 路由跳转，锚点 → 平滑滚动）。
 */
import { useRoute, useRouter } from 'vue-router';

defineProps<{ html: string }>();

const router = useRouter();
const route = useRoute();

function onClick(e: MouseEvent): void {
  const anchor = (e.target as HTMLElement).closest('a');
  if (!anchor) return;
  const href = anchor.getAttribute('href') ?? '';
  if (!href) return;

  // 纯锚点：本页内滚动
  if (href.startsWith('#')) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  // 站内路由（绝对路径，可能带 hash）
  if (href.startsWith('/')) {
    const path = href.split('#')[0] ?? '';
    const hash = href.split('#')[1];
    if (path === route.path) {
      e.preventDefault();
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    void router.push(hash ? `${path}#${hash}` : path);
  }
  // 其余（外链、相对文件）交浏览器默认行为；外链已在渲染期补 target/rel
}
</script>

<template>
  <div class="doc-markdown" @click="onClick" v-html="html" />
</template>
