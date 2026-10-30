import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ConfigProvider from '../../config-provider/ConfigProvider';
import BackTop from '../BackTop';
import FloatButton from '../FloatButton';
import Group from '../FloatButtonGroup';
import PurePanel from '../PurePanel';

const global = { stubs: { teleport: false } };
afterEach(() => vi.restoreAllMocks());

describe('FloatButton current Vue content and configuration', () => {
  it('reads complete content once per render and follows slot replacement/removal', async () => {
    const content = ref('first');
    const present = ref(true);
    let setups = 0;
    const Stateful = defineComponent({
      setup() {
        setups++;
        const draft = ref('draft');
        return () =>
          h(
            'span',
            {
              'data-draft': '',
              onClick: () => {
                draft.value = 'edited';
              },
            },
            draft.value,
          );
      },
    });
    const renderContent = vi.fn(() => [h('strong', content.value), h(Stateful)]);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            FloatButton,
            { shape: 'square', description: 'fallback' },
            present.value ? { content: renderContent } : {},
          ),
      }),
      { global, attachTo: document.body },
    );
    try {
      expect(renderContent).toHaveBeenCalledTimes(1);
      const child = wrapper.get('[data-draft]').element;
      await wrapper.get('[data-draft]').trigger('click');
      const button = wrapper.get<HTMLButtonElement>('button').element;
      button.focus();
      content.value = 'second';
      await nextTick();
      expect(wrapper.text()).toContain('second');
      expect(wrapper.get('[data-draft]').element).toBe(child);
      expect(wrapper.get('[data-draft]').text()).toBe('edited');
      expect(setups).toBe(1);
      expect(document.activeElement).toBe(button);
      expect(renderContent).toHaveBeenCalledTimes(2);
      present.value = false;
      await nextTick();
      expect(wrapper.text()).toBe('fallback');
      expect(warning.mock.calls.flat().join(' ')).not.toContain('outside of the render function');
    } finally {
      wrapper.unmount();
    }
  });

  it('an explicitly empty content or icon slot takes precedence and remains reactive', async () => {
    const empty = ref(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            FloatButton,
            { shape: 'square', description: 'fallback' },
            {
              content: () => (empty.value ? [] : [h('b', 'current')]),
              icon: () => [],
            },
          ),
      }),
      { global },
    );
    try {
      expect(wrapper.text()).toBe('');
      expect(wrapper.find('svg').exists()).toBe(false);
      expect(wrapper.classes()).toContain('apollo-float-btn-icon-only');
      empty.value = false;
      await nextTick();
      expect(wrapper.text()).toBe('current');
      expect(wrapper.classes()).not.toContain('apollo-float-btn-icon-only');
    } finally {
      wrapper.unmount();
    }
  });

  it('follows current Provider semantics, prefix, direction and native root precedence', async () => {
    const enabled = ref(true);
    const prefix = ref('brand');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: prefix.value,
              direction: enabled.value ? 'rtl' : 'ltr',
              components: enabled.value
                ? {
                    floatButton: {
                      className: 'provider',
                      style: { paddingInline: '5px' },
                      classNames: { content: 'provider-content' },
                      styles: { icon: { color: 'red' } },
                    },
                  }
                : {},
            },
            () =>
              h(
                FloatButton,
                { shape: 'square', style: 'padding-inline:7px' },
                {
                  content: () => 'content',
                  icon: () => h('i', 'icon'),
                },
              ),
          ),
      }),
      { global },
    );
    try {
      expect(wrapper.get('button').classes()).toContain('provider');
      expect(wrapper.get('button').classes()).toContain('brand-float-btn-rtl');
      expect(wrapper.get('.provider-content').text()).toBe('content');
      expect(wrapper.get<HTMLElement>('button').element.style.paddingInline).toBe('7px');
      prefix.value = 'next';
      enabled.value = false;
      await nextTick();
      expect(wrapper.get('button').classes()).toContain('next-float-btn');
      expect(wrapper.find('.provider-content').exists()).toBe(false);
      expect(wrapper.get('button').classes()).not.toContain('provider');
    } finally {
      wrapper.unmount();
    }
  });
});

