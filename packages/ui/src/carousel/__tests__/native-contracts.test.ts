import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommentVNode, defineComponent, Fragment, h, nextTick, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { ssrTrackStyle } from '../engine';
import { Carousel } from '../index';
import NativeCarousel from './fixtures/NativeCarousel.vue';

const kids = () => ['a', 'b', 'c'].map((key) => h('div', { key }, key));
const settle = async () => {
  await nextTick();
  await nextTick();
};
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('Carousel native contracts', () => {
  it('uses typed camel-case owned notifications naturally with h and template event spelling', async () => {
    vi.useFakeTimers();
    const before = vi.fn();
    const after = vi.fn();
    const w = mount(Carousel, {
      props: { speed: 20, onBeforeChange: before, onAfterChange: after },
      slots: { default: kids },
    });
    await w.get('.slick-dots li:nth-child(2) button').trigger('click');
    await vi.advanceTimersByTimeAsync(25);
    expect(before).toHaveBeenCalledExactlyOnceWith(0, 1);
    expect(after).toHaveBeenCalledExactlyOnceWith(1);
    expect(w.emitted('beforeChange')).toEqual([[0, 1]]);
    expect(w.emitted('afterChange')).toEqual([[1]]);
    w.unmount();
  });

  it('lands complete native root attrs and style while preserving the separate semantic slider target', async () => {
    const clicked = vi.fn();
    const w = mount(Carousel, {
      props: { styles: { slider: { marginTop: '9px' } } },
      attrs: {
        id: 'native-carousel',
        title: 'Root',
        'data-native': 'yes',
        style: ['color: red', { paddingTop: '7px' }],
        onClick: clicked,
      },
      slots: { default: kids },
    });
    const root = w.get<HTMLDivElement>('#native-carousel');
    expect(root.attributes('title')).toBe('Root');
    expect(root.attributes('data-native')).toBe('yes');
    expect(root.element.style.color).toBe('red');
    expect(root.element.style.paddingTop).toBe('7px');
    expect(w.get<HTMLDivElement>('.slick-slider').element.style.marginTop).toBe('9px');
    expect(w.get<HTMLDivElement>('.slick-slider').element.style.color).toBe('');
    expect(Object.hasOwn(Carousel.props ?? {}, 'easing')).toBe(false);
    await root.trigger('click');
    expect(clicked).toHaveBeenCalledOnce();
    w.unmount();
  });

  it('keeps keyed original component identity after reordering and isolates clone refs/interactivity', async () => {
    const order = ref(['a', 'b', 'c']);
    const original = shallowRef<HTMLButtonElement | null>(null);
    let mounted = 0;
    const Slide = defineComponent({
      props: { label: { type: String, required: true } },
      setup: (props) => {
        const serial = ++mounted;
        return () => h('button', { 'data-label': props.label, 'data-serial': serial }, props.label);
      },
    });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Carousel,
            {},
            {
              default: () =>
                order.value.map((key) =>
                  key === 'a'
                    ? h('button', { key, ref: original, 'data-label': key }, key)
                    : h(Slide, { key, label: key }),
                ),
            },
          ),
      }),
    );
    const b = w.get('.slick-slide:not(.slick-cloned) [data-label="b"]').element;
    expect(original.value?.closest('.slick-slide')?.classList.contains('slick-cloned')).toBe(false);
    expect(
      w
        .findAll('.slick-cloned')
        .every(
          (slide) =>
            slide.attributes('inert') !== undefined && slide.attributes('aria-hidden') === 'true',
        ),
    ).toBe(true);
    expect(
      w.get('.slick-slide.slick-active:not(.slick-cloned)').attributes('inert'),
    ).toBeUndefined();
    expect(
      w.get('.slick-slide.slick-active:not(.slick-cloned) button').attributes('tabindex'),
    ).toBeUndefined();
    order.value = ['c', 'a', 'b'];
    await settle();
    expect(w.get('.slick-slide:not(.slick-cloned) [data-label="b"]').element).toBe(b);
    expect(original.value?.closest('.slick-slide')?.classList.contains('slick-cloned')).toBe(false);
    w.unmount();
    expect(original.value).toBeNull();
  });

  it('renders conditional full arrow content inside stable native buttons without losing siblings', async () => {
    const content = ref(false);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            Carousel,
            { arrows: true, infinite: false, speed: 0 },
            {
              default: kids,
              'next-arrow': () =>
                content.value
                  ? h(Fragment, [h('span', 'Next'), h('b', ' slide')])
                  : [createCommentVNode('empty')],
            },
          ),
      }),
    );
    const button = w.get('button.slick-next').element;
    expect(w.get('button.slick-prev').attributes('disabled')).toBeDefined();
    content.value = true;
    await settle();
    expect(w.get('button.slick-next').element).toBe(button);
    expect(w.get('button.slick-next').text()).toBe('Next slide');
    expect(w.get('button.slick-next').classes()).toContain('slick-arrow-custom');
    await w.get('button.slick-next').trigger('click');
    expect(w.get('.slick-current').attributes('data-index')).toBe('1');
    w.unmount();
  });

  it('reconfigures live show/infinite/fade and settles the superseded animation only once', async () => {
    vi.useFakeTimers();
    const after = vi.fn();
    const w = mount(Carousel, {
      props: { arrows: true, speed: 100, onAfterChange: after },
      slots: { default: kids },
    });
    await w.get('.slick-next').trigger('click');
    await w.setProps({ effect: 'fade', useTransform: false });
    expect(after).toHaveBeenCalledExactlyOnceWith(1);
    await vi.advanceTimersByTimeAsync(200);
    expect(after).toHaveBeenCalledTimes(1);
    expect(w.get<HTMLDivElement>('.slick-track').element.style.transform).toBe('');
    await w.setProps({ effect: 'scrollx', slidesToShow: 3 });
    expect(w.find('.slick-cloned').exists()).toBe(false);
    expect(w.find('.slick-arrow').exists()).toBe(false);
    expect(
      w
        .findAll('.slick-slide')
        .every(
          (slide) =>
            slide.attributes('aria-hidden') === 'false' && slide.attributes('inert') === undefined,
        ),
    ).toBe(true);
    await w.setProps({ slidesToShow: 1, infinite: false });
    expect(w.findAll('.slick-slide')).toHaveLength(3);
    expect(w.find('.slick-arrow').exists()).toBe(true);
    w.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses current autoplay for descendant focus and overlapping hover, and responds to pause option removal', async () => {
    vi.useFakeTimers();
    const before = vi.fn();
    const w = mount(Carousel, {
      props: {
        autoplay: true,
        autoplaySpeed: 100,
        speed: 0,
        pauseOnFocus: true,
        onBeforeChange: before,
      },
      slots: {
        default: () =>
          ['a', 'b', 'c'].map((key) =>
            h('div', { key }, [h('input', { value: key }), h('button', key)]),
          ),
      },
    });
    const input = w.get('.slick-slide:not(.slick-cloned).slick-active input');
    await input.trigger('focusin');
    await w.get('.slick-track').trigger('mouseenter');
    await w.get('.slick-track').trigger('mouseleave');
    await vi.advanceTimersByTimeAsync(400);
    expect(before).not.toHaveBeenCalled();
    await w.get('.slick-track').trigger('mouseenter');
    await input.trigger('focusout');
    await vi.advanceTimersByTimeAsync(400);
    expect(before).not.toHaveBeenCalled();
    await w.setProps({ pauseOnHover: false });
    await vi.advanceTimersByTimeAsync(151);
    expect(before).toHaveBeenCalledExactlyOnceWith(0, 1);
    await w.get('.slick-dots button').trigger('focusin');
    await vi.advanceTimersByTimeAsync(400);
    expect(before).toHaveBeenCalledTimes(1);
    await w
      .get('.slick-dots button')
      .trigger('focusout', { relatedTarget: w.findAll('.slick-dots button')[1]?.element });
    await vi.advanceTimersByTimeAsync(400);
    expect(before).toHaveBeenCalledTimes(1);
    await w.get('.slick-dots button').trigger('focusout');
    await vi.advanceTimersByTimeAsync(151);
    expect(before).toHaveBeenCalledTimes(2);
    w.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors current Provider styles/tokens including the legacy width alias, lengths and removal', async () => {
    const active = ref(true);
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              components: active.value
                ? {
                    carousel: {
                      classNames: { slider: 'provider-slider' },
                      styles: { slider: { color: 'navy' } },
                    },
                  }
                : undefined,
              theme: active.value
                ? {
                    components: {
                      Carousel: {
                        arrowSize: '2rem',
                        arrowOffset: 11,
                        dotWidth: 20,
                        dotHeight: 5,
                        dotGap: 6,
                        dotOffset: 17,
                        dotWidthActive: 41,
                      },
                    },
                  }
                : undefined,
            },
            () => h(Carousel, { id: 'configured-carousel' }, { default: kids }),
          ),
      }),
      { global: { stubs: { teleport: false } } },
    );
    const root = () => w.get<HTMLDivElement>('#configured-carousel');
    expect(w.get('.slick-slider').classes()).toContain('provider-slider');
    expect(w.get<HTMLDivElement>('.slick-slider').element.style.color).toBe('navy');
    expect(root().element.style.getPropertyValue('--apollo-carousel-arrow-size')).toBe('2rem');
    expect(root().element.style.getPropertyValue('--apollo-carousel-dot-width-active')).toBe(
      '41px',
    );
    expect(root().element.style.getPropertyValue('--apollo-carousel-dot-active-width')).toContain(
      'dot-width-active',
    );
    active.value = false;
    await settle();
    expect(w.get('.slick-slider').classes()).not.toContain('provider-slider');
    expect(root().element.style.getPropertyValue('--apollo-carousel-arrow-size')).toBe('');
    w.unmount();
  });
});

