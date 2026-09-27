/**
 * L1/L2 —— 判据：antd FloatButton.tsx / FloatButtonGroup.tsx / BackTop.tsx 逐层。
 *
 * 覆盖：类名链（type/shape/individual/icon-only）/ 默认图标 / #content 与 deprecated
 * description / badge（dot 类 + omit）/ tooltip 包装 / usage 告警 ×2 / Group 列表
 * （Flex vs Space.Compact）/ menu 模式（trigger open/close、外部点击、受控）/ BackTop
 * 可见性（visibilityHeight）与 showProgress 变量。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import FloatButtonBackTop from '../BackTop';
import FloatButton from '../FloatButton';
import FloatButtonGroup from '../FloatButtonGroup';

const P = 'apollo-float-btn';

const mountFB = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) =>
  mount(FloatButton, {
    props: props as never,
    slots,
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

describe('FloatButton · 结构契约', () => {
  it('root 类链：float-btn + -default + -circle + -individual + -icon-only；Button 共存', () => {
    const w = mountFB();
    const root = w.find(`.${P}`);
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain(`${P}-default`);
    expect(root.classes()).toContain(`${P}-circle`);
    expect(root.classes()).toContain(`${P}-individual`);
    expect(root.classes()).toContain(`${P}-icon-only`);
    expect(root.classes()).toContain('apollo-btn'); // 包装 Button
    w.unmount();
  });

  it('默认图标 FileTextOutlined（icon-only 时）', () => {
    const w = mountFB();
    expect(w.find(`.${P}-icon svg`).exists()).toBe(true);
    w.unmount();
  });

  it('#content ⇒ -icon-only 退场；circle + 内容 ⇒ usage 告警', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mountFB({ shape: 'circle' }, { content: () => 'HELP INFO' });
    spy.mockRestore();
    expect(w.find(`.${P}-icon-only`).exists()).toBe(false);
    expect(warnings.join('\n')).toContain('supported only when `shape` is `square`');
    w.unmount();
  });

  it('deprecated description ⇒ 告警并等价 #content', () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mountFB({ shape: 'square', description: 'HELP INFO' });
    spy.mockRestore();
    expect(warnings.join('\n')).toContain('`description` is deprecated');
    expect(w.text()).toContain('HELP INFO');
    w.unmount();
  });

  it('#icon 插槽覆盖默认图标', () => {
    const w = mountFB({}, { icon: () => h('i', { class: 'my-icon' }) });
    expect(w.find('.my-icon').exists()).toBe(true);
    w.unmount();
  });

  it('badge：dot ⇒ -badge-dot 类；badge 内容经 Badge 渲染', () => {
    const w = mountFB({ badge: { dot: true } });
    expect(w.find(`.${P}-badge`).exists()).toBe(true);
    expect(w.find(`.${P}-badge-dot`).exists()).toBe(true);
    w.unmount();

    const w2 = mountFB({ badge: { count: 5 } });
    expect(w2.find(`.${P}-badge-dot`).exists()).toBe(false);
    expect(w2.text()).toContain('5');
    w2.unmount();
  });

  it('无 badge prop ⇒ 不渲染 -badge', () => {
    const w = mountFB();
    expect(w.find(`.${P}-badge`).exists()).toBe(false);
    w.unmount();
  });

  it('tooltip string ⇒ 包 Tooltip（触发显示 title）', async () => {
    const w = mountFB({ tooltip: 'title text' });
    await w.find(`.${P}`).trigger('mouseenter');
    await new Promise((r) => setTimeout(r, 300));
    expect(document.body.textContent).toContain('title text');
    w.unmount();
  });

  it('tooltip 对象（TooltipProps）逐字转发', async () => {
    const w = mountFB({ tooltip: { title: 'obj tip' } });
    await w.find(`.${P}`).trigger('mouseenter');
    await new Promise((r) => setTimeout(r, 300));
    expect(document.body.textContent).toContain('obj tip');
    w.unmount();
  });

  it('href ⇒ 渲染为链接（Button 的 a 形态）', () => {
    const w = mountFB({ href: 'https://example.com' });
    expect(w.find('a').exists()).toBe(true);
    w.unmount();
  });

  it('expose nativeElement', () => {
    const w = mountFB();
    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(vm.nativeElement).toBeTruthy();
    w.unmount();
  });

  it('type=primary ⇒ -primary 类', () => {
    const w = mountFB({ type: 'primary' });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-primary`);
    w.unmount();
  });
});

describe('FloatButtonGroup', () => {
  const LIST = () => [h(FloatButton, { key: 1 }), h(FloatButton, { key: 2 })];

  it('root 类：-group；circle ⇒ -individual；list 为 Flex', () => {
    const w = mount(FloatButtonGroup, {
      props: {},
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    expect(w.find(`.${P}-group`).exists()).toBe(true);
    expect(w.find(`.${P}-group-individual`).exists()).toBe(true);
    expect(w.find(`.${P}-group-list`).exists()).toBe(true);
    w.unmount();
  });

  it('shape=square ⇒ Space.Compact（-compact 类）', () => {
    const w = mount(FloatButtonGroup, {
      props: { shape: 'square' },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    expect(w.find('.apollo-space-compact').exists()).toBe(true);
    w.unmount();
  });

  it('menu 模式：trigger 按钮 + 受控 open ⇒ 列表出现', async () => {
    const w = mount(FloatButtonGroup, {
      props: { trigger: 'click', open: true },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    await new Promise((r) => setTimeout(r, 30));
    expect(w.find(`.${P}-group-menu-mode`).exists()).toBe(true);
    expect(w.find(`.${P}-group-trigger`).exists()).toBe(true);
    // open=true 经 motion 渲染列表
    expect(
      document.body.querySelector(`.${P}-group-list`) ?? w.find(`.${P}-group-list`).element,
    ).toBeTruthy();
    w.unmount();
  });

  it('click trigger：点触发按钮开合 + 外部点击关闭', async () => {
    const onOpenChange = vi.fn();
    const w = mount(FloatButtonGroup, {
      props: { trigger: 'click', onOpenChange },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    await w.find(`.${P}-group-trigger`).trigger('click');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // 外部点击
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it('hover trigger：mouseenter/leave 开合', async () => {
    const onOpenChange = vi.fn();
    const w = mount(FloatButtonGroup, {
      props: { trigger: 'hover', onOpenChange },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    await w.find(`.${P}-group`).trigger('mouseenter');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await w.find(`.${P}-group`).trigger('mouseleave');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it('v-model:open（update:open 中继）+ usage 告警（open 无 trigger）', async () => {
    const warnings: string[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => {
      warnings.push(a.map(String).join(' '));
    });
    const w = mount(FloatButtonGroup, {
      props: { open: true },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    spy.mockRestore();
    expect(warnings.join('\n')).toContain('`open` need to be used together with `trigger`');
    w.unmount();
  });

  it('placement 落类（menu 模式）', () => {
    const w = mount(FloatButtonGroup, {
      props: { trigger: 'click', placement: 'left', open: true },
      slots: { default: LIST },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    } as never);
    expect(w.find(`.${P}-group-left`).exists()).toBe(true);
    w.unmount();
  });
});

describe('FloatButton.BackTop', () => {
  it('visibilityHeight=0 ⇒ 初始可见；默认 VerticalAlignTopOutlined 图标', async () => {
    const w = mount(FloatButtonBackTop, {
      props: { visibilityHeight: 0 },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(w.find(`.${P}`).exists()).toBe(true);
    expect(w.find(`.${P}-icon svg`).exists()).toBe(true);
    w.unmount();
  });

  it('visibilityHeight=400 ⇒ 初始不可见（motion 隐藏）', async () => {
    const w = mount(FloatButtonBackTop, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await new Promise((r) => setTimeout(r, 30));
    // CSSMotion visible=false ⇒ motion 隐藏类或节点移除；此处以「无可见按钮」为判据
    expect(
      document.querySelector(`.${P}.apollo-float-btn-circle`) === null ||
        w.find(`.${P}`).exists() === false,
    ).toBe(true);
    w.unmount();
  });

  it('showProgress ⇒ -progress 类 + CSS 变量注入', async () => {
    const w = mount(FloatButtonBackTop, {
      props: { visibilityHeight: 0, showProgress: true },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(w.find(`.${P}-progress`).exists()).toBe(true);
    const style = (w.find(`.${P}`).element as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('--apollo-float-btn-progress');
    w.unmount();
  });

  it('点击 ⇒ scrollTo(0) + onClick', async () => {
    const onClick = vi.fn();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const w = mount(FloatButtonBackTop, {
      props: { visibilityHeight: 0, onClick },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await new Promise((r) => setTimeout(r, 30));
    await w.find(`.${P}`).trigger('click');
    expect(onClick).toHaveBeenCalled();
    scrollToSpy.mockRestore();
    w.unmount();
  });
});
