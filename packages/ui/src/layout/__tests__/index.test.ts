/**
 * L1/L2 · 单元测试（Layout）
 *
 * 覆盖 L4（SSR）拿不到的运行时契约：
 *   - `has-sider` 的**嵌套**检测与「多 Sider 逐个移除」（依赖 `addSider` 注册）
 *   - 折叠（受控 / 非受控 / 零宽触发器）
 *   - 响应式 `onBreakpoint`（挂载时立即以 `mql.matches` 调用一次）
 *   - 四个组件的 ref
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Content, Footer, Header, Layout, Sider } from '../index';

const HAS_SIDER = 'apollo-layout-has-sider';

describe('Layout · has-sider', () => {
  it('直系 Sider 首帧即检测（SSR 也要成立）', () => {
    const w = mount(Layout, {
      slots: { default: () => [h(Sider), h(Content)] },
    });
    expect(w.classes()).toContain(HAS_SIDER);
  });

  it('Sider 嵌套一层 div：挂载后由注册机制补上', async () => {
    const w = mount(Layout, {
      slots: { default: () => [h('div', null, [h(Sider)]), h(Content)] },
    });
    await nextTick();
    expect(w.classes()).toContain(HAS_SIDER);
  });

  it('hasSider=false 强制不加（即使有 Sider）', async () => {
    const w = mount(Layout, {
      props: { hasSider: false },
      slots: { default: () => h(Sider) },
    });
    await nextTick();
    expect(w.classes()).not.toContain(HAS_SIDER);
  });

  it('多 Sider：逐个隐藏，最后一个移除后类名消失', async () => {
    const hide1 = ref(false);
    const hide2 = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Layout, null, {
            default: () => [
              hide1.value ? null : h(Sider),
              hide2.value ? null : h(Sider),
              h(Content),
            ],
          });
      },
    });
    const w = mount(App);
    expect(w.find('.apollo-layout').classes()).toContain(HAS_SIDER);
    hide1.value = true;
    await nextTick();
    expect(w.find('.apollo-layout').classes()).toContain(HAS_SIDER);
    hide2.value = true;
    await nextTick();
    expect(w.find('.apollo-layout').classes()).not.toContain(HAS_SIDER);
  });
});

describe('Layout · 结构与 ref', () => {
  it('四个组件的标签名与默认类名', () => {
    const l = mount(Layout);
    expect(l.element.tagName).toBe('DIV');
    expect(l.classes()).toContain('apollo-layout');
    const h1 = mount(Header);
    expect(h1.element.tagName).toBe('HEADER');
    expect(h1.classes()).toContain('apollo-layout-header');
    const f = mount(Footer);
    expect(f.element.tagName).toBe('FOOTER');
    expect(f.classes()).toContain('apollo-layout-footer');
    const c = mount(Content);
    expect(c.element.tagName).toBe('MAIN');
    expect(c.classes()).toContain('apollo-layout-content');
  });

  it('Basic 传了 prefixCls 就不再拼 suffix', () => {
    const w = mount(Header, { props: { prefixCls: 'my-header' } });
    expect(w.classes()).toContain('my-header');
    expect(w.classes()).not.toContain('apollo-layout-header');
  });

  it('四个组件的 nativeElement ref 都指向根', () => {
    for (const Comp of [Layout, Header, Footer, Content]) {
      const w = mount(Comp);
      const exposed = w.getCurrentComponent().exposed as
        | { nativeElement?: HTMLElement }
        | undefined;
      expect(exposed?.nativeElement).toBe(w.element);
    }
  });

  it('rtl 类名', () => {
    const w = mount(Layout, { props: { hasSider: true } });
    expect(w.classes()).not.toContain('apollo-layout-rtl');
  });
});

describe('Sider · 宽度与状态', () => {
  it('width="50%" ⇒ width/flex 保持百分比', () => {
    const w = mount(Sider, { props: { width: '50%' } });
    const el = w.element as HTMLElement;
    expect(el.style.width).toBe('50%');
    expect(el.style.flex).toContain('50%');
    expect(el.style.maxWidth).toBe('50%');
    expect(el.style.minWidth).toBe('50%');
  });

  it('width=120 ⇒ 补 px', () => {
    const w = mount(Sider, { props: { width: 120 } });
    expect((w.element as HTMLElement).style.width).toBe('120px');
  });

  it('width="0%" ⇒ -zero-width 类', () => {
    const w = mount(Sider, { props: { width: '0%' } });
    expect(w.classes()).toContain('apollo-layout-sider-zero-width');
  });

  it('默认 dark 主题；theme=light ⇒ -light', () => {
    expect(mount(Sider).classes()).toContain('apollo-layout-sider-dark');
    expect(mount(Sider, { props: { theme: 'light' } }).classes()).toContain(
      'apollo-layout-sider-light',
    );
  });

  it('collapsible ⇒ -has-trigger', () => {
    expect(mount(Sider, { props: { collapsible: true } }).classes()).toContain(
      'apollo-layout-sider-has-trigger',
    );
  });

  it('trigger=null ⇒ 无触发器 DOM、无 -has-trigger', () => {
    const w = mount(Sider, { props: { collapsible: true, trigger: null } });
    expect(w.find('.apollo-layout-sider-trigger').exists()).toBe(false);
    expect(w.classes()).not.toContain('apollo-layout-sider-has-trigger');
  });
});

describe('Sider · 折叠', () => {
  it('非受控：click trigger ⇒ collapsed + onCollapse(true, "clickTrigger")', async () => {
    const onCollapse = vi.fn();
    const w = mount(Sider, {
      props: { collapsible: true, onCollapse },
    });
    await w.find('.apollo-layout-sider-trigger').trigger('click');
    expect(w.classes()).toContain('apollo-layout-sider-collapsed');
    expect(onCollapse).toHaveBeenCalledWith(true, 'clickTrigger');
  });

  it('受控：click 只发事件，状态由父级决定', async () => {
    const onCollapse = vi.fn();
    const w = mount(Sider, {
      props: { collapsible: true, collapsed: false, onCollapse },
    });
    await w.find('.apollo-layout-sider-trigger').trigger('click');
    expect(onCollapse).toHaveBeenCalledTimes(1);
    // 父级没回传 ⇒ 仍是展开态
    expect(w.classes()).not.toContain('apollo-layout-sider-collapsed');
  });

  it('零宽触发器：span + click 触发折叠', async () => {
    const onCollapse = vi.fn();
    const w = mount(Sider, {
      props: { collapsible: true, collapsedWidth: 0, onCollapse },
    });
    const trigger = w.find('.apollo-layout-sider-zero-width-trigger');
    expect(trigger.element.tagName).toBe('SPAN');
    await trigger.trigger('click');
    expect(onCollapse).toHaveBeenCalledWith(true, 'clickTrigger');
  });

  it('zeroWidthTriggerStyle 落到零宽触发器', () => {
    const w = mount(Sider, {
      props: {
        collapsible: true,
        collapsedWidth: 0,
        zeroWidthTriggerStyle: { background: 'rgb(1, 2, 3)' },
      },
    });
    const trigger = w.find('.apollo-layout-sider-zero-width-trigger').element as HTMLElement;
    expect(trigger.style.background).toBe('rgb(1, 2, 3)');
  });

  it('语义化函数形态能读到合并后的 props（collapsed 变化要反映）', async () => {
    const classNames = vi.fn(({ props }: { props: { collapsed?: boolean } }) => ({
      body: props.collapsed ? 'body-collapsed' : 'body-expanded',
    }));
    const w = mount(Sider, { props: { collapsible: true, classNames } });
    expect(w.find('.apollo-layout-sider-children').classes()).toContain('body-expanded');
    await w.find('.apollo-layout-sider-trigger').trigger('click');
    expect(w.find('.apollo-layout-sider-children').classes()).toContain('body-collapsed');
  });
});

describe('Sider · 响应式', () => {
  it('挂载时立即以 mql.matches 调一次 onBreakpoint', () => {
    const onBreakpoint = vi.fn();
    // vitest.setup.ts 的 matchMedia 桩恒返回 matches:false
    mount(Sider, { props: { breakpoint: 'md', onBreakpoint } });
    expect(onBreakpoint).toHaveBeenCalledWith(false);
  });

  it('没有 breakpoint 时不调用 onBreakpoint', () => {
    const onBreakpoint = vi.fn();
    mount(Sider, { props: { onBreakpoint } });
    expect(onBreakpoint).not.toHaveBeenCalled();
  });
});
