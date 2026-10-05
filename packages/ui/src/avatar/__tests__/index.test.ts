/**
 * Avatar · L1/L2（jsdom）。
 *
 * ── 为什么这里能钉住大部分契约 ────────────────────────────────────────────────
 *
 * jsdom **没有布局**（`offsetWidth` 恒 0）—— 但 Avatar 的可见形态几乎全在**结构**上
 * （五路互斥分支的产物、类名的条件组合、内联尺寸样式），所以 L1 能钉住绝大部分行为契约。
 * 像素归 **L6**。
 *
 * ⚠️ 唯一需要「布局」的是**字符缩放**（`setScaleParam`）⇒ 本文件用
 * `Object.defineProperty(el, 'offsetWidth', …)` **手动造**几何，再触发重测。
 *
 * 上游测试 `components/avatar/__tests__/`。本文件钉**最容易写错的那批**：
 * 五路分支、`-image` 的真值判据、`onError` 的 `!== false` 语义、`src` 变化的重置、
 * 数字/响应式尺寸的**不同** `fontSize` 判据、`gap` 的缩放算式、`Avatar.Group` 的截断与
 * context 透传、以及**一次渲染只调一次插槽**这条回归防线。
 */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Avatar, AvatarGroup } from '../index';

const P = 'apollo-avatar';

type Slots = Record<string, () => unknown>;

const mountAvatar = (props: Record<string, unknown> = {}, slots?: Slots) =>
  mount(Avatar, { props, slots, attachTo: document.body });

/** 造几何：`offsetWidth` 在 jsdom 里恒 0，测量路径需要它非 0。 */
const setWidth = (el: Element, width: number): void => {
  Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true });
};

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 根元素与类名
// ---------------------------------------------------------------------------

describe('Avatar · 根元素与类名', () => {
  it('根是 `<span class="apollo-avatar apollo-avatar-circle apollo-avatar-css-var">`', () => {
    const w = mountAvatar({}, { default: () => 'U' });

    expect(w.element.tagName).toBe('SPAN');
    const cls = w.element.classList;
    expect(cls.contains(P)).toBe(true);
    // 默认 shape 是 circle
    expect(cls.contains(`${P}-circle`)).toBe(true);
    expect(cls.contains(`${P}-css-var`)).toBe(true);
    w.unmount();
  });

  it('`shape="square"` ⇒ `-square`，**没有** `-circle`', () => {
    const w = mountAvatar({ shape: 'square' }, { default: () => 'U' });

    expect(w.element.classList.contains(`${P}-square`)).toBe(true);
    expect(w.element.classList.contains(`${P}-circle`)).toBe(false);
    w.unmount();
  });

  it('`size="large"` ⇒ `-lg`；`size="small"` ⇒ `-sm`；数字尺寸 ⇒ **不落类名**', () => {
    expect(mountAvatar({ size: 'large' }).element.classList.contains(`${P}-lg`)).toBe(true);
    expect(mountAvatar({ size: 'small' }).element.classList.contains(`${P}-sm`)).toBe(true);

    const numeric = mountAvatar({ size: 40 });
    expect(numeric.element.classList.contains(`${P}-lg`)).toBe(false);
    expect(numeric.element.classList.contains(`${P}-sm`)).toBe(false);
  });

  it('原生 `class`（字符串/数组/对象）/ `style` / attrs 落到根', () => {
    const w = mountAvatar({ class: ['user-cls', { active: true }] });
    expect(w.element.classList.contains('user-cls')).toBe(true);
    expect(w.element.classList.contains('active')).toBe(true);

    const withStyle = mountAvatar({ style: { backgroundColor: 'red' }, size: 40 });
    // 调用方 style 覆盖内部 sizeStyle（同名键优先）
    expect((withStyle.element as HTMLElement).style.backgroundColor).toBe('red');
    expect((withStyle.element as HTMLElement).style.width).toBe('40px');

    const withAttrs = mount(Avatar, { attrs: { 'data-testid': 'av' } });
    expect(withAttrs.element.getAttribute('data-testid')).toBe('av');
  });
});