describe('FloatButtonGroup owns its trigger, model and focus', () => {
  it('routes attrs to the group once and separates current item/trigger semantics and slots', async () => {
    const shape = ref<'circle' | 'square'>('circle');
    const glyph = ref('open');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Group,
            {
              id: 'actions',
              'data-group': 'root',
              trigger: 'click',
              shape: shape.value,
              class: 'native-root',
              classNames: {
                root: 'semantic-root',
                item: 'item',
                trigger: 'trigger',
                triggerIcon: 'trigger-icon',
                triggerContent: 'trigger-content',
              },
            },
            {
              default: () => h(FloatButton, { 'aria-label': 'action' }),
              icon: () => h('i', glyph.value),
              closeIcon: () => h('b', 'close'),
              content: () => 'Actions',
            },
          ),
      }),
      { global, attachTo: document.body },
    );
    try {
      const root = wrapper.get('.apollo-float-btn-group');
      const trigger = wrapper.get('.apollo-float-btn-group-trigger');
      expect(root.classes()).toContain('semantic-root');
      expect(trigger.attributes('id')).toBeUndefined();
      expect(trigger.attributes('data-group')).toBeUndefined();
      expect(trigger.classes()).toContain('trigger');
      expect(trigger.classes()).not.toContain('item');
      expect(trigger.find('.trigger-icon i').text()).toBe('open');
      expect(trigger.find('.trigger-content').text()).toBe('Actions');
      glyph.value = 'current';
      shape.value = 'square';
      await nextTick();
      expect(trigger.find('i').text()).toBe('current');
      await trigger.trigger('click');
      expect(wrapper.get('.item').classes()).toContain('apollo-float-btn-square');
      expect(trigger.find('b').text()).toBe('close');
      expect(trigger.classes()).toContain('apollo-float-btn-individual');
      expect(wrapper.findAll('#actions')).toHaveLength(1);
    } finally {
      wrapper.unmount();
    }
  });

  it('emits one openChange/update:open/click and exposes current DOM refs', async () => {
    const onOpenChange = vi.fn();
    const onClick = vi.fn();
    const wrapper = mount(Group, {
      props: { trigger: 'click', onOpenChange, onClick },
      slots: { default: () => h(FloatButton, { 'aria-label': 'action' }) },
      global,
      attachTo: document.body,
    });
    try {
      const trigger = wrapper.get<HTMLButtonElement>('.apollo-float-btn-group-trigger');
      expect(wrapper.vm.nativeElement).toBe(wrapper.element);
      expect(trigger.attributes('aria-expanded')).toBe('false');
      const event = new MouseEvent('click', { bubbles: true });
      trigger.element.dispatchEvent(event);
      await nextTick();
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
      expect(wrapper.emitted('openChange')).toEqual([[true]]);
      expect(wrapper.emitted('update:open')).toEqual([[true]]);
      expect(onClick).toHaveBeenCalledExactlyOnceWith(event);
      expect(wrapper.emitted('click')).toEqual([[event]]);
      expect(trigger.attributes('aria-expanded')).toBe('true');
      expect(wrapper.get(`#${trigger.attributes('aria-controls')}`).classes()).toContain(
        'apollo-float-btn-group-list',
      );
    } finally {
      wrapper.unmount();
    }
  });

  it('Escape closes and returns focus only after an accepted close', async () => {
    const controlled = ref<boolean | undefined>(true);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Group, { trigger: 'click', open: controlled.value }, () =>
            h(FloatButton, { 'aria-label': 'action' }),
          ),
      }),
      { global, attachTo: document.body },
    );
    try {
      await vi.waitFor(() =>
        expect(wrapper.find('.apollo-float-btn-group-list button').exists()).toBe(true),
      );
      const item = wrapper.get<HTMLButtonElement>('.apollo-float-btn-group-list button');
      const trigger = wrapper.get<HTMLButtonElement>('.apollo-float-btn-group-trigger');
      item.element.focus();
      await item.trigger('keydown', { key: 'Escape' });
      expect(document.activeElement).toBe(item.element);
      controlled.value = false;
      await nextTick();
      expect(document.activeElement).toBe(trigger.element);
      controlled.value = undefined;
      await nextTick();
      expect(trigger.attributes('aria-expanded')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('hover interaction is keyboard accessible and keeps focus while pointer leaves', async () => {
    const wrapper = mount(Group, {
      props: { trigger: 'hover' },
      slots: { default: () => h(FloatButton, { 'aria-label': 'action' }) },
      global,
      attachTo: document.body,
    });
    try {
      const root = wrapper.get('.apollo-float-btn-group');
      const trigger = wrapper.get<HTMLButtonElement>('.apollo-float-btn-group-trigger');
      trigger.element.focus();
      await trigger.trigger('focusin');
      expect(trigger.attributes('aria-expanded')).toBe('true');
      await root.trigger('mouseleave');
      expect(trigger.attributes('aria-expanded')).toBe('true');
      await trigger.trigger('keydown', { key: 'Escape' });
      expect(trigger.attributes('aria-expanded')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('independent groups have unique controls and do not steal external focus', async () => {
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h('section', [
            ...[1, 2].map((key) => h(Group, { key, trigger: 'click' }, () => h(FloatButton))),
            h('input', { id: 'outside' }),
          ]),
      }),
      { global, attachTo: document.body },
    );
    try {
      const triggers = wrapper.findAll<HTMLButtonElement>('.apollo-float-btn-group-trigger');
      expect(triggers[0]?.attributes('aria-controls')).not.toBe(
        triggers[1]?.attributes('aria-controls'),
      );
      await triggers[0]?.trigger('click');
      const outside = wrapper.get<HTMLInputElement>('#outside').element;
      outside.focus();
      outside.click();
      await nextTick();
      expect(document.activeElement).toBe(outside);
      expect(triggers[0]?.attributes('aria-expanded')).toBe('false');
    } finally {
      wrapper.unmount();
    }
  });

  it('keeps rejected controlled proposals out of the value retained after control removal', async () => {
    const open = ref<boolean | undefined>(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Group,
            {
              trigger: 'click',
              open: open.value,
            },
            () => h(FloatButton),
          ),
      }),
      { global },
    );
    try {
      const trigger = wrapper.get('.apollo-float-btn-group-trigger');
      await trigger.trigger('click');
      expect(trigger.attributes('aria-expanded')).toBe('false');
      open.value = undefined;
      await nextTick();
      expect(trigger.attributes('aria-expanded')).toBe('false');
      await trigger.trigger('click');
      expect(trigger.attributes('aria-expanded')).toBe('true');
    } finally {
      wrapper.unmount();
    }
  });

  it('uses current Provider group semantics and disabled state without blocking child actions', async () => {
    const disabled = ref(true);
    const label = ref('provider');
    const onOpenChange = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              componentDisabled: disabled.value,
              components: {
                floatButtonGroup: {
                  classNames: { root: label.value, trigger: 'provider-trigger' },
                },
              },
            },
            () =>
              h(Group, { trigger: 'click', onOpenChange }, () =>
                h(FloatButton, { disabled: false }),
              ),
          ),
      }),
      { global },
    );
    try {
      expect(wrapper.get('.apollo-float-btn-group').classes()).toContain('provider');
      const trigger = wrapper.get<HTMLButtonElement>('.provider-trigger');
      expect(trigger.element.disabled).toBe(true);
      await trigger.trigger('click');
      expect(onOpenChange).not.toHaveBeenCalled();
      disabled.value = false;
      label.value = 'current';
      await nextTick();
      expect(wrapper.get('.apollo-float-btn-group').classes()).toContain('current');
      expect(trigger.element.disabled).toBe(false);
      await trigger.trigger('click');
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    } finally {
      wrapper.unmount();
    }
  });
});

