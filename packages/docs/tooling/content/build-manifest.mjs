/**
 * 内容管线主脚本：扫描 → 解析 → 规范化 → 校验 → manifest。
 *
 * 数据真源（不复制、不改写组件文档）：
 *   packages/ui/src/<c>/index.zh-CN.md | index.en-US.md   组件文档
 *   packages/ui/src/<c>/demo/<name>.vue                   演示源码（运行的真源）
 *   packages/ui/src/<c>/demo/<name>.md                    演示元数据与说明
 *   packages/docs/content/guide/<slug>.md                 指南（双语分节）
 *
 * 产物（packages/docs/.generated/，全部 gitignore）：
 *   manifest.json            小体积：分类导航 / 组件与指南清单（页面懒加载其余）
 *   docs/<c>.<lang>.json     组件页：文档 HTML + TOC + demo 元数据与源码
 *   guides/<slug>.<lang>.json
 *   search.json              全站搜索索引（懒加载）
 *   changelog.json           从 git log 生成
 *
 * --check 模式：只跑扫描与校验、不落盘（CI / 测试用）。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { bilingualOf, localeOf, normalizeText, parseFrontmatter } from './frontmatter.mjs';
import { highlightCode, renderDocWithToc } from './markdown.mjs';
import { collectDemoSources } from './demo-source.mjs';
import { compareCategories } from './categories.mjs';

const HERE = nodePath.dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = nodePath.resolve(HERE, '../..');
export const REPO_ROOT = nodePath.resolve(DOCS_DIR, '../..');
const UI_SRC = nodePath.resolve(REPO_ROOT, 'packages/ui/src');
const OUT_DIR = nodePath.resolve(DOCS_DIR, '.generated');
const GUIDE_SRC = nodePath.resolve(DOCS_DIR, 'content/guide');
const REPO_URL = 'https://github.com/apollocmh/apollo-design-ui';

const DEMO_SECTION_RE = /^## (代码演示|代码示例|Examples?|Demos?)\s*$/im;

// ---------------------------------------------------------------------------
// 校验错误收集：errors = 门禁失败（重复 ID / 缺失文件 / 解析错误）；
// notes = 已做规范化兜底的信息（缺 order、孤儿文件），打印但不拦构建。
// ---------------------------------------------------------------------------
const problems = [];
const notes = [];

function note(message) {
  notes.push(message);
}

function warn(message) {
  problems.push(message);
}

function assert(condition, message) {
  if (!condition) warn(message);
}

// ---------------------------------------------------------------------------
// 扫描
// ---------------------------------------------------------------------------

function toPascal(kebab) {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** 从 packages/ui/src/<c>/index.ts 提取公开值导出（用于「使用方式」导入语句）。 */
function extractExports(name) {
  const entry = nodePath.join(UI_SRC, name, 'index.ts');
  const names = new Set();
  if (fs.existsSync(entry)) {
    const src = fs.readFileSync(entry, 'utf8');
    const re = /export\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(src))) {
      for (const piece of m[1].split(',')) {
        let id = piece.trim();
        if (!id || id.startsWith('type')) continue;
        if (/^import\s/.test(id)) continue;
        const asMatch = /\bas\s+([A-Za-z_$][\w$]*)$/.exec(id);
        if (asMatch) id = asMatch[1];
        if (/^[A-Z]/.test(id)) names.add(id);
      }
    }
  }
  if (names.size === 0) names.add(toPascal(name));
  return [...names];
}

