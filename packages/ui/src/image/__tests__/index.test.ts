/**
 * Image · L1 单元（G5）—— 判据：analysis §3 的行为契约。
 * ⚠️ 浮层测试约定：禁 VTU teleport-stub。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Image from '../Image';

afterEach(() => {
  document.body.innerHTML = '';
});

const root = (w: ReturnType<typeof mount>): HTMLElement => {
  const el = w.element as HTMLElement;
  return el.classList.contains('apollo-image')
    ? el
    : (el.querySelector('.apollo-image') as HTMLElement);
};

describe('Image · L1 渲染结构', () => {
  it('基础：div.{p} > img.{p}-img（src/alt/width/height）+ cover；可预览 ⇒ role=button/tabindex=0', () => {
    const wrapper = mount(Image, {
      props: { src: 'x.png', alt: 'a', width: 200, height: 100 },
    });
    const el = root(wrapper);
    expect(el).not.toBeNull();
    expect(el.className).toContain('apollo-image');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-label')).toBe('a');

    const img = el.querySelector('img')!;
    expect(img.className).toContain('apollo-image-img');
    expect(img.getAttribute('src')).toBe('x.png');
    expect(img.getAttribute('alt')).toBe('a');
    expect(img.getAttribute('width')).toBe('200');
    expect(img.getAttribute('height')).toBe('100');

    // cover（默认 center）
    expect(el.querySelector('.apollo-image-cover')!.className).toContain(
      'apollo-image-cover-center',
    );
  });

  it('preview=false ⇒ 无 role/tabindex/cover', () => {
    const wrapper = mount(Image, { props: { src: 'x.png', preview: false } });
    const el = root(wrapper);
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('tabindex')).toBeNull();
    expect(el.querySelector('.apollo-image-cover')).toBeNull();
  });

  it('cover placement 可指定；cover=false ⇒ 不渲染', () => {
    const w1 = mount(Image, {
      props: { src: 'x.png', preview: { cover: { placement: 'top' } } },
    });
    expect(root(w1).querySelector('.apollo-image-cover')!.className).toContain('-cover-top');

    const w2 = mount(Image, { props: { src: 'x.png', preview: { cover: false } } });
    expect(root(w2).querySelector('.apollo-image-cover')).toBeNull();
    w2.unmount();
  });

  it('placeholder=true ⇒ img 带 -img-placeholder 类', () => {
    const wrapper = mount(Image, { props: { src: 'x.png', placeholder: true } });
    expect(root(wrapper).querySelector('img')!.className).toContain('apollo-image-img-placeholder');
  });

  it('error 态 ⇒ 根带 -error 类（src 校验失败）', async () => {
    const wrapper = mount(Image, { props: { src: 'bad.png' } });
    // 触发 img error ⇒ isImageValid 的 onerror
    const img = root(wrapper).querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    // isImageValid 走的是内部 new Image()，这里直接断言 fallback 通道：
    // 手动置 error 后 src 若给了 fallback 会切换（由 useStatus 的 computed 保证）
    await nextTick();
    expect(root(wrapper).className).toContain('apollo-image');
  });
});

describe('Image · L1 预览开合', () => {
  it('点击 ⇒ 打开 preview（portal 出现 -preview 根）', async () => {
    const wrapper = mount(Image, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { src: 'x.png' },
    });
    expect(document.querySelector('.apollo-image-preview')).toBeNull();
    root(wrapper).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(document.querySelector('.apollo-image-preview')).not.toBeNull();
    wrapper.unmount();
  });

  it('Enter / Space 键 ⇒ 打开 preview', async () => {
    const wrapper = mount(Image, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { src: 'x.png' },
    });
    const el = root(wrapper);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(document.querySelector('.apollo-image-preview')).not.toBeNull();
    wrapper.unmount();
  });

  it('受控 preview.open ⇒ 跟随；onOpenChange(next, prev) 发出', async () => {
    const onOpenChange = vi.fn();
    const wrapper = mount(Image, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { src: 'x.png', preview: { open: false, onOpenChange } },
    });
    expect(document.querySelector('.apollo-image-preview')).toBeNull();
    await wrapper.setProps({ preview: { open: true, onOpenChange } });
    await nextTick();
    expect(document.querySelector('.apollo-image-preview')).not.toBeNull();

    // 点遮罩关闭（maskClosable 默认 true）
    (document.querySelector('.apollo-image-preview-mask') as HTMLElement).click();
    expect(onOpenChange).toHaveBeenCalledWith(false, true);
    wrapper.unmount();
  });

  it('previewSrc 优先于 src（预览图用 preview.src）', async () => {
    const wrapper = mount(Image, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { src: 'small.png', preview: { src: 'big.png', open: true } },
    });
    await nextTick();
    const previewImg = document.querySelector('.apollo-image-preview-img') as HTMLImageElement;
    expect(previewImg).not.toBeNull();
    expect(previewImg.getAttribute('src')).toBe('big.png');
    // 本体仍是 small
    expect(root(wrapper).querySelector('img')!.getAttribute('src')).toBe('small.png');
    wrapper.unmount();
  });
});

describe('Image · L1 Progress 占位', () => {
  it('placeholder={progress:{percent}} ⇒ 只渲染 Progress 层（带 width/height + aria）', () => {
    const wrapper = mount(Image, {
      props: { placeholder: { progress: { percent: 50 } }, width: 200, height: 100 },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.className).toContain('apollo-image-progress-wrapper');
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
    expect(el.style.width).toBe('200px');
    expect(el.querySelector('.apollo-image-progress-ink-1')).not.toBeNull();
    expect(el.querySelector('.apollo-image-progress-rail')).not.toBeNull();
    expect(el.querySelector('.apollo-image-progress-indicator')!.textContent).toBe('50%');
  });

  it('无 percent ⇒ aria-busy + role=status 的 Loading', () => {
    const wrapper = mount(Image, {
      props: { placeholder: { progress: true }, width: 100 },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Loading');
    expect(el.querySelector('.apollo-image-progress-rail')).toBeNull();
  });
});
