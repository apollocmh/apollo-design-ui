import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCommentVNode,
  defineComponent,
  h,
  nextTick,
  ref,
  type StyleValue,
  shallowRef,
} from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Statistic, StatisticCountdown, StatisticTimer } from '../index';

const mounted: { unmount(): void }[] = [];
function track<T extends { unmount(): void }>(wrapper: T): T {
  mounted.push(wrapper);
  return wrapper;
}
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Statistic complete contract', () => {
  it('uses complete current slots before text props, including intentional emptiness', async () => {
    const empty = ref(false),
      present = ref(true);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              Statistic,
              { title: 'fallback title', prefix: 'fallback prefix', suffix: 'fallback suffix' },
              present.value
                ? {
                    title: () =>
                      empty.value
                        ? []
                        : [createCommentVNode(), h('b', 'Current title'), h('i', 'tail')],
                    prefix: () => (empty.value ? null : 0),
                    suffix: () => (empty.value ? [] : 'current suffix'),
                  }
                : {},
            ),
        ),
      ),
    );
    expect(wrapper.get('.apollo-statistic-title').text()).toBe('Current titletail');
    expect(wrapper.get('.apollo-statistic-content-prefix').text()).toBe('0');
    expect(wrapper.get('.apollo-statistic-content-suffix').text()).toBe('current suffix');
    empty.value = true;
    await nextTick();
    expect(wrapper.find('.apollo-statistic-header').exists()).toBe(false);
    expect(wrapper.find('.apollo-statistic-content-prefix').exists()).toBe(false);
    expect(wrapper.find('.apollo-statistic-content-suffix').exists()).toBe(false);
    present.value = false;
    await nextTick();
    expect(wrapper.get('.apollo-statistic-title').text()).toBe('fallback title');
  });

  it('provides business values and formatted text without replacing native value content', async () => {
    const value = ref(1234.5),
      precision = ref(2),
      empty = ref(false);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              Statistic,
              {
                value: value.value,
                precision: precision.value,
                styles: { value: { color: 'red' } },
              },
              {
                value: (scope: { value: number | string; text: string }) =>
                  empty.value
                    ? []
                    : [
                        createCommentVNode(),
                        h('input', { 'aria-label': 'Statistic draft' }),
                        h('output', `${scope.value}|${scope.text}`),
                      ],
              },
            ),
        ),
        { attachTo: document.body },
      ),
    );
    const editor = wrapper.get('input').element;
    await wrapper.get('input').setValue('native draft');
    editor.focus();
    value.value = 42.125;
    precision.value = 1;
    await nextTick();
    expect(wrapper.get('output').text()).toBe('42.125|42.1');
    expect(wrapper.get('input').element).toBe(editor);
    expect(document.activeElement).toBe(editor);
    expect(wrapper.get('input').element.value).toBe('native draft');
    expect(wrapper.get('.apollo-statistic-content-value').attributes('style')).toContain('red');
    empty.value = true;
    await nextTick();
    expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('');
  });

  it('keeps current Provider configuration, semantic props, prefix and direction', async () => {
    const enabled = ref(false),
      value = ref(1),
      prefix = ref('apollo');
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                prefixCls: prefix.value,
                direction: enabled.value ? 'rtl' : 'ltr',
                components: enabled.value
                  ? {
                      statistic: {
                        className: 'current-provider',
                        style: { padding: '7px' },
                        classNames: { content: 'provider-content' },
                        styles: { value: { color: 'red' } },
                      },
                    }
                  : undefined,
              },
              () =>
                h(Statistic, {
                  value: value.value,
                  classNames: ({ props }) => ({ value: `value-${props.value}` }),
                }),
            ),
        ),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const root = wrapper.get('.apollo-statistic').element;
    enabled.value = true;
    value.value = 2;
    prefix.value = 'custom';
    await nextTick();
    expect(wrapper.get('.custom-statistic').element).toBe(root);
    expect(wrapper.get('.custom-statistic').classes()).toEqual(
      expect.arrayContaining(['current-provider', 'custom-statistic-rtl']),
    );
    expect(wrapper.get('.custom-statistic').attributes('style')).toContain('padding: 7px');
    expect(wrapper.get('.custom-statistic-content').classes()).toContain('provider-content');
    expect(wrapper.get('.custom-statistic-content-value').classes()).toContain('value-2');
    expect(wrapper.get('.custom-statistic-content-value').attributes('style')).toContain('red');
    enabled.value = false;
    prefix.value = 'apollo';
    await nextTick();
    expect(wrapper.get('.apollo-statistic').element).toBe(root);
    expect(wrapper.get('.apollo-statistic').classes()).not.toContain('current-provider');
    expect(wrapper.get('.apollo-statistic-content-value').attributes('style') ?? '').not.toContain(
      'red',
    );
  });

  it('merges native attrs and every Vue style form on the root with one native event', async () => {
    const style = shallowRef<StyleValue>('width: 231px; color: red');
    const click = vi.fn(),
      enter = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(Statistic, {
              id: 'native-stat',
              tabindex: 0,
              onClick: click,
              onMouseenter: enter,
              style: style.value,
              styles: { root: { width: '111px', marginTop: '3px' } },
            }),
        ),
      ),
    );
    expect(wrapper.get('.apollo-statistic').attributes('id')).toBe('native-stat');
    expect(wrapper.get('.apollo-statistic').attributes('tabindex')).toBe('0');
    expect(wrapper.get<HTMLDivElement>('.apollo-statistic').element.style.width).toBe('231px');
    for (const next of [[{ width: '241px' }, 'padding: 9px'], { width: '251px' }]) {
      style.value = next;
      await nextTick();
      expect(wrapper.get<HTMLDivElement>('.apollo-statistic').element.style.width).toBe(
        Array.isArray(next) ? '241px' : '251px',
      );
    }
    await wrapper.get('.apollo-statistic').trigger('click');
    await wrapper.get('.apollo-statistic').trigger('mouseenter');
    expect(click).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('consumes both source tokens, removes them and retains independent native overrides', async () => {
    const enabled = ref(true);
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              {
                theme: enabled.value
                  ? { components: { Statistic: { titleFontSize: 18, contentFontSize: 42 } } }
                  : undefined,
              },
              () => [
                h(Statistic, { value: 1 }),
                h(Statistic, {
                  value: 2,
                  style: { '--apollo-statistic-content-font-size': '47px' },
                }),
              ],
            ),
        ),
        { global: { stubs: { teleport: false } } },
      ),
    );
    const roots = wrapper.findAll<HTMLDivElement>('.apollo-statistic');
    const first = roots[0],
      second = roots[1];
    if (!first || !second) throw new Error('Both independent statistic instances must render');
    expect(first.element.style.getPropertyValue('--apollo-statistic-title-font-size')).toBe('18px');
    expect(first.element.style.getPropertyValue('--apollo-statistic-content-font-size')).toBe(
      '42px',
    );
    expect(second.element.style.getPropertyValue('--apollo-statistic-content-font-size')).toBe(
      '47px',
    );
    enabled.value = false;
    await nextTick();
    expect(wrapper.get<HTMLDivElement>('.apollo-statistic').element).toBe(first.element);
    expect(first.element.style.getPropertyValue('--apollo-statistic-content-font-size')).toBe('');
    expect(second.element.style.getPropertyValue('--apollo-statistic-content-font-size')).toBe(
      '47px',
    );
  });

  it('treats group separators literally and ignores nonfinite precision without throwing', () => {
    const wrapper = track(mount(Statistic, { props: { value: '1234.50', groupSeparator: '$&' } }));
    expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('1$&234.50');
    for (const precision of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN]) {
      const next = track(mount(Statistic, { props: { value: '1234.50', precision } }));
      expect(next.get('.apollo-statistic-content-value').text()).toBe('1,234.50');
    }
  });
});

