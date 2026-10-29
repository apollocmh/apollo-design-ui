import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import {
  computed,
  defineComponent,
  Fragment,
  h,
  nextTick,
  provide,
  reactive,
  ref,
  shallowRef,
} from 'vue';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { sizeContextKey } from '../../config-provider/size-context';
import {
  Divider,
  type DividerConfig,
  type DividerProps,
  type DividerRef,
  type DividerSize,
  type Orientation,
} from '../index';

describe('Divider current Vue contracts', () => {
  it('Provider and local semantic functions observe the current effective props', async () => {
    const size = ref<DividerSize>('small');
    const configNames: DividerConfig['classNames'] = ({ props }) => ({
      root: `config-${props.titlePlacement}-${props.size}`,
    });
    const configStyles: DividerConfig['styles'] = ({ props }) => ({
      root: { padding: props.size === 'small' ? '3px' : '7px' },
    });
    const context = reactive<ConfigContextValue>({
      ...DEFAULT_CONFIG_CONTEXT,
      direction: 'ltr',
      components: { divider: { classNames: configNames, styles: configStyles } },
    });
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(configContextKey, context);
          provide(
            sizeContextKey,
            computed(() => size.value),
          );
          return () =>
            h(
              Divider,
              {
                titlePlacement: 'left',
                classNames: ({ props }) => ({ root: `local-${props.orientation}-${props.size}` }),
              },
              () => 'Title',
            );
        },
      }),
    );
    expect(wrapper.classes()).toContain('config-start-small');
    expect(wrapper.classes()).toContain('local-horizontal-small');
    expect(wrapper.attributes('style')).toContain('padding: 3px');
    context.direction = 'rtl';
    size.value = 'large';
    await nextTick();
    expect(wrapper.classes()).toContain('config-end-large');
    expect(wrapper.classes()).toContain('local-horizontal-large');
    expect(wrapper.attributes('style')).toContain('padding: 7px');
  });

  it('exposes only the actual native root and clears it across unmount/remount', async () => {
    const owner = ref<DividerRef | null>(null),
      visible = ref(true);
    const wrapper = mount(
      defineComponent({ setup: () => () => (visible.value ? h(Divider, { ref: owner }) : null) }),
    );
    const original = wrapper.get<HTMLDivElement>('.apollo-divider').element;
    expect(owner.value?.nativeElement).toBe(original);
    visible.value = false;
    await nextTick();
    expect(owner.value).toBeNull();
    visible.value = true;
    await nextTick();
    expect(owner.value?.nativeElement).toBe(wrapper.get('.apollo-divider').element);
    expect(owner.value?.nativeElement).not.toBe(original);
    wrapper.unmount();
    expect(owner.value).toBeNull();
  });
  it.each([
    ['1.5', '1.5px'],
    ['-2.5', '-2.5px'],
    ['+2', '2px'],
    ['.5', '0.5px'],
    ['0', '0px'],
    ['2em', '2em'],
  ])('normalizes the documented margin %s to %s', (value, expected) => {
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const wrapper = mount(Divider, {
        props: { titlePlacement: 'start', orientationMargin: value },
        slots: { default: () => 'Title' },
      });
      expect(
        wrapper.get<HTMLSpanElement>('.apollo-divider-inner-text').element.style.marginInlineStart,
      ).toBe(expected);
    } finally {
      warning.mockRestore();
    }
  });
  it('DIV-01 inserts and removes a conditional title on the same root', async () => {
    const present = ref(false);
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(Divider, {}, present.value ? { default: () => 'Current title' } : {}),
      }),
    );
    const root = wrapper.element;
    for (const value of [true, false, true, false]) {
      present.value = value;
      await nextTick();
      expect(wrapper.element).toBe(root);
      expect(wrapper.text()).toBe(value ? 'Current title' : '');
      expect(wrapper.find('.apollo-divider-inner-text').exists()).toBe(value);
      expect(wrapper.classes().includes('apollo-divider-rail')).toBe(!value);
    }
  });

  it('DIV-02 consumes replacement and removed configuration without remounting', async () => {
    const context = reactive<ConfigContextValue>({
      ...DEFAULT_CONFIG_CONTEXT,
      direction: 'ltr',
      components: {
        divider: {
          className: 'first-root',
          classNames: { content: 'first-content' },
          styles: { content: { padding: '3px' } },
        },
      },
    });
    const wrapper = mount(
      defineComponent({
        setup() {
          provide(configContextKey, context);
          return () => h(Divider, { titlePlacement: 'left' }, () => 'Title');
        },
      }),
    );
    const root = wrapper.element;
    context.direction = 'rtl';
    context.components = {
      divider: {
        className: 'second-root',
        classNames: { content: 'second-content' },
        styles: { content: { padding: '7px' } },
      },
    };
    await nextTick();
    expect(wrapper.element).toBe(root);
    expect(wrapper.classes()).toContain('second-root');
    expect(wrapper.classes()).toContain('apollo-divider-rtl');
    expect(wrapper.classes()).toContain('apollo-divider-with-text-end');
    expect(wrapper.find('.apollo-divider-inner-text').classes()).toContain('second-content');
    expect(wrapper.find('.apollo-divider-inner-text').attributes('style')).toContain(
      'padding: 7px',
    );
    context.direction = 'ltr';
    context.components = {};
    await nextTick();
    expect(wrapper.element).toBe(root);
    expect(wrapper.classes()).not.toContain('second-root');
    expect(wrapper.classes()).not.toContain('apollo-divider-rtl');
    expect(wrapper.find('.apollo-divider-inner-text').attributes('style') ?? '').not.toContain(
      '7px',
    );
  });

  it('DIV-03/DIV-06 actual direction and axis follow their current sources', async () => {
    const orientation = ref<Orientation>('vertical');
    const dir = ref('rtl');
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(Divider, { orientation: orientation.value, dir: dir.value }),
      }),
    );
    expect(wrapper.attributes('aria-orientation')).toBe('vertical');
    expect(wrapper.attributes('dir')).toBe('rtl');
    expect(wrapper.classes()).toContain('apollo-divider-rtl');
    orientation.value = 'horizontal';
    dir.value = 'ltr';
    await nextTick();
    expect(wrapper.attributes('aria-orientation')).toBeUndefined();
    expect(wrapper.attributes('dir')).toBe('ltr');
    expect(wrapper.classes()).not.toContain('apollo-divider-rtl');
  });

  it('root attrs, listeners, complete contents and native controls remain current', async () => {
    const calls: string[] = [];
    const current = shallowRef({
      id: 'first',
      class: 'first',
      style: 'padding:3px',
      onClick: () => calls.push('first'),
    });
    const props = shallowRef<DividerProps>({ plain: false, size: 'small' });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Divider, { ...props.value, ...current.value }, () => [
            h('strong', 'Complete'),
            ' text ',
            0,
            h(Fragment, [h('em', 'fragment'), h('input', { 'aria-label': 'Divider draft' })]),
          ]),
      }),
      { attachTo: document.body },
    );
    const input = wrapper.get('input').element;
    input.value = 'Draft';
    input.focus();
    input.setSelectionRange(1, 3);
    await wrapper.trigger('click');
    current.value = {
      id: 'second',
      class: 'second',
      style: 'padding:7px',
      onClick: () => calls.push('second'),
    };
    props.value = { plain: true, size: 'large', variant: 'dotted' };
    await nextTick();
    await wrapper.trigger('click');
    expect(wrapper.attributes('id')).toBe('second');
    expect(wrapper.classes()).toContain('second');
    expect(wrapper.attributes('style')).toContain('padding: 7px');
    expect(calls).toEqual(['first', 'second']);
    expect(wrapper.text()).toBe('Complete text 0fragment');
    expect(wrapper.get('input').element).toBe(input);
    expect(input.value).toBe('Draft');
    expect(document.activeElement).toBe(input);
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3]);
  });
});
