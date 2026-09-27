/**
 * L1 · 单元测试（Result）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 无事件/受控/焦点。L2 适用面：props 更新 → DOM 分支切换（status 变更换图标、
 * icon 禁用）。「prop 更新 → DOM」的时序由这里钉死（类名/结构断言即等价形态）。
 *
 * 判据来源：antd 6.6.4 `es/result/index.js` 逐条（见 G1 分析 §2）。
 */

import { SmileOutlined } from '@apollo-design/icons';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { ExceptionMap, IconMap, PRESENTED_IMAGE_404, Result } from '../index';
import type { ResultConfig } from '../interface';

const P = 'apollo-result';

const mountResult = (props = {}, slots: Record<string, () => unknown> = {}) =>
  mount(Result, { props: props as never, slots, attachTo: document.body });

describe('Result · 结构', () => {
  it('根类名：前缀 + 状态后缀（默认 info）', () => {
    const w = mountResult({ title: 'T' });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-info`);
    const w2 = mountResult({ title: 'T', status: 'success' });
    expect(w2.find(`.${P}`).classes()).toContain(`${P}-success`);
  });

  it('普通状态渲染 IconMap 图标（div -icon 内）', () => {
    const w = mountResult({ title: 'T', status: 'success' });
    const icon = w.find(`.${P}-icon`);
    expect(icon.exists()).toBe(true);
    expect(icon.classes()).not.toContain(`${P}-image`);
    // 默认图标是 CheckCircleFilled（apollo-icon 类）
    expect(icon.find('.apollo-icon').exists()).toBe(true);
  });

  it('异常状态（403/404/500，字符串与数字）渲染静态插画并带 -image', () => {
    for (const status of ['404', 404, '403', '500']) {
      const w = mountResult({ title: 'T', status: status as never });
      const icon = w.find(`.${P}-icon`);
      expect(icon.classes()).toContain(`${P}-image`);
      // 插画是内联 SVG（252×294，无 apollo-icon 类）
      expect(icon.find('svg').exists()).toBe(true);
    }
  });

  it('异常状态忽略 icon prop（恒渲染插画）', () => {
    const w = mountResult({ status: '404' }, { icon: () => h(SmileOutlined) });
    expect(w.find(`.${P}-icon svg`).exists()).toBe(true);
    expect(w.find(`.${P}-icon .apollo-icon`).exists()).toBe(false);
  });

  it('icon === null / false 显式禁用（连容器都不渲染）', () => {
    const w = mountResult({ title: 'T', icon: null });
    expect(w.find(`.${P}-icon`).exists()).toBe(false);
    const w2 = mountResult({ title: 'T', icon: false });
    expect(w2.find(`.${P}-icon`).exists()).toBe(false);
  });

  it('icon 节点覆盖默认图标', () => {
    const w = mountResult({ title: 'T', status: 'success' }, { icon: () => h(SmileOutlined) });
    expect(w.find(`.${P}-icon .apollo-icon`).exists()).toBe(true);
  });

  it("title/subTitle/extra 守卫：'' 与 false 不渲染容器", () => {
    const w = mountResult({ title: '' }, { subTitle: () => false, extra: () => '' });
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    expect(w.find(`.${P}-subtitle`).exists()).toBe(false);
    expect(w.find(`.${P}-extra`).exists()).toBe(false);
    // 0 是 renderable（antd isReactRenderable 语义）—— 经 #title/#subTitle slot 传入
    const w2 = mountResult({}, { title: () => 0, subTitle: () => 0 });
    expect(w2.find(`.${P}-title`).exists()).toBe(true);
    expect(w2.find(`.${P}-subtitle`).exists()).toBe(true);
  });

  it("body 守卫：antd children='' 在 Vue 侧是 PLATFORM（空插槽归一为数组仍渲染空容器，与 Empty 契约一致）", () => {
    // ⚠️ antd 的 isReactRenderable('') 为假 → 不渲染 body；但 Vue 的插槽函数返回
    //    `''` 会被归一化成 [textVNode]（truthy）—— 与 `<Empty></Empty>` 渲染空 footer
    //    是同一条平台差异（README §7 登记）。判据与 Empty 逐字同构，不在本组件「顺手修」。
    const w = mountResult({ title: 'T' }, { default: () => '' });
    expect(w.find(`.${P}-body`).exists()).toBe(true);
  });

  it('body 渲染 children（有插槽才有容器）', () => {
    const w = mountResult({ title: 'T' }, { default: () => h('p', 'content') });
    expect(w.find(`.${P}-body p`).exists()).toBe(true);
    const w2 = mountResult({ title: 'T' });
    expect(w2.find(`.${P}-body`).exists()).toBe(false);
  });

  it('title/subTitle/extra 的类名与文本', () => {
    const w = mountResult(
      { title: 'Title', subTitle: 'Sub' },
      { default: () => 'body', extra: () => h('button', 'Go') },
    );
    expect(w.find(`.${P}-title`).text()).toBe('Title');
    expect(w.find(`.${P}-subtitle`).text()).toBe('Sub');
    expect(w.find(`.${P}-extra button`).exists()).toBe(true);
    expect(w.find(`.${P}-body`).text()).toBe('body');
  });

  it('restProps 只透传 aria / data attrs', () => {
    const w = mountResult({
      title: 'T',
      'aria-label': 'result',
      'data-testid': 'r1',
      id: 'kept-id-not-picked',
    } as never);
    expect(w.find(`.${P}`).attributes('aria-label')).toBe('result');
    expect(w.find(`.${P}`).attributes('data-testid')).toBe('r1');
    // id 不在 aria/data 白名单
    expect(w.find(`.${P}`).attributes('id')).toBeUndefined();
  });

  it('nativeElement 指向根元素', () => {
    const w = mountResult({ title: 'T' });
    expect((w.vm as unknown as { nativeElement: HTMLElement }).nativeElement).toBe(
      w.find(`.${P}`).element,
    );
  });

  it('direction === rtl → -rtl 类（provide 上下文）', () => {
    const w = mount(Result, {
      props: { title: 'T' },
      global: {
        provide: {
          [configContextKey as unknown as string]: {
            ...DEFAULT_CONFIG_CONTEXT,
            direction: 'rtl',
          },
        },
      },
      attachTo: document.body,
    });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-rtl`);
  });
});