describe('Statistic timer lifecycle contract', () => {
  it('uses the current direction, restarts the cycle and preserves scoped native editors', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
    const type = ref<'countup' | 'countdown'>('countup'),
      value = ref(Date.now() - 5000);
    const finish = vi.fn(),
      change = vi.fn();
    const wrapper = track(
      mount(
        defineComponent(
          () => () =>
            h(
              StatisticTimer,
              {
                type: type.value,
                value: value.value,
                format: 'ss',
                onFinish: finish,
                onChange: change,
              },
              {
                title: () => h('b', 'Current timer'),
                value: (scope: { text: string; duration: number | null; type: string }) => [
                  createCommentVNode(),
                  h('input', { 'aria-label': 'Timer draft' }),
                  h('output', `${scope.type}|${scope.text}|${scope.duration}`),
                ],
              },
            ),
        ),
        { attachTo: document.body },
      ),
    );
    await nextTick();
    expect(wrapper.get('.apollo-statistic-title').text()).toBe('Current timer');
    const editor = wrapper.get('input').element;
    editor.value = 'keep';
    editor.focus();
    expect(wrapper.get('output').text()).toBe('countup|05|5000');
    type.value = 'countdown';
    value.value = Date.now() + 2000;
    await nextTick();
    expect(wrapper.get('output').text()).toBe('countdown|02|2000');
    await vi.advanceTimersByTimeAsync(2100);
    expect(wrapper.get('output').text()).toBe('countdown|00|0');
    expect(change).toHaveBeenLastCalledWith(0);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(wrapper.get('input').element).toBe(editor);
    expect(document.activeElement).toBe(editor);
    expect(editor.value).toBe('keep');
    expect(vi.getTimerCount()).toBe(0);
    value.value = Date.now() + 1000;
    await nextTick();
    await vi.advanceTimersByTimeAsync(1100);
    expect(finish).toHaveBeenCalledTimes(2);
  });

  it('does not schedule invalid dates and resumes immediately with one finish at zero', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
    const finish = vi.fn(),
      change = vi.fn();
    const wrapper = track(
      mount(StatisticTimer, {
        props: { type: 'countdown', value: 'invalid', onChange: change, onFinish: finish },
      }),
    );
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('-');
    expect(change).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
    await wrapper.setProps({ value: Date.now() });
    expect(change).toHaveBeenLastCalledWith(0);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    await wrapper.setProps({ format: 'ss[ seconds]' });
    expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('00 seconds');
    expect(finish).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ value: Date.now() + 2000 });
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('forwards Countdown slots, actual native ref, attrs and exactly one business event', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
    const finish = vi.fn(),
      click = vi.fn();
    const wrapper = track(
      mount(StatisticCountdown, {
        attrs: { value: Date.now() + 100, onFinish: finish, id: 'countdown-root', onClick: click },
        slots: { title: () => 'Countdown title', suffix: () => h('b', 'seconds') },
      }),
    );
    await nextTick();
    expect(wrapper.get('.apollo-statistic-title').text()).toBe('Countdown title');
    expect(wrapper.get('.apollo-statistic-content-suffix').text()).toBe('seconds');
    expect(wrapper.get('.apollo-statistic').attributes('id')).toBe('countdown-root');
    const exposed = wrapper.getCurrentComponent().exposed;
    expect(exposed?.nativeElement).toBe(wrapper.get('.apollo-statistic').element);
    await wrapper.get('.apollo-statistic').trigger('click');
    expect(click).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(finish).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    mounted.splice(mounted.indexOf(wrapper), 1);
    expect(exposed?.nativeElement).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});