/** 解析单个 demo 元数据（demo/<n>.md + demo/<n>.vue）。 */
function parseDemo(componentName, demoMdPath) {
  const name = nodePath.basename(demoMdPath, '.md');
  const vuePath = nodePath.join(nodePath.dirname(demoMdPath), `${name}.vue`);
  const raw = fs.existsSync(demoMdPath) ? fs.readFileSync(demoMdPath, 'utf8') : '';
  const { meta, body } = raw ? parseFrontmatter(raw) : { meta: {}, body: '' };

  assert(
    fs.existsSync(vuePath),
    `${componentName}/demo/${name}：有 .md 说明但没有对应的 .vue 源码`,
  );

  // 说明正文按 `## zh-CN` / `## en-US` 分节；截掉与源码重复的 ``` 代码块
  const sectionOf = (lang) => {
    const re = new RegExp(`^## ${lang}\\s*$`, 'm');
    const hit = re.exec(body);
    if (!hit) return '';
    const next = /^## (zh-CN|en-US)\s*$/m.exec(body.slice(hit.index + hit[0].length));
    const end = next ? hit.index + hit[0].length + next.index : body.length;
    return body
      .slice(hit.index + hit[0].length, end)
      .replace(/```[\s\S]*?```/g, '')
      .trim();
  };

  const order = Number.isFinite(Number(meta.order)) ? Number(meta.order) : Number.MAX_SAFE_INTEGER;
  if (!Number.isFinite(Number(meta.order))) {
    note(`${componentName}/demo/${name}.md：frontmatter 缺少数字 order（按文件名兜底排序）`);
  }

  const zhDesc = sectionOf('zh-CN') || body.replace(/```[\s\S]*?```/g, '').trim();
  const enDesc = sectionOf('en-US');

  return {
    id: `${componentName}-demo-${name}`,
    component: componentName,
    name,
    order,
    title: bilingualOf(meta, 'title', name, name),
    desc: { zh: zhDesc, en: enDesc || zhDesc, enFallback: !enDesc },
    iframe: meta.iframe === true,
    vuePath,
    relVuePath: nodePath.relative(REPO_ROOT, vuePath).split(nodePath.sep).join('/'),
  };
}

function scanComponentDir(entry) {
  const name = entry.name;
  const dir = nodePath.join(UI_SRC, name);
  const zhPath = nodePath.join(dir, 'index.zh-CN.md');
  const enPath = nodePath.join(dir, 'index.en-US.md');
  assert(fs.existsSync(zhPath), `${name}：缺少 index.zh-CN.md`);

  const zhRaw = fs.existsSync(zhPath) ? normalizeText(fs.readFileSync(zhPath, 'utf8')) : '';
  const enRaw = fs.existsSync(enPath) ? normalizeText(fs.readFileSync(enPath, 'utf8')) : zhRaw;
  const { meta: zhMeta, body: zhBody } = parseFrontmatter(zhRaw);
  const { meta: enMeta, body: enBody } = parseFrontmatter(enRaw);

  // demo 目录：有 .md 的才收（.vue-only 的历史残留给警告）
  const demoDir = nodePath.join(dir, 'demo');
  const demos = [];
  if (fs.existsSync(demoDir)) {
    for (const f of fs.readdirSync(demoDir)) {
      if (!f.endsWith('.md')) continue;
      demos.push(parseDemo(name, nodePath.join(demoDir, f)));
    }
    const orphanVues = fs
      .readdirSync(demoDir)
      .filter((f) => f.endsWith('.vue'))
      .filter((f) => !fs.existsSync(nodePath.join(demoDir, `${f.slice(0, -4)}.md`)));
    for (const o of orphanVues) {
      note(`${name}/demo/${o}：没有配对的 .md 说明（不会出现在文档站）`);
    }
  }
  demos.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  // demo id 去重
  const ids = new Set();
  for (const d of demos) {
    assert(!ids.has(d.name), `${name}/demo：重复的 demo 名「${d.name}」`);
    ids.add(d.name);
  }

  return {
    name,
    id: name,
    pascal: toPascal(name),
    category: localeOf(zhMeta, 'category', '其他'),
    order: Number.isFinite(Number(zhMeta.order)) ? Number(zhMeta.order) : Number.MAX_SAFE_INTEGER,
    title: bilingualOf(zhMeta, 'title', name, localeOf(enMeta, 'title', name)),
    subtitle: bilingualOf(zhMeta, 'subtitle', '', localeOf(enMeta, 'subtitle', '')),
    imports: extractExports(name),
    body: { zh: zhBody, en: enBody },
    demos,
    relDir: `packages/ui/src/${name}`,
  };
}

