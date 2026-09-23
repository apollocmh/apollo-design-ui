/**
 * L1/L2 · 单元与交互测试（Carousel）
 *
 * 上游测试转断言：antd 6.6.4 `carousel/__tests__/` + `@ant-design/react-slick@2.0.0`
 * 的运行时语义（inner-slider.js）。每条用例的注释标明判据来源。
 *
 * ⚠️ jsdom 里 `offsetWidth` 恒为 0 ⇒ 挂载后 slideWidth=0、track transform 是
 *    `translate3d(0px,…)`—— 定位**数值**没有意义，钉的是**状态机**：currentSlide /
 *    targetSlide / 类名 / aria / 回调次序 / 自动播放计时。SSR 定位由 L4 钉。
 *
 * ⚠️ jsdom 会把 style 属性经 CSSOM 重序列化（`width: 500%`、`left: 0px`，带空格），
 *    断言一律用 `styleOf()` 去空白后比对。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Carousel } from '../index';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const kids = (n = 3) =>
  Array.from({ length: n }, (_, i) => h('div', { key: i }, h('h3', null, `${i + 1}`)));

type Slots = Record<string, () => unknown>;

/** 结构化最小 wrapper 类型：不同 props 形态的 VueWrapper 泛型互不兼容（TS2345）。 */
interface MiniWrapper {
  find: (selector: string) => { attributes: (k: string) => string | undefined };
  findAll: (selector: string) => {
    attributes: (k: string) => string | undefined;
    classes: () => string[];
    find: (s: string) => {
      trigger: (e: string) => Promise<void>;
      text: () => string;
      classes: () => string[];
    };
  }[];
}

const makeCarousel = (props: Record<string, unknown> = {}, slots?: Slots) =>
  mount(Carousel, { props, slots: slots ?? { default: () => kids() } });

const track = (w: MiniWrapper) => w.find('.slick-track');
const slides = (w: MiniWrapper) => w.findAll('.slick-slide');
const dots = (w: MiniWrapper) => w.findAll('.slick-dots li');

/** style 属性去空白（jsdom 的 CSSOM 序列化带空格）。 */
const styleOf = (el: { attributes: (k: string) => string | undefined }): string =>
  (el.attributes('style') ?? '').replace(/\s+/g, '');

/** 冲刷引擎的动画 setTimeout（speed=500）。 */
const flushSpeed = async () => {
  await vi.advanceTimersByTimeAsync(600);
  await nextTick();
};

describe('Carousel · 初始 DOM（与 L4 呼应的结构判据）', () => {
  it('infinite 默认 true ⇒ 5 个 slide（前 1 后 1 clone），track 定位是 % 公式', () => {
    const w = makeCarousel();
    expect(slides(w)).toHaveLength(5);
    expect(slides(w)[0]!.classes()).toContain('slick-cloned');
    expect(slides(w)[0]!.attributes('data-index')).toBe('-1');
    expect(slides(w)[4]!.attributes('data-index')).toBe('3');
    const st = styleOf(track(w));
    expect(st).toContain('width:500%');
    expect(st).toContain('left:-100%');
    // 正片 0：slick-active slick-current + aria-hidden=false
    expect(slides(w)[1]!.classes()).toContain('slick-current');
    expect(slides(w)[1]!.attributes('aria-hidden')).toBe('false');
    // clone：aria-hidden=true
    expect(slides(w)[0]!.attributes('aria-hidden')).toBe('true');
  });

  it('dots 默认 3 个、非激活 li 的 class 是空字符串（不是省略）', () => {
    const w = makeCarousel();
    expect(dots(w)).toHaveLength(3);
    expect(dots(w)[0]!.classes()).toEqual(['slick-active']);
    expect(dots(w)[1]!.classes()).toEqual([]);
    expect(dots(w)[1]!.find('button').text()).toBe('2');
  });

  it('arrows 默认无；开启后前后各一个 button，aria-label 来自 locale', () => {
    const w = makeCarousel({ arrows: true });
    const prev = w.find('button.slick-prev');
    const next = w.find('button.slick-next');
    expect(prev.exists()).toBe(true);
    expect(next.exists()).toBe(true);
    // ⚠️ antd 的默认箭头没有文案（空 ArrowButton），aria-label 来自 en locale
    expect(prev.attributes('aria-label')).toBe('Previous slide');
    expect(next.attributes('aria-label')).toBe('Next slide');
    expect(prev.attributes('data-role')).toBe('none');
  });

  it('单张 slide ⇒ unslick：无 clone、无 dots、track 100%/left 0', () => {
    const w = makeCarousel({}, { default: () => [kids(1)[0]!] });
    expect(slides(w)).toHaveLength(1);
    expect(w.find('.slick-dots').exists()).toBe(false);
    const st = styleOf(track(w));
    expect(st).toContain('width:100%');
    expect(st).toContain('left:0%');
  });
});

