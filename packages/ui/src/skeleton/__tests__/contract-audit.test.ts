import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Comment, defineComponent, h, nextTick, ref, type StyleValue, shallowRef } from 'vue';
import { ConfigProvider, type ConfigProviderProps } from '../../config-provider';
import ChildrenDemo from '../demo/children.vue';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from '../index';
import { toCssLength } from '../styleLength';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.useRealTimers();
  document.body.innerHTML = '';
});
const variants = [
  ['main', (attrs: Record<string, unknown>) => h(Skeleton, attrs)],
  ['avatar', (attrs: Record<string, unknown>) => h(SkeletonAvatar, attrs)],
  ['button', (attrs: Record<string, unknown>) => h(SkeletonButton, attrs)],
  ['input', (attrs: Record<string, unknown>) => h(SkeletonInput, attrs)],
  ['image', (attrs: Record<string, unknown>) => h(SkeletonImage, attrs)],
  ['node', (attrs: Record<string, unknown>) => h(SkeletonNode, attrs)],
] as const;

describe('Skeleton complete public-boundary regressions', () => {
  it.each(variants)(
    '%s routes native attributes and events to its actual root',
    async (name, render) => {
      const click = vi.fn();
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            render({
              id: `native-${name}`,
              'data-skeleton-probe': name,
              tabindex: 0,
              'aria-label': `Loading ${name}`,
              role: 'region',
              onClick: click,
              class: 'native-root',
            }),
        }),
      );
      mounted.push(wrapper);
      const root = wrapper.get('.apollo-skeleton');
      expect(root.attributes('id')).toBe(`native-${name}`);
      expect(root.attributes('data-skeleton-probe')).toBe(name);
      expect(root.attributes('tabindex')).toBe('0');
      expect(root.attributes('aria-label')).toBe(`Loading ${name}`);
      expect(root.attributes('role')).toBe('region');
      expect(root.classes()).toContain('native-root');
      await root.trigger('click');
      expect(click).toHaveBeenCalledTimes(1);
      expect(click.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    },
  );

  it.each(variants)(
    '%s keeps all Vue style forms on the root and content styles separate',
    async (name, render) => {
      const style = shallowRef<StyleValue>('padding: 13px');
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            render({
              style: style.value,
              styles:
                name === 'main'
                  ? { root: { padding: '3px' } }
                  : { root: { padding: '3px' }, content: { width: '91px' } },
            }),
        }),
      );
      mounted.push(wrapper);
      const root = wrapper.get<HTMLDivElement>('.apollo-skeleton');
      expect(root.element.style.padding).toBe('13px');
      style.value = [{ padding: '17px' }, { opacity: 0.75 }];
      await nextTick();
      expect(root.element.style.padding).toBe('17px');
      expect(root.element.style.opacity).toBe('0.75');
      style.value = { padding: '19px' };
      await nextTick();
      expect(root.element.style.padding).toBe('19px');
      style.value = undefined;
      await nextTick();
      expect(root.element.style.padding).toBe('3px');
      expect(root.element.style.opacity).toBe('');
      if (name !== 'main') {
        const content = root.get<HTMLElement>(':scope > :first-child');
        expect(content.element.style.width).toBe('91px');
        expect(content.element.style.padding).toBe('');
      }
    },
  );

  it('reads the current Provider configuration after replacement, removal and restoration', async () => {
    const components = shallowRef<ConfigProviderProps['components']>();
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            { components: components.value },
            {
              default: () => h(Skeleton, { avatar: true }),
            },
          ),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    mounted.push(wrapper);
    const original = wrapper.get('.apollo-skeleton').element;
    for (const name of ['first', 'second']) {
      components.value = {
        skeleton: {
          className: name,
          style: { padding: '11px' },
          classNames: { title: `${name}-title` },
          styles: { avatar: { opacity: 0.6 } },
        },
      };
      await nextTick();
      expect(wrapper.get('.apollo-skeleton').element).toBe(original);
      expect(wrapper.get('.apollo-skeleton').classes()).toContain(name);
      expect(wrapper.get('.apollo-skeleton-title').classes()).toContain(`${name}-title`);
      expect(wrapper.get<HTMLElement>('.apollo-skeleton-avatar').element.style.opacity).toBe('0.6');
    }
    components.value = undefined;
    await nextTick();
    expect(wrapper.get('.apollo-skeleton').classes()).not.toContain('second');
    expect(wrapper.get<HTMLElement>('.apollo-skeleton').element.style.padding).toBe('');
  });

  it('evaluates semantic functions against the current reactive props', async () => {
    const round = ref(false);
    const styles = ({ props }: { props: { round?: boolean } }) => ({
      title: { height: props.round ? '29px' : '17px' },
    });
    const wrapper = mount(
      defineComponent({ setup: () => () => h(Skeleton, { round: round.value, styles }) }),
    );
    mounted.push(wrapper);
    expect(wrapper.get<HTMLElement>('.apollo-skeleton-title').element.style.height).toBe('17px');
    round.value = true;
    await nextTick();
    expect(wrapper.get<HTMLElement>('.apollo-skeleton-title').element.style.height).toBe('29px');
  });

  it('merges every nested block class/style instead of discarding them', () => {
    const wrapper = mount(Skeleton, {
      props: {
        avatar: { className: 'custom-avatar', style: { opacity: 0.7 } },
        title: { className: 'custom-title', style: { height: '23px' } },
        paragraph: { className: 'custom-paragraph', style: { marginTop: '31px' } },
        classNames: {
          avatar: 'semantic-avatar',
          title: 'semantic-title',
          paragraph: 'semantic-paragraph',
        },
      },
    });
    mounted.push(wrapper);
    for (const name of ['avatar', 'title', 'paragraph']) {
      expect(wrapper.get(`.apollo-skeleton-${name}`).classes()).toContain(`custom-${name}`);
      expect(wrapper.get(`.apollo-skeleton-${name}`).classes()).toContain(`semantic-${name}`);
    }
    expect(wrapper.get<HTMLElement>('.apollo-skeleton-avatar').element.style.opacity).toBe('0.7');
    expect(wrapper.get<HTMLElement>('.apollo-skeleton-title').element.style.height).toBe('23px');
    expect(wrapper.get<HTMLElement>('.apollo-skeleton-paragraph').element.style.marginTop).toBe(
      '31px',
    );
  });

  it.each(variants)(
    '%s consumes current source aliases and component tokens',
    async (_name, render) => {
      const themed = ref(false);
      const wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(
              ConfigProvider,
              {
                theme: themed.value
                  ? {
                      token: { controlHeight: 44 },
                      components: {
                        Skeleton: {
                          gradientFromColor: '#dce8ff',
                          gradientToColor: '#8cafff',
                          titleHeight: 23,
                          paragraphLiHeight: 21,
                          blockRadius: 7,
                          paragraphMarginTop: 33,
                        },
                      },
                    }
                  : undefined,
              },
              { default: () => render({}) },
            ),
        }),
        {
          attachTo: document.body,
          global: { stubs: { teleport: false } },
        },
      );
      mounted.push(wrapper);
      for (const on of [true, false, true]) {
        themed.value = on;
        await nextTick();
        const root = wrapper.get<HTMLElement>('.apollo-skeleton').element;
        expect(root.style.getPropertyValue('--apollo-skeleton-title-height')).toBe(
          on ? '23px' : '',
        );
        expect(root.style.getPropertyValue('--apollo-skeleton-gradient-from-color')).toBe(
          on ? '#dce8ff' : '',
        );
        expect(root.style.getPropertyValue('--apollo-skeleton-paragraph-li-height')).toBe(
          on ? '21px' : '',
        );
        expect(root.style.getPropertyValue('--apollo-skeleton-block-radius')).toBe(on ? '7px' : '');
        expect(root.style.getPropertyValue('--apollo-skeleton-paragraph-margin-top')).toBe(
          on ? '33px' : '',
        );
        expect(root.style.getPropertyValue('--apollo-control-height')).toBe(on ? '44px' : '');
      }
    },
  );

  it('keeps Image default content complete and respects an intentionally empty slot', async () => {
    const empty = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            SkeletonImage,
            {},
            {
              default: () =>
                empty.value
                  ? [h(Comment)]
                  : [h(Comment), h('b', 'First'), h('input', { 'aria-label': 'Image draft' })],
            },
          ),
      }),
    );
    mounted.push(wrapper);
    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(wrapper.get('b').text()).toBe('First');
    expect(wrapper.find('svg').exists()).toBe(false);
    empty.value = true;
    await nextTick();
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.find('svg').exists()).toBe(false);
  });

  it('preserves a Node native editor while surrounding configuration changes', async () => {
    const active = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(
            SkeletonNode,
            { active: active.value },
            {
              default: () => [
                h(Comment),
                h('input', { 'aria-label': 'Node draft' }),
                ...(active.value ? [h('b', 'Extra')] : []),
              ],
            },
          ),
      }),
      { attachTo: document.body },
    );
    mounted.push(wrapper);
    const editor = wrapper.get<HTMLInputElement>('input').element;
    editor.value = 'Kept draft';
    editor.focus();
    for (const on of [true, false, true]) {
      active.value = on;
      await nextTick();
      expect(wrapper.get('input').element).toBe(editor);
      expect(editor.value).toBe('Kept draft');
      expect(document.activeElement).toBe(editor);
    }
  });

  it('does not expose decorative headings and explicitly owns the loading state', () => {
    const wrapper = mount(Skeleton, { props: { avatar: true }, attrs: { 'aria-busy': false } });
    mounted.push(wrapper);
    expect(wrapper.get('.apollo-skeleton').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('.apollo-skeleton-header').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.apollo-skeleton-section').attributes('aria-hidden')).toBe('true');
  });

  it('tracks the actual root through loading switches and clears it after unmount', async () => {
    const wrapper = mount(Skeleton, {
      props: { loading: true },
      slots: { default: () => h('input', { 'aria-label': 'Loaded draft' }) },
      attachTo: document.body,
    });
    const instance = wrapper.vm;
    expect(instance.nativeElement).toBe(wrapper.get('.apollo-skeleton').element);
    await wrapper.setProps({ loading: false });
    expect(instance.nativeElement).toBeNull();
    const editor = wrapper.get<HTMLInputElement>('input').element;
    editor.value = 'Loaded edit';
    editor.focus();
    await wrapper.setProps({ round: true });
    expect(wrapper.get('input').element).toBe(editor);
    expect(editor.value).toBe('Loaded edit');
    expect(document.activeElement).toBe(editor);
    await wrapper.setProps({ loading: true });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(instance.nativeElement).toBe(wrapper.get('.apollo-skeleton').element);
    await wrapper.setProps({ loading: false });
    expect(wrapper.get('input').element).not.toBe(editor);
    wrapper.unmount();
    expect(instance.nativeElement).toBeNull();
  });

  it('ignores nonfinite row counts without throwing', () => {
    expect(() => {
      const wrapper = mount(Skeleton, { props: { paragraph: { rows: Infinity } } });
      mounted.push(wrapper);
      expect(wrapper.findAll('.apollo-skeleton-paragraph > li')).toHaveLength(0);
    }).not.toThrow();
  });

  it('omits nonfinite lengths while retaining zero and valid CSS lengths', () => {
    for (const value of [NaN, Infinity, -Infinity]) expect(toCssLength(value)).toBeUndefined();
    expect(toCssLength(0)).toBe('0');
    expect(toCssLength(40)).toBe('40px');
    expect(toCssLength('42%')).toBe('42%');
  });

  it('cleans up the actual children demo timer on unmount', async () => {
    vi.useFakeTimers();
    const before = vi.getTimerCount();
    const wrapper = mount(ChildrenDemo);
    await wrapper.get('button').trigger('click');
    expect(vi.getTimerCount()).toBeGreaterThan(before);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(before);
  });
});
