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
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compareCategories } from './categories.mjs';
import { collectDemoSources } from './demo-source.mjs';
import { bilingualOf, localeOf, normalizeText, parseFrontmatter } from './frontmatter.mjs';
import { highlightCode, renderDocWithToc } from './markdown.mjs';

const HERE = nodePath.dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = nodePath.resolve(HERE, '../..');
export const REPO_ROOT = nodePath.resolve(DOCS_DIR, '../..');
const UI_SRC = nodePath.resolve(REPO_ROOT, 'packages/ui/src');
const ICONS_SRC = nodePath.resolve(REPO_ROOT, 'packages/icons/src/icons');
const OUT_DIR = nodePath.resolve(DOCS_DIR, '.generated');
const GUIDE_SRC = nodePath.resolve(DOCS_DIR, 'content/guide');
const REPO_URL = 'https://github.com/apollocmh/apollo-design-ui';

const DEMO_SECTION_RE = /^## (代码演示|代码示例|Examples?|Demos?)\s*$/im;

// 分类名的英文映射（与 src/composables/locale.ts 的 CATEGORY_EN 保持同步）。
// 搜索索引必须给出英文 text，否则英文站搜「Data Entry」搜不到任何组件。
const CATEGORY_EN = {
  通用: 'General',
  布局: 'Layout',
  导航: 'Navigation',
  数据录入: 'Data Entry',
  数据展示: 'Data Display',
  反馈: 'Feedback',
  其他: 'Other',
};

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
    for (const m of src.matchAll(re)) {
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

  // ── 预览模式（DOC-01 / DOC-11）─────────────────────────────────────────
  // 新写法：frontmatter `preview: { mode: viewport, viewportHeight: 320, scrollable: true }`
  // 旧写法：`iframe: true` ⇒ isolated（兼容存量 demo，不做批量迁移）。
  const previewRaw = meta.preview && typeof meta.preview === 'object' ? meta.preview : {};
  const allowedModes = new Set(['inline', 'isolated', 'viewport']);
  const previewMode = allowedModes.has(previewRaw.mode)
    ? previewRaw.mode
    : meta.iframe === true
      ? 'isolated'
      : 'inline';
  if (previewRaw.mode !== undefined && !allowedModes.has(previewRaw.mode)) {
    throw new Error(
      `${componentName}/demo/${name}：preview.mode 必须是 inline / isolated / viewport，实际「${previewRaw.mode}」`,
    );
  }
  const positive = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  // V3：画布档位 / 栅格跨度是**展示元数据**（不改变组件本身）。非法值直接报错，
  // 避免拼写错误静默退回默认档位、看起来「声明了但没生效」。
  const allowedSizes = new Set(['compact', 'interactive', 'full']);
  if (previewRaw.size !== undefined && !allowedSizes.has(previewRaw.size)) {
    throw new Error(
      `${componentName}/demo/${name}：preview.size 必须是 compact / interactive / full，实际「${previewRaw.size}」`,
    );
  }
  const spanRaw = previewRaw.span;
  const allowedSpans = new Set([1, 2, 'full']);
  if (spanRaw !== undefined && !allowedSpans.has(spanRaw)) {
    throw new Error(
      `${componentName}/demo/${name}：preview.span 必须是 1 / 2 / full，实际「${spanRaw}」`,
    );
  }
  const preview = {
    mode: previewMode,
    size: previewRaw.size,
    span: spanRaw,
    viewportHeight: positive(previewRaw.viewportHeight),
    scrollable: previewRaw.scrollable === true,
    minHeight: positive(previewRaw.minHeight),
  };

  return {
    id: `${componentName}-demo-${name}`,
    component: componentName,
    name,
    order,
    title: bilingualOf(meta, 'title', name, name),
    desc: { zh: zhDesc, en: enDesc || zhDesc, enFallback: !enDesc },
    iframe: previewMode !== 'inline',
    preview,
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

  // 导航主副标题契约（2026-10-21 审计 A02）：
  //   title    = 技术组件名（如 Table），不得混中文；
  //   subtitle = 简体中文说明（如 表格），导航/总览据此渲染次级文字。
  // 英文文档允许独立 subtitle；但 title 同样只能是技术名。
  const zhTitle = localeOf(zhMeta, 'title', '');
  const zhSubtitle = localeOf(zhMeta, 'subtitle', '');
  const enTitle = localeOf(enMeta, 'title', '');
  assert(zhTitle.trim() !== '', `${name}：frontmatter 缺少 title`);
  assert(
    !/[一-鿿]/.test(zhTitle),
    `${name}：title 只能放技术名（中文说明放 subtitle），实际「${zhTitle}」`,
  );
  assert(zhSubtitle.trim() !== '', `${name}：frontmatter 缺少 subtitle（中文说明）`);
  assert(!/[一-鿿]/.test(enTitle), `${name}：en-US title 含中文「${enTitle}」`);

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
    if (entry.name.startsWith('_') || entry.name === '__tests__' || entry.name === 'style')
      continue;
    const hasDoc = fs.existsSync(nodePath.join(UI_SRC, entry.name, 'index.zh-CN.md'));
    if (!hasDoc) continue;
    components.push(scanComponentDir(entry));
  }
  components.sort((a, b) => a.name.localeCompare(b.name));
  return components;
}