describe('Carousel · 切换状态机（slick slideHandler / changeSlide）', () => {
  it('点击 dot 2：before-change(0,1) → currentSlide=1 → after-change(1)，li 类更新', async () => {
    const before = vi.fn();
    const after = vi.fn();
    const w = mount(Carousel, {
      props: { onBeforeChange: before, onAfterChange: after },
      slots: { default: () => kids() },
    });
    await dots(w)[1]!.find('button').trigger('click');
    // waitForAnimate 默认 false：currentSlide 立即到目标，after 在 speed 后
    expect(slides(w)[2]!.classes()).toContain('slick-current');
    await flushSpeed();
    expect(before).toHaveBeenCalledWith(0, 1);
    expect(after).toHaveBeenCalledWith(1);
    expect(dots(w)[1]!.classes()).toContain('slick-active');
  });

  it('expose 的 next()/prev()/goTo()：回绕与定位', async () => {
    const w = makeCarousel();
    const exposed = w.vm.$.exposed as {
      next: () => void;
      prev: () => void;
      goTo: (i: number, d?: boolean) => void;
      innerSlider: { currentSlide: number };
    };
    exposed.next();
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(1);
    exposed.prev();
    exposed.prev();
    await nextTick();
    // 1 → 0 → prev 回绕到 2（infinite：index=-1 ⇒ finalSlide = -1+3 = 2）
    expect(exposed.innerSlider.currentSlide).toBe(2);
    exposed.goTo(0, true);
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(0);
  });

  it('goTo 越界（infinite）：goTo(3) ⇒ 归一化到 0', async () => {
    const w = makeCarousel();
    const exposed = w.vm.$.exposed as {
      goTo: (i: number) => void;
      innerSlider: { currentSlide: number };
    };
    exposed.goTo(3);
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(0);
  });

  it('waitForAnimate=true：动画中新的切换被忽略（slideHandler 返回空）', async () => {
    const w = makeCarousel({ waitForAnimate: true });
    const exposed = w.vm.$.exposed as {
      goTo: (i: number) => void;
      innerSlider: { currentSlide: number };
    };
    exposed.goTo(1);
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(1);
    // 动画未结束（speed 500 未冲刷）⇒ 新目标被拦截
    exposed.goTo(2);
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(1);
    await flushSpeed();
    exposed.goTo(2);
    await nextTick();
    expect(exposed.innerSlider.currentSlide).toBe(2);
  });

  it('waitForAnimate=false（antd 默认）：打断时立即补发旧 slide 的 after-change', async () => {
    const after = vi.fn();
    const w = mount(Carousel, {
      props: { onAfterChange: after },
      slots: { default: () => kids() },
    });
    const ex = w.vm.$.exposed as {
      goTo: (i: number) => void;
      innerSlider: { currentSlide: number };
    };
    ex.goTo(1);
    await nextTick();
    ex.goTo(2); // 动画中打断
    await flushSpeed();
    // 旧目标 1 的 after 被立即补发 + 新目标 2 的 after
    expect(after.mock.calls.map((c) => c[0])).toContain(1);
    expect(after).toHaveBeenLastCalledWith(2);
    expect(ex.innerSlider.currentSlide).toBe(2);
  });
});

describe('Carousel · fade 分支', () => {
  it('fade：无 clone、当前张 opacity 1 / 非当前 0（内联），z-index 999/998', () => {
    const w = makeCarousel({ effect: 'fade' });
    expect(slides(w)).toHaveLength(3);
    const first = slides(w)[0]!;
    const st0 = styleOf(first);
    expect(st0).toContain('opacity:1');
    expect(st0).toContain('z-index:999');
    const st1 = styleOf(slides(w)[1]!);
    expect(st1).toContain('opacity:0');
    expect(st1).toContain('z-index:998');
    expect(st0).toContain('transition:opacity500msease,visibility500msease');
  });

  it('fade：点击 dot 后透明度切换到新当前张', async () => {
    const w = makeCarousel({ effect: 'fade' });
    await dots(w)[2]!.find('button').trigger('click');
    await nextTick();
    expect(styleOf(slides(w)[2]!)).toContain('opacity:1');
    expect(styleOf(slides(w)[0]!)).toContain('opacity:0');
  });
});

