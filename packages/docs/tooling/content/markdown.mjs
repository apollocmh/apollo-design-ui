/**
 * Markdown → HTML（构建期专用，不进客户端 bundle）。
 *
 * 设计要点：
 *  - shiki 高亮：createHighlighter 一次、codeToHtml 同步（markdown-it 的 highlight
 *    钩子是同步契约）。
 *  - 标题自动加 id（slug 去重），TOC 由 renderDoc 的返回值直接给出。
 *  - 外链补 rel/target；站内 ./*.md 相对链接改写为路由（组件文档互相引用用相对路径）。
 *  - 不把 Markdown 当 Vue 模板：产物是纯 HTML 字符串，页面用 v-html 注入。
 */
import MarkdownIt from 'markdown-it';
import { createJavaScriptRegexEngine } from 'shiki';
import { createHighlighterCore } from 'shiki/core';

/**
 * 去掉内联 HTML 标签（标题里出现 `<a>` / `<code>` 这类标签时，锚点与 TOC 文案
 * 都应当只取可见文本 —— 否则 id 会变成 `<a>-与-<button>-…`，既是脏锚点，
 * 放进 href 还要再转义一层）。
 */
function stripTags(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .trim();
}

/** kebab-case slug（中文保留，空格/标点转 -）。 */
export function slugify(text) {
  return (
    stripTags(text)
      .toLowerCase()
      // HTML 属性里不能原样出现的字符（引号 / 尖括号 / 斜杠）一律剔除
      .replace(/[`*~[\]{}()<>"'/\\]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

let highlighterPromise = null;

/** 惰性创建 shiki highlighter（JS 引擎，免 oniguruma wasm）。 */
async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
      langs: [
        import('shiki/langs/vue.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/bash.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/html.mjs'),
        import('shiki/langs/css.mjs'),
        import('shiki/langs/markdown.mjs'),
      ],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

/** 创建配置好的 markdown-it 实例（构建期调用一次）。 */
export async function createMarkdownRenderer({ currentPathPrefix = '' } = {}) {
  const highlighter = await getHighlighter();

  const md = new MarkdownIt({
    html: true, // 第一方内容里的内联 HTML（如 <br />）原样保留
    linkify: true,
    typographer: false,
    highlight(code, lang) {
      const actual = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'vue';
      try {
        return highlighter.codeToHtml(code, {
          lang: actual,
          themes: { light: 'github-light', dark: 'github-dark' },
        });
      } catch {
        return `<pre class="site-code-fallback"><code>${md.utils.escapeHtml(code)}</code></pre>`;
      }
    },
  });

  // ── 标题 slug + 双层锚点 ────────────────────────────────────────────────
  const usedSlugs = new Set();
  const uniqueSlug = (raw) => {
    const base = slugify(raw) || 'section';
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
    usedSlugs.add(slug);
    return slug;
  };
  md.core.ruler.push('reset_slugs', () => usedSlugs.clear());

  const headings = [];
  md.renderer.rules.heading_open = (tokens, idx) => {
    const token = tokens[idx];
    const level = Number(token.tag.slice(1));
    // TOC 文案同样去标签：侧栏显示的是「人读的标题」，不是 Markdown 源文本
    const text = stripTags(tokens[idx + 1]?.content ?? '');
    const slug = uniqueSlug(text);
    token.attrSet('id', slug);
    if (level >= 2 && level <= 3) {
      headings.push({ level, text, id: slug });
    }
    return md.renderer.renderToken(tokens, idx);
  };

  // ── 链接：外链新窗口；相对 .md 链接改写成路由 ──────────────────────────
  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet('href') ?? '';
    if (/^https?:\/\//.test(href)) {
      tokens[idx].attrSet('target', '_blank');
      tokens[idx].attrSet('rel', 'noopener noreferrer');
    } else if (/\.md($|#)/.test(href)) {
      // 文档互引：./demo 或 ../other/index.md → 去掉 .md，交给前端路由
      tokens[idx].attrSet('href', href.replace(/\.md(?=#|$)/, ''));
    } else if (href.startsWith('./') || href.startsWith('../')) {
      tokens[idx].attrSet('href', currentPathPrefix + href);
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  return { md, headings: () => headings };
}

/**
 * 渲染一段文档。返回 { html, toc }；`splitMarker` 用于把「代码演示」段从正文切开
 * （组件页的 demo 卡片由 DemoPreview 体系接管，不复述文档里的 demo 表格）。
 */
export async function renderDoc(markdownText, options = {}) {
  const { md } = await createMarkdownRenderer(options);
  const html = md.render(markdownText);
  return { html, toc: structuredClone(md.core.ruler ? [] : []) };
}

/** 渲染并回收标题（配合 heading_open 钩子拿 TOC）。 */
export async function renderDocWithToc(markdownText, options = {}) {
  const { md, headings } = await createMarkdownRenderer(options);
  const html = md.render(markdownText);
  return { html, toc: headings() };
}

/** 单段代码高亮（demo 源码面板用；与文档代码块同一套双主题）。 */
export async function highlightCode(code, lang = 'vue') {
  const highlighter = await getHighlighter();
  const actual = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'vue';
  try {
    return highlighter.codeToHtml(code, {
      lang: actual,
      themes: { light: 'github-light', dark: 'github-dark' },
    });
  } catch {
    return `<pre class="site-code-fallback"><code>${code.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'))}</code></pre>`;
  }
}
