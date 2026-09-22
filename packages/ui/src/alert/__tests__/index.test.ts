/**
 * L1/L2 · 单元测试（Alert / Alert.ErrorBoundary）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 事件：关闭按钮 click（onClose / closable.onClose 优先级）、根元素
 * mouseenter/leave/click、ErrorBoundary 的错误捕获。「prop 更新 → DOM」都在这里钉死。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, provide } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT } from '../../config-provider/context';
import { Alert, AlertErrorBoundary } from '../index';

describe('Alert · 结构', () => {
  it('默认：info + outlined + no-icon + role=alert + data-show', () => {
    const w = mount(Alert);
    const cls = w.find('.apollo-alert').classes();
    expect(cls).toContain('apollo-alert-info');
    expect(cls).toContain('apollo-alert-outlined');
    expect(cls).toContain('apollo-alert-no-icon');
    expect(w.find('.apollo-alert').attributes('role')).toBe('alert');
    expect(w.find('.apollo-alert').attributes('data-show')).toBe('true');
  });

  it('title / description / action 的完整结构（with-description）', () => {
    const w = mount(() =>
      h(Alert, {
        title: 'Info Text',
        description: 'Info Description',
        showIcon: true,
        type: 'info',
        action: h('button', { type: 'button' }, 'A'),
      }),
    );
    expect(w.find('.apollo-alert-title').text()).toBe('Info Text');
    expect(w.find('.apollo-alert-description').text()).toBe('Info Description');
    expect(w.find('.apollo-alert-actions').text()).toBe('A');
    expect(w.find('.apollo-alert-icon').exists()).toBe(true);
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-with-description');
  });

  it('title 未传时不渲染 -title div；description-only 触发 with-description', () => {
    const w = mount(() => h(Alert, { description: 'd' }));
    expect(w.find('.apollo-alert-title').exists()).toBe(false);
    expect(w.find('.apollo-alert-description').text()).toBe('d');
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-with-description');
  });

  it('title/description/action 传 0 也渲染（isRenderable 判据）', () => {
    const w = mount(() => h(Alert, { title: 0, description: 0, action: 0 }));
    expect(w.find('.apollo-alert-title').text()).toBe('0');
    expect(w.find('.apollo-alert-description').text()).toBe('0');
    expect(w.find('.apollo-alert-actions').text()).toBe('0');
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-with-description');
  });

  it('type 未传 ⇒ banner ? warning : info；banner 默认带图标', () => {
    const w = mount(() => h(Alert, { banner: true, title: 'x' }));
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-warning');
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-banner');
    expect(w.find('.apollo-alert-icon').exists()).toBe(true);
    const w2 = mount(() => h(Alert, { banner: true, title: 'x', showIcon: false }));
    expect(w2.find('.apollo-alert-icon').exists()).toBe(false);
    expect(w2.find('.apollo-alert').classes()).toContain('apollo-alert-no-icon');
  });

  it('variant：默认 outlined，prop 与 ConfigProvider 均可覆盖', () => {
    const w = mount(() => h(Alert, { title: 'Info' }));
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-outlined');
    const w2 = mount(() => h(Alert, { title: 'Info', variant: 'filled' }));
    expect(w2.find('.apollo-alert').classes()).toContain('apollo-alert-filled');
  });

  it('插槽双通道：title / description / action 插槽（prop 优先）', () => {
    const w = mount(Alert, {
      props: { title: 'prop-title' },
      slots: {
        title: () => 'slot-title',
        description: () => 'slot-description',
        action: () => 'slot-action',
      },
    });
    expect(w.find('.apollo-alert-title').text()).toBe('prop-title');
    expect(w.find('.apollo-alert-description').text()).toBe('slot-description');
    expect(w.find('.apollo-alert-actions').text()).toBe('slot-action');
  });

  it('aria/data 透传根元素；role 可覆盖默认 alert', () => {
    const w = mount(() =>
      h(Alert, { 'data-test': 'test-id', 'aria-describedby': 'some-label' } as never),
    );
    expect(w.find('.apollo-alert').attributes('data-test')).toBe('test-id');
    expect(w.find('.apollo-alert').attributes('aria-describedby')).toBe('some-label');
    const w2 = mount(() => h(Alert, { role: 'status' } as never));
    expect(w2.find('.apollo-alert').attributes('role')).toBe('status');
  });

  it('id 落根元素；nativeElement expose 指向根（motion 元素即 expose 元素）', () => {
    const w = mount(Alert, { props: { id: 'test-id' } });
    expect(w.find('#test-id').exists()).toBe(true);
    const exposed = (w.getCurrentComponent().exposed ?? {}) as { nativeElement?: unknown };
    expect((exposed.nativeElement as HTMLElement)?.id).toBe('test-id');
  });

  it('L2 · mouseenter / mouseleave / click 落根元素', async () => {
    const onMouseenter = vi.fn();
    const onMouseleave = vi.fn();
    const onClick = vi.fn();
    const w = mount(() => h(Alert, { onMouseenter, onMouseleave, onClick }));
    await w.find('.apollo-alert').trigger('mouseenter');
    await w.find('.apollo-alert').trigger('mouseleave');
    await w.find('.apollo-alert').trigger('click');
    expect(onMouseenter).toHaveBeenCalledTimes(1);
    expect(onMouseleave).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Alert · closable / 关闭', () => {
  it('closable 布尔 ⇒ 渲染关闭按钮（默认 CloseOutlined 图标）', () => {
    const w = mount(() => h(Alert, { title: 'x', closable: true }));
    const btn = w.find('button.apollo-alert-close-icon');
    expect(btn.exists()).toBe(true);
    expect(btn.attributes('type')).toBe('button');
    expect(btn.attributes('tabindex')).toBe('0');
    expect(btn.find('span.apollo-icon-close').exists()).toBe(true);
  });

  it('L2 · 点击关闭：onClose 触发一次、data-show 变 false、进入 leave 动画', async () => {
    const onClose = vi.fn();
    const w = mount(() => h(Alert, { title: 'x', closable: true, onClose }));
    await w.find('button.apollo-alert-close-icon').trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(w.find('.apollo-alert').attributes('data-show')).toBe('false');
    expect(
      w
        .find('.apollo-alert')
        .classes()
        .some((c) => c.includes('-motion-leave')),
    ).toBe(true);
  });

  it('closable.onClose 优先于 onClose prop（后者不触发）', async () => {
    const onClose = vi.fn();
    const handleClosableClose = vi.fn();
    const w = mount(() =>
      h(Alert, {
        title: 'x',
        closable: { onClose: handleClosableClose },
        onClose,
      }),
    );
    await w.find('button.apollo-alert-close-icon').trigger('click');
    expect(onClose).toHaveBeenCalledTimes(0);
    expect(handleClosableClose).toHaveBeenCalledTimes(1);
  });

  it('closable 对象恒可关（不传 closeIcon 也有默认图标）', () => {
    const w = mount(() => h(Alert, { title: 'x', closable: {} }));
    expect(w.find('button.apollo-alert-close-icon').exists()).toBe(true);
  });

  it('closeIcon null/false ⇒ 不可关；closeIcon 字符串/0/空串 ⇒ 可关', () => {
    expect(
      mount(() => h(Alert, { closeIcon: null }))
        .find('button.apollo-alert-close-icon')
        .exists(),
    ).toBe(false);
    expect(
      mount(() => h(Alert, { closeIcon: false }))
        .find('button.apollo-alert-close-icon')
        .exists(),
    ).toBe(false);
    expect(
      mount(() => h(Alert, { closeIcon: 'X' }))
        .find('button.apollo-alert-close-icon')
        .text(),
    ).toBe('X');
    expect(
      mount(() => h(Alert, { closeIcon: 0 }))
        .find('button.apollo-alert-close-icon')
        .exists(),
    ).toBe(true);
    expect(
      mount(() => h(Alert, { closeIcon: '' }))
        .find('button.apollo-alert-close-icon')
        .exists(),
    ).toBe(true);
  });

  it('closable 对象的 aria-* 落在关闭按钮上', () => {
    const w = mount(() => h(Alert, { closable: { 'aria-label': 'Close' }, closeIcon: 'X' }));
    expect(w.find('button.apollo-alert-close-icon').attributes('aria-label')).toBe('Close');
    expect(w.find('.apollo-alert').attributes('aria-label')).toBeUndefined();
  });

  it('closeIcon 优先级：closable.closeIcon > closeText > closeIcon', () => {
    const w = mount(() =>
      h(Alert, { title: 'x', closable: { closeIcon: 'CloseBtn' }, closeIcon: 'CloseBtn2' }),
    );
    expect(w.find('button.apollo-alert-close-icon').text()).toBe('CloseBtn');
    const w2 = mount(() =>
      h(Alert, { title: 'x', closable: { closeIcon: 'CloseBtn' }, closeText: 'CloseBtn3' }),
    );
    expect(w2.find('button.apollo-alert-close-icon').text()).toBe('CloseBtn');
    const w3 = mount(() => h(Alert, { title: 'x', closeText: 'CloseBtn2' }));
    expect(w3.find('button.apollo-alert-close-icon').text()).toBe('CloseBtn2');
    const w4 = mount(() => h(Alert, { title: 'x', closeIcon: 'CloseBtn3' }));
    expect(w4.find('button.apollo-alert-close-icon').text()).toBe('CloseBtn3');
  });

  it('closeText 真值 ⇒ 可关；发废弃告警（setup 期一次）', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(() => h(Alert, { title: 'x', closeText: 'close' }));
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: [apollo: Alert] `closeText` is deprecated. Please use `closable.closeIcon` instead.',
    );
    expect(w.find('button.apollo-alert-close-icon').text()).toBe('close');
    errorSpy.mockRestore();
  });

  it('message 发废弃告警且 title 缺省时生效', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = mount(() => h(Alert, { message: 'legacy' }));
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: [apollo: Alert] `message` is deprecated. Please use `title` instead.',
    );
    expect(w.find('.apollo-alert-title').text()).toBe('legacy');
    errorSpy.mockRestore();
  });

  it('message 插槽兜底（title prop 优先）', () => {
    const w = mount(Alert, {
      props: { message: 'legacy' },
      slots: { title: () => 'slot-title' },
    });
    expect(w.find('.apollo-alert-title').text()).toBe('legacy');
  });

  it('closable.afterClose 优先于 afterClose prop（leave 结束触发）', async () => {
    const afterClose = vi.fn();
    const closableAfterClose = vi.fn();
    const w = mount(() =>
      h(Alert, {
        title: 'x',
        closable: { closeIcon: true, afterClose: closableAfterClose },
        afterClose,
      }),
    );
    await w.find('button.apollo-alert-close-icon').trigger('click');
    // 等驱动推进到 active 步（prepare → start → active 走双 rAF ≈ 64ms）
    const deadline = Date.now() + 1000;
    while (
      Date.now() < deadline &&
      !w
        .find('.apollo-alert')
        .classes()
        .some((c) => c.endsWith('-motion-leave-active'))
    ) {
      await new Promise((r) => setTimeout(r, 16));
    }
    // jsdom 无真实 transition —— 手动派发 transitionend 驱动 leave 结束
    // （antd 的 rc-motion 同样依赖 transitionend；机制一致）
    w.find('.apollo-alert').element.dispatchEvent(new Event('transitionend', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    await nextTick();
    expect(closableAfterClose).toHaveBeenCalled();
    expect(afterClose).not.toHaveBeenCalled();
  });
});

describe('Alert · ConfigProvider', () => {
  /** 指定 ConfigProvider 上下文下渲染（button/semantic 同范式）。 */
  const withConfig = (config: Record<string, unknown>, children: () => ReturnType<typeof h>) =>
    defineComponent({
      name: 'AAlertConfigProbe',
      setup() {
        provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
        return children;
      },
    });

  it('ConfigProvider 的 alert.variant 覆盖默认；显式 variant 压过 context', () => {
    const w = mount(
      withConfig({ components: { alert: { variant: 'filled' } } }, () =>
        h(Alert, { title: 'Info' }),
      ),
    );
    expect(w.find('.apollo-alert').classes()).toContain('apollo-alert-filled');
    const w2 = mount(
      withConfig({ components: { alert: { variant: 'filled' } } }, () =>
        h(Alert, { title: 'Info', variant: 'outlined' }),
      ),
    );
    expect(w2.find('.apollo-alert').classes()).toContain('apollo-alert-outlined');
  });

  it('ConfigProvider 的 successIcon 覆盖默认 success 图标', () => {
    const w = mount(
      withConfig({ components: { alert: { successIcon: 'foobar' } } }, () =>
        h(Alert, { title: 'Success Tips', type: 'success', showIcon: true }),
      ),
    );
    expect(w.find('.apollo-alert-icon').text()).toBe('foobar');
  });
});

