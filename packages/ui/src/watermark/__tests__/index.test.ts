/**
 * L1/L2 · 单元测试（Watermark）
 *
 * ── 测试设施 ────────────────────────────────────────────────────────────────
 *
 * 1. jsdom 无 canvas：`getContext('2d')` 恒 null → 用 stub 2D context 替换原型，
 *    measureText 按字数 ×10px、fontBoundingBox 20+5，toDataURL 返回固定 data URL。
 * 2. `MutationObserver` 被 vitest.setup.ts **主动替换**为 `MockMutationObserver`
 *    （确定性，TESTING.md T5/T6）→ 防篡改用例不能用「真的改 DOM」驱动，必须
 *    显式 `trigger(records)`。单例实例从 `globalThis.MutationObserver.instances`
 *    取（元素→observer 由 utils 的 observeMutation 维护）。
 */

import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Watermark } from '../index';

const ctxMock = {
  save: vi.fn(),
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillText: vi.fn(),
  font: '',
  fillStyle: '',
  textAlign: '',
  textBaseline: '',
  measureText: (text: string) => ({
    width: text.length * 10,
    fontBoundingBoxAscent: 20,
    fontBoundingBoxDescent: 5,
  }),
};

let toDataUrlCalls = 0;

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctxMock as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
    toDataUrlCalls += 1;
    return 'data:image/png;base64,TEST';
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

/** 等一帧 + 微任务（raf 节流与 MutationObserver 回调都落在这条时间线上）。 */
const flushFrame = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 40));
  await nextTick();
};

interface MockMO {
  targets: Set<Node>;
  trigger: (records?: unknown[]) => void;
}

/** 取观察了 target 的那个 MockMutationObserver 实例。 */
function observerOf(target: Node): MockMO {
  const Ctor = globalThis.MutationObserver as unknown as {
    instances: Set<MockMO>;
  };
  const found = [...Ctor.instances].find((mo) => mo.targets.has(target));
  if (!found) throw new Error('未找到观察该元素的 MutationObserver');
  return found;
}

/** 造一条 antd `reRendering` 能认的记录。 */
function record(
  type: 'childList' | 'attributes',
  target: Node,
  removedNodes: Node[] = [],
): unknown {
  return {
    type,
    target,
    addedNodes: [],
    removedNodes,
    attributeName: type === 'attributes' ? 'style' : null,
    attributeNamespace: null,
    oldValue: null,
    previousSibling: null,
    nextSibling: null,
  } as never;
}

