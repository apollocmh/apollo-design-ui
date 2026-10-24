/**
 * 全量示例审计 + 路由契约。
 *
 * 「某个 demo 打不开」是最容易被漏掉的一类缺陷：组件页整页照常渲染，
 * 只有那一张卡片停在「加载失败」。这里做的是**全量**核对，而不是抽样。
 *
 * 路由部分钉的是深链接契约：/components/<name>、/components/<name>/demo/<demo>、
 * /guide/<slug> 必须各自命中，未知路径落到 404 —— GitHub Pages 上刷新即失效是
 * 文档站最典型的线上事故。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import manifest from '../.generated/manifest.json';
import DemoFrame from '../src/components/demo/DemoFrame.vue';
import { routes } from '../src/router';
import type { DemoMeta } from '../src/types/manifest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_SRC = path.resolve(HERE, '../../ui/src');

const pageOf = (name: string) =>
  JSON.parse(fs.readFileSync(path.resolve(HERE, `../.generated/docs/${name}.json`), 'utf8'));

const allDemos: Array<{ component: string; demo: DemoMeta }> = manifest.components.flatMap(
  (c: { name: string }) =>
    (pageOf(c.name).demos as DemoMeta[]).map((d) => ({ component: c.name, demo: d })),
);

describe('全量 demo 审计', () => {
  // 阶段 2 补齐后 758 → 881，2026-10-21 余量补齐后 → 989；F01 新增标签/输入属性示例后 → 990，F02 条件选项示例后 → 991；新增 demo 时同步更新此数（它是管线重复/漏收的哨兵）。
  it('数量与管线口径一致（999）', () => {
    expect(allDemos.length).toBe(999);
    expect(allDemos.some(({ demo }) => demo.id === 'steps-demo-native-slots')).toBe(true);
    expect(allDemos.some(({ demo }) => demo.id === 'timeline-demo-native-slots')).toBe(true);
    expect(allDemos.some(({ demo }) => demo.id === 'pagination-demo-native-slots')).toBe(true);
    expect(allDemos.some(({ demo }) => demo.id === 'breadcrumb-demo-scoped-item')).toBe(true);
    expect(allDemos.some(({ demo }) => demo.id === 'tabs-demo-popup-render')).toBe(true);
  });

  it('预览模式合法；FloatButton / BackTop 的 fixed 场景使用 viewport', () => {
    const modes = new Set(['inline', 'isolated', 'viewport']);
    for (const { component, demo } of allDemos) {
      expect(demo.preview, `${component}/${demo.name}`).toBeTruthy();
      expect(modes.has(demo.preview.mode), `${component}/${demo.name}`).toBe(true);
    }
    const viewportDemos = allDemos
      .filter(({ demo }) => demo.preview.mode === 'viewport')
      .map(({ component, demo }) => `${component}/${demo.name}`);
    expect(viewportDemos).toContain('float-button/basic');
    expect(viewportDemos).toContain('float-button/group');
    expect(viewportDemos).toContain('back-top/basic');
  });

  it('每个 demo 的 .vue 文件真实存在（渲染器 glob 一定命中）', () => {
    const missing = allDemos
      .filter(
        ({ component, demo }) =>
          !fs.existsSync(path.join(UI_SRC, component, 'demo', `${demo.name}.vue`)),
      )
      .map(({ component, demo }) => `${component}/${demo.name}`);
    expect(missing, `缺失 ${missing.length} 个：${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('每个 demo 都有说明 .md（标题与描述来自它）', () => {
    const missing = allDemos
      .filter(
        ({ component, demo }) =>
          !fs.existsSync(path.join(UI_SRC, component, 'demo', `${demo.name}.md`)),
      )
      .map(({ component, demo }) => `${component}/${demo.name}`);
    expect(missing).toEqual([]);
  });

  it('每个 demo 都有非空标题（不显示成空白卡片）', () => {
    const blank = allDemos
      .filter(({ demo }) => !demo.title?.zh?.trim())
      .map(({ component, demo }) => `${component}/${demo.name}`);
    expect(blank).toEqual([]);
  });

  it('每个 demo 的源码都已完成 import 改写（用户复制即可用）', () => {
    const offenders = allDemos
      .flatMap(({ component, demo }) =>
        demo.sources.map((s: { code: string }) => ({
          id: `${component}/${demo.name}`,
          code: s.code,
        })),
      )
      .filter(({ code }) => /from\s+['"](\.\.\/){2,}index['"]/.test(code))
      .map(({ id }) => id);
    expect(offenders).toEqual([]);
  });

  it('每个组件至少有一个 demo（空组件页没有意义）', () => {
    for (const c of manifest.components as Array<{ name: string }>) {
      expect(pageOf(c.name).demos.length, c.name).toBeGreaterThan(0);
    }
  });
});

describe('路由契约（深链接）', () => {
  const router = createRouter({ history: createMemoryHistory(), routes });

  it('首页 / 总览 / 更新日志', () => {
    expect(router.resolve('/').name).toBe('home');
    expect(router.resolve('/components').name).toBe('overview');
    expect(router.resolve('/changelog').name).toBe('changelog');
  });

  it('组件详情：每个组件都能解析到（不是 404）', () => {
    for (const c of manifest.components as Array<{ name: string }>) {
      expect(router.resolve(`/components/${c.name}`).name, c.name).toBe('component');
    }
  });

  it('独立示例页：/components/:name/demo/:demo', () => {
    const r = router.resolve('/components/button/demo/basic');
    expect(r.name).toBe('standalone-demo');
    expect(r.params).toMatchObject({ name: 'button', demo: 'basic' });
  });

  // 注意：redirect 发生在**导航**阶段，router.resolve 不会展开它 ——
  // 断言 resolve('/guide').redirect 会因为没有该字段而假失败。
  it('/guide 导航后落到第一篇，/guide/:slug 命中', async () => {
    for (const g of manifest.guides as Array<{ slug: string }>) {
      expect(router.resolve(`/guide/${g.slug}`).name, g.slug).toBe('guide');
    }
    const nav = createRouter({ history: createMemoryHistory(), routes });
    await nav.push('/guide');
    await nav.isReady();
    expect(nav.currentRoute.value.path).toBe('/guide/getting-started');
  });

  it('未知路径落到 404（不是首页也不是空白）', () => {
    expect(router.resolve('/no-such-page').name).toBe('not-found');
    expect(router.resolve('/components/no-such-component/deep').name).toBe('not-found');
  });

  it('每个组件页都产出物理文件所需的静态路径（SSG 展开依据）', () => {
    // vite.config 的 includedRoutes 依赖 manifest.components/guides 展开；
    // 这两份列表必须与路由参数口径一致，否则产物会缺页。
    const names = (manifest.components as Array<{ name: string }>).map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(router.resolve(`/components/${n}`).params.name).toBe(n);
  });
});

describe('iframe 隔离预览', () => {
  it('src 带 base 前缀（子路径部署下不会 404）', () => {
    const { component, demo } = allDemos[0]!;
    const wrapper = mount(DemoFrame, { props: { demo }, attachTo: document.body });
    const src = wrapper.find('iframe').attributes('src')!;
    expect(src).toContain(`/components/${component}/demo/${demo.name}`);
    expect(src).toContain('embed=1');
    // 必须以 base（或 /）开头 —— 曾经写死 `/components/...`，子路径部署下必然 404
    expect(src).toMatch(/^(\/apollo-design-ui)?\/components\//);
    expect(wrapper.find('iframe').attributes('title')).toContain('demo:');
    wrapper.unmount();
  });

  it('同源 postMessage 才更新高度（防跨站注入）', async () => {
    const wrapper = mount(DemoFrame, {
      props: { demo: allDemos[0]!.demo },
      attachTo: document.body,
    });
    const el = wrapper.find('iframe').element as HTMLIFrameElement;
    const before = el.style.height;
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'apollo-demo:resize', height: 999 },
        origin: 'https://evil.example',
      }),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(el.style.height).toBe(before);

    // DOC-03：同源之外还必须核对「消息来自当前 iframe」+ frameId。
    const frameId = new URL(el.src, location.href).searchParams.get('frameId') ?? '';
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'apollo-demo:resize', height: 320, frameId },
        origin: location.origin,
        source: el.contentWindow,
      }),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(el.style.height).toBe('320px');
    wrapper.unmount();
  });
});