describe('Result · 语义槽位', () => {
  it('classNames 拼接 / styles 合并（对象式）', () => {
    const w = mountResult({
      title: 'T',
      classNames: { root: 'user-root', title: 'user-title' },
      styles: { root: { padding: '8px' }, title: { color: 'red' } },
    });
    expect(w.find(`.${P}`).classes()).toContain('user-root');
    expect(w.find(`.${P}-title`).classes()).toContain('user-title');
    expect(w.find(`.${P}-title`).attributes('style')).toContain('color');
  });

  it('★ style prop 覆盖 styles.root（antd 的 useSemanticRootStyle 顺序）', () => {
    const w = mountResult({
      title: 'T',
      style: { padding: '4px' },
      styles: { root: { padding: '8px' } },
    });
    expect(w.find(`.${P}`).attributes('style')).toContain('4px');
    expect(w.find(`.${P}`).attributes('style')).not.toContain('8px');
  });

  it('函数式语义槽位能读到 props', () => {
    const w = mountResult({
      title: 'T',
      status: 'success',
      classNames: (info: { props: { status?: string } }) =>
        info.props.status === 'success' ? { root: 'fn-success' } : { root: 'fn-other' },
    } as never);
    expect(w.find(`.${P}`).classes()).toContain('fn-success');
  });

  it('ConfigProvider 的 contextClassNames / contextStyles 参与', () => {
    const componentConfig: ResultConfig = {
      classNames: { root: 'ctx-root' },
      styles: { root: { color: 'blue' } },
    };
    const w = mount(Result, {
      props: { title: 'T' },
      global: {
        provide: {
          [configContextKey as unknown as string]: {
            ...DEFAULT_CONFIG_CONTEXT,
            components: { result: componentConfig },
          },
        },
      },
      attachTo: document.body,
    });
    expect(w.find(`.${P}`).classes()).toContain('ctx-root');
    expect(w.find(`.${P}`).attributes('style')).toContain('blue');
  });
});

describe('Result · 导出契约', () => {
  it('IconMap / ExceptionMap / PRESENTED_IMAGE_404', () => {
    expect(Object.keys(IconMap).sort()).toEqual(['error', 'info', 'success', 'warning']);
    expect(Object.keys(ExceptionMap).sort()).toEqual(['403', '404', '500']);
    // PRESENTED_IMAGE_* 是**组件**（与 Empty 的「元素常量」不同源 —— antd 6.6.4 如此）
    expect(typeof PRESENTED_IMAGE_404).toBe('object');
  });

  it('status 默认 info（未传与 undefined 等价）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mountResult({ title: 'T' });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-info`);
    spy.mockRestore();
  });
});
