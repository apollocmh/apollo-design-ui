import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref, type StyleValue, shallowRef } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider } from '../../config-provider';
import MaxCountDemo from '../demo/max-count.vue';
import { Avatar, AvatarGroup } from '../index';

const wrappers: { unmount(): void }[] = [];
const keep = <T extends { unmount(): void }>(w: T): T => {
  wrappers.push(w);
  return w;
};
const children = () => ['A', 'B', 'C'].map((s) => h(Avatar, { key: s }, () => s));
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Avatar complete contract audit', () => {
  it('inherits numeric Group size and updates to explicit child size', async () => {
    const w = keep(mount(AvatarGroup, { props: { size: 48 }, slots: { default: children } }));
    expect(w.find('.apollo-avatar').attributes('style')).toContain('width: 48px');
    await w.setProps({ size: 0 });
    expect(w.find('.apollo-avatar').attributes('style')).toContain('width: 0px');
  });
  it('nested Groups retain explicit zero size', () => {
    const w = keep(
      mount(() => h(AvatarGroup, { size: 48 }, () => h(AvatarGroup, { size: 0 }, children))),
    );
    expect(w.find('.apollo-avatar').attributes('style')).toContain('width: 0px');
  });
  it('preserves keyed child draft state on reorder', async () => {
    const order = ref(['A', 'B']);
    const Child = defineComponent({
      props: { name: { type: String, required: true } },
      setup(p) {
        const draft = ref(p.name);
        return () =>
          h(Avatar, null, () =>
            h('input', {
              value: draft.value,
              'aria-label': p.name,
              onInput: (e: Event) => {
                if (e.target instanceof HTMLInputElement) draft.value = e.target.value;
              },
            }),
          );
      },
    });
    const w = keep(
      mount(
        () => h(AvatarGroup, null, () => order.value.map((name) => h(Child, { key: name, name }))),
        { attachTo: document.body },
      ),
    );
    const input = w.get('input[aria-label="A"]');
    await input.setValue('A draft');
    const node = input.element;
    order.value.reverse();
    await nextTick();
    expect(w.get('input[aria-label="A"]').element).toBe(node);
    expect(w.get<HTMLInputElement>('input[aria-label="A"]').element.value).toBe('A draft');
  });
  it('updates only native Group attrs without requiring another prop change', async () => {
    const attrs = shallowRef<{ class: string; style: StyleValue; 'data-current': string }>({
      class: 'first',
      style: 'padding: 3px',
      'data-current': 'first',
    });
    const w = keep(mount(() => h(AvatarGroup, attrs.value, { default: children })));
    const root = w.element;
    attrs.value = { class: 'second', style: [{ padding: '7px' }], 'data-current': 'second' };
    await nextTick();
    expect(w.element).toBe(root);
    expect(w.classes()).toContain('second');
    expect(w.classes()).not.toContain('first');
    expect(w.attributes('style')).toContain('padding: 7px');
    expect(w.attributes('data-current')).toBe('second');
  });
  it('reads current Provider avatar config including replacement and removal', async () => {
    const config = shallowRef({ className: 'first', style: { marginInline: '3px' } });
    const w = keep(
      mount(
        () =>
          h(ConfigProvider, { components: { avatar: config.value } }, () =>
            h(Avatar, null, () => 'U'),
          ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const root = w.get('.apollo-avatar').element;
    config.value = { className: 'second', style: { marginInline: '7px' } };
    await nextTick();
    expect(w.get('.apollo-avatar').classes()).toContain('second');
    expect(root.getAttribute('style')).toContain('margin-inline: 7px');
    config.value = { className: '', style: { marginInline: '' } };
    await nextTick();
    expect(root.classList.contains('second')).toBe(false);
    expect(root.getAttribute('style') ?? '').not.toContain('margin-inline: 7px');
  });
  it('native click listeners merge and once listeners emit native MouseEvents once', async () => {
    const first = vi.fn(),
      second = vi.fn(),
      once = vi.fn();
    const w = keep(mount(Avatar, { attrs: { onClick: [first, second], onClickOnce: once } }));
    await w.trigger('click');
    await w.trigger('click');
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(first.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });
  it('error emits the original Event once and once listeners use the same payload', async () => {
    const first = vi.fn(),
      second = vi.fn(),
      once = vi.fn();
    const w = keep(
      mount(Avatar, {
        props: { src: 'bad.png' },
        attrs: { onError: [first, second], onErrorOnce: once },
        slots: { default: () => 'U' },
      }),
    );
    const event = new Event('error');
    w.get('img').element.dispatchEvent(event);
    await nextTick();
    expect(first).toHaveBeenCalledExactlyOnceWith(event);
    expect(second).toHaveBeenCalledExactlyOnceWith(event);
    expect(once).toHaveBeenCalledExactlyOnceWith(event);
    expect(w.find('img').exists()).toBe(false);
  });
  it('beforeFallback may cancel without treating event listener return values as cancellation', async () => {
    const beforeFallback = vi.fn(() => false),
      onError = vi.fn(() => false);
    const w = keep(
      mount(Avatar, {
        props: { src: 'bad.png', beforeFallback },
        attrs: { onError },
        slots: { default: () => 'U' },
      }),
    );
    await w.get('img').trigger('error');
    expect(beforeFallback).toHaveBeenCalledTimes(1);
    expect(w.find('img').exists()).toBe(true);
    await w.setProps({ beforeFallback: () => undefined });
    await w.get('img').trigger('error');
    expect(w.find('img').exists()).toBe(false);
  });
  it('srcSet change retries a failed image without needing a different src', async () => {
    const w = keep(
      mount(Avatar, {
        props: { src: 'bad.png', srcSet: 'one.png 1x' },
        slots: { default: () => 'U' },
      }),
    );
    await w.get('img').trigger('error');
    expect(w.find('img').exists()).toBe(false);
    await w.setProps({ srcSet: 'two.png 2x' });
    expect(w.find('img').exists()).toBe(true);
    expect(w.get('img').attributes('srcset')).toBe('two.png 2x');
  });
  it('the default image is decorative and explicit alt still wins', async () => {
    const w = keep(mount(Avatar, { props: { src: 'image.png' } }));
    expect(w.get('img').attributes('alt')).toBe('');
    await w.setProps({ alt: 'Olivia' });
    expect(w.get('img').attributes('alt')).toBe('Olivia');
  });
  it('complete image slot suppresses src, keeps all nodes and explicit empty suppresses fallback', async () => {
    const mode = ref('full');
    const w = keep(
      mount(() =>
        h(
          Avatar,
          { src: 'image.png' },
          mode.value === 'absent'
            ? {}
            : {
                image: () =>
                  mode.value === 'empty' ? [] : [h('span', 'First'), h('span', 'Tail'), 0],
              },
        ),
      ),
    );
    expect(w.text()).toBe('FirstTail0');
    expect(w.find('img').exists()).toBe(false);
    mode.value = 'empty';
    await nextTick();
    expect(w.text()).toBe('');
    expect(w.find('img').exists()).toBe(false);
    mode.value = 'absent';
    await nextTick();
    expect(w.find('img').exists()).toBe(true);
  });
  it('complete icon slot suppresses data, keeps all nodes and conditionally returns to data', async () => {
    const on = ref(true);
    const w = keep(
      mount(() =>
        h(
          Avatar,
          { icon: 'Data' },
          on.value ? { icon: () => [h('span', 'First'), h('span', 'Tail'), 0] } : {},
        ),
      ),
    );
    expect(w.text()).toBe('FirstTail0');
    expect(w.classes()).toContain('apollo-avatar-icon');
    on.value = false;
    await nextTick();
    expect(w.text()).toBe('Data');
  });
  it('complete VNode image arrays and numeric zero are consumed as declared', async () => {
    const w = keep(mount(Avatar, { props: { src: [h('span', 'First'), h('span', 'Tail'), 0] } }));
    expect(w.text()).toBe('FirstTail0');
    await w.setProps({ src: 0 });
    expect(w.text()).toBe('0');
  });
  it('SSR text is visible and native roots are stable', async () => {
    const html = await renderToString(createSSRApp(() => h(Avatar, null, () => 'Olivia')));
    expect(html).toContain('Olivia');
    expect(html).not.toContain('opacity:0');
  });
  it('large gap resets previous text scaling instead of retaining stale scale', async () => {
    const w = keep(mount(Avatar, { props: { gap: 4 }, slots: { default: () => 'Long text' } }));
    Object.defineProperty(w.element, 'offsetWidth', { value: 100 });
    Object.defineProperty(w.get('.apollo-avatar-string').element, 'offsetWidth', { value: 200 });
    await w.setProps({ gap: 5 });
    expect(w.get('.apollo-avatar-string').attributes('style')).toContain('scale(0.45)');
    await w.setProps({ gap: 60 });
    expect(w.get('.apollo-avatar-string').attributes('style')).toContain('scale(1)');
  });
  it('overflow exposes a native keyboard button and keeps static avatars outside Tab order', () => {
    const w = keep(
      mount(AvatarGroup, { props: { max: { count: 1 } }, slots: { default: children } }),
    );
    const button = w.get('button');
    expect(button.attributes('type')).toBe('button');
    expect(button.text()).toBe('+2');
    expect(w.get('.apollo-avatar').attributes('tabindex')).toBeUndefined();
  });
  it('actual max-count Demo counts direct avatar children and updates its controls', async () => {
    const w = keep(mount(MaxCountDemo, { attachTo: document.body }));
    expect(w.get('.apollo-avatar-group').findAll('.apollo-avatar')).toHaveLength(3);
    expect(w.get('.apollo-avatar-group').text()).toBe('AB+2');
    await w.get('[role="switch"]').trigger('click');
    expect(w.get('.apollo-avatar-group').text()).toBe('ABC+1');
  });
  it('valid icon text has no obsolete upstream naming warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = keep(mount(Avatar, { props: { icon: 'USER' } }));
    expect(w.text()).toBe('USER');
    expect(error).not.toHaveBeenCalled();
  });
  it('all twelve existing component Tokens follow current configuration on Avatar and Group', async () => {
    const theme = shallowRef({
      components: {
        Avatar: {
          containerSize: 46,
          containerSizeLG: 60,
          containerSizeSM: 30,
          textFontSize: 15,
          textFontSizeLG: 17,
          textFontSizeSM: 13,
          iconFontSize: 23,
          iconFontSizeLG: '2em',
          iconFontSizeSM: 16,
          groupSpace: 9,
          groupOverlapping: -12,
          groupBorderColor: '#aabbcc',
        },
      },
    });
    const w = keep(
      mount(() => h(ConfigProvider, { theme: theme.value }, () => h(AvatarGroup, null, children))),
    );
    for (const target of [w.get('.apollo-avatar-group'), w.get('.apollo-avatar')]) {
      expect(target.attributes('style')).toContain('--apollo-avatar-container-size: 46px');
      expect(target.attributes('style')).toContain('--apollo-avatar-group-overlapping: -12px');
      expect(target.attributes('style')).toContain('--apollo-avatar-icon-font-size-lg: 2em');
      expect(target.attributes('style')).toContain('--apollo-avatar-group-border-color: #aabbcc');
    }
    theme.value = {
      components: {
        Avatar: { ...theme.value.components.Avatar, containerSize: 52, groupOverlapping: -5 },
      },
    };
    await nextTick();
    expect(w.get('.apollo-avatar').attributes('style')).toContain(
      '--apollo-avatar-container-size: 52px',
    );
    expect(w.get('.apollo-avatar-group').attributes('style')).toContain(
      '--apollo-avatar-group-overlapping: -5px',
    );
  });
});

describe('Avatar current boundaries', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('count %s is unlimited', (count) => {
    const w = keep(mount(AvatarGroup, { props: { max: { count } }, slots: { default: children } }));
    expect(w.findAll('.apollo-avatar')).toHaveLength(3);
    expect(w.find('button').exists()).toBe(false);
  });
  it('fractional count floors once and the indicator counts actual hidden children', () => {
    const w = keep(
      mount(AvatarGroup, { props: { max: { count: 1.9 } }, slots: { default: children } }),
    );
    expect(w.text()).toBe('A+2');
    expect(w.findAll('.apollo-avatar')).toHaveLength(2);
  });
  it('local size and shape override current nested Group and Provider values', async () => {
    const size = ref<'small' | 'large'>('large'),
      local = ref<number | undefined>();
    const w = keep(
      mount(() =>
        h(ConfigProvider, { componentSize: size.value }, () =>
          h(AvatarGroup, { size: 48, shape: 'square' }, () => [
            h(Avatar, { size: local.value }, () => 'Inherited'),
            h(Avatar, { size: 20, shape: 'circle' }, () => 'Local'),
          ]),
        ),
      ),
    );
    expect(w.findAll('.apollo-avatar')[0]?.attributes('style')).toContain('width: 48px');
    expect(w.findAll('.apollo-avatar')[1]?.attributes('style')).toContain('width: 20px');
    expect(w.findAll('.apollo-avatar')[1]?.classes()).toContain('apollo-avatar-circle');
    local.value = 0;
    size.value = 'small';
    await nextTick();
    expect(w.findAll('.apollo-avatar')[0]?.attributes('style')).toContain('width: 0px');
  });
  it('explicit empty icon slot suppresses its data while image priority remains intact', async () => {
    const source = ref<string | undefined>();
    const w = keep(
      mount(() =>
        h(
          Avatar,
          { icon: 'Data', src: source.value },
          { icon: () => [], default: () => 'Default' },
        ),
      ),
    );
    expect(w.text()).toBe('');
    source.value = 'image.png';
    await nextTick();
    expect(w.get('img').attributes('src')).toBe('image.png');
  });
  it('unrelated root and Provider updates preserve complete slot draft and focus', async () => {
    const source = ref(0);
    const Probe = defineComponent({
      setup() {
        const draft = ref('initial');
        return () => [
          h('input', {
            'aria-label': 'icon draft',
            value: draft.value,
            onInput: (e: Event) => {
              if (e.target instanceof HTMLInputElement) draft.value = e.target.value;
            },
          }),
          h('span', 'Tail'),
          0,
        ];
      },
    });
    const w = keep(
      mount(
        () =>
          h(
            ConfigProvider,
            { components: { avatar: { className: `stage-${source.value}` } } },
            () => h(Avatar, { title: String(source.value) }, { icon: () => h(Probe) }),
          ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    const input = w.get<HTMLInputElement>('input');
    await input.setValue('business draft');
    input.element.focus();
    source.value++;
    await nextTick();
    expect(w.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('business draft');
    expect(document.activeElement).toBe(input.element);
    expect(w.text()).toBe('Tail0');
  });
  it('current theme override replacement and removal restore fallback component values', async () => {
    const theme = shallowRef<{ components: { Avatar?: { containerSize: number } } }>({
      components: { Avatar: { containerSize: 51 } },
    });
    const w = keep(
      mount(() => h(ConfigProvider, { theme: theme.value }, () => h(Avatar, null, () => 'U')), {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      }),
    );
    const root = w.get('.apollo-avatar').element;
    expect(root.getAttribute('style')).toContain('--apollo-avatar-container-size: 51px');
    theme.value = { components: { Avatar: { containerSize: 62 } } };
    await nextTick();
    expect(root.getAttribute('style')).toContain('--apollo-avatar-container-size: 62px');
    theme.value = { components: {} };
    await nextTick();
    expect(root.getAttribute('style')).toContain('--apollo-avatar-container-size: 32px');
    expect(w.get('.apollo-avatar').element).toBe(root);
  });
  it('native Group and Avatar public refs point at their actual roots', () => {
    const w = keep(mount(AvatarGroup, { slots: { default: children } }));
    expect(w.vm.nativeElement).toBe(w.element);
    expect(w.findComponent(Avatar).vm.nativeElement).toBe(w.find('.apollo-avatar').element);
  });
});
