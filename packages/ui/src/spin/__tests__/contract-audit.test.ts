import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommentVNode, createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import { Spin, setDefaultIndicator } from '../index';
import type { SpinConfig, SpinRef } from '../interface';

const disposers: Array<() => void> = [];
function track<T extends { unmount(): void }>(wrapper: T): T {
  disposers.push(() => wrapper.unmount());
  return wrapper;
}
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  setDefaultIndicator(undefined);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Spin complete contract: native content and current configuration', () => {
  it('renders all indicator nodes after conditional empty content and preserves native editors', async () => {
    const label = ref('First');
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              Spin,
              {},
              {
                indicator: () => [
                  createCommentVNode('conditional first node'),
                  h('input', { key: 'draft', 'aria-label': 'Indicator draft' }),
                  h('button', { key: 'action', type: 'button' }, label.value),
                ],
              },
            ),
        ),
        { attachTo: document.body },
      ),
    );
    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(wrapper.findAll('button')).toHaveLength(1);
    const editor = wrapper.get('input').element;
    editor.value = 'Native draft';
    editor.focus();
    label.value = 'Current';
    await nextTick();
    expect(wrapper.get('button').text()).toBe('Current');
    expect(wrapper.get('input').element).toBe(editor);
    expect(editor.value).toBe('Native draft');
    expect(document.activeElement).toBe(editor);
  });

  it('an existing empty indicator slot suppresses Provider and global defaults', () => {
    setDefaultIndicator(h('em', { class: 'global-indicator' }, 'Global'));
    const wrapper = track(
      mount(ConfigProvider, {
        props: {
          components: { spin: { indicator: h('em', { class: 'provider-indicator' }, 'Provider') } },
        },
        slots: { default: () => h(Spin, {}, { indicator: () => [] }) },
      }),
    );
    expect(wrapper.find('.provider-indicator').exists()).toBe(false);
    expect(wrapper.find('.global-indicator').exists()).toBe(false);
    expect(wrapper.find('.apollo-spin-dot-holder').exists()).toBe(false);
  });

  it('passes current progress as a named indicator slot scope without cloning child attributes', async () => {
    const percent = ref(37);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              Spin,
              { percent: percent.value },
              {
                indicator: (scope?: { percent?: number }) =>
                  h('output', { 'aria-label': 'Custom progress' }, String(scope?.percent)),
              },
            ),
        ),
      ),
    );
    expect(wrapper.get('output').text()).toBe('37');
    expect(wrapper.get('output').attributes('percent')).toBeUndefined();
    expect(wrapper.get('output').classes()).toEqual([]);
    percent.value = 64;
    await nextTick();
    expect(wrapper.get('output').text()).toBe('64');
  });

  it('does not create an empty description wrapper or fall back to its prop', () => {
    const wrapper = track(
      mount(Spin, {
        props: { description: 'Prop description' },
        slots: { description: () => [createCommentVNode('empty')] },
      }),
    );
    expect(wrapper.find('.apollo-spin-description').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Prop description');
  });

  it('indicator semantics own the visible progress ring as well as the four dots', async () => {
    const wrapper = track(
      mount(Spin, {
        props: {
          percent: 42,
          classNames: { indicator: 'owned-indicator' },
          styles: { indicator: { color: 'red' } },
        },
      }),
    );
    await nextTick();
    expect(wrapper.get('.owned-indicator').find('[role="progressbar"]').exists()).toBe(true);
    expect(wrapper.get('.owned-indicator').attributes('style')).toContain('color: red');
  });

  it.each(['Global text', 0])('consumes the declared global VNodeChild value %s', (content) => {
    setDefaultIndicator(content);
    const wrapper = track(mount(Spin));
    expect(wrapper.text()).toBe(String(content));
  });

  it('reads the current global default on the next actual render', async () => {
    const wrapper = track(mount(Spin));
    setDefaultIndicator(h('em', { class: 'current-global' }, 'Current global'));
    await nextTick();
    expect(wrapper.find('.current-global').exists()).toBe(false);
    await wrapper.setProps({ description: 'Render again' });
    expect(wrapper.find('.current-global').text()).toBe('Current global');
  });

  it('reacts to the addition and removal of an entire default slot', async () => {
    const present = ref(false);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              Spin,
              { spinning: false },
              present.value
                ? { default: () => h('input', { 'aria-label': 'Conditional draft' }) }
                : {},
            ),
        ),
      ),
    );
    expect(wrapper.find('input').exists()).toBe(false);
    present.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-spin-container input').exists()).toBe(true);
    present.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-spin-container').exists()).toBe(false);
  });

  it('consumes all four component tokens and removes overrides with the current theme', async () => {
    const themed = ref(true);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                theme: themed.value
                  ? {
                      components: {
                        Spin: { contentHeight: '96px', dotSize: 31, dotSizeSM: 13, dotSizeLG: 47 },
                      },
                    }
                  : undefined,
              },
              {
                default: () =>
                  h(Spin, {}, { default: () => h('input', { 'aria-label': 'Theme draft' }) }),
              },
            ),
        ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('.apollo-spin');
    const nativeBefore = wrapper.getComponent(Spin).vm.nativeElement;
    const editor = wrapper.get('input').element;
    const styles = root.attributes('style');
    for (const declaration of [
      '--apollo-spin-content-height: 96px',
      '--apollo-spin-dot-size: 31px',
      '--apollo-spin-dot-size-sm: 13px',
      '--apollo-spin-dot-size-lg: 47px',
    ])
      expect(styles).toContain(declaration);
    themed.value = false;
    await nextTick();
    expect(wrapper.getComponent(Spin).vm.nativeElement).toBe(nativeBefore);
    expect(root.attributes('style') ?? '').not.toContain('--apollo-spin-dot-size: 31px');
    expect(wrapper.get('input').element).toBe(editor);
  });

  it('keeps native attrs, once listeners and exposed root current through prefix and attrs-only updates', async () => {
    const phase = ref(0);
    const api = ref<SpinRef | null>(null);
    const click = vi.fn();
    const once = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(Spin, {
              ref: api,
              prefixCls: phase.value === 1 ? 'owned-spin' : undefined,
              class: ['native-root', { current: phase.value > 0 }],
              style:
                phase.value === 0
                  ? 'color:red;padding:3px'
                  : [{ color: 'blue' }, { padding: '7px' }],
              'data-phase': String(phase.value),
              'aria-live': phase.value ? 'off' : 'assertive',
              onClick: click,
              onClickOnce: once,
            }),
        ),
        { attachTo: document.body },
      ),
    );
    const root = wrapper.element;
    expect(api.value?.nativeElement).toBe(root);
    expect(wrapper.attributes('style')).toContain('padding: 3px');
    await wrapper.trigger('click');
    for (const value of [1, 2]) {
      phase.value = value;
      await nextTick();
      expect(wrapper.element).toBe(root);
      expect(api.value?.nativeElement).toBe(root);
      expect(wrapper.attributes('data-phase')).toBe(String(value));
      expect(wrapper.attributes('aria-live')).toBe('off');
      expect(wrapper.attributes('style')).toContain('color: blue');
      expect(wrapper.classes()).toContain(value === 1 ? 'owned-spin' : 'apollo-spin');
      expect(
        wrapper.find(value === 1 ? '.owned-spin-indicator' : '.apollo-spin-indicator').exists(),
      ).toBe(true);
      await wrapper.trigger('click');
    }
    expect(click).toHaveBeenCalledTimes(3);
    expect(once).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    expect(api.value).toBeNull();
  });

  it('reads replacement and removal of all five Provider fields while keeping local semantics and sibling ownership', async () => {
    const config = ref<SpinConfig>({
      className: 'provider-first',
      style: { padding: '3px' },
      classNames: { section: 'provider-section' },
      styles: { indicator: { color: 'red' } },
      indicator: h('em', 'First indicator'),
    });
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h('main', [
              h(ConfigProvider, { components: { spin: config.value } }, () =>
                h(Spin, {
                  id: 'configured',
                  percent: 37,
                  classNames: ({ props }) => ({ root: `progress-${props.percent}` }),
                  styles: { root: { margin: '5px' } },
                }),
              ),
              h(Spin, { id: 'independent' }),
            ]),
        ),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('#configured').element;
    expect(wrapper.get('#configured').classes()).toContain('provider-first');
    expect(wrapper.get('#configured').classes()).toContain('progress-37');
    expect(wrapper.find('#configured .provider-section').exists()).toBe(true);
    expect(wrapper.get('#configured .apollo-spin-indicator').attributes('style')).toContain(
      'color: red',
    );
    expect(wrapper.get('#configured em').text()).toBe('First indicator');
    config.value = {
      className: 'provider-current',
      style: { padding: '7px' },
      classNames: { section: 'current-section' },
      styles: { indicator: { color: 'blue' } },
      indicator: h('strong', 'Current indicator'),
    };
    await nextTick();
    expect(wrapper.get('#configured').element).toBe(root);
    expect(wrapper.get('#configured').classes()).toContain('provider-current');
    expect(wrapper.get('#configured').classes()).not.toContain('provider-first');
    expect(wrapper.get('#configured').attributes('style')).toContain('padding: 7px');
    expect(wrapper.get('#configured').attributes('style')).toContain('margin: 5px');
    expect(wrapper.find('#configured .current-section').exists()).toBe(true);
    expect(wrapper.get('#configured .apollo-spin-indicator').attributes('style')).toContain(
      'color: blue',
    );
    expect(wrapper.get('#configured strong').text()).toBe('Current indicator');
    config.value = {};
    await nextTick();
    expect(wrapper.get('#configured').element).toBe(root);
    expect(wrapper.get('#configured').classes()).toEqual(
      expect.arrayContaining(['apollo-spin', 'progress-37']),
    );
    expect(wrapper.get('#configured').classes()).not.toContain('provider-current');
    expect(wrapper.get('#configured').attributes('style')).toBe('margin: 5px;');
    expect(wrapper.find('#configured .current-section').exists()).toBe(false);
    expect(wrapper.get('#configured [role="progressbar"]').attributes('aria-valuenow')).toBe('37');
    expect(wrapper.find('#independent [role="progressbar"]').exists()).toBe(false);
    expect(wrapper.find('#independent strong').exists()).toBe(false);
  });
});