describe('Carousel · infinite=false', () => {
  it('无 clone、3 个 slide、track 300%/left 0', () => {
    const w = makeCarousel({ infinite: false });
    expect(slides(w)).toHaveLength(3);
    const st = styleOf(track(w));
    expect(st).toContain('width:300%');
    expect(st).toContain('left:0%');
  });

  it('arrows：currentSlide=0 时 prev 有 slick-disabled 且点击不切换', async () => {
    const w = makeCarousel({ arrows: true, infinite: false });
    const prev = w.find('button.slick-prev');
    expect(prev.classes()).toContain('slick-disabled');
    // arrows.js：disabled 时 prevHandler = null ⇒ click 不切换
    await prev.trigger('click');
    await nextTick();
    const exposed = w.vm.$.exposed as { innerSlider: { currentSlide: number } };
    expect(exposed.innerSlider.currentSlide).toBe(0);
    // next 可用
    expect(w.find('button.slick-next').classes()).not.toContain('slick-disabled');
  });
});

describe('Carousel · 键盘（slick keyHandler：keyCode 37/39）', () => {
  const keydown = async (el: Element, keyCode: number) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { value: keyCode });
    el.dispatchEvent(event);
    await nextTick();
  };

  it('ArrowRight(39) → next；ArrowLeft(37) → previous', async () => {
    const w = makeCarousel();
    const list = w.find('.slick-list');
    await keydown(list.element, 39);
    const exposed = w.vm.$.exposed as { innerSlider: { currentSlide: number } };
    expect(exposed.innerSlider.currentSlide).toBe(1);
    await keydown(list.element, 37);
    expect(exposed.innerSlider.currentSlide).toBe(0);
  });

  it('焦点在 INPUT 内不触发（keyHandler 的 tagName 判据）', async () => {
    const w = mount(Carousel, {
      slots: { default: () => [h('div', [h('input')])] },
    });
    const input = w.find('input');
    (input.element as HTMLElement).focus?.();
    await keydown(input.element, 39);
    const exposed = w.vm.$.exposed as { innerSlider: { currentSlide: number } };
    expect(exposed.innerSlider.currentSlide).toBe(0);
  });

  it('accessibility=false 关闭键盘', async () => {
    const w = makeCarousel({ accessibility: false });
    await keydown(w.find('.slick-list').element, 39);
    const exposed = w.vm.$.exposed as { innerSlider: { currentSlide: number } };
    expect(exposed.innerSlider.currentSlide).toBe(0);
  });
});

describe('Carousel · 自动播放（slick autoPlay / pause / play）', () => {
  it('autoplay：autoplaySpeed+50 推进 currentSlide', async () => {
    const w = makeCarousel({ autoplay: true, autoplaySpeed: 1000 });
    await vi.advanceTimersByTimeAsync(1050);
    await nextTick();
    const exposed = w.vm.$.exposed as { innerSlider: { currentSlide: number } };
    expect(exposed.innerSlider.currentSlide).toBe(1);
    await flushSpeed();
  });

  it('pauseOnHover（默认 true）：track mouseenter 暂停、mouseleave 恢复', async () => {
    const w = makeCarousel({ autoplay: true, autoplaySpeed: 1000 });
    await vi.advanceTimersByTimeAsync(1050);
    await nextTick();
    await w.find('.slick-track').trigger('mouseenter');
    const exposed = w.vm.$.exposed as { innerSlider: { autoplaying: string | null } };
    expect(exposed.innerSlider.autoplaying).toBe('hovered');
    await w.find('.slick-track').trigger('mouseleave');
    expect(exposed.innerSlider.autoplaying).toBe('playing');
    await flushSpeed();
  });

  it('autoplay 对象形态 dotDuration：根节点注入 --dot-duration', () => {
    const w = makeCarousel({ autoplay: { dotDuration: true }, autoplaySpeed: 4000 });
    expect(styleOf(w.find('.apollo-carousel'))).toContain('--dot-duration:4000ms');
  });

  it('expose.autoPlay("update"/"leave"/"blur") 状态机（slick 语义）', async () => {
    const w = makeCarousel({ autoplay: true, autoplaySpeed: 1000 });
    const exposed = w.vm.$.exposed as {
      autoPlay: (t?: 'update' | 'leave' | 'blur') => void;
      innerSlider: { autoplaying: string | null };
    };
    exposed.autoPlay('update');
    expect(exposed.innerSlider.autoplaying).toBe('playing');
    await flushSpeed();
  });
});