export function scanComponents() {
  const components = [];
  for (const entry of fs.readdirSync(UI_SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name === '__tests__' || entry.name === 'style') continue;
    const hasDoc = fs.existsSync(nodePath.join(UI_SRC, entry.name, 'index.zh-CN.md'));
    if (!hasDoc) continue;
    components.push(scanComponentDir(entry));
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  return components;
}

// ---------------------------------------------------------------------------
// 指南
// ---------------------------------------------------------------------------

function scanGuides() {
  if (!fs.existsSync(GUIDE_SRC)) return [];
  const guides = [];
  for (const f of fs.readdirSync(GUIDE_SRC)) {
    if (!f.endsWith('.md')) continue;
    const slug = f.slice(0, -3);
    const raw = normalizeText(fs.readFileSync(nodePath.join(GUIDE_SRC, f), 'utf8'));
    const { meta, body: ownBody } = parseFrontmatter(raw);
    // frontmatter `source:` 指向仓库内另一份文档（如根目录 COMPATIBILITY.md）⇒
    // 单一真源，构建期注入，正文不在此手抄。
    let body = ownBody;
    if (typeof meta.source === 'string') {
      const sourcePath = nodePath.resolve(GUIDE_SRC, meta.source);
      assert(fs.existsSync(sourcePath), `guide/${slug}：source 文件不存在：${meta.source}`);
      body = normalizeText(fs.readFileSync(sourcePath, 'utf8'))
        .replace(/^# .*$/m, '') // 去掉源文件的一级标题（页面标题由 frontmatter 提供）
        .trim();
    }
    // 指南正文按 `## zh-CN` / `## en-US` 分节
    const sectionOf = (lang) => {
      const re = new RegExp(`^## ${lang}\\s*$`, 'm');
      const hit = re.exec(body);
      if (!hit) return lang === 'zh-CN' ? body : '';
      const next = /^## (zh-CN|en-US)\s*$/m.exec(body.slice(hit.index + hit[0].length));
      const end = next ? hit.index + hit[0].length + next.index : body.length;
      return body.slice(hit.index + hit[0].length, end).trim();
    };
    guides.push({
      slug,
      title: bilingualOf(meta, 'title', slug, slug),
      order: Number.isFinite(Number(meta.order)) ? Number(meta.order) : Number.MAX_SAFE_INTEGER,
      body: { zh: sectionOf('zh-CN'), en: sectionOf('en-US') || sectionOf('zh-CN') },
    });
  }
  guides.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return guides;
}

// ---------------------------------------------------------------------------
// 渲染
// ---------------------------------------------------------------------------

/** 组件文档拆分：代码演示之前的 intro / 之后的 rest（API、FAQ…）。 */
function splitDocBody(body) {
  const m = DEMO_SECTION_RE.exec(body);
  if (!m) return { intro: body.trim(), rest: '' };
  const restStart = body.indexOf(m[0], m.index);
  const intro = body.slice(0, m.index).trim();
  const rest = body.slice(restStart + m[0].length).trim();
  return { intro, rest };
}

async function renderComponentDocs(comp) {
  const out = {};
  for (const lang of ['zh', 'en']) {
    const body = comp.body[lang];
    const { intro, rest } = splitDocBody(body);
    const introR = await renderDocWithToc(intro || '', { currentPathPrefix: '' });
    const restR = rest ? await renderDocWithToc(rest) : { html: '', toc: [] };
    out[lang] = {
      introHtml: introR.html,
      restHtml: restR.html,
      toc: [...introR.toc, ...restR.toc],
    };
  }
  return out;
}

async function renderText(text, prefix = '') {
  const { md } = await (await import('./markdown.mjs')).createMarkdownRenderer({
    currentPathPrefix: prefix,
  });
  return md.render(text);
}

// ---------------------------------------------------------------------------
// 更新日志（git log 是真源；没有 tag，就按日期分组）
// ---------------------------------------------------------------------------

function buildChangelog() {
  const out = execFileSync('git', [
    '-C',
    REPO_ROOT,
    'log',
    '--date=short',
    '--pretty=%H%x09%ad%x09%s',
    '-n',
    '600',
  ])
    .toString()
    .trim();
  const days = new Map();
  for (const line of out.split('\n')) {
    const [hash, date, subject] = line.split('\t');
    if (!hash || !subject) continue;
    if (!days.has(date)) days.set(date, []);
    const type = /^(feat|fix|perf|docs|refactor|test|build|chore|ci|style)(\([^)]*\))?[:!]/.exec(
      subject,
    );
    days.get(date).push({
      hash,
      type: type ? type[1] : 'other',
      scope: type?.[2] ? type[2].slice(1, -1) : '',
      subject,
    });
  }
  return [...days.entries()].map(([date, commits]) => ({ date, commits }));
}

// ---------------------------------------------------------------------------
// 搜索索引
// ---------------------------------------------------------------------------

function buildSearchIndex(manifest, pageData) {
  const docs = [];
  for (const c of manifest.components) {
    const full = pageData[c.name];
    docs.push({
      type: 'component',
      id: c.id,
      component: c.name,
      title: c.title,
      subtitle: c.subtitle,
      text: { zh: c.category, en: c.category },
      route: { zh: `/components/${c.name}`, en: `/components/${c.name}` },
    });
    for (const d of full?.demos ?? []) {
      docs.push({
        type: 'demo',
        id: d.id,
        component: c.name,
        demo: d.name,
        title: d.title,
        text: { zh: d.desc.zh, en: d.desc.en },
        route: { zh: `/components/${c.name}`, en: `/components/${c.name}` },
        anchor: `demo-${d.name}`,
      });
    }
  }
  for (const g of manifest.guides) {
    docs.push({
      type: 'guide',
      id: g.slug,
      title: g.title,
      text: { zh: '', en: '' },
      route: { zh: `/guide/${g.slug}`, en: `/guide/${g.slug}` },
    });
  }
  return docs;
}

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

export async function buildManifest({ write = true } = {}) {
  // ⚠️ notes/problems 是模块级数组，而 vite.config 里 includedRoutes 与 onFinished
  // 会各自再调用一次本函数 —— 不复位就会把同一条提示累积打印成几十条重复项。
  notes.length = 0;
  problems.length = 0;

  const scanned = scanComponents();
  const guides = scanGuides();

  // 文档 HTML + demo 源码 → 每组件一个懒加载 chunk
  const pageData = {};
  for (const comp of scanned) {
    const doc = await renderComponentDocs(comp);
    const demoMetas = [];
    for (const d of comp.demos) {
      demoMetas.push({
        id: d.id,
        component: d.component,
        name: d.name,
        order: d.order,
        title: d.title,
        desc: d.desc,
        descHtml: {
          zh: await renderText(d.desc.zh || '', '../'),
          en: await renderText(d.desc.en || '', '../'),
        },
        iframe: d.iframe,
        sources: await Promise.all(
          collectDemoSources(d.vuePath).map(async (s) => ({
            ...s,
            codeHtml: await highlightCode(s.code, s.lang),
          })),
        ),
        githubPath: d.relVuePath,
      });
    }
    pageData[comp.name] = {
      name: comp.name,
      pascal: comp.pascal,
      imports: comp.imports,
      category: comp.category,
      title: comp.title,
      subtitle: comp.subtitle,
      doc,
      demos: demoMetas,
      githubDir: `${REPO_URL}/tree/master/${comp.relDir}`,
    };
  }

  const guidePages = {};
  for (const g of guides) {
    guidePages[g.slug] = {
      slug: g.slug,
      title: g.title,
      doc: {
        zh: await renderDocWithToc(g.body.zh || ''),
        en: await renderDocWithToc(g.body.en || ''),
      },
    };
  }

  // 导航清单（不含正文，保持小体积）
  const categories = new Map();
  for (const c of scanned) {
    if (!categories.has(c.category)) categories.set(c.category, []);
    categories.get(c.category).push({
      name: c.name,
      title: c.title,
      subtitle: c.subtitle,
      demoCount: c.demos.length,
    });
  }
  const nav = [...categories.entries()]
    .sort(([a], [b]) => compareCategories(a, b))
    .map(([name, items]) => ({
      name,
      components: items.sort((a, b) =>
        (a.title.zh || a.name).localeCompare(b.title.zh || b.name),
      ),
    }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    repoUrl: REPO_URL,
    apolloVersion: JSON.parse(
      fs.readFileSync(nodePath.resolve(REPO_ROOT, 'packages/ui/package.json'), 'utf8'),
    ).version,
    antdTarget: '6.6.4',
    categories: nav,
    components: scanned.map((c) => ({
      name: c.name,
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      demoCount: c.demos.length,
    })),
    guides: guides.map((g) => ({ slug: g.slug, title: g.title, order: g.order })),
  };

  const search = buildSearchIndex(manifest, pageData);

  if (problems.length > 0) {
    console.error(`\n❌ 内容管线校验失败（${problems.length} 项）：\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error('');
  }
  if (notes.length > 0) {
    console.log(`ℹ️ 内容管线规范化提示（${notes.length} 项，不拦构建）：`);
    for (const n of notes) console.log(`  · ${n}`);
  }

  if (write) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(nodePath.join(OUT_DIR, 'docs'), { recursive: true });
    fs.mkdirSync(nodePath.join(OUT_DIR, 'guides'), { recursive: true });
    fs.writeFileSync(nodePath.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest));
    fs.writeFileSync(nodePath.join(OUT_DIR, 'search.json'), JSON.stringify(search));
    fs.writeFileSync(
      nodePath.join(OUT_DIR, 'changelog.json'),
      JSON.stringify({ generatedAt: manifest.generatedAt, days: buildChangelog() }),
    );
    for (const [name, data] of Object.entries(pageData)) {
      fs.writeFileSync(
        nodePath.join(OUT_DIR, 'docs', `${name}.json`),
        JSON.stringify(data),
      );
    }
    for (const [slug, data] of Object.entries(guidePages)) {
      fs.writeFileSync(nodePath.join(OUT_DIR, 'guides', `${slug}.json`), JSON.stringify(data));
    }
    console.log(
      `✅ 内容管线：${scanned.length} 组件 / ${Object.values(pageData).reduce((n, c) => n + c.demos.length, 0)} demo / ${guides.length} 指南 → .generated/`,
    );
  }

  return {
    ok: problems.length === 0,
    problems,
    notes,
    manifest,
    pageData,
    guidePages,
    search,
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const checkOnly = process.argv.includes('--check');
  // --if-missing：产物齐全就跳过（本地反复跑 test / dev 时可省掉 ~25s 全量重扫）。
  // 注意这只是**跳过重建**，不是跳过校验 —— 校验请用 --check。
  const ifMissing = process.argv.includes('--if-missing');
  if (ifMissing && fs.existsSync(nodePath.join(OUT_DIR, 'manifest.json'))) {
    console.log('ℹ️ .generated/ 已存在，--if-missing 跳过重建');
    process.exit(0);
  }
  const result = await buildManifest({ write: !checkOnly });
  if (checkOnly) {
    console.log(
      result.ok
        ? `✅ 内容校验通过：${result.manifest.components.length} 组件`
        : `❌ 内容校验失败（${result.problems.length} 项）`,
    );
  }
  process.exit(result.ok ? 0 : 1);
}