describe('Watermark · 结构', () => {
  it('nativeElement ref 指向根 div；fixedStyle 落根元素', () => {
    // ⚠️ 必须直接 mount 组件：函数式包装会让 getCurrentComponent() 取到包装组件，
    //    exposed 恒为 undefined（statistic 会话踩过同一坑）。
    const w = mount(Watermark, { props: { className: 'watermark-ref', content: 'Ant Design' } });
    const root = w.find('.watermark-ref');
    expect(root.exists()).toBe(true);
    const exposed = (w.getCurrentComponent().exposed ?? {}) as { nativeElement?: unknown };
    expect(exposed.nativeElement).toBe(root.element);
    const style = root.attributes('style') ?? '';
    expect(style).toContain('position: relative');
    expect(style).toContain('overflow: hidden');
  });

  it('水印 div 被运行时 append：背景图 + pointer-events:none + repeat + 默认 zIndex 999', async () => {
    const w = mount(() => h(Watermark, { className: 'watermark', content: 'Ant Design' }));
    await flushFrame();
    const target = w.find('.watermark div');
    expect(target.exists()).toBe(true);
    const style = target.attributes('style') ?? '';
    // jsdom 的 CSS 序列化会给 url() 加单引号（antd 真实 DOM 也是 url("…")）
    expect(style).toContain("background-image: url('data:image/png;base64,TEST')");
    expect(style).toContain('pointer-events: none;');
    expect(style).toContain('background-repeat: repeat;');
    expect(style).toContain('z-index: 999;');
    expect(style).toContain('visibility: visible !important;');
    expect(target.attributes('class')).toBeUndefined();
  });

  it('offset 修正：>0 才写 left/top 与 calc 宽高，position 归 0', async () => {
    const w = mount(() =>
      h(Watermark, {
        className: 'watermark',
        offset: [200, 200],
        content: ['Ant Design', 'Ant Design Pro'],
      }),
    );
    await flushFrame();
    const style = w.find('.watermark div').attributes('style') ?? '';
    expect(style).toContain('left: 150px;');
    expect(style).toContain('top: 150px;');
    expect(style).toContain('width: calc(100% - 150px);');
    expect(style).toContain('height: calc(100% - 150px);');
    expect(style).toContain('background-position: 0px 0px;');
  });

  it('交错平铺 backgroundSize（width=height=200, gap 100/100 ⇒ 720px）', async () => {
    const w = mount(() =>
      h(Watermark, {
        className: 'watermark',
        width: 200,
        height: 200,
        content: 'Ant Design',
        gap: [100, 100],
      }),
    );
    await flushFrame();
    const style = w.find('.watermark div').attributes('style') ?? '';
    expect(style).toContain('background-size: 720px;');
  });

  it('每行独立 font：measure 串与绘制串都符合 antd 形态', async () => {
    const fonts: string[] = [];
    const spyFont = vi.spyOn(ctxMock, 'font', 'set').mockImplementation((v: string) => {
      fonts.push(v);
    });
    const w = mount(() =>
      h(Watermark, {
        content: [
          { text: 'Ant Design', font: { fontSize: 20, fontWeight: 'bold' } },
          {
            text: 'Happy Working',
            font: { fontFamily: 'serif', fontSize: 12, fontStyle: 'italic' },
          },
          { text: 'Fallback', font: { fontFamily: 'monospace', fontSize: undefined } },
        ],
      }),
    );
    await flushFrame();
    // 测量（getMarkSize，无行高）与绘制（useClips，带 /行高）都会设置 font
    expect(fonts).toEqual(expect.arrayContaining(['normal normal bold 20px sans-serif']));
    expect(fonts).toEqual(expect.arrayContaining(['italic normal normal 12px serif']));
    // ⚠️ 第三行 `fontSize: undefined` 会**覆盖**默认 16 ⇒ NaNpx。这是 antd 同判
    //    （`{...font, ...item.font}` 的 undefined 覆盖），不是我们要改的行为 —— 钉住。
    expect(fonts).toEqual(expect.arrayContaining(['normal normal normal NaNpx monospace']));
    spyFont.mockRestore();
    w.unmount();
  });

  it('content 为空串 ⇒ 零尺寸保护（无 0,0 drawImage）', async () => {
    const w = mount(() => h(Watermark, { className: 'watermark', content: '' }));
    await flushFrame();
    for (const call of ctxMock.drawImage.mock.calls) {
      const [, x, y] = call;
      expect(!(Number(x) === 0 && Number(y) === 0)).toBe(true);
    }
    w.unmount();
  });

  it('MutationObserver：水印元素被删 ⇒ 重挂（参数未变则命中缓存，不重绘）', async () => {
    toDataUrlCalls = 0;
    const w = mount(() => h(Watermark, { className: 'watermark', content: 'MutationObserver' }));
    await flushFrame();
    expect(toDataUrlCalls).toBe(1);
    const root = w.find('.watermark').element;
    const watermarkEle = w.find('.watermark div').element;
    watermarkEle.remove();
    observerOf(root).trigger([record('childList', root, [watermarkEle])]);
    await flushFrame();
    expect(toDataUrlCalls).toBe(1);
    expect(w.find('.watermark div').exists()).toBe(true);
  });

  it('防篡改：container 的 style 被清空 ⇒ fixedStyle 回写', async () => {
    const w = mount(() =>
      h(Watermark, { className: 'watermark', offset: [-200, -200], content: 'MutationObserver' }),
    );
    await flushFrame();
    const root = w.find('.watermark').element as HTMLElement;
    root.setAttribute('style', '');
    observerOf(root).trigger([record('attributes', root)]);
    await flushFrame();
    expect(root.style.position).toBe('relative');
    expect(root.style.overflow).toBe('hidden');
  });

  it('防篡改：水印元素 style 被清空 ⇒ 重写完整样式', async () => {
    const w = mount(() =>
      h(Watermark, { className: 'watermark', offset: [-200, -200], content: 'MutationObserver' }),
    );
    await flushFrame();
    const root = w.find('.watermark').element;
    const target = w.find('.watermark div').element as HTMLElement;
    target.setAttribute('style', '');
    // ⚠️ 水印元素**不是**观察目标本身 —— 它在 container 的 subtree 里被看到，
    //    所以要用 container 的 observer，记录的 target 才是水印元素
    //    （antd 的 `reRendering(mutation, …)` 认 mutation.target）。
    observerOf(root).trigger([record('attributes', target)]);
    await flushFrame();
    const style = target.getAttribute('style') ?? '';
    expect(style).toContain('background-image');
    // offset 修正：position = offset - gap/2 ⇒ -200 - 50 = -250
    expect(style).toContain('background-position: -250px -250px;');
  });

  it('onRemove：水印被换父时触发一次；卸载不触发', async () => {
    const onRemove = vi.fn();
    const w = mount(Watermark, { props: { content: 'Ant', onRemove } });
    await flushFrame();
    const root = w.element as HTMLElement;
    const watermarkEle = w.find('[style*="background-image"]').element;
    // 换父 = 先 removed（重渲染路径），onRemove 由 useWatermark 在重挂时触发
    watermarkEle.remove();
    observerOf(root).trigger([record('childList', root, [watermarkEle])]);
    await flushFrame();
    expect(onRemove).toHaveBeenCalled();
    const callsAfterReAppend = onRemove.mock.calls.length;
    w.unmount();
    await flushFrame();
    expect(onRemove.mock.calls.length).toBe(callsAfterReAppend);
  });

  it('inherit=false：不向子树 provide 水印 context', async () => {
    const w = mount(() =>
      h(
        Watermark,
        { inherit: false, content: 'x' },
        { default: () => h('div', { class: 'inner' }) },
      ),
    );
    await flushFrame();
    expect(w.find('.inner').exists()).toBe(true);
  });
});