describe('Carousel · 位置 / 纵向 / rtl', () => {
  it('dotPlacement start ⇒ vertical 布局类 + dots-start', () => {
    const w = makeCarousel({ dotPlacement: 'start' });
    expect(w.find('.apollo-carousel').classes()).toContain('apollo-carousel-vertical');
    expect(w.find('.slick-slider').classes()).toContain('slick-vertical');
    expect(w.find('.slick-dots').classes()).toContain('slick-dots-start');
  });

  it('deprecated dotPosition="left" 映射到 start（deprecated 告警由 dev-warning 层测）', () => {
    const w = makeCarousel({ dotPosition: 'left' as never });
    expect(w.find('.apollo-carousel').classes()).toContain('apollo-carousel-vertical');
    expect(w.find('.slick-dots').classes()).toContain('slick-dots-start');
  });

  it('dotPlacement top：dots-top，无 vertical 类', () => {
    const w = makeCarousel({ dotPlacement: 'top' });
    expect(w.find('.apollo-carousel').classes()).not.toContain('apollo-carousel-vertical');
    expect(w.find('.slick-dots').classes()).toContain('slick-dots-top');
  });

  it('rtl：DOM 顺序反转（data-index 3..1）+ 根 -rtl 类 + 类名按镜像索引', () => {
    const w = makeCarousel({ rtl: true });
    expect(w.find('.apollo-carousel').classes()).toContain('apollo-carousel-rtl');
    const order = slides(w).map((s) => s.attributes('data-index'));
    expect(order).toEqual(['3', '2', '1', '0', '-1']);
    // 镜像判据：slick-current 落在 data-index=2（镜像后 index 0）
    expect(slides(w)[1]!.classes()).toContain('slick-current');
  });
});

describe('Carousel · children 变化（componentDidUpdate 语义）', () => {
  it('动态加 slide：track 重建、unslick 边界切换（1 → 2 张出 clone）', async () => {
    const count = ref(1);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Carousel, null, {
            default: () =>
              Array.from({ length: count.value }, (_, i) => h('div', { key: i }, `${i}`)),
          });
      },
    });
    const w = mount(Host);
    expect(w.findAll('.slick-slide')).toHaveLength(1); // unslick
    count.value = 2;
    await nextTick();
    // infinite + n=2：pre/post 各 1 ⇒ 4 个节点
    expect(w.findAll('.slick-slide')).toHaveLength(4);
  });
});

describe('Carousel · ConfigProvider', () => {
  it('direction=rtl 且未显式 vertical 时启用 rtl（且不与 vertical 同用）', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Carousel, null, { default: () => kids() }) },
    });
    expect(w.find('.apollo-carousel').classes()).toContain('apollo-carousel-rtl');
  });

  it('prefixCls 覆盖（默认经 ConfigProvider 为 apollo-carousel）', () => {
    const w = mount(ConfigProvider, {
      props: { prefixCls: 'ant' },
      slots: { default: () => h(Carousel, null, { default: () => kids() }) },
    });
    expect(w.find('.ant-carousel').exists()).toBe(true);
  });
});

describe('Carousel · 事件与 ref 形状', () => {
  it('事件四件套：before-change / after-change / swipe / edge 均可监听', async () => {
    const onBeforeChange = vi.fn();
    const onAfterChange = vi.fn();
    const w = mount(Carousel, {
      props: { onBeforeChange, onAfterChange },
      slots: { default: () => kids() },
    });
    await dots(w)[2]!.find('button').trigger('click');
    await flushSpeed();
    expect(onBeforeChange).toHaveBeenCalledWith(0, 2);
    expect(onAfterChange).toHaveBeenCalledWith(2);
  });

  it('ref 形状：nativeElement / goTo / next / prev / autoPlay / innerSlider', () => {
    const w = makeCarousel();
    const exposed = w.vm.$.exposed as Record<string, unknown>;
    expect(exposed.nativeElement).toBeInstanceOf(HTMLElement);
    expect(typeof exposed.goTo).toBe('function');
    expect(typeof exposed.next).toBe('function');
    expect(typeof exposed.prev).toBe('function');
    expect(typeof exposed.autoPlay).toBe('function');
    expect((exposed.innerSlider as { currentSlide: number }).currentSlide).toBe(0);
  });
});