/**
 * 图标目录清单（2026-10-21 审计 A13）。
 *
 * 只读文件名 + 后缀，不 import 848 个生成组件 —— 文档站首屏不能为此加载全量 JS。
 * 风格直接由真实导出名后缀判定（Outlined / Filled / TwoTone），不臆造上游分组。
 */
export function scanIcons() {
  if (!fs.existsSync(ICONS_SRC)) {
    return { total: 0, byStyle: { outlined: 0, filled: 0, twoTone: 0 }, items: [] };
  }
  const items = fs
    .readdirSync(ICONS_SRC)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => {
      const name = f.slice(0, -3);
      const style = name.endsWith('TwoTone')
        ? 'twoTone'
        : name.endsWith('Filled')
          ? 'filled'
          : 'outlined';
      return { name, style };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const byStyle = { outlined: 0, filled: 0, twoTone: 0 };
  for (const item of items) byStyle[item.style] += 1;
  return { total: items.length, byStyle, items };
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

/** 历史遗留的 demo 引用标记：`<code src="./demo/x.vue"></code>`（可带内联文案）。 */
const LEGACY_DEMO_CODE_RE = /^\s*<code\s+src="[^"]*"[^>]*>.*<\/code>\s*$/;
/** 任意级 markdown 标题（捕获组给层级）。 */
const ANY_HEADING_RE = /^(#{1,6})\s+\S/;
/** 三级及以下标题（demo 小节用的层级）。 */
const SUB_HEADING_RE = /^(#{3,})\s+\S/;

/**
 * 清掉历史遗留的 demo 引用标记（2026-10-17）。
 *
 * 站点的代码演示由 `demo/*.md`（标题 / 顺序 / 说明）+ `demo/*.vue` 渲染
 * （见 scanComponentDir），`index.*.md` 里 `### 标题` + `<code src="…">` 这套
 * 标记对渲染毫无贡献；但 markdown 会把它直出成「只有标题、正文为空」的小节，
 * 浮在演示网格与 API 之间 ⇒ 页面底部出现一整列与演示卡片**重复**的标题
 * （实测 popconfirm / tabs / tree / input 等 14 个组件中招）。
 *
 * 规则：① 丢掉代码引用行；② 丢掉删完之后**正文为空**的小节标题（下一行仍是标题
 * 或已到文末）。
 *
 * ⚠️ 不能整段丢掉 `## 代码演示` 区块 —— 多数组件的该区块里还有
 * 「见 demo/（13 个…）+ 一览表格」这类正文，那是刻意保留的内容。
 */
export function stripLegacyDemoRefs(body) {
  const lines = String(body)
    .split('\n')
    .filter((line) => !LEGACY_DEMO_CODE_RE.test(line));
  // HTML 注释在渲染结果里不可见 ⇒ 判断「本节有没有正文」时当它不存在
  // （date-picker 的 `### 基本` 下面只剩一段 TODO 注释，不这样就漏网）。
  const invisible = lines.map(() => false);
  let inComment = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (inComment) {
      invisible[i] = true;
      if (line.includes('-->')) inComment = false;
      continue;
    }
    if (line.includes('<!--')) {
      invisible[i] = true;
      if (!line.includes('-->', line.indexOf('<!--') + 4)) inComment = true;
    }
  }
  const hasContent = (i) => lines[i].trim() !== '' && !invisible[i];
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const h = SUB_HEADING_RE.test(line) ? ANY_HEADING_RE.exec(line) : null;
    if (h) {
      const level = h[1].length;
      const nextIdx = lines.findIndex((_, j) => j > i && hasContent(j));
      const next = nextIdx === -1 ? undefined : lines[nextIdx];
      const nextH = next ? ANY_HEADING_RE.exec(next) : null;
      // 下一个可见行是「同级或更高级」标题 ⇒ 本节既无正文也无子节 ⇒ 纯 demo 索引，丢。
      // ⚠️ 下一个标题**更深**（如 `### Space` 下面是 `#### Props`）说明是父子结构，保留；
      //    文末没有下一行时也保留（宁可多留，不要吃掉正文开头的标题）。
      if (nextH && nextH[1].length <= level) continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/** 组件文档拆分：代码演示之前的 intro / 之后的 rest（API、FAQ…）。 */
function splitDocBody(body) {
  const src = stripLegacyDemoRefs(body);
  const m = DEMO_SECTION_RE.exec(src);
  if (!m) return { intro: src.trim(), rest: '' };
  const restStart = src.indexOf(m[0], m.index);
  const intro = src.slice(0, m.index).trim();
  const rest = src.slice(restStart + m[0].length).trim();
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
      text: { zh: c.category, en: CATEGORY_EN[c.category] ?? c.category },
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
        preview: d.preview,
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
      components: items.sort((a, b) => (a.title.zh || a.name).localeCompare(b.title.zh || b.name)),
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
    icons: scanIcons(),
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
      fs.writeFileSync(nodePath.join(OUT_DIR, 'docs', `${name}.json`), JSON.stringify(data));
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
// ⚠️ Windows 上 process.argv[1] 是 `D:\…`，拼成 `file://D:\…` 永远不等于
// import.meta.url ⇒ CLI 静默不执行（2026-10-21 实测：docs build 用的仍是旧
// manifest）。必须走 pathToFileURL。
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
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