describe('Watermark · 图片水印', () => {
  it('image onload 路径：显式 width/height 生效（交错平铺 backgroundSize）', async () => {
    // jsdom 不会真的加载图片 ⇒ stub `src` setter 立刻回调 onload
    const descriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
    Object.defineProperty(Image.prototype, 'src', {
      configurable: true,
      set(this: HTMLImageElement) {
        setTimeout(() => this.onload?.(new Event('load')), 0);
      },
      get() {
        return '';
      },
    });
    ctxMock.drawImage.mockClear();
    const w = mount(Watermark, {
      props: { className: 'watermark', width: 130, height: 30, image: 'https://test/svg.svg' },
    });
    await flushFrame();
    const style = w.find('.watermark div').attributes('style') ?? '';
    // 交错平铺：backgroundSize = (旋转包围盒宽 + gapX) × 2。
    //   130×30 绕 -22° ⇒ 130·cos22 + 30·sin22 ≈ 131.7 ⇒ (131.7 + 100) × 2 ≈ 463
    expect(style).toContain('background-size: 463px;');
    if (descriptor) Object.defineProperty(Image.prototype, 'src', descriptor);
    w.unmount();
  });

  it('image onerror 路径：回落到 contentLines 文本绘制', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
    Object.defineProperty(Image.prototype, 'src', {
      configurable: true,
      set(this: HTMLImageElement) {
        setTimeout(() => this.onerror?.(new Event('error') as unknown as never), 0);
      },
      get() {
        return '';
      },
    });
    ctxMock.drawImage.mockClear();
    const w = mount(Watermark, {
      props: { className: 'watermark', content: 'Ant Design', image: 'https://test.svg' },
    });
    await flushFrame();
    const style = w.find('.watermark div').attributes('style') ?? '';
    expect(style).toContain('background-image');
    if (descriptor) Object.defineProperty(Image.prototype, 'src', descriptor);
    w.unmount();
  });
});