describe('FloatButtonBackTop and PurePanel composition', () => {
  it('forwards complete dynamic slots, semantic styles and native styles', async () => {
    const label = ref('first');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            BackTop,
            {
              visibilityHeight: 0,
              shape: 'square',
              showProgress: true,
              style: ['inset-inline-end:63px', { zIndex: 0 }],
              classNames: { content: 'back-content' },
              styles: { icon: { color: 'red' } },
            },
            { icon: () => h('i', label.value), content: () => h('b', label.value) },
          ),
      }),
      { global },
    );
    try {
      await vi.waitFor(() => expect(wrapper.find('.back-content b').exists()).toBe(true));
      expect(wrapper.get('.back-content b').text()).toBe('first');
      expect(wrapper.get<HTMLElement>('button').element.style.insetInlineEnd).toBe('63px');
      expect(wrapper.get<HTMLElement>('button').element.style.zIndex).toBe('0');
      label.value = 'current';
      await nextTick();
      expect(wrapper.get('.back-content b').text()).toBe('current');
      expect(wrapper.get('i').text()).toBe('current');
    } finally {
      wrapper.unmount();
    }
  });

  it('calibrates pending target refs and preserves explicit null until a target exists', async () => {
    const target = shallowRef<HTMLElement | null>(null);
    const wrapper = mount(BackTop, {
      props: { target: () => target.value, visibilityHeight: 100 },
      global,
    });
    try {
      await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(false));
      const container = document.createElement('div');
      container.scrollTop = 500;
      target.value = container;
      await nextTick();
      await nextTick();
      expect(wrapper.find('button').exists()).toBe(true);
      target.value = null;
      await nextTick();
      await nextTick();
      expect(wrapper.get('button').attributes('hidden')).toBeDefined();
    } finally {
      wrapper.unmount();
    }
  });

  it('cancels the current scroll animation when target changes or component unmounts', async () => {
    vi.useFakeTimers();
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.scrollTop = 600;
    b.scrollTop = 500;
    const target = shallowRef(a);
    const wrapper = mount(BackTop, {
      props: { target: () => target.value, visibilityHeight: 0, duration: 450 },
      global,
    });
    try {
      await vi.advanceTimersByTimeAsync(32);
      await wrapper.get('button').trigger('click');
      await vi.advanceTimersByTimeAsync(32);
      target.value = b;
      await nextTick();
      const stopped = a.scrollTop;
      await vi.advanceTimersByTimeAsync(500);
      expect(a.scrollTop).toBe(stopped);
      await wrapper.get('button').trigger('click');
      await vi.advanceTimersByTimeAsync(32);
      wrapper.unmount();
      const afterUnmount = b.scrollTop;
      await vi.advanceTimersByTimeAsync(500);
      expect(b.scrollTop).toBe(afterUnmount);
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it('PurePanel backTop and items use the requested component and current prefix', async () => {
    const single = mount(PurePanel, { props: { backTop: true }, global });
    const items = mount(PurePanel, {
      props: { prefixCls: 'custom-float', items: [{ backTop: true }] },
      global,
    });
    try {
      await vi.waitFor(() => expect(items.find('.custom-float').exists()).toBe(true));
      expect(single.findComponent(BackTop).exists()).toBe(true);
      expect(items.find('.custom-float-group').exists()).toBe(true);
      expect(items.find('.custom-float').exists()).toBe(true);
    } finally {
      single.unmount();
      items.unmount();
    }
  });

  it('BackTop emits the actual click once and respects disabled and source motion:false', async () => {
    const container = document.createElement('div');
    container.scrollTop = 500;
    const disabled = ref(true);
    const onClick = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ConfigProvider, { theme: { token: { motion: false } } }, () =>
            h(BackTop, {
              target: () => container,
              visibilityHeight: 0,
              disabled: disabled.value,
              onClick,
            }),
          ),
      }),
      { global },
    );
    try {
      await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true));
      await wrapper.get('button').trigger('click');
      expect(container.scrollTop).toBe(500);
      expect(onClick).not.toHaveBeenCalled();
      disabled.value = false;
      await nextTick();
      const event = new MouseEvent('click', { bubbles: true });
      wrapper.get('button').element.dispatchEvent(event);
      await nextTick();
      expect(container.scrollTop).toBe(0);
      expect(onClick).toHaveBeenCalledExactlyOnceWith(event);
      expect(wrapper.findComponent(BackTop).emitted('click')).toEqual([[event]]);
    } finally {
      wrapper.unmount();
    }
  });

  it('reads progress on the current target, refreshes on resize and releases scroll/resize listeners', async () => {
    const container = document.createElement('div');
    container.scrollTop = 400;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200 });
    const remove = vi.spyOn(container, 'removeEventListener');
    const removeResize = vi.spyOn(window, 'removeEventListener');
    const wrapper = mount(BackTop, {
      props: { target: () => container, visibilityHeight: 0, showProgress: true },
      global,
    });
    try {
      await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true));
      const button = wrapper.get<HTMLElement>('button').element;
      expect(button.style.getPropertyValue('--apollo-float-btn-progress')).toBe('0.5turn');
      Object.defineProperty(container, 'scrollHeight', { value: 1800, configurable: true });
      window.dispatchEvent(new Event('resize'));
      await vi.waitFor(() =>
        expect(button.style.getPropertyValue('--apollo-float-btn-progress')).toBe('0.25turn'),
      );
      await wrapper.setProps({ showProgress: false });
      expect(button.style.getPropertyValue('--apollo-float-btn-progress')).toBe('');
      wrapper.unmount();
      expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(removeResize).toHaveBeenCalledWith('resize', expect.any(Function));
    } finally {
      wrapper.unmount();
    }
  });

  it('renders on the server without resolving the scroll target or touching browser globals', async () => {
    const target = vi.fn(() => null);
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      const html = await renderToString(
        createSSRApp(
          defineComponent({
            setup: () => () =>
              h('section', [
                h(Group, { trigger: 'click', open: true }, { default: () => h(FloatButton) }),
                h(BackTop, { target, visibilityHeight: 0 }),
              ]),
          }),
        ),
      );
      expect(html).toContain('apollo-float-btn-group');
      expect(html).toContain('aria-expanded="true"');
      expect(target).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('resolves a hidden BackTop default target from its actual mount document', async () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const owner = frame.contentDocument;
    if (!owner) throw new Error('Missing iframe document');
    owner.documentElement.scrollTop = 500;
    const add = vi.spyOn(owner, 'addEventListener');
    const wrapper = mount(BackTop, { props: { duration: 0 }, global, attachTo: owner.body });
    try {
      await vi.waitFor(() => expect(wrapper.find('button').exists()).toBe(true));
      expect(wrapper.vm.nativeElement?.ownerDocument).toBe(owner);
      expect(add).toHaveBeenCalledWith('scroll', expect.any(Function));
      await wrapper.get('button').trigger('click');
      expect(owner.documentElement.scrollTop).toBe(0);
    } finally {
      wrapper.unmount();
      frame.remove();
    }
  });
});