describe('Alert.ErrorBoundary', () => {
  it('捕获后代渲染错误 → 渲染 type=error 的 Alert（title=error.toString()）', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ThrowError = defineComponent({
      name: 'ThrowError',
      setup() {
        throw new Error('This is a test error');
      },
    });
    const w = mount(() => h(AlertErrorBoundary, null, { default: () => h(ThrowError) }));
    await nextTick();
    const alert = w.find('.apollo-alert');
    expect(alert.exists()).toBe(true);
    expect(alert.classes()).toContain('apollo-alert-error');
    expect(alert.text()).toContain('Error: This is a test error');
    expect(w.find('.apollo-alert-description pre').exists()).toBe(true);
    errorSpy.mockRestore();
  });

  it('无错误时渲染默认插槽；title/description prop 覆盖错误信息（有 description 时无 pre）', async () => {
    const w = mount(() => h(AlertErrorBoundary, null, { default: () => h('div', 'ok') }));
    expect(w.text()).toBe('ok');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ThrowError = defineComponent({
      name: 'ThrowError2',
      setup() {
        throw new Error('boom');
      },
    });
    const w2 = mount(() =>
      h(
        AlertErrorBoundary,
        { title: 'Custom Title', description: 'Custom Desc' },
        { default: () => h(ThrowError) },
      ),
    );
    await nextTick();
    expect(w2.find('.apollo-alert-title').text()).toBe('Custom Title');
    expect(w2.find('.apollo-alert-description').text()).toBe('Custom Desc');
    // description prop 直接渲染；只有组件栈形态才包 <pre>（antd 同判）
    expect(w2.find('.apollo-alert-description pre').exists()).toBe(false);
    errorSpy.mockRestore();
  });
});