// ---------------------------------------------------------------------------
// 五路互斥分支
// ---------------------------------------------------------------------------

describe('Avatar · 五路互斥分支', () => {
  it('第 1 支：字符串 `src` ⇒ `<img>`，且根上 `-image`', () => {
    const w = mountAvatar({ src: 'x.png', srcSet: 'x.png 2x', alt: 'a', crossOrigin: 'anonymous' });

    const img = w.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('x.png');
    expect(img.attributes('srcset')).toBe('x.png 2x');
    expect(img.attributes('alt')).toBe('a');
    expect(img.attributes('crossorigin')).toBe('anonymous');
    expect(w.element.classList.contains(`${P}-image`)).toBe(true);
    w.unmount();
  });

  it('第 2 支：`src` 是 vnode ⇒ **原样渲染**（不包 `<img>`），且根上 `-image`', () => {
    const w = mountAvatar({ src: h('span', { class: 'my-src' }, 'S') });

    expect(w.find('span.my-src').exists()).toBe(true);
    expect(w.find('img').exists()).toBe(false);
    expect(w.element.classList.contains(`${P}-image`)).toBe(true);
    w.unmount();
  });

  it('第 3 支：`icon` ⇒ 渲染 icon，且根上 `-icon`', () => {
    const w = mountAvatar({ icon: h('span', { class: 'my-icon' }, 'i') });

    expect(w.find('span.my-icon').exists()).toBe(true);
    expect(w.element.classList.contains(`${P}-icon`)).toBe(true);
    w.unmount();
  });

  it('第 4/5 支：无 src/icon ⇒ **同一个** `-string` span（首帧 `opacity:0`）', async () => {
    const w = mountAvatar({}, { default: () => 'U' });

    const str = w.find(`.${P}-string`);
    expect(str.exists()).toBe(true);
    expect(str.text()).toBe('U');
    // 🚨 首帧走「第 5 支」：opacity:0（不用未测量的 scale 闪一下）
    expect(str.attributes('style')).toContain('opacity: 0');

    // 挂载后 `mounted = true` ⇒ 切到第 4 支：同一个 span，改成 transform
    await nextTick();
    const after = w.find(`.${P}-string`);
    expect(after.attributes('style')).toContain('transform: scale(1)');
    expect(after.attributes('style')).not.toContain('opacity');
    w.unmount();
  });

  it('🚨 第 4/5 支是**同一个元素**（挂载前后 `element` 引用不变）', async () => {
    const w = mountAvatar({}, { default: () => 'U' });
    const before = w.find(`.${P}-string`).element;
    await nextTick();

    expect(w.find(`.${P}-string`).element).toBe(before);
    w.unmount();
  });

  it('`src` 优先级高于 `icon`（字符串 src 赢）', () => {
    const w = mountAvatar({ src: 'x.png', icon: h('span', { class: 'my-icon' }) });

    expect(w.find('img').exists()).toBe(true);
    expect(w.find('span.my-icon').exists()).toBe(false);
    // ⚠️ `-icon` 类名的判据是 `!!icon`（与渲染哪一支**无关**）⇒ 两者都在
    expect(w.element.classList.contains(`${P}-icon`)).toBe(true);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 尺寸样式
// ---------------------------------------------------------------------------

describe('Avatar · 尺寸的内联样式', () => {
  it('🚨 数字尺寸：`width`/`height`/`fontSize` 都带 `px`（Vue 不补 px，PITFALLS 170）', () => {
    const w = mountAvatar({ size: 40 });
    const style = w.element.getAttribute('style') ?? '';

    expect(style).toContain('width: 40px');
    expect(style).toContain('height: 40px');
    // 无 icon ⇒ 走 `18` 这一支
    expect(style).toContain('font-size: 18px');
    w.unmount();
  });

  it('🚨 数字尺寸 + `icon` ⇒ `fontSize = size / 2`', () => {
    const w = mountAvatar({ size: 40, icon: h('span', { class: 'my-icon' }) });

    expect(w.element.getAttribute('style')).toContain('font-size: 20px');
    w.unmount();
  });

  it('字符串尺寸**不产生**内联样式', () => {
    const w = mountAvatar({ size: 'large' });
    expect(w.element.getAttribute('style')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// onError / src 重置
// ---------------------------------------------------------------------------

describe('Avatar · 图片失败与重置', () => {
  it('🚨 `onError` 返回 `undefined` ⇒ **走**内置回退（`-image` 摘掉、`-string` 出现）', async () => {
    const onError = vi.fn(() => undefined);
    const w = mountAvatar({ src: 'bad.png', onError }, { default: () => 'U' });

    expect(w.element.classList.contains(`${P}-image`)).toBe(true);
    await w.find('img').trigger('error');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(w.element.classList.contains(`${P}-image`)).toBe(false);
    expect(w.find(`.${P}-string`).text()).toBe('U');
    w.unmount();
  });

  it('🚨 `onError` 返回 `false` ⇒ **阻止**内置回退（`-image` 保留）', async () => {
    const onError = vi.fn(() => false);
    const w = mountAvatar({ src: 'bad.png', onError }, { default: () => 'U' });

    await w.find('img').trigger('error');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(w.element.classList.contains(`${P}-image`)).toBe(true);
    w.unmount();
  });

  it("🚨 `onError` 返回 `0` / `''` 也**走**回退（判据是 `!== false`，不是真值）", async () => {
    const w = mountAvatar({ src: 'bad.png', onError: () => 0 as never }, { default: () => 'U' });
    await w.find('img').trigger('error');
    expect(w.element.classList.contains(`${P}-image`)).toBe(false);
    w.unmount();
  });

  it('🚨 `src` 变化 ⇒ 重置「图片失败」（`-image` 回来）', async () => {
    const w = mountAvatar({ src: 'bad.png' }, { default: () => 'U' });
    await w.find('img').trigger('error');
    expect(w.element.classList.contains(`${P}-image`)).toBe(false);

    await w.setProps({ src: 'good.png' });
    await nextTick();

    expect(w.element.classList.contains(`${P}-image`)).toBe(true);
    expect(w.find('img').attributes('src')).toBe('good.png');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 字符缩放（测量）
// ---------------------------------------------------------------------------

describe('Avatar · 字符缩放（setScaleParam）', () => {
  it('🚨 `gap` 变化触发重测：`scale = (nodeWidth - gap*2) / childrenWidth`', async () => {
    const w = mountAvatar({ gap: 4 }, { default: () => 'U' });

    // 造几何：容器 100、字符 200 ⇒ 需要缩到 100 - 4*2 = 92 ⇒ scale = 0.46
    setWidth(w.element, 100);
    setWidth(w.find(`.${P}-string`).element, 200);

    await w.setProps({ gap: 5 });
    await nextTick();
    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(0.45)');

    // gap 变小 ⇒ 可用宽度变大 ⇒ scale 变大
    await w.setProps({ gap: 3 });
    await nextTick();
    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(0.47)');
    w.unmount();
  });

  it('字符比容器窄 ⇒ 不缩放（`scale` 保持 1）', async () => {
    const w = mountAvatar({ gap: 4 }, { default: () => 'U' });

    setWidth(w.element, 100);
    setWidth(w.find(`.${P}-string`).element, 40);

    await w.setProps({ gap: 5 });
    await nextTick();
    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(1)');
    w.unmount();
  });

  it('🚨 `gap * 2 >= nodeWidth` ⇒ 完全不缩放（`scale` 保持 1）', async () => {
    const w = mountAvatar({ gap: 4 }, { default: () => 'U' });

    setWidth(w.element, 100);
    setWidth(w.find(`.${P}-string`).element, 200);

    await w.setProps({ gap: 60 });
    await nextTick();
    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(1)');
    w.unmount();
  });

  it('🚨 `src` 变化 ⇒ `scale` 重置为 1', async () => {
    // ⚠️ 先在**字符形态**下造几何（带 `src` 时根本没有 `-string` span）
    const w = mountAvatar({ gap: 4 }, { default: () => 'U' });
    setWidth(w.element, 100);
    setWidth(w.find(`.${P}-string`).element, 200);
    await w.setProps({ gap: 3 });
    await nextTick();
    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(0.47)');

    // 切到图片形态（`-string` 消失）再切回来 ⇒ `src` 变化重置了 scale
    await w.setProps({ src: 'y.png' });
    await nextTick();
    await w.setProps({ src: undefined });
    await nextTick();

    expect(w.find(`.${P}-string`).attributes('style')).toContain('transform: scale(1)');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// Avatar.Group
// ---------------------------------------------------------------------------

describe('Avatar.Group', () => {
  const kids = (n: number) =>
    Array.from({ length: n }, (_, i) => h(Avatar, { key: i }, { default: () => String(i + 1) }));

  const mountGroup = (props: Record<string, unknown> = {}, count = 3) =>
    mount(AvatarGroup, {
      props,
      slots: { default: () => kids(count) },
      attachTo: document.body,
    });

  it('根是 `<div class="apollo-avatar-group apollo-avatar-css-var">`，子头像平铺', () => {
    const w = mountGroup();

    expect(w.element.tagName).toBe('DIV');
    expect(w.element.classList.contains(`${P}-group`)).toBe(true);
    expect(w.findAll(`.${P}`)).toHaveLength(3);
    w.unmount();
  });

  it('🚨 `max.count` ⇒ 截断成「前 N 个 + 一个 `+M`」，被隐藏的**不进 DOM**', () => {
    const w = mountGroup({ max: { count: 2 } }, 4);

    const avatars = w.findAll(`.${P}`);
    // 前 2 个 + `+2`
    expect(avatars).toHaveLength(3);
    expect(avatars[2]?.text()).toBe('+2');
    w.unmount();
  });

  it('🚨 `max.count === 0` ⇒ **不截断**（判据是 `mergeCount &&`）', () => {
    const w = mountGroup({ max: { count: 0 } }, 3);
    expect(w.findAll(`.${P}`)).toHaveLength(3);
    w.unmount();
  });

  it('🚨 `max.count >= children.length` ⇒ 不截断', () => {
    const w = mountGroup({ max: { count: 5 } }, 3);
    expect(w.findAll(`.${P}`)).toHaveLength(3);
    w.unmount();
  });

  it('`maxCount`（deprecated）也能截断，且 `max.count` 优先', () => {
    expect(mountGroup({ maxCount: 1 }, 3).findAll(`.${P}`)).toHaveLength(2);
    // `max.count=2` 覆盖 `maxCount=1` ⇒ 2 + 1 = 3
    expect(mountGroup({ maxCount: 1, max: { count: 2 } }, 3).findAll(`.${P}`)).toHaveLength(3);
  });

  it('🚨 `size` / `shape` 经 context 透传给子头像', () => {
    const w = mountGroup({ size: 'large', shape: 'square' });

    for (const av of w.findAll(`.${P}`)) {
      expect(av.classes()).toContain(`${P}-lg`);
      expect(av.classes()).toContain(`${P}-square`);
    }
    w.unmount();
  });

  it('子头像自己的 `size` / `shape` **覆盖** context', () => {
    const w = mount(AvatarGroup, {
      props: { size: 'large' },
      slots: { default: () => [h(Avatar, { size: 'small' }, { default: () => 'U' })] },
      attachTo: document.body,
    });

    const av = w.find(`.${P}`);
    expect(av.classes()).toContain(`${P}-sm`);
    expect(av.classes()).not.toContain(`${P}-lg`);
    w.unmount();
  });

  it('🚨 `-rtl` 落在 **group 根**上（`Avatar` 自己不带 `-rtl`）', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(AvatarGroup, null, { default: () => kids(2) }) },
      attachTo: document.body,
    });
    await nextTick();

    expect(w.find(`.${P}-group`).element.classList.contains(`${P}-group-rtl`)).toBe(true);
    expect(w.find(`.${P}`).element.classList.contains(`${P}-rtl`)).toBe(false);
    w.unmount();
  });

  it('`expose` 出的是 `{ nativeElement }`', () => {
    const w = mountGroup();
    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(vm.nativeElement).toBe(w.element);
  });
});

// ---------------------------------------------------------------------------
// 告警
// ---------------------------------------------------------------------------

describe('Avatar · 告警', () => {
  const errorSpy = () => vi.spyOn(console, 'error').mockImplementation(() => {});

  it('🚨 `icon` 是**长度 > 2 的字符串** ⇒ v4 命名告警', () => {
    const spy = errorSpy();
    mountAvatar({ icon: 'user' as never });

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.flat().join(' ')).toContain('string naming in v4');
  });

  it('`icon` 是长度 ≤ 2 的字符串 / vnode ⇒ 不告警', () => {
    const spy = errorSpy();
    mountAvatar({ icon: 'u' as never });
    mountAvatar({ icon: h('span', null, 'i') });

    expect(spy).not.toHaveBeenCalled();
  });

  it('`Avatar.Group` 的四条 deprecated 告警各自触发', () => {
    const spy = errorSpy();
    mount(AvatarGroup, { props: { maxCount: 1, maxStyle: {}, maxPopoverPlacement: 'top' } });

    const text = spy.mock.calls.flat().join(' ');
    expect(text).toContain('maxCount');
    expect(text).toContain('maxStyle');
    expect(text).toContain('maxPopoverPlacement');
  });

  it('都不传 ⇒ 无 deprecated 告警', () => {
    const spy = errorSpy();
    mount(AvatarGroup, { props: { max: { count: 2 } }, slots: { default: () => [] } });

    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 回归防线
// ---------------------------------------------------------------------------

describe('Avatar · 回归防线', () => {
  it('🚨 `Avatar.Group` 一次渲染只调用插槽函数**一次**（children 被两处消费）', async () => {
    const slot = vi.fn(() => [h(Avatar, null, { default: () => 'U' })]);
    const w = mount(AvatarGroup, {
      props: { max: { count: 1 } },
      slots: { default: slot },
      attachTo: document.body,
    });

    expect(slot).toHaveBeenCalledTimes(1);

    await w.setProps({ max: { count: 1 } });
    await nextTick();
    expect(slot).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('🚨 children 变化时截断结果跟着变（缓存按渲染失效）', async () => {
    // ⚠️ 必须是 `ref`（响应式）—— 普通对象不会让 Host 重渲染，用例会变成空转
    const count = ref(2);
    const Host = {
      setup() {
        return () =>
          h(
            AvatarGroup,
            { max: { count: 1 } },
            {
              default: () =>
                Array.from({ length: count.value }, (_, i) =>
                  h(Avatar, { key: i }, { default: () => String(i + 1) }),
                ),
            },
          );
      },
    };
    const w = mount(Host, { attachTo: document.body });
    expect(w.findAll(`.${P}`)).toHaveLength(2); // 1 + `+1`

    count.value = 4;
    await nextTick();
    expect(w.findAll(`.${P}`)).toHaveLength(2); // 1 + `+3`
    expect(w.findAll(`.${P}`)[1]?.text()).toBe('+3');

    w.unmount();
  });
});
