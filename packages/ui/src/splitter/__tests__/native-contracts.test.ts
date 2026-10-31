import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { MockResizeObserver } from '../../../../../vitest.setup';
import { ConfigProvider } from '../../config-provider';
import { Splitter, SplitterPanel } from '../index';
import type { SplitterRef } from '../interface';
import NativeSplitter from './fixtures/NativeSplitter.vue';

async function measure(root: Element, width = 500, height = 300) {
  await nextTick();
  Object.defineProperties(root, {
    offsetWidth: { value: width, configurable: true },
    offsetHeight: { value: height, configurable: true },
  });
  for (const observer of MockResizeObserver.instances) observer.trigger();
  await nextTick();
  await nextTick();
}

async function drag(root: Element, index: number, offset: number) {
  const bar = root.querySelectorAll('.apollo-splitter-bar-dragger')[index];
  expect(bar).toBeInstanceOf(HTMLElement);
  bar?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
  await nextTick();
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 + offset }));
  await nextTick();
  window.dispatchEvent(new MouseEvent('mouseup'));
  await nextTick();
}

const bases = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>('.apollo-splitter-panel')].map(
    (element) => element.style.flexBasis,
  );

describe('native Splitter contracts', () => {
  it('consumes the actual SFC Panel prop casing and Boolean attributes', async () => {
    const wrapper = mount(NativeSplitter);
    const root = wrapper.get('.main-splitter');
    await measure(root.element, 800, 180);
    expect(bases(root.element)).toEqual(['200px', '200px', '400px']);
    expect(root.findAll('.apollo-splitter-bar-collapse-bar')).toHaveLength(4);
  });
  it('owns camelCase resize lifecycle events and natural listeners exactly once', async () => {
    const start = vi.fn();
    const resize = vi.fn();
    const end = vi.fn();
    const wrapper = mount(Splitter, {
      props: { onResizeStart: start, onResize: resize, onResizeEnd: end },
      slots: { default: () => [h(SplitterPanel), h(SplitterPanel)] },
    });
    await measure(wrapper.element);
    await drag(wrapper.element, 0, 40);
    expect(start).toHaveBeenCalledExactlyOnceWith([250, 250]);
    expect(resize).toHaveBeenCalledExactlyOnceWith([290, 210]);
    expect(end).toHaveBeenCalledExactlyOnceWith([290, 210]);
    expect(wrapper.emitted('resizeStart')).toEqual([[[250, 250]]]);
    expect(wrapper.emitted('resizeEnd')).toEqual([[[290, 210]]]);
    expect(wrapper.emitted('resize-start')).toBeUndefined();
  });

  it('mounts the actual Panel with current native attrs and a real public ref', async () => {
    const panel = ref<SplitterRef | null>(null);
    const second = ref(false);
    const clicked = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            {},
            {
              default: () => [
                h(
                  SplitterPanel,
                  {
                    ref: panel,
                    key: 'a',
                    'data-current': second.value ? 'second' : 'first',
                    class: second.value ? ['second', { active: true }] : 'first',
                    style: second.value
                      ? [{ paddingTop: '3px' }, { paddingTop: '7px' }]
                      : 'padding-top:2px',
                    onClick: clicked,
                  },
                  { default: () => [0, h('input', { 'aria-label': 'Draft' }), 'Text'] },
                ),
                h(SplitterPanel, { key: 'b' }),
              ],
            },
          ),
      }),
    );
    const input = wrapper.get<HTMLInputElement>('input');
    await input.setValue('retained');
    const root = wrapper.get('.apollo-splitter-panel').element;
    expect(panel.value?.nativeElement).toBe(root);
    await wrapper.get('.apollo-splitter-panel').trigger('click');
    expect(clicked).toHaveBeenCalledOnce();
    second.value = true;
    await nextTick();
    const current = wrapper.get('.apollo-splitter-panel');
    expect(current.attributes('data-current')).toBe('second');
    expect(current.classes()).toEqual(expect.arrayContaining(['second', 'active']));
    expect(current.classes()).not.toContain('first');
    expect(current.attributes('style')).toContain('padding-top: 7px');
    expect(current.text()).toBe('0Text');
    expect(current.element).toBe(root);
    expect(wrapper.get('input').element).toBe(input.element);
  });

  it('reads replaced conditional slots during render and retains keyed Panel content', async () => {
    const shown = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () => {
          const order = shown.value ? ['c', 'a', 'b'] : ['a', 'b'];
          return h(
            Splitter,
            {},
            {
              default: () =>
                order.map((key) =>
                  h(
                    SplitterPanel,
                    { key, 'data-key': key },
                    {
                      default: () => h('input', { 'aria-label': key }),
                    },
                  ),
                ),
            },
          );
        },
      }),
    );
    const editor = wrapper.get<HTMLInputElement>('input[aria-label="a"]');
    await editor.setValue('draft');
    shown.value = true;
    await nextTick();
    expect(
      wrapper.findAll('.apollo-splitter-panel').map((node) => node.attributes('data-key')),
    ).toEqual(['c', 'a', 'b']);
    expect(wrapper.get<HTMLInputElement>('input[aria-label="a"]').element).toBe(editor.element);
    expect(editor.element.value).toBe('draft');
  });

  it('rejects controlled proposals, accepts current size props and releases the last accepted sizes', async () => {
    const size = ref<number[] | undefined>([200, 300]);
    const resized = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            { onResize: resized },
            {
              default: () => [
                h(SplitterPanel, { key: 'a', size: size.value?.[0], defaultSize: 100 }),
                h(SplitterPanel, { key: 'b', size: size.value?.[1], defaultSize: 400 }),
              ],
            },
          ),
      }),
    );
    await measure(wrapper.element);
    await drag(wrapper.element, 0, 60);
    expect(resized).toHaveBeenCalledExactlyOnceWith([260, 240]);
    expect(bases(wrapper.element)).toEqual(['200px', '300px']);
    size.value = undefined;
    await nextTick();
    expect(bases(wrapper.element)).toEqual(['200px', '300px']);
    size.value = [230, 270];
    await nextTick();
    size.value = undefined;
    await nextTick();
    expect(bases(wrapper.element)).toEqual(['230px', '270px']);
  });

  it('keeps uncontrolled sizes with business keys as panels reorder', async () => {
    const order = ref(['a', 'b', 'c']);
    const defaults: Record<string, string> = { a: '20%', b: '30%', c: '50%' };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            {},
            {
              default: () =>
                order.value.map((key) => h(SplitterPanel, { key, defaultSize: defaults[key] })),
            },
          ),
      }),
    );
    await measure(wrapper.element);
    await drag(wrapper.element, 0, 50);
    expect(bases(wrapper.element)).toEqual(['150px', '100px', '250px']);
    order.value = ['c', 'a', 'b'];
    await nextTick();
    expect(bases(wrapper.element)).toEqual(['250px', '150px', '100px']);
  });

  it('restores the collapsed panel own remembered size after reorder', async () => {
    const order = ref(['a', 'b', 'c']);
    const defaults: Record<string, string> = { a: '20%', b: '30%', c: '50%' };
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            {},
            {
              default: () =>
                order.value.map((key) =>
                  h(SplitterPanel, { key, collapsible: true, defaultSize: defaults[key] }),
                ),
            },
          ),
      }),
    );
    await measure(wrapper.element, 1000);
    await wrapper.get('.apollo-splitter-bar-collapse-bar-start').trigger('click');
    expect(bases(wrapper.element)).toEqual(['0px', '500px', '500px']);
    order.value = ['c', 'a', 'b'];
    await nextTick();
    await wrapper
      .findAll('.apollo-splitter-bar')[1]
      ?.get('.apollo-splitter-bar-collapse-bar-end')
      .trigger('click');
    expect(bases(wrapper.element)).toEqual(['500px', '200px', '300px']);
  });

  it('offers keyboard resize with the current bounds and owned lifecycle', async () => {
    const resized = vi.fn();
    const wrapper = mount(Splitter, {
      props: { onResize: resized },
      slots: {
        default: () => [h(SplitterPanel, { min: '20%' }), h(SplitterPanel, { min: '20%' })],
      },
    });
    await measure(wrapper.element);
    const separator = wrapper.get('[role="separator"]');
    expect(separator.attributes('tabindex')).toBe('0');
    await separator.trigger('keydown', { key: 'ArrowRight' });
    expect(bases(wrapper.element)).toEqual(['260px', '240px']);
    await separator.trigger('keydown', { key: 'End' });
    expect(bases(wrapper.element)).toEqual(['400px', '100px']);
    await separator.trigger('keydown', { key: 'Home' });
    expect(bases(wrapper.element)).toEqual(['100px', '400px']);
    expect(resized).toHaveBeenCalledTimes(3);
  });

  it('consumes current Splitter component tokens and active dragger styles', async () => {
    const theme = shallowRef<ThemeConfig | undefined>({
      components: { Splitter: { splitBarSize: 4, splitTriggerSize: 12, resizeSpinnerSize: 28 } },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { theme: theme.value },
            {
              default: () =>
                h(
                  Splitter,
                  { styles: { dragger: { default: { color: 'red' }, active: { color: 'blue' } } } },
                  {
                    default: () => [h(SplitterPanel), h(SplitterPanel)],
                  },
                ),
            },
          ),
      }),
    );
    const root = wrapper.get('.apollo-splitter');
    expect(root.attributes('style')).toContain('--apollo-splitter-split-bar-size: 4px');
    expect(root.attributes('style')).toContain('--apollo-splitter-split-trigger-size: 12px');
    expect(root.attributes('style')).toContain('--apollo-splitter-resize-spinner-size: 28px');
    expect(root.attributes('style')).toContain('--apollo-splitter-split-bar-draggable-size: 28px');
    const separator = wrapper.get('[role="separator"]');
    await separator.trigger('mousedown', { clientX: 100 });
    expect(separator.attributes('style')).toContain('color: blue');
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    theme.value = undefined;
    await nextTick();
    expect(root.attributes('style')).not.toContain('--apollo-splitter-split-bar-size');
  });

  it('keeps defaultSize initial and renders the actual current content on the server', async () => {
    const initial = ref('40%');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            {},
            {
              default: () => [h(SplitterPanel, { defaultSize: initial.value }), h(SplitterPanel)],
            },
          ),
      }),
    );
    await measure(wrapper.element);
    initial.value = '80%';
    await nextTick();
    expect(bases(wrapper.element)).toEqual(['200px', '300px']);
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            Splitter,
            {},
            {
              default: () => [
                h(
                  SplitterPanel,
                  { defaultSize: '40%', 'data-server': 'actual' },
                  { default: () => [0, 'Server'] },
                ),
                h(SplitterPanel),
              ],
            },
          ),
      }),
    );
    expect(html).toContain('data-server="actual"');
    expect(html).toContain('flex-basis:40%');
    expect(html).toContain('0Server');
  });

  it('reads current Provider and semantic props and releases removed configuration', async () => {
    const configured = ref(true);
    const vertical = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: configured.value
                ? {
                    splitter: {
                      className: 'provider-root',
                      style: { paddingTop: '3px' },
                      classNames: { panel: 'provider-panel', dragger: 'provider-grip' },
                    },
                  }
                : undefined,
            },
            {
              default: () =>
                h(
                  Splitter,
                  {
                    vertical: vertical.value,
                    classNames: ({ props }) => ({ root: `axis-${props.orientation}` }),
                  },
                  { default: () => [h(SplitterPanel), h(SplitterPanel)] },
                ),
            },
          ),
      }),
    );
    const root = wrapper.get('.apollo-splitter');
    expect(root.classes()).toEqual(expect.arrayContaining(['provider-root', 'axis-horizontal']));
    expect(wrapper.get('.apollo-splitter-panel').classes()).toContain('provider-panel');
    expect(wrapper.get('[role="separator"]').classes()).toContain('provider-grip');
    configured.value = false;
    vertical.value = true;
    await nextTick();
    expect(root.classes()).toContain('axis-vertical');
    expect(root.classes()).not.toContain('provider-root');
    expect(wrapper.get('.apollo-splitter-panel').classes()).not.toContain('provider-panel');
    expect(root.attributes('style') ?? '').not.toContain('padding-top');
  });

  it('clamps RTL lazy preview and commits exactly once on release', async () => {
    const resized = vi.fn();
    const ended = vi.fn();
    const wrapper = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: {
        default: () =>
          h(
            Splitter,
            { lazy: true, onResize: resized, onResizeEnd: ended },
            {
              default: () => [
                h(SplitterPanel, { min: '20%', defaultSize: '40%' }),
                h(SplitterPanel, { min: '20%' }),
              ],
            },
          ),
      },
    });
    const root = wrapper.get('.apollo-splitter');
    await measure(root.element);
    await root.get('[role="separator"]').trigger('mousedown', { clientX: 100 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: -900 }));
    await nextTick();
    expect(bases(root.element)).toEqual(['200px', '300px']);
    expect(resized).not.toHaveBeenCalled();
    expect(root.get('.apollo-splitter-bar-preview').attributes('style')).toContain('-200px');
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(bases(root.element)).toEqual(['400px', '100px']);
    expect(resized).toHaveBeenCalledExactlyOnceWith([400, 100]);
    expect(ended).toHaveBeenCalledExactlyOnceWith([400, 100]);
  });

  it('cancels a disabled or removed active boundary and releases its actual listeners and observer', async () => {
    const enabled = ref(true);
    const shown = ref(true);
    const resized = vi.fn();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            { lazy: true, onResize: resized },
            {
              default: () => [
                h(SplitterPanel, { key: 'a', resizable: enabled.value }),
                ...(shown.value ? [h(SplitterPanel, { key: 'b' })] : []),
              ],
            },
          ),
      }),
    );
    await measure(wrapper.element);
    await wrapper.get('[role="separator"]').trigger('mousedown', { clientX: 100 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 170 }));
    await nextTick();
    enabled.value = false;
    await nextTick();
    expect(wrapper.find('.apollo-splitter-mask').exists()).toBe(false);
    expect(wrapper.get('[role="separator"]').attributes('tabindex')).toBe('-1');
    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(resized).not.toHaveBeenCalled();
    const events = ['mousemove', 'mouseup', 'touchmove', 'touchend', 'touchcancel'];
    const listeners = add.mock.calls.filter(([event]) => events.includes(event));
    for (const [event, listener] of listeners) {
      expect(remove).toHaveBeenCalledWith(event, listener);
    }
    shown.value = false;
    await nextTick();
    expect(wrapper.find('[role="separator"]').exists()).toBe(false);
    const root = wrapper.element;
    wrapper.unmount();
    expect([...MockResizeObserver.instances].every((observer) => !observer.targets.has(root))).toBe(
      true,
    );
  });

  it('cancels a pending full-layout size snapshot when remote panel keys reorder', async () => {
    const order = ref(['a', 'b', 'c', 'd']);
    const resize = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            { lazy: true, onResize: resize },
            {
              default: () => order.value.map((key) => h(SplitterPanel, { key })),
            },
          ),
      }),
    );
    await measure(wrapper.element);
    await wrapper.findAll('[role="separator"]')[0]?.trigger('mousedown', { clientX: 100 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130 }));
    await nextTick();
    order.value = ['a', 'b', 'd', 'c'];
    await nextTick();
    expect(wrapper.find('.apollo-splitter-mask').exists()).toBe(false);
    window.dispatchEvent(new MouseEvent('mouseup'));
    await nextTick();
    expect(resize).not.toHaveBeenCalled();
  });

  it('emits accepted collapse proposals once and respects Panel destruction ownership', async () => {
    const destroy = ref(false);
    const collapse = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            Splitter,
            { onCollapse: collapse, destroyOnHidden: destroy.value },
            {
              default: () => [
                h(
                  SplitterPanel,
                  { key: 'a', collapsible: true, defaultSize: '40%' },
                  { default: () => h('input') },
                ),
                h(SplitterPanel, { key: 'b', collapsible: true }),
              ],
            },
          ),
      }),
    );
    await measure(wrapper.element);
    const editor = wrapper.get('input').element;
    await wrapper
      .get('.apollo-splitter-bar-collapse-bar-start')
      .trigger('keydown', { key: 'Enter' });
    expect(collapse).toHaveBeenCalledExactlyOnceWith([true, false], [0, 500]);
    expect(wrapper.get('input').element).toBe(editor);
    destroy.value = true;
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(false);
    await wrapper.get('.apollo-splitter-bar-collapse-bar-end').trigger('keydown', { key: ' ' });
    expect(bases(wrapper.element)).toEqual(['200px', '300px']);
    expect(wrapper.get('input').element).not.toBe(editor);
  });
});
