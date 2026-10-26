import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Comment,
  defineComponent,
  Fragment,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { ConfigProvider, type ConfigProviderProps } from '../../config-provider';
import {
  ExceptionMap,
  PRESENTED_IMAGE_403,
  PRESENTED_IMAGE_404,
  PRESENTED_IMAGE_500,
  Result,
} from '../index';
import type { ResultProps, ResultRef, ResultStatusType } from '../interface';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount();
  document.body.innerHTML = '';
});
const track = <T extends { unmount(): void }>(wrapper: T): T => {
  mounted.push(wrapper);
  return wrapper;
};
const nativeMount = (render: () => ReturnType<typeof h>) =>
  track(
    mount(defineComponent({ setup: () => render }), {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    }),
  );

describe('Result complete public-boundary regressions', () => {
  it('routes complete native attributes and exactly one native event to its actual root', async () => {
    const click = vi.fn();
    const w = track(
      mount(Result, {
        attrs: {
          id: 'native-result',
          tabindex: 0,
          role: 'region',
          'aria-label': 'Operation result',
          'data-native-result': 'yes',
          class: 'native-root',
          onClick: click,
        },
      }),
    );
    const root = w.get('.apollo-result');
    expect(root.attributes()).toMatchObject({
      id: 'native-result',
      tabindex: '0',
      role: 'region',
      'aria-label': 'Operation result',
      'data-native-result': 'yes',
    });
    expect(root.classes()).toContain('native-root');
    await root.trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
  });

  it('supports all three native style forms and removal without changing root ownership', async () => {
    const style = shallowRef<StyleValue>('padding:13px');
    const w = nativeMount(() =>
      h(Result, {
        style: style.value,
        styles: { root: { padding: '3px' }, title: { color: 'red' } },
        title: 'Title',
      }),
    );
    const root = w.get<HTMLElement>('.apollo-result');
    const original = root.element;
    expect(root.element.style.padding).toBe('13px');
    for (const value of [
      [{ padding: '17px' }, { opacity: 0.75 }],
      { padding: '19px' },
      undefined,
    ]) {
      style.value = value;
      await nextTick();
    }
    expect(root.element).toBe(original);
    expect(root.element.style.padding).toBe('3px');
    expect(root.element.style.opacity).toBe('');
    expect(w.get<HTMLElement>('.apollo-result-title').element.style.color).toBe('red');
  });

  it('reads replacement, removed and restored Provider configuration on the same root', async () => {
    const components = shallowRef<ConfigProviderProps['components']>();
    const w = nativeMount(() =>
      h(
        ConfigProvider,
        { components: components.value },
        { default: () => h(Result, { title: 'T' }) },
      ),
    );
    const original = w.get('.apollo-result').element;
    for (const name of ['first', 'second']) {
      components.value = {
        result: {
          className: name,
          style: { padding: '11px' },
          classNames: { title: `${name}-title` },
          styles: { title: { opacity: 0.6 } },
        },
      };
      await nextTick();
      expect(w.get('.apollo-result').element).toBe(original);
      expect(w.get('.apollo-result').classes()).toContain(name);
      expect(w.get('.apollo-result-title').classes()).toContain(`${name}-title`);
      expect(w.get<HTMLElement>('.apollo-result-title').element.style.opacity).toBe('0.6');
    }
    components.value = undefined;
    await nextTick();
    expect(w.get('.apollo-result').classes()).not.toContain('second');
    expect(w.get<HTMLElement>('.apollo-result').element.style.padding).toBe('');
  });

  it('follows current direction and prefix without remounting native content', async () => {
    const rtl = ref(false);
    const w = nativeMount(() =>
      h(
        ConfigProvider,
        { direction: rtl.value ? 'rtl' : 'ltr', prefixCls: rtl.value ? 'custom' : 'apollo' },
        { default: () => h(Result, null, { default: () => h('input', { value: 'draft' }) }) },
      ),
    );
    const input = w.get('input').element;
    rtl.value = true;
    await nextTick();
    expect(w.get('.custom-result').classes()).toContain('custom-result-rtl');
    expect(w.get('input').element).toBe(input);
    rtl.value = false;
    await nextTick();
    expect(w.get('.apollo-result').classes()).not.toContain('apollo-result-rtl');
  });

  it('evaluates semantic functions with current effective props', async () => {
    const status = ref<ResultStatusType | undefined>();
    const factory = ({ props }: { props: ResultProps }) => ({ root: `current-${props.status}` });
    const styles = ({ props }: { props: ResultProps }) => ({
      title: { opacity: props.status === 'success' ? 0.8 : 0.6 },
    });
    const attrs: Record<string, unknown> = { classNames: factory, styles, title: 'T' };
    const w = nativeMount(() => h(Result, { ...attrs, status: status.value }));
    expect(w.get('.apollo-result').classes()).toContain('current-info');
    status.value = 'success';
    await nextTick();
    expect(w.get('.apollo-result').classes()).toContain('current-success');
    expect(w.get<HTMLElement>('.apollo-result-title').element.style.opacity).toBe('0.8');
    status.value = undefined;
    await nextTick();
    expect(w.get('.apollo-result').classes()).toContain('current-info');
  });

  for (const [slot, selector] of [
    ['title', '.apollo-result-title'],
    ['subTitle', '.apollo-result-subtitle'],
    ['extra', '.apollo-result-extra'],
    ['icon', '.apollo-result-icon'],
    ['default', '.apollo-result-body'],
  ] as const) {
    it(`reads dynamically added and removed ${slot} slots on every render`, async () => {
      const present = ref(false);
      const content = ref(true);
      const w = nativeMount(() =>
        h(
          Result,
          { title: 'Fallback title', subTitle: 'Fallback subtitle' },
          present.value
            ? {
                [slot]: () =>
                  content.value
                    ? [
                        h(Comment),
                        h('span', { 'data-current-slot': slot }, 'Current'),
                        h('strong', 'Tail'),
                      ]
                    : [h(Fragment, null, [h(Comment)])],
              }
            : {},
        ),
      );
      for (let cycle = 0; cycle < 2; cycle++) {
        present.value = true;
        await nextTick();
        expect(w.get(`${selector} [data-current-slot]`).attributes('data-current-slot')).toBe(slot);
        expect(w.get(`${selector} strong`).text()).toBe('Tail');
        content.value = false;
        await nextTick();
        expect(w.find(selector).exists()).toBe(false);
        present.value = false;
        await nextTick();
        if (slot === 'title') expect(w.get(selector).text()).toBe('Fallback title');
        if (slot === 'subTitle') expect(w.get(selector).text()).toBe('Fallback subtitle');
        if (slot === 'icon') expect(w.find(`${selector} .apollo-icon`).exists()).toBe(true);
        content.value = true;
      }
    });
  }

  it.each([403, '404', 500] as const)(
    '%s respects complete custom icon content and explicit empty override',
    async (status) => {
      const empty = ref(false);
      const w = nativeMount(() =>
        h(
          Result,
          { status, icon: false },
          {
            icon: () =>
              empty.value
                ? [h(Comment)]
                : [
                    h('label', { for: 'icon-draft' }, 'Draft'),
                    h('input', { id: 'icon-draft' }),
                    h('strong', 'Tail'),
                  ],
          },
        ),
      );
      expect(w.find('.apollo-result-icon input').exists()).toBe(true);
      expect(w.get('.apollo-result-icon strong').text()).toBe('Tail');
      expect(w.find('.apollo-result-image').exists()).toBe(false);
      expect(w.get('.apollo-result-icon').attributes('aria-hidden')).toBeUndefined();
      empty.value = true;
      await nextTick();
      expect(w.find('.apollo-result-icon').exists()).toBe(false);
    },
  );

  it.each([403, '404', 500] as const)(
    '%s disables the default illustration with the existing icon switch',
    async (status) => {
      const w = track(mount(Result, { props: { status, icon: false } }));
      expect(w.find('.apollo-result-icon').exists()).toBe(false);
      await w.setProps({ icon: null });
      expect(w.find('.apollo-result-icon').exists()).toBe(false);
      await w.setProps({ icon: true });
      expect(w.find('.apollo-result-image svg').exists()).toBe(true);
      expect(w.get('.apollo-result-image svg').attributes('aria-hidden')).toBe('true');
      expect(w.get('.apollo-result-image svg').attributes('focusable')).toBe('false');
    },
  );

  it('does not create an empty body for comments, fragments or empty text', () => {
    for (const content of [() => '', () => [h(Comment)], () => h(Fragment, null, [h(Comment)])]) {
      const w = track(mount(Result, { slots: { default: content } }));
      expect(w.find('.apollo-result-body').exists()).toBe(false);
    }
    const w = track(mount(Result, { slots: { default: () => 0 } }));
    expect(w.get('.apollo-result-body').text()).toBe('0');
  });

  it('keeps complete native content, editor identity, focus and exact root lifecycle across status changes', async () => {
    const status = ref<ResultStatusType>('success');
    const shown = ref(true);
    const publicRef = ref<ResultRef | null>(null);
    const w = nativeMount(() =>
      shown.value
        ? h(
            Result,
            { ref: publicRef, status: status.value },
            {
              default: () => [
                h(Comment),
                h('label', { for: 'draft' }, 'Draft'),
                h('input', { id: 'draft' }),
                h('strong', 'Tail'),
              ],
            },
          )
        : h('p', 'Removed'),
    );
    const input = w.get<HTMLInputElement>('input');
    input.element.value = 'Uncontrolled draft';
    input.element.focus();
    const root = publicRef.value?.nativeElement;
    const instance = publicRef.value;
    for (const value of ['404', 'warning', 403, 'success'] as const) {
      status.value = value;
      await nextTick();
      expect(w.get('input').element).toBe(input.element);
      expect(input.element.value).toBe('Uncontrolled draft');
      expect(document.activeElement).toBe(input.element);
      expect(publicRef.value?.nativeElement).toBe(root);
      expect(w.get('strong').text()).toBe('Tail');
    }
    shown.value = false;
    await nextTick();
    expect(instance?.nativeElement).toBeNull();
    shown.value = true;
    await nextTick();
    expect(publicRef.value?.nativeElement).not.toBe(root);
  });

  it('projects all four current source tokens, aliases and removals while native variables win', async () => {
    const custom = ref(true);
    const native = ref(false);
    const w = nativeMount(() =>
      h(
        ConfigProvider,
        {
          theme: custom.value
            ? {
                token: { fontSize: 17 },
                components: {
                  Result: {
                    titleFontSize: 29,
                    subtitleFontSize: '1.25rem',
                    iconFontSize: 0,
                    extraMargin: '31px 0 0',
                  },
                },
              }
            : undefined,
        },
        {
          default: () =>
            h(Result, {
              title: 'T',
              style: native.value ? { '--apollo-result-title-font-size': '43px' } : undefined,
            }),
        },
      ),
    );
    const root = w.get<HTMLElement>('.apollo-result');
    expect(root.element.style.getPropertyValue('--apollo-result-title-font-size')).toBe('29px');
    expect(root.element.style.getPropertyValue('--apollo-result-subtitle-font-size')).toBe(
      '1.25rem',
    );
    expect(root.element.style.getPropertyValue('--apollo-result-icon-font-size')).toBe('0px');
    expect(root.element.style.getPropertyValue('--apollo-result-extra-margin')).toBe('31px 0 0');
    expect(root.element.style.getPropertyValue('--apollo-font-size')).toBe('17px');
    native.value = true;
    await nextTick();
    expect(root.element.style.getPropertyValue('--apollo-result-title-font-size')).toBe('43px');
    custom.value = false;
    native.value = false;
    await nextTick();
    expect(root.element.style.getPropertyValue('--apollo-result-title-font-size')).toBe('');
    custom.value = true;
    await nextTick();
    expect(root.element.style.getPropertyValue('--apollo-result-title-font-size')).toBe('29px');
  });

  it('isolates nearest Providers and adjacent native overrides', () => {
    const w = nativeMount(() =>
      h(
        ConfigProvider,
        {
          components: {
            result: { className: 'outer-result', styles: { title: { color: 'red' } } },
          },
        },
        {
          default: () => [
            h(Result, { title: 'Outer' }),
            h(
              ConfigProvider,
              {
                components: {
                  result: { className: 'inner-result', styles: { title: { color: 'blue' } } },
                },
              },
              { default: () => h(Result, { title: 'Inner', style: { padding: '7px' } }) },
            ),
            h(Result, { title: 'Adjacent' }),
          ],
        },
      ),
    );
    const roots = w.findAll<HTMLElement>('.apollo-result');
    expect(roots.map((r) => r.classes().includes('inner-result'))).toEqual([false, true, false]);
    expect(
      roots.map((r) => r.get<HTMLElement>('.apollo-result-title').element.style.color),
    ).toEqual(['red', 'blue', 'red']);
    expect(roots.map((r) => r.element.style.padding)).toEqual(['', '7px', '']);
  });

  it('evaluates each complete slot exactly once per render', () => {
    const calls = {
      title: vi.fn(() => 'Title'),
      subTitle: vi.fn(() => 'Subtitle'),
      icon: vi.fn(() => h('span', 'Icon')),
      extra: vi.fn(() => h('button', 'Action')),
      default: vi.fn(() => h('p', 'Body')),
    };
    track(mount(Result, { slots: calls }));
    for (const call of Object.values(calls)) expect(call).toHaveBeenCalledTimes(1);
  });

  it('rejects nonfinite and negative font token values while preserving zero and CSS lengths', () => {
    const w = nativeMount(() =>
      h(
        ConfigProvider,
        {
          theme: {
            components: {
              Result: {
                titleFontSize: Number.NaN,
                subtitleFontSize: -1,
                iconFontSize: Number.POSITIVE_INFINITY,
                extraMargin: '',
              },
            },
          },
        },
        { default: () => h(Result) },
      ),
    );
    const style = w.get<HTMLElement>('.apollo-result').element.style;
    expect(style.getPropertyValue('--apollo-result-title-font-size')).toBe('24px');
    expect(style.getPropertyValue('--apollo-result-subtitle-font-size')).toBe('14px');
    expect(style.getPropertyValue('--apollo-result-icon-font-size')).toBe('72px');
    expect(style.getPropertyValue('--apollo-result-extra-margin')).toBe('24px 0 0 0');
  });

  it('preserves all illustration exports and independent static SVG instances', () => {
    expect(PRESENTED_IMAGE_403).toBe(ExceptionMap[403]);
    expect(PRESENTED_IMAGE_404).toBe(ExceptionMap[404]);
    expect(PRESENTED_IMAGE_500).toBe(ExceptionMap[500]);
    const w = nativeMount(() =>
      h('div', [
        h(PRESENTED_IMAGE_404, { 'aria-label': 'First illustration' }),
        h(PRESENTED_IMAGE_404, { 'aria-label': 'Second illustration' }),
      ]),
    );
    const svgs = w.findAll('svg');
    expect(svgs).toHaveLength(2);
    expect(svgs[0]?.element).not.toBe(svgs[1]?.element);
    expect(svgs[0]?.attributes('aria-label')).toBe('First illustration');
    expect(svgs[1]?.attributes('aria-label')).toBe('Second illustration');
  });
});