it('uses actual compiled slots/events/ref, finite goTo normalization and conditional content', async () => {
  vi.useFakeTimers();
  const w = mount(NativeCarousel);
  await settle();
  expect(w.vm.element).toBe(w.get('#compiled-carousel').element);
  expect(w.vm.contentElements).toHaveLength(3);
  expect(w.vm.contentElements?.every((element) => !element.closest('.slick-cloned'))).toBe(true);
  w.vm.goTo(100);
  await settle();
  expect(w.vm.current).toBe(1);
  expect(w.vm.before).toEqual([[0, 1]]);
  expect(w.vm.after).toEqual([1]);
  const original = w.get('.slick-slide:not(.slick-cloned) [data-item="a"]').element;
  w.vm.items = ['c', 'b', 'a'];
  await settle();
  expect(w.get('.slick-slide:not(.slick-cloned) [data-item="a"]').element).toBe(original);
  w.vm.custom = false;
  await settle();
  expect(w.find('button.slick-next').exists()).toBe(true);
  w.vm.items = [];
  await settle();
  expect(w.find('.slick-slide').exists()).toBe(false);
  expect(ssrTrackStyle(0, 1, 0, 0)).toEqual({
    trackStyle: { width: '0%', left: '0%' },
    slideWidth: '0%',
  });
  w.vm.present = false;
  await settle();
  expect(w.vm.element).toBeUndefined();
  w.vm.items = ['a', 'b'];
  w.vm.present = true;
  await settle();
  expect(w.vm.element).toBe(w.get('#compiled-carousel').element);
  w.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('dispatches each completed horizontal/vertical swipe once and honors native keyboard cancellation/IME/input boundaries', async () => {
  vi.useFakeTimers();
  const swipe = vi.fn();
  const cancel = (event: KeyboardEvent) => event.preventDefault();
  const w = mount(Carousel, {
    props: { infinite: false, speed: 0, onSwipe: swipe, onKeydown: cancel },
    slots: {
      default: () => ['a', 'b', 'c'].map((key) => h('div', { key }, [h('input'), h('span', key)])),
    },
  });
  const list = w.get('.slick-list');
  await list.trigger('keydown', { key: 'ArrowRight' });
  expect(w.get('.slick-current').attributes('data-index')).toBe('0');
  await w.setProps({ onKeydown: undefined });
  await list.trigger('keydown', { key: 'ArrowRight', isComposing: true });
  expect(w.get('.slick-current').attributes('data-index')).toBe('0');
  await list.trigger('mousedown', { clientX: 250, clientY: 0 });
  await list.trigger('mousemove', { clientX: 0, clientY: 0 });
  await list.trigger('mouseup', { clientX: 0, clientY: 0 });
  await vi.advanceTimersByTimeAsync(1);
  expect(swipe).toHaveBeenCalledExactlyOnceWith('left');
  expect(w.get('.slick-current').attributes('data-index')).toBe('1');
  await w.setProps({ vertical: true });
  await w.get('.slick-active:not(.slick-cloned) input').trigger('keydown', { key: 'ArrowDown' });
  expect(w.get('.slick-current').attributes('data-index')).toBe('1');
  await list.trigger('mousedown', { clientX: 0, clientY: 250 });
  await list.trigger('mousemove', { clientX: 0, clientY: 0 });
  await list.trigger('mouseup', { clientX: 0, clientY: 0 });
  await vi.advanceTimersByTimeAsync(1);
  expect(swipe.mock.calls).toEqual([['left'], ['up']]);
  expect(w.get('.slick-current').attributes('data-index')).toBe('2');
  w.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('coalesces resize work during an animation and releases actual targets/timers on unmount', async () => {
  vi.useFakeTimers();
  const instances: TestObserver[] = [];
  class TestObserver implements ResizeObserver {
    readonly targets = new Set<Element>();
    constructor(private readonly callback: ResizeObserverCallback) {
      instances.push(this);
    }
    observe(target: Element) {
      this.targets.add(target);
    }
    unobserve(target: Element) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
    trigger() {
      this.callback([], this);
    }
  }
  vi.stubGlobal('ResizeObserver', TestObserver);
  const w = mount(Carousel, { props: { arrows: true, speed: 100 }, slots: { default: kids } });
  await settle();
  const observer = instances[0];
  if (!observer) throw new Error('Expected the actual Carousel observer');
  expect(observer.targets.size).toBe(4);
  await w.get('.slick-next').trigger('click');
  observer.trigger();
  observer.trigger();
  observer.trigger();
  expect(vi.getTimerCount()).toBe(2);
  w.unmount();
  expect(observer.targets.size).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(500);
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps a visible infinite boundary clone interactive with local native ID relationships and original-only refs', async () => {
  vi.useFakeTimers();
  const original = shallowRef<HTMLInputElement | null>(null);
  const arrows = ref(false);
  const BusinessSlide = defineComponent({
    props: { id: { type: String, required: true } },
    setup: (props) => () => h('span', { 'data-business': props.id }, props.id),
  });
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Carousel,
          { slidesToShow: 2, speed: 0, arrows: arrows.value },
          {
            default: () => [
              h('div', { key: 'a' }, [
                h('label', { for: 'field-a' }, 'Field A'),
                h('input', {
                  id: 'field-a',
                  ref: original,
                  'aria-describedby': 'help-a outside-help',
                }),
                h('span', { id: 'help-a' }, 'Local help'),
              ]),
              h(BusinessSlide, { key: 'b', id: 'business-b' }),
              h('div', { key: 'c' }, 'Third'),
            ],
          },
        ),
    }),
    { attachTo: document.body },
  );
  await w.get('.slick-dots li:nth-child(3) button').trigger('click');
  await vi.advanceTimersByTimeAsync(1);
  const active = w.get('.slick-cloned.slick-active');
  expect(active.attributes('inert')).toBeUndefined();
  expect(active.attributes('aria-hidden')).toBe('false');
  const input = active.get<HTMLInputElement>('input');
  expect(input.element.id).not.toBe('field-a');
  expect(active.get<HTMLLabelElement>('label').element.control).toBe(input.element);
  const help = active.get('span').attributes('id');
  expect(input.attributes('aria-describedby')).toBe(`${help} outside-help`);
  expect(original.value).toBe(
    w.get<HTMLInputElement>('.slick-slide:not(.slick-cloned) input').element,
  );
  expect(
    w
      .findAll('.slick-cloned [data-business]')
      .every((node) => node.attributes('data-business') === 'business-b'),
  ).toBe(true);
  expect(w.findAll('.slick-cloned input').map((node) => node.element.id).length).toBe(
    new Set(w.findAll('.slick-cloned input').map((node) => node.element.id)).size,
  );
  const stableId = input.element.id;
  arrows.value = true;
  await settle();
  expect(w.get('.slick-cloned.slick-active input').attributes('id')).toBe(stableId);
  w.unmount();
  expect(original.value).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps scoped component slot refs on the original and invokes each rendered slot only once', async () => {
  const field = shallowRef<HTMLInputElement | null>(null);
  const text = ref('initial');
  const scopes = new Set<object>();
  const calls: object[] = [];
  const Shell = defineComponent({
    setup: (_props, { slots }) => {
      const scope = { stamp: 'from-shell' };
      scopes.add(scope);
      return () => h('div', slots.default?.(scope));
    },
  });
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          Carousel,
          {},
          {
            default: () => [
              h(
                Shell,
                { key: 'a' },
                {
                  default: (scope: { stamp: string }) => {
                    calls.push(scope);
                    return [
                      h('input', { ref: field, 'data-slot-field': scope.stamp, value: text.value }),
                    ];
                  },
                },
              ),
              h('div', { key: 'b' }, 'Second'),
            ],
          },
        ),
    }),
  );
  await settle();
  const original = w.get<HTMLInputElement>('.slick-slide:not(.slick-cloned) input').element;
  expect(field.value).toBe(original);
  expect(calls.every((scope) => scopes.has(scope))).toBe(true);
  const count = calls.length;
  text.value = 'updated';
  await settle();
  expect(calls.length - count).toBe(2);
  expect(field.value).toBe(original);
  expect(
    w.findAll<HTMLInputElement>('input').every((input) => input.element.value === 'updated'),
  ).toBe(true);
  expect(calls.every((scope) => scopes.has(scope))).toBe(true);
  w.unmount();
  expect(field.value).toBeNull();
});