it('changes the existing timer direction without depending on custom slots', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
  const wrapper = track(
    mount(StatisticTimer, { props: { type: 'countup', value: Date.now() - 5000, format: 'ss' } }),
  );
  await nextTick();
  expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('05');
  await wrapper.setProps({ type: 'countdown', value: Date.now() + 2000 });
  expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('02');
});
it('ignores infinite precision as invalid configuration', () => {
  const wrapper = track(mount(Statistic, { props: { value: '1234.50', precision: Infinity } }));
  expect(wrapper.get('.apollo-statistic-content-value').text()).toBe('1,234.50');
});
it('exposes the actual Timer root independently of content slots', () => {
  vi.useFakeTimers();
  const wrapper = track(
    mount(StatisticTimer, { props: { type: 'countdown', value: Date.now() + 5000 } }),
  );
  expect(wrapper.getCurrentComponent().exposed?.nativeElement).toBe(
    wrapper.get('.apollo-statistic').element,
  );
});

it('isolates multiple clocks, consumes Vue once listeners and never mistakes input events for durations', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-27T00:00:00Z'));
  const once = vi.fn(),
    firstFinish = vi.fn(),
    secondFinish = vi.fn();
  const first = track(
    mount(StatisticTimer, {
      props: { type: 'countdown', value: Date.now() + 100, onFinish: firstFinish },
      attrs: { onChangeOnce: once },
      slots: { value: () => h('input', { 'aria-label': 'Independent native clock' }) },
    }),
  );
  const second = track(
    mount(StatisticTimer, {
      props: { type: 'countdown', value: Date.now() + 500, onFinish: secondFinish },
    }),
  );
  expect(once).toHaveBeenCalledTimes(1);
  expect(once).toHaveBeenCalledWith(100);
  await first.get('input').trigger('change');
  expect(once).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(200);
  expect(firstFinish).toHaveBeenCalledTimes(1);
  expect(secondFinish).not.toHaveBeenCalled();
  first.unmount();
  mounted.splice(mounted.indexOf(first), 1);
  expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(500);
  expect(secondFinish).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
  second.unmount();
  mounted.splice(mounted.indexOf(second), 1);
});

