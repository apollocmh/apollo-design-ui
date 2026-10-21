/**
 * 内容管线产物（.generated/）与路由的一致性测试。
 *
 * 这一层不测「怎么生成」，只测「生成出来的东西能不能被站点正确消费」：
 * 组件/示例数量、ID 唯一性、分类归属、TOC 锚点、双语字段类型、站内链接可达。
 * 任何一条漂移都会直接变成页面上的空白、错链或崩溃。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import manifest from '../.generated/manifest.json';
import search from '../.generated/search.json';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATED = path.resolve(HERE, '../.generated');

const readPage = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(GENERATED, 'docs', `${name}.json`), 'utf8'));
const readGuide = (slug: string) =>
  JSON.parse(fs.readFileSync(path.join(GENERATED, 'guides', `${slug}.json`), 'utf8'));

const pages = manifest.components.map((c) => ({ meta: c, data: readPage(c.name) }));
const allDemos = pages.flatMap((p) => p.data.demos);

describe('manifest 骨架', () => {
  it('组件与指南都有产出', () => {
    expect(manifest.components.length).toBe(72);
    expect(manifest.guides.length).toBe(7);
  });

  it('组件 name / id 唯一', () => {
    const names = manifest.components.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    const ids = manifest.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个组件恰好归属一个分类（不重不漏）', () => {
    const listed = manifest.categories.flatMap((c) => c.components.map((x) => x.name));
    expect(listed.length).toBe(manifest.components.length);
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('分类按固定序排列，且分类名已知', () => {
    const order = ['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他'];
    expect(manifest.categories.map((c) => c.name)).toEqual(
      order.filter((o) => manifest.categories.some((c) => c.name === o)),
    );
    for (const c of manifest.categories) expect(order).toContain(c.name);
  });

  it('分类里的 demoCount 与页面数据一致', () => {
    for (const cat of manifest.categories) {
      for (const entry of cat.components) {
        const page = pages.find((p) => p.meta.name === entry.name)!;
        expect(entry.demoCount, `${entry.name} demoCount`).toBe(page.data.demos.length);
      }
    }
  });

  it('导航主副标题契约：title 是技术名，中文 subtitle 非空', () => {
    for (const c of manifest.components) {
      expect(c.title.zh, `${c.name} title.zh`).not.toMatch(/[一-鿿]/);
      expect(c.title.en, `${c.name} title.en`).not.toMatch(/[一-鿿]/);
      expect(c.subtitle.zh.trim(), `${c.name} subtitle.zh`).not.toBe('');
    }
  });
});

describe('图标目录（独立资源，不计入 72 组件）', () => {
  it('848 个图标，Outlined / Filled / TwoTone 计数正确', () => {
    expect(manifest.icons.total).toBe(848);
    expect(manifest.icons.byStyle).toEqual({ outlined: 447, filled: 251, twoTone: 150 });
    expect(manifest.icons.items.length).toBe(848);
    expect(new Set(manifest.icons.items.map((i) => i.name)).size).toBe(848);
  });

  it('不把 icon 混进 UI 组件清单 / 分类导航', () => {
    expect(manifest.components.some((c) => c.name === 'icon')).toBe(false);
    expect(manifest.categories.flatMap((c) => c.components).some((c) => c.name === 'icon')).toBe(
      false,
    );
  });
});

describe('组件页数据', () => {
  it('每个组件都有正文，且正文总量不被截断', () => {
    for (const p of pages) {
      const zh = p.data.doc.zh.introHtml + p.data.doc.zh.restHtml;
      const en = p.data.doc.en.introHtml + p.data.doc.en.restHtml;
      // intro 是「代码演示」之前的部分，短是正常的（affix 只有一句话）；
      // 真正要防的是**整篇被吞掉** —— 所以看总量。
      expect(zh.length, `${p.meta.name} 中文正文`).toBeGreaterThan(500);
      expect(en.length, `${p.meta.name} 英文正文`).toBeGreaterThan(500);
    }
  });

  it('TOC 锚点在同一篇文档内唯一', () => {
    for (const p of pages) {
      for (const lang of ['zh', 'en'] as const) {
        const ids = p.data.doc[lang].toc.map((t: { id: string }) => t.id);
        expect(new Set(ids).size, `${p.meta.name}/${lang} TOC`).toBe(ids.length);
        for (const id of ids) expect(id.length).toBeGreaterThan(0);
      }
    }
  });

  // 🚨 真缺陷回归：标题里写 `<a> 与 <button> 的禁用不对称` 时，slug 曾原样保留标签
  // ⇒ 锚点 id 变成 `<a>-与-<button>-…`，既脏又要在 href 里二次转义。
  it('锚点 id 不含 HTML 标签 / 引号 / 尖括号', () => {
    for (const p of pages) {
      for (const lang of ['zh', 'en'] as const) {
        for (const t of p.data.doc[lang].toc as Array<{ id: string; text: string }>) {
          expect(t.id, `${p.meta.name}/${lang}`).not.toMatch(/[<>"'/\\]/);
          expect(t.text).not.toMatch(/<[a-z/]/i);
        }
      }
    }
  });

  it('正文里的锚点 id 与 TOC 对得上（锚点不是死链）', () => {
    for (const p of pages.slice(0, 12)) {
      const ids = p.data.doc.zh.toc.map((t: { id: string }) => t.id);
      const html = p.data.doc.zh.introHtml + p.data.doc.zh.restHtml;
      for (const id of ids) expect(html, `${p.meta.name}: ${id}`).toContain(`id="${id}"`);
    }
  });

  it('正文里不留历史遗留的 <code src="…"> demo 引用标记', () => {
    // 演示卡片由 demo/*.md + demo/*.vue 渲染；这些标记对页面零贡献，却会被 markdown
    // 直出成「只有标题、没有正文」的小节 ⇒ 页面底部出现一整列与卡片重复的标题
    // （2026-10-17 实测 14 个组件中招）。生成期由 stripLegacyDemoRefs 清掉。
    for (const p of pages) {
      for (const lang of ['zh', 'en'] as const) {
        const html = p.data.doc[lang].introHtml + p.data.doc[lang].restHtml;
        expect(html, `${p.meta.name}.${lang}`).not.toContain('<code src=');
      }
    }
  });

  it('每个组件都给出了可用的 import 名字（页面据此拼 import 语句）', () => {
    for (const p of pages) {
      const names: string[] = Array.isArray(p.data.imports)
        ? p.data.imports
        : String(p.data.imports).split(',');
      expect(names.length, `${p.meta.name} imports`).toBeGreaterThan(0);
      for (const n of names) expect(n, `${p.meta.name}`).toMatch(/^[A-Za-z_$][\w$]*$/);
      expect(`import { ${names.join(', ')} } from '@apollo-design/ui';`).toMatch(
        /@apollo-design\/ui/,
      );
    }
  });
});

describe('demo 元数据', () => {
  it('demo 全量可枚举（881 个）', () => {
    expect(allDemos.length).toBe(881);
  });

  it('demo id 全局唯一 —— id 同时是锚点与搜索主键', () => {
    const ids = allDemos.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个 demo 至少有一个主源码文件，且内容非空', () => {
    for (const d of allDemos) {
      const main = d.sources.find((s: { main: boolean }) => s.main);
      expect(main, `${d.id} 缺主源码`).toBeTruthy();
      expect(main.code.length, `${d.id} 源码为空`).toBeGreaterThan(20);
    }
  });

  it('每个 demo 都给出 GitHub 源码路径（相对仓库根，不以 / 开头）', () => {
    for (const d of allDemos) {
      expect(d.githubPath, d.id).toMatch(/^packages\/ui\/src\//);
    }
  });

  it('demo 按 order 升序排列，order 缺失时也有确定值', () => {
    for (const p of pages) {
      const orders = p.data.demos.map((d: { order: number }) => d.order);
      for (const o of orders) expect(typeof o).toBe('number');
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    }
  });

  it('双语标题一律是字符串（YAML 数字标量必须已归一化）', () => {
    for (const d of allDemos) {
      expect(typeof d.title.zh, `${d.id}.zh`).toBe('string');
      expect(typeof d.title.en, `${d.id}.en`).toBe('string');
    }
  });
});

// 路由集合提到 describe 外层：搜索索引的路由校验要用同一份，
// 各自维护一份「已知路由」就会漂移。
const staticRoutes = new Set(['/', '/components', '/components/icon', '/changelog', '/guide']);
const componentRoutes = new Set(manifest.components.map((c) => `/components/${c.name}`));
const guideRoutes = new Set(manifest.guides.map((g) => `/guide/${g.slug}`));
const allRoutes = new Set([...staticRoutes, ...componentRoutes, ...guideRoutes]);

describe('站内链接可达性（不许静默死链）', () => {
  it('正文与示例说明里的站内链接都指向真实路由', () => {
    const offenders: string[] = [];
    for (const p of pages) {
      const html = p.data.doc.zh.introHtml + p.data.doc.zh.restHtml + p.data.doc.en.introHtml;
      for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
        const href = m[1]!;
        if (href.startsWith('/assets') || href === '/apollo-design-ui/') continue;
        if (staticRoutes.has(href) || componentRoutes.has(href) || guideRoutes.has(href)) continue;
        offenders.push(`${p.meta.name}: ${href}`);
      }
    }
    expect(offenders, `死链 ${offenders.length} 条：${offenders.slice(0, 8).join(', ')}`).toEqual(
      [],
    );
  });

  it('外链一律带 target=_blank + rel=noopener', () => {
    for (const p of pages.slice(0, 15)) {
      const html = p.data.doc.zh.introHtml + p.data.doc.zh.restHtml;
      for (const m of html.matchAll(/<a [^>]*href="(https?:\/\/[^"]*)"[^>]*>/g)) {
        expect(m[0]).toMatch(/rel="[^"]*noopener/);
      }
    }
  });
});

describe('搜索索引', () => {
  it('每条记录的文本字段都是字符串', () => {
    for (const doc of search) {
      expect(typeof doc.title?.zh, doc.id).toBe('string');
      expect(typeof doc.title?.en, doc.id).toBe('string');
      if (doc.text) {
        expect(typeof doc.text.zh).toBe('string');
        expect(typeof doc.text.en).toBe('string');
      }
    }
  });

  it('英文搜索文本使用英文分类名（不再原样展示中文）', () => {
    const button = search.find((d: { id: string }) => d.id === 'button');
    expect(button?.text.en).toBe('General');
    const table = search.find((d: { id: string }) => d.id === 'table');
    expect(table?.text.en).toBe('Data Display');
  });

  it('每条记录的路由指向真实页面', () => {
    for (const doc of search) {
      expect(allRoutes.has(doc.route.zh), `${doc.id} zh 路由 ${doc.route.zh}`).toBe(true);
      expect(allRoutes.has(doc.route.en), `${doc.id} en 路由 ${doc.route.en}`).toBe(true);
    }
  });

  it('指南也被索引（不只是组件）', () => {
    expect(search.some((d: { type: string }) => d.type === 'guide')).toBe(true);
    expect(search.some((d: { type: string }) => d.type === 'component')).toBe(true);
    expect(search.some((d: { type: string }) => d.type === 'demo')).toBe(true);
  });
});

describe('指南', () => {
  it('每篇指南都有正文与 TOC', () => {
    for (const g of manifest.guides) {
      const data = readGuide(g.slug);
      // 指南不切 intro/rest（没有「代码演示」分隔），正文整体在 doc.<lang>.html
      // 指南的 en 段允许比 zh 短（tree-shaking 的英文版确实更精炼），
      // 但只要**存在**就必须被渲染出来 —— 空字符串才是缺译文。
      expect(data.doc.zh.html.length, `${g.slug} 中文正文`).toBeGreaterThan(500);
      expect(data.doc.en.html.length, `${g.slug} 英文正文`).toBeGreaterThan(300);
      expect(data.doc.zh.toc.length, `${g.slug} TOC`).toBeGreaterThan(0);
    }
  });

  it('兼容性指南注入的是仓库真源（不是副本）', () => {
    const data = readGuide('compatibility');
    expect(String(data.doc.zh.html)).toMatch(/COMPATIBILITY|兼容性/);
  });
});
