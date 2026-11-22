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
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return;
  const anchor = e.target instanceof Element ? e.target.closest('a') : null;
  if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self'))
    return;
  const href = anchor.getAttribute('href') ?? '';
  if (!href) return;

  // 纯锚点：本页内滚动
  if (href.startsWith('#')) {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  // The HTML href is usable independently. Only a normal click stays in the router.
  const destination = anchor.dataset.docRoute;
  if (destination) {
    e.preventDefault();
    const to = router.resolve(destination);
    if (to.fullPath.split('#')[0] === route.fullPath.split('#')[0]) {
      if (to.hash)
        document.getElementById(to.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    void router.push(destination);
  }
  // 其余（外链、相对文件）交浏览器默认行为；外链已在渲染期补 target/rel
}
</script>

<template>
  <div class="doc-markdown" @click="onClick" v-html="html" />
</template>