it('keeps the nearest Provider and neighboring local styles independent during outer replacement', async () => {
  const active = ref(true);
  const Probe = defineComponent(
    () => () =>
      h(
        ConfigProvider,
        {
          components: {
            statistic: {
              className: active.value ? 'outer-active' : 'outer-replaced',
              styles: { value: { color: active.value ? 'red' : 'gray' } },
            },
          },
        },
        () => [
          h(Statistic, { id: 'outer-statistic', value: 1 }),
          h(
            ConfigProvider,
            {
              components: {
                statistic: { className: 'nearest-provider', styles: { value: { color: 'blue' } } },
              },
            },
            () =>
              h(
                Statistic,
                { id: 'inner-statistic', value: 2 },
                { value: () => h('input', { 'aria-label': 'Nearest provider draft' }) },
              ),
          ),
          h(Statistic, { id: 'local-statistic', value: 3, styles: { value: { color: 'green' } } }),
        ],
      ),
  );
  const wrapper = track(mount(Probe, { global: { stubs: { teleport: false } } }));
  const editor = wrapper.get('input').element;
  expect(
    wrapper.get('#outer-statistic').get('.apollo-statistic-content-value').attributes('style'),
  ).toContain('red');
  active.value = false;
  await nextTick();
  expect(wrapper.get('#outer-statistic').classes()).toContain('outer-replaced');
  expect(
    wrapper.get('#outer-statistic').get('.apollo-statistic-content-value').attributes('style'),
  ).toContain('gray');
  expect(wrapper.get('#inner-statistic').classes()).toContain('nearest-provider');
  expect(
    wrapper.get('#inner-statistic').get('.apollo-statistic-content-value').attributes('style'),
  ).toContain('blue');
  expect(
    wrapper.get('#local-statistic').get('.apollo-statistic-content-value').attributes('style'),
  ).toContain('green');
  expect(wrapper.get('input').element).toBe(editor);
});
