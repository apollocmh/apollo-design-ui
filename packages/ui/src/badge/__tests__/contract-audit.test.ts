import { getDesignToken } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Component,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  type VNodeChild,
} from 'vue';
import ConfigProvider from '../../config-provider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import { Badge, Ribbon } from '../index';
import type { BadgeProps, RibbonProps } from '../interface';
import SingleNumber from '../SingleNumber.vue';
import { prepareComponentToken } from '../style/token';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  vi.useRealTimers();
});
function render(component: Component, props: Record<string, unknown> = {}) {
  const w = mount(
    defineComponent(() => () => h(component, props)),
    { attachTo: document.body },
  );
  cleanups.push(() => w.unmount());
  return w;
}

describe('Badge/Ribbon current native contracts', () => {
  const specimens: {
    name: string;
    component: Component;
    props: BadgeProps | RibbonProps;
    wrapped: boolean;
  }[] = [
    { name: 'wrapped Badge', component: Badge, props: { count: 5 }, wrapped: true },
    { name: 'standalone Badge', component: Badge, props: { count: 5 }, wrapped: false },
    { name: 'status Badge', component: Badge, props: { status: 'success' }, wrapped: false },
    { name: 'Ribbon', component: Ribbon, props: { text: 'Ribbon' }, wrapped: true },
  ];
  for (const spec of specimens) {
    for (const style of [
      'padding: 13px; --native-audit: 1',
      [{ padding: '13px' }, { '--native-audit': '1' }],
      { padding: '13px', '--native-audit': '1' },
    ]) {
      it(`${spec.name}: native root style accepts ${typeof style === 'string' ? 'string' : Array.isArray(style) ? 'array' : 'object'}`, async () => {
        const attrs = ref<Record<string, unknown>>({
          id: 'before',
          class: 'native-before',
          style,
          'aria-label': 'Before',
        });
        const clicks = vi.fn();
        const w = mount(
          defineComponent(
            () => () =>
              h(
                spec.component,
                {
                  ...spec.props,
                  styles: { root: { marginLeft: '7px' } },
                  ...attrs.value,
                  onClick: clicks,
                },
                spec.wrapped
                  ? { default: () => h('input', { 'aria-label': 'Business draft' }) }
                  : {},
              ),
          ),
          { attachTo: document.body },
        );
        cleanups.push(() => w.unmount());
        const root = w.element;
        expect(w.attributes('style')).toContain('padding: 13px');
        expect(w.attributes('style')).toContain('margin-left: 7px');
        expect(w.attributes('style')).toContain('--native-audit: 1');
        await w.trigger('click');
        expect(clicks).toHaveBeenCalledTimes(1);
        const input = spec.wrapped ? w.get('input').element : undefined;
        attrs.value = { id: 'after', class: ['native-after'], style: { padding: '3px' } };
        await nextTick();
        expect(w.element).toBe(root);
        if (spec.wrapped) expect(w.get('input').element).toBe(input);
        expect(w.attributes('id')).toBe('after');
        expect(w.classes()).toContain('native-after');
        expect(w.classes()).not.toContain('native-before');
        expect(w.attributes('aria-label')).toBeUndefined();
        expect(w.attributes('style')).toContain('padding: 3px');
        expect(w.attributes('style')).not.toContain('--native-audit');
        attrs.value = {};
        await nextTick();
        expect(w.attributes('id')).toBeUndefined();
        expect(w.attributes('style')).toBe('margin-left: 7px;');
      });
    }
  }

  it('Badge exposes its actual stable root across status/count changes and clears it on unmount', async () => {
    const w = mount(Badge, {
      props: { status: 'success' },
      attrs: { tabindex: 0 },
      attachTo: document.body,
    });
    cleanups.push(() => w.unmount());
    const vm = w.vm;
    const root = w.element;
    if (!(root instanceof HTMLElement)) throw Error('Missing Badge root');
    expect(Reflect.get(vm, 'nativeElement')).toBe(root);
    root.focus();
    await w.setProps({ count: 8 });
    expect(w.element).toBe(root);
    expect(document.activeElement).toBe(root);
    expect(Reflect.get(vm, 'nativeElement')).toBe(root);
    await w.setProps({ count: null });
    expect(w.element).toBe(root);
    w.unmount();
    expect(Reflect.get(vm, 'nativeElement')).toBeNull();
  });

  for (const component of [Badge, Ribbon]) {
    it(`${component.name}: Provider configuration replacement/removal keeps business content`, async () => {
      const key = component === Badge ? 'badge' : 'ribbon';
      const indicator = component === Badge ? '.apollo-badge-count' : '.apollo-ribbon';
      const config = ref<ConfigProviderProps['components']>({
        [key]: {
          className: 'provider-before',
          classNames: { root: 'root-before', indicator: 'indicator-before' },
          styles: { root: { marginTop: '3px' }, indicator: { paddingLeft: '4px' } },
        },
      });
      const direction = ref<'ltr' | 'rtl'>('ltr');
      const w = mount(
        defineComponent(
          () => () =>
            h(
              ConfigProvider,
              { components: config.value, direction: direction.value },
              {
                default: () =>
                  h(
                    component,
                    { count: 5, text: 'Ready' },
                    { default: () => h('input', { 'aria-label': 'Provider draft' }) },
                  ),
              },
            ),
        ),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      );
      cleanups.push(() => w.unmount());
      const input = w.get('input').element;
      input.value = 'Local draft';
      input.focus();
      const root = w.findComponent(component).element;
      config.value = {
        [key]: {
          className: 'provider-after',
          classNames: () => ({
            root: 'root-after',
            indicator: 'indicator-after',
            content: 'content-after',
          }),
          styles: () => ({
            root: { marginTop: '9px' },
            indicator: { paddingLeft: '11px' },
            content: { fontWeight: 'bold' },
          }),
        },
      };
      direction.value = 'rtl';
      await nextTick();
      expect(w.findComponent(component).element).toBe(root);
      expect(root.classList.contains('root-after')).toBe(true);
      expect(root.classList.contains('root-before')).toBe(false);
      expect(root.getAttribute('style')).toContain('margin-top: 9px');
      expect(w.get(indicator).classes()).toContain('indicator-after');
      expect(w.get(indicator).attributes('style')).toContain('padding-left: 11px');
      expect(w.html()).toContain('provider-after');
      expect(w.html()).not.toContain('provider-before');
      expect(w.html()).toContain(`${component === Badge ? 'apollo-badge' : 'apollo-ribbon'}-rtl`);
      if (component === Ribbon)
        expect(w.get('.apollo-ribbon-content').classes()).toContain('content-after');
      config.value = {};
      direction.value = 'ltr';
      await nextTick();
      expect(root.classList.contains('root-after')).toBe(false);
      expect(w.html()).not.toContain('provider-after');
      expect(w.get(indicator).attributes('style') ?? '').not.toContain('padding-left');
      expect(w.get('input').element).toBe(input);
      expect(input.value).toBe('Local draft');
      expect(document.activeElement).toBe(input);
    });
  }

  for (const count of [0, '0', null]) {
    it(`dot overrides ${String(count)} count`, () => {
      const w = render(Badge, { count, dot: true });
      expect(w.get('.apollo-badge-dot').text()).toBe('');
    });
  }
  it('numeric text zero cannot hide an independent nonzero count', () => {
    const w = render(Badge, { count: 5, text: 0 });
    expect(w.get('.apollo-badge-count').text()).toBe('5');
    expect(w.find('.apollo-badge-status-text').exists()).toBe(false);
  });
  it('status indicators consume explicit title and disable it dynamically', async () => {
    const w = mount(Badge, { props: { status: 'success', title: 'Current status' } });
    cleanups.push(() => w.unmount());
    expect(w.get('.apollo-badge-status-dot').attributes('title')).toBe('Current status');
    await w.setProps({ title: false });
    expect(w.get('.apollo-badge-status-dot').attributes('title')).toBeUndefined();
  });
  it('negative integer counts preserve their sign and never render NaN', () => {
    const w = render(Badge, { count: -12 });
    expect(w.get('.apollo-badge-count').text()).toBe('-12');
    expect(w.text()).not.toContain('NaN');
  });
  it('animated digits expose only the current value as accessible text', async () => {
    const w = mount(Badge, { props: { count: 15 } });
    cleanups.push(() => w.unmount());
    await w.setProps({ count: 29 });
    const copy = w.get('.apollo-badge-count').element.cloneNode(true);
    if (!(copy instanceof HTMLElement)) throw Error('Missing indicator');
    for (const node of copy.querySelectorAll('[aria-hidden="true"]')) node.remove();
    expect(copy.textContent).toBe('29');
    expect(w.findAll('.apollo-scroll-number-only-unit').length).toBeGreaterThan(2);
  });
  for (const [offset, expected] of [
    [[1.5, -2.5], '-1.5px'],
    [['1.5em', '2rem'], 'calc(-1.5em)'],
    [['25%', '10%'], 'calc(-25%)'],
  ] as const) {
    it(`offset preserves ${offset[0]} as a logical CSS length`, () => {
      const w = render(Badge, { count: 5, offset: [...offset] });
      expect(w.get('.apollo-badge-count').attributes('style')).toContain(
        `inset-inline-end: ${expected}`,
      );
    });
  }
  for (const [name, text] of [
    ['array', [h('strong', 'First'), ' / ', h('em', 'Second')]],
    ['Fragment', h(Fragment, [h('strong', 'First'), ' / ', h('em', 'Second')])],
    ['zero', 0],
  ] satisfies [string, VNodeChild][]) {
    it(`Ribbon renders complete ${name} text data`, () => {
      const w = render(Ribbon, { text });
      expect(w.get('.apollo-ribbon-content').text()).toBe(name === 'zero' ? '0' : 'First / Second');
    });
  }
  it('Ribbon #text is typed native content with empty precedence and prop restoration', async () => {
    const enabled = ref(true),
      empty = ref(false);
    const w = mount(
      defineComponent(
        () => () =>
          h(
            Ribbon,
            { text: 'Fallback' },
            {
              ...(enabled.value
                ? { text: () => (empty.value ? [] : [h('strong', 'First'), h('em', 'Second')]) }
                : {}),
              default: () => h('input', { 'aria-label': 'Ribbon draft' }),
            },
          ),
      ),
    );
    cleanups.push(() => w.unmount());
    const input = w.get('input').element;
    expect(w.get('.apollo-ribbon-content').text()).toBe('FirstSecond');
    empty.value = true;
    await nextTick();
    expect(w.get('.apollo-ribbon-content').text()).toBe('');
    enabled.value = false;
    await nextTick();
    expect(w.get('.apollo-ribbon-content').text()).toBe('Fallback');
    expect(w.get('input').element).toBe(input);
  });
  it('count VNode data retains complete content and business identity across updates', async () => {
    const count = ref(0),
      mounted = vi.fn(),
      unmounted = vi.fn();
    const Business = defineComponent(() => {
      onMounted(mounted);
      onUnmounted(unmounted);
      return () => h('input', { 'aria-label': 'Count business draft' });
    });
    const w = mount(
      defineComponent(
        () => () =>
          h(Badge, {
            count: [h('strong', String(count.value)), h(Business)],
          }),
      ),
      { attachTo: document.body },
    );
    cleanups.push(() => w.unmount());
    const input = w.get('input').element;
    input.value = 'Draft';
    input.focus();
    count.value++;
    await nextTick();
    expect(w.get('strong').text()).toBe('1');
    expect(w.get('input').element).toBe(input);
    expect(input.value).toBe('Draft');
    expect(document.activeElement).toBe(input);
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
  });
  for (const [name, content] of [
    ['native VNode', () => h('strong', { class: 'owned-content' }, 'First / Last0')],
    ['array', () => [h('strong', 'First'), ' / ', h('em', 'Last'), 0]],
    ['Fragment', () => h(Fragment, [h('strong', 'First'), ' / ', h('em', 'Last'), 0])],
    ['text VNode', () => createTextVNode('First / Last0')],
    [
      'multiple-root component',
      () => h(defineComponent(() => () => [h('strong', 'First'), ' / ', h('em', 'Last'), 0])),
    ],
  ] satisfies [string, () => VNodeChild][]) {
    it(`complete ${name} count has an owned native indicator with semantic attributes`, () => {
      const w = render(Badge, {
        count: content(),
        title: 'Custom count',
        classNames: { indicator: 'owned-indicator' },
        styles: { indicator: { paddingLeft: '7px' } },
      });
      const indicator = w.get('.apollo-scroll-number-custom-component');
      expect(indicator.element.tagName).toBe('SUP');
      expect(indicator.classes()).toContain('owned-indicator');
      expect(indicator.attributes('title')).toBe('Custom count');
      expect(indicator.attributes('style')).toContain('padding-left: 7px');
      expect(indicator.text()).toBe('First / Last0');
      if (name === 'native VNode')
        expect(indicator.get('.owned-content').element.tagName).toBe('STRONG');
    });
  }
  for (const [name, content] of [
    ['null', () => null],
    ['false', () => false],
    ['true', () => true],
    ['zero', () => 0],
    ['string zero', () => '0'],
    ['empty string', () => ''],
    ['empty array', () => []],
    ['empty Fragment', () => h(Fragment, [])],
    ['empty text VNode', () => createTextVNode('')],
  ] satisfies [string, () => VNodeChild][]) {
    it(`${name} count cannot create an empty indicator or hide independent text`, () => {
      const w = render(Badge, { count: content(), text: 'Caption' });
      expect(w.find('.apollo-badge-count,.apollo-scroll-number-custom-component').exists()).toBe(
        false,
      );
      expect(w.get('.apollo-badge-status-text').text()).toBe('Caption');
    });
  }
  it('new standalone status titles cannot inherit a stale leaving count', async () => {
    const w = mount(Badge, { props: { count: 8, status: 'success' } });
    cleanups.push(() => w.unmount());
    await w.setProps({ count: null });
    expect(w.get('.apollo-badge-status-dot').attributes('title')).toBeUndefined();
    expect(w.find('.apollo-badge-count').exists()).toBe(false);
  });
  it('existing nine tokens derive from the current AliasToken', () => {
    const token = getDesignToken({
      token: { fontSize: 20, fontSizeSM: 16, lineWidth: 2, paddingXS: 13 },
    });
    expect(prepareComponentToken(token)).toEqual({
      indicatorZIndex: 'auto',
      indicatorHeight: Math.round(token.fontSize * token.lineHeight) - 2 * token.lineWidth,
      indicatorHeightSM: token.fontSize,
      dotSize: token.fontSizeSM / 2,
      textFontSize: token.fontSizeSM,
      textFontSizeSM: token.fontSizeSM,
      textFontWeight: 'normal',
      statusSize: token.fontSizeSM / 2,
      paddingInline: token.paddingXS,
    });
  });
  it('numeric motion fallback timers are removed when the instance unmounts', async () => {
    vi.useFakeTimers();
    const w = mount(SingleNumber, {
      props: { prefixCls: 'apollo-scroll-number', count: 1, value: '1' },
    });
    await w.setProps({ count: 2, value: '2' });
    expect(vi.getTimerCount()).toBe(1);
    w.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
