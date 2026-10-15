/**
 * Issue #42 · [Watermark] 图片异步 `onload` 覆盖新版水印的竞态
 *
 * 每次 `renderWatermark` 都 `new Image()` 并在 `onload` / `onerror` 之后
 * `drawCanvas(...)` —— 没有版本号 ⇒ 换图 A→B 时若 **A 晚于 B 完成**，会把已经
 * 画好的 B 顶回 A（Issue #42.1）；组件卸载后旧回调仍会写 `watermarkInfo`。
 *
 * ── 测试设施 ────────────────────────────────────────────────────────────────
 *
 * - jsdom 无 canvas ⇒ stub `getContext`；`toDataURL` **每次返回递增的 data URL**
 *   ⇒ 「水印 div 的 background-image」就能分辨「当前生效的是哪一版」。
 * - jsdom 不会真的加载图片 ⇒ 拦截 `Image.prototype.src` 的 setter
 *   （与 `index.test.ts` 的图片用例同手法），收集实例后由测试**手动、乱序**触发
 *   `onload` / `onerror`。
 * - ⚠️ 必须是**真实的 `HTMLImageElement`**：`getClips()` 的分支判据是
 *   `content instanceof HTMLImageElement`，假对象会掉进文字分支。
 */

import { mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
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

type SrcCarrier = HTMLImageElement & { _wmSrc?: string };

let images: HTMLImageElement[] = [];
let srcDescriptor: PropertyDescriptor | undefined;
let dataUrlSeq = 0;

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctxMock as unknown as CanvasRenderingContext2D,
  );
  // ⚠️ 每次返回不同的 URL ⇒ background-image 能分辨「哪一版」
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
    dataUrlSeq += 1;
    return `data:image/png;base64,SEQ${dataUrlSeq}`;
  });
});

beforeEach(() => {
  images = [];
  dataUrlSeq = 0;
  ctxMock.drawImage.mockClear();
  ctxMock.fillText.mockClear();
  srcDescriptor = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
  Object.defineProperty(Image.prototype, 'src', {
    configurable: true,
    get(this: SrcCarrier) {
      return this._wmSrc ?? '';
    },
    set(this: SrcCarrier, v: string) {
      this._wmSrc = v;
      images.push(this);
    },
  });
});

afterEach(() => {
  if (srcDescriptor) Object.defineProperty(Image.prototype, 'src', srcDescriptor);
});

afterAll(() => {
  vi.restoreAllMocks();
});

/**
 * 按 `src` 定位组件创建的 Image 再触发回调。
 *
 * ⚠️ 不要用**下标**：`syncWatermark` 是 raf 节流、MutationObserver 还可能触发
 *    额外的 reRendering ⇒ 实例的创建次数/顺序不固定。
 */
const imgOf = (src: string): HTMLImageElement => {
  const found = images.filter((i) => (i as SrcCarrier)._wmSrc === src).at(-1);
  if (!found) throw new Error(`没有为 ${src} 创建 Image`);
  return found;
};
const fireLoad = (src: string): void => {
  imgOf(src).onload?.(new Event('load'));
};
const fireError = (src: string): void => {
  imgOf(src).onerror?.(new Event('error') as unknown as never);
};

const flushFrame = async () => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 40));
  await nextTick();
};

/**
 * 当前生效的水印：取**最后一个**水印 div 的 background-image。
 *
 * ⚠️ 不能用 `find()`（第一个）：`appendWatermark` 可能追加新的水印节点，
 *    第一个会停在旧版本 ⇒ 断言永远「不变」（假绿）。
 */
const currentMark = (w: ReturnType<typeof mount>): string => {
  const divs = w.findAll('.wm-probe div');
  const style = divs.at(-1)?.attributes('style') ?? '';
  return /background-image:\s*url\("?([^")]+)"?\)?/.exec(style)?.[1] ?? '';
};

const mountWm = (props: Record<string, unknown> = {}) =>
  mount(Watermark, {
    props: { class: 'wm-probe', content: 'X', ...props } as never,
    attachTo: document.body,
  });

describe('Watermark · Issue #42 图片异步回调的竞态守卫', () => {
  it('[A] 乱序：B 先完成、A 后完成 ⇒ 最终水印仍是 B（核心回归）', async () => {
    // ⚠️ 换图**同时**改几何尺寸：`getClipsCache` 把图片元素归一成空串参与比较
    //    （`useSingletonCache` 逐字上游），光换图会命中缓存、根本不会重绘 ——
    //    那样正好掩盖竞态。
    const w = mountWm({ image: 'A.png', width: 100, height: 30 });
    await flushFrame();

    await w.setProps({ image: 'B.png', width: 160, height: 60 } as never);
    await flushFrame();

    // B 先完成
    fireLoad('B.png');
    await nextTick();
    await flushFrame();
    const afterB = currentMark(w);
    expect(afterB).not.toBe('');

    // A **晚到** ⇒ 不能把结果顶回 A
    fireLoad('A.png');
    await nextTick();
    await flushFrame();
    expect(currentMark(w)).toBe(afterB);
    w.unmount();
  });

  it('[B] 顺序正常（A 完成后 B 完成）⇒ 最终水印换成 B（守卫：不是一律丢弃）', async () => {
    const w = mountWm({ image: 'A.png', width: 100, height: 30 });
    await flushFrame();
    fireLoad('A.png');
    await nextTick();
    await flushFrame();
    const afterA = currentMark(w);
    expect(afterA).not.toBe('');

    await w.setProps({ image: 'B.png', width: 160, height: 60 } as never);
    await flushFrame();
    fireLoad('B.png');
    await nextTick();
    await flushFrame();
    expect(currentMark(w)).not.toBe(afterA);
    w.unmount();
  });

  it('[C] 卸载后旧回调不再提交（不产生新的绘制）', async () => {
    const w = mountWm({ image: 'C.png' });
    await flushFrame();

    w.unmount();
    const seqBefore = dataUrlSeq;

    fireLoad('C.png');
    await nextTick();
    await flushFrame();
    expect(dataUrlSeq).toBe(seqBefore);
  });

  it('[D] 换图后旧图的 onerror 同样被作废（error 分支同判）', async () => {
    const w = mountWm({ image: 'A.png', width: 100, height: 30 });
    await flushFrame();

    await w.setProps({ image: 'B.png', width: 160, height: 60 } as never);
    await flushFrame();
    fireLoad('B.png');
    await nextTick();
    await flushFrame();
    const afterB = currentMark(w);

    // 旧图失败 ⇒ 走 `drawCanvas(contentLines)` 的文字分支，同样必须被作废
    fireError('A.png');
    await nextTick();
    await flushFrame();
    expect(currentMark(w)).toBe(afterB);
    w.unmount();
  });

  it('[E] 守卫：无 image 时走文字分支（不创建 Image）', async () => {
    const w = mountWm();
    await flushFrame();
    expect(images.length).toBe(0);
    expect(ctxMock.fillText).toHaveBeenCalled();
    w.unmount();
  });
});
