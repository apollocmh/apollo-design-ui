/**
 * 示例预览体系：加载 → 失败 → 重试 → 重置 → 复制 → 源码面板。
 *
 * 这些是文档站**最容易静默退化**的交互：加载失败没有兜底、重置没真的重建子树、
 * 复制没有反馈 —— 页面看起来都还在，但用户实际用不了。
 */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import DemoPreview from '../src/components/demo/DemoPreview.vue';
import DemoRenderer from '../src/components/demo/DemoRenderer.vue';
import DemoSource from '../src/components/demo/DemoSource.vue';
import DemoToolbar from '../src/components/demo/DemoToolbar.vue';
import { useSiteLocale } from '../src/composables/locale';
import type { DemoMeta, SourceFile } from '../src/types/manifest';

const sources: SourceFile[] = [
  {
    path: 'basic.vue',
    label: 'basic.vue',
    code: '<template><b/></template>',
    lang: 'vue',
    main: true,
    codeHtml: '<pre>basic</pre>',
  },
  {
    path: '../interface.ts',
    label: '../interface.ts',
    code: 'export interface X {}',
    lang: 'ts',
    main: false,
    codeHtml: '<pre>ts</pre>',
  },
];

const demoMeta: DemoMeta = {
  id: 'button-demo-basic',
  component: 'button',
  name: 'basic',
  order: 0,
  title: { zh: '按钮类型', en: 'Type', enFallback: false },
  desc: { zh: '最简单的用法', en: 'The simplest usage', enFallback: true },
  descHtml: { zh: '<p>最简单的用法</p>', en: '<p>最简单的用法</p>', enFallback: true },
  iframe: false,
  sources,
  githubPath: 'packages/ui/src/button/demo/basic.vue',
} as unknown as DemoMeta;

afterEach(() => {
  vi.restoreAllMocks();
  useSiteLocale().setLocale('zh-CN');
});

/**
 * 轮询等待条件成立。
 *
 * ⚠️ 不能用固定 flushPromises：真实 demo 的动态 import 会拉起整个 @apollo-design/ui
 * 模块图，jsdom 下首次解析实测 ~8s（不是失败，是真的慢）。固定 tick 数会造出
 * 「本地快机器上过、CI 上不过」的红灯 —— 这类红灯会训练人忽略它。
 */
async function waitUntil(predicate: () => boolean, timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await flushPromises();
    if (predicate()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`waitUntil 超时（${timeoutMs}ms）`);
}

describe('DemoRenderer —— 加载 / 失败 / 重试', () => {
  it('未知示例进入 error 态（role=alert）而不是白屏', async () => {
    const wrapper = mount(DemoRenderer, {
      props: { component: 'button', demo: 'no-such-demo' },
      attachTo: document.body,
    });
    await flushPromises();
    const err = wrapper.find('.demo-renderer-error');
    expect(err.exists()).toBe(true);
    expect(err.attributes('role')).toBe('alert');
    expect(err.text()).toContain('button/no-such-demo');
    wrapper.unmount();
  });

  it('error 态提供重试按钮，点击会重新尝试加载', async () => {
    const wrapper = mount(DemoRenderer, {
      props: { component: 'button', demo: 'no-such-demo' },
      attachTo: document.body,
    });
    await flushPromises();
    const btn = wrapper.find('.demo-renderer-error button');
    expect(btn.exists()).toBe(true);
    await btn.trigger('click');
    await flushPromises();
    // 仍然是 error（路径确实不存在），但必须**重新走过加载流程**而不是卡死
    expect(wrapper.find('.demo-renderer-error').exists()).toBe(true);
    wrapper.unmount();
  });

  it('加载中给出 aria-busy 的占位（不是空白）', async () => {
    const wrapper = mount(DemoRenderer, {
      props: { component: 'button', demo: 'basic' },
      attachTo: document.body,
    });
    expect(wrapper.find('.demo-renderer-loading').attributes('aria-busy')).toBe('true');
    expect(wrapper.find('.demo-renderer-loading').text()).toContain('加载中');
    await waitUntil(() => wrapper.find('.demo-renderer-loading').exists() === false);
    expect(wrapper.find('.demo-renderer-error').exists()).toBe(false);
    wrapper.unmount();
  });

  it('真实示例渲染出组件库的 DOM（不是占位层）', async () => {
    const wrapper = mount(DemoRenderer, {
      props: { component: 'button', demo: 'basic' },
      attachTo: document.body,
    });
    await waitUntil(() => wrapper.find('.apollo-btn').exists());
    expect(wrapper.findAll('.apollo-btn').length).toBeGreaterThan(0);
    wrapper.unmount();
  });

  it('resetToken 变化 ⇒ 重新加载，且重建后仍然渲染真实组件', async () => {
    const wrapper = mount(DemoRenderer, {
      props: { component: 'button', demo: 'basic' },
      attachTo: document.body,
    });
    await waitUntil(() => wrapper.find('.apollo-btn').exists());
    await wrapper.setProps({ resetToken: 1 });
    await waitUntil(() => wrapper.find('.apollo-btn').exists());
    expect(wrapper.findAll('.apollo-btn').length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});

describe('DemoToolbar —— 复制反馈', () => {
  it('复制成功：按钮变成「✓ 复制成功」并上报 copied=true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const wrapper = mount(DemoToolbar, {
      props: { demo: demoMeta, expanded: false, standaloneHref: '/x' },
    });
    await wrapper.findAll('.demo-tool-btn')[1]!.trigger('click');
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith(sources.map((s) => s.code).join('\n\n'));
    expect(wrapper.text()).toContain('复制成功');
    expect(wrapper.emitted('copied')?.[0]).toEqual([true]);
  });

  it('复制失败：降级到 execCommand，仍要给出结果而不是静默', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const exec = vi.fn().mockReturnValue(false);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    const wrapper = mount(DemoToolbar, {
      props: { demo: demoMeta, expanded: false, standaloneHref: '/x' },
    });
    await wrapper.findAll('.demo-tool-btn')[1]!.trigger('click');
    await flushPromises();
    expect(exec).toHaveBeenCalledWith('copy');
    expect(wrapper.emitted('copied')?.[0]).toEqual([false]);
  });

  it('展开/收起按钮带 aria-expanded', async () => {
    const wrapper = mount(DemoToolbar, {
      props: { demo: demoMeta, expanded: false, standaloneHref: '/x' },
    });
    expect(wrapper.find('.demo-tool-btn').attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ expanded: true });
    expect(wrapper.find('.demo-tool-btn').attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('收起代码');
  });

  it('「新窗口打开」与 GitHub 链接都是有效外跳', () => {
    const wrapper = mount(DemoToolbar, {
      props: { demo: demoMeta, expanded: false, standaloneHref: '/components/button/demo/basic' },
    });
    const links = wrapper.findAll('a.demo-tool-btn');
    expect(links[0]!.attributes('href')).toBe('/components/button/demo/basic');
    expect(links[0]!.attributes('target')).toBe('_blank');
    expect(links[1]!.attributes('href')).toContain('github.com');
    expect(links[1]!.attributes('rel')).toContain('noopener');
  });
});