describe('Spin complete contract: native timing and universal progress', () => {
  it('shows a zero-delay change by the Vue update without a synthetic extra timer', async () => {
    vi.useFakeTimers();
    const wrapper = track(mount(Spin, { props: { spinning: false } }));
    await wrapper.setProps({ spinning: true });
    expect(wrapper.classes()).toContain('apollo-spin-spinning');
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retains positive delay cancellation, immediate closing and unmount cleanup', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Spin, { props: { spinning: true, delay: 40, percent: 'auto' } });
    try {
      expect(wrapper.attributes('aria-busy')).toBe('false');
      await vi.advanceTimersByTimeAsync(20);
      await wrapper.setProps({ spinning: false });
      await vi.advanceTimersByTimeAsync(40);
      expect(wrapper.attributes('aria-busy')).toBe('false');
      await wrapper.setProps({ spinning: true, delay: 10 });
      await vi.advanceTimersByTimeAsync(10);
      expect(wrapper.attributes('aria-busy')).toBe('true');
    } finally {
      wrapper.unmount();
    }
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, 42])(
    'renders the explicit %s percent in SSR with a progress name',
    async (percent) => {
      const html = await renderToString(createSSRApp({ render: () => h(Spin, { percent }) }));
      expect(html).toContain('role="progressbar"');
      expect(html).toContain(`aria-valuenow="${percent}"`);
      expect(html).toMatch(/aria-label="[^"]+"/);
    },
  );

  it('keeps undefined progress indeterminate and nonfinite input out of ARIA', async () => {
    const wrapper = track(mount(Spin));
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    await wrapper.setProps({ percent: Number.NaN });
    await nextTick();
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false);
    expect(wrapper.html()).not.toContain('NaN');
    expect(wrapper.findAll('.apollo-spin-dot-item')).toHaveLength(4);
  });
});
