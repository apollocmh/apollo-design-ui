/**
 * 组件文档页生成器。
 *
 * 数据源（单一真源）：
 *   - packages/ui/src/<c>/index.zh-CN.md   组件文档（frontmatter: category/title/subtitle）
 *   - packages/ui/src/<c>/demo/*.vue       演示源码
 *   - packages/ui/src/<c>/demo/<n>.md      演示说明
 *
 * 产出：
 *   - packages/docs/components/<c>.md      组件页（原文档正文 + 每个演示的实时渲染块）
 *   - packages/docs/components/index.md    组件总览页
 *
 * 幂等：每次 build/dev 前全量重生成（脚本由 docs 的 dev/build 自动调用），
 * 因此组件源码或文档更新后文档站无需手工同步。
 */
import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const UI_SRC = nodePath.resolve(__dirname, '../../ui/src');
const OUT_DIR = nodePath.resolve(__dirname, '../components');

/** kebab-case 目录名 → PascalCase 组件名（仅用于展示兜底）。 */
function toPascal(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** 解析 index.zh-CN.md 的 frontmatter（--- 包裹的 key: value）。 */
function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  const meta = {};
  if (!m) return meta;
  for (const line of m[1].split('\n')) {
    const kv = /^(\w[\w-]*):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return meta;
}

/** 去掉 frontmatter 后的正文。 */
function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n*/, '');
}

/** 解析 demo/<n>.md 说明：去 frontmatter → 取 zh-CN 段 → 截掉代码块与容器 → 单行摘要。 */
function readDemoDesc(descFile) {
  if (!fs.existsSync(descFile)) return '';
  let md = fs.readFileSync(descFile, 'utf8').replace(/^---\n[\s\S]*?\n---\n*/, '');
  const zh = /^## zh-CN\s*$/m.exec(md);
  if (zh) {
    const en = /^## en-US\s*$/m.exec(md.slice(zh.index + zh[0].length));
    md = md.slice(zh.index + zh[0].length, en ? zh.index + zh[0].length + en.index : undefined);
  }
  // 截掉代码块（源码由 DemoPreview 展示）与 markdown 自定义容器（与文档站容器语法冲突）
  const cut = md.split('\n').findIndex((l) => /^(```|:::)/.test(l.trim()));
  if (cut !== -1) md = md.split('\n').slice(0, cut).join('\n');
  return md.trim().replace(/\n{2,}/g, '\n');
}

function collectComponents() {
  const names = fs
    .readdirSync(UI_SRC, { withFileTypes: true })
    .map((e) => e.name)
    .filter((n) => !n.startsWith('_') && n !== '__tests__' && n !== 'style')
    .filter((n) => fs.statSync(nodePath.join(UI_SRC, n)).isDirectory())
    .filter((n) => {
      const d = nodePath.join(UI_SRC, n);
      return (
        fs.existsSync(nodePath.join(d, 'index.zh-CN.md')) ||
        (fs.existsSync(nodePath.join(d, 'demo')) && fs.existsSync(nodePath.join(d, 'index.ts')))
      );
    })
    .sort();
  return names.map((name) => {
    const dir = nodePath.join(UI_SRC, name);
    const mdPath = nodePath.join(dir, 'index.zh-CN.md');
    const hasDoc = fs.existsSync(mdPath);
    const meta = hasDoc ? parseFrontmatter(fs.readFileSync(mdPath, 'utf8')) : {};
    const demos = fs
      .readdirSync(nodePath.join(dir, 'demo'), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.vue'))
      .map((e) => e.name.replace(/\.vue$/, ''));
    return {
      name,
      title: meta.title ?? toPascal(name),
      subtitle: meta.subtitle ?? '',
      category: meta.category ?? '其他',
      body: hasDoc ? stripFrontmatter(fs.readFileSync(mdPath, 'utf8')) : '',
      docsPending: !hasDoc,
      demos,
      demoDir: nodePath.join(dir, 'demo'),
    };
  });
}

/** 生成一个组件页 markdown。 */
function renderComponentPage(c) {
  const parts = [
    '---',
    `title: ${c.title}${c.subtitle ? ` ${c.subtitle}` : ''}`,
    'outline: [2, 3]',
    '---',
    '',
    '<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->',
    '',
  ];

  if (c.docsPending) {
    parts.push(`> ⚠️ 该组件的 API 文档（\`index.zh-CN.md\`）尚未补齐，以下为可运行的实时演示。`, '');
  }

  const body = c.body;
  const demoHeading = /^## 代码演示\s*$/m.exec(body);
  let before = body;
  let after = '';
  if (demoHeading) {
    before = body.slice(0, demoHeading.index);
    const rest = body.slice(demoHeading.index + demoHeading[0].length);
    const nextH2 = /^## /m.exec(rest);
    if (nextH2) after = rest.slice(nextH2.index);
  }

  if (before.trim()) {
    parts.push('::: v-pre', '', before.trimEnd(), '', ':::', '');
  }
  parts.push('## 代码演示', '');

  for (const demo of c.demos) {
    const desc = readDemoDesc(nodePath.join(c.demoDir, `${demo}.md`));
    if (desc) {
      parts.push('::: v-pre', '', `**${demo}**：${desc}`, '', ':::', '');
    }
    parts.push(`<DemoPreview component="${c.name}" demo="${demo}" />`, '');
  }

  if (after) {
    parts.push('::: v-pre', '', after.trimStart().trimEnd(), '', ':::', '');
  }
  return parts.join('\n');
}

/** 组件总览页（按 frontmatter category 分组）。 */
function renderOverview(components) {
  const byCat = new Map();
  for (const c of components) {
    if (!byCat.has(c.category)) byCat.set(c.category, []);
    byCat.get(c.category).push(c);
  }
  const lines = [
    '---',
    'title: 组件总览',
    '---',
    '',
    `<div class="component-count">共 ${components.length} 个组件</div>`,
    '',
  ];
  for (const [cat, list] of byCat) {
    lines.push(`## ${cat}`, '');
    for (const c of list) {
      lines.push(`- [${c.title}${c.subtitle ? ` ${c.subtitle}` : ''}](./${c.name})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const components = collectComponents();
fs.mkdirSync(OUT_DIR, { recursive: true });

// 清掉旧页面（防止改名组件留下孤儿页）
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.md')) fs.rmSync(nodePath.join(OUT_DIR, f));
}

for (const c of components) {
  fs.writeFileSync(nodePath.join(OUT_DIR, `${c.name}.md`), renderComponentPage(c));
}
// ⚠️ 必须是 overview.md：nav/侧边栏链接 /components/overview，
//    写成 index.md 会变成 /components/（链接 404）。
fs.writeFileSync(
  nodePath.join(OUT_DIR, 'overview.md'),
  renderOverview(components),
);

console.log(`[gen-component-pages] ${components.length} 组件页 + 1 总览页 → components/`);