describe('DemoSource —— 多文件源码', () => {
  it('默认展示主文件', () => {
    const wrapper = mount(DemoSource, { props: { sources } });
    expect(wrapper.text()).toContain('basic.vue');
    expect(wrapper.find('.demo-source-code').html()).toContain('<pre>basic</pre>');
  });

  it('多文件时给 tab，且可切换；切换只换内容不影响其它', async () => {
    const wrapper = mount(DemoSource, { props: { sources } });
    const tabs = wrapper.findAll('.demo-source-tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0]!.attributes('aria-selected')).toBe('true');
    await tabs[1]!.trigger('click');
    await nextTick();
    expect(wrapper.findAll('.demo-source-tab')[1]!.attributes('aria-selected')).toBe('true');
    expect(wrapper.find('.demo-source-code').html()).toContain('<pre>ts</pre>');
  });

  it('单文件时不渲染 tablist（不制造无意义的切换器）', () => {
    const wrapper = mount(DemoSource, { props: { sources: [sources[0]!] } });
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false);
  });
});

describe('DemoPreview —— 卡片编排', () => {
  it('标题、锚点 id 与 aria-labelledby 对得上', async () => {
    const wrapper = mount(DemoPreview, { props: { demo: demoMeta }, attachTo: document.body });
    await flushPromises();
    expect(wrapper.attributes('id')).toBe('demo-basic');
    expect(wrapper.attributes('aria-labelledby')).toBe('demo-basic-title');
    expect(wrapper.find('#demo-basic-title').exists()).toBe(true);
    expect(wrapper.find('a.demo-anchor').attributes('href')).toBe('#demo-basic');
    wrapper.unmount();
  });

  it('点「重置示例」真的递增 resetToken（子树重建）', async () => {
    const wrapper = mount(DemoPreview, { props: { demo: demoMeta }, attachTo: document.body });
    await flushPromises();
    const renderer = wrapper.findComponent(DemoRenderer);
    expect(renderer.props('resetToken')).toBe(0);
    const resetBtn = wrapper.findAll('.demo-tool-btn').find((b) => b.text().includes('重置示例'))!;
    await resetBtn.trigger('click');
    await flushPromises();
    expect(wrapper.findComponent(DemoRenderer).props('resetToken')).toBe(1);
    wrapper.unmount();
  });

  it('展开源码后显示源码面板，收起后移除', async () => {
    const wrapper = mount(DemoPreview, { props: { demo: demoMeta }, attachTo: document.body });
    await flushPromises();
    expect(wrapper.find('.demo-source').exists()).toBe(false);
    await wrapper.find('.demo-tool-btn').trigger('click');
    await nextTick();
    expect(wrapper.find('.demo-source').exists()).toBe(true);
    await wrapper.find('.demo-tool-btn').trigger('click');
    await nextTick();
    expect(wrapper.find('.demo-source').exists()).toBe(false);
    wrapper.unmount();
  });

  it('英文界面 + 描述缺译文 ⇒ 显式给出回退提示', async () => {
    const wrapper = mount(DemoPreview, { props: { demo: demoMeta }, attachTo: document.body });
    await flushPromises();
    expect(wrapper.find('.site-fallback-hint').exists()).toBe(false);
    useSiteLocale().setLocale('en-US');
    await nextTick();
    expect(wrapper.find('.site-fallback-hint').exists()).toBe(true);
    wrapper.unmount();
  });
});
