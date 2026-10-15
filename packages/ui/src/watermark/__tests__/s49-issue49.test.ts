/**
 * Issue #49 · [Watermark] inherit 动态切换契约（运行时验证）
 *
 * 上游判据（antd 6.6.4 `es/watermark/index.js:232`）：
 * ```jsx
 * const childNode = inherit ? <WatermarkContext.Provider value={ctx}>{children}</WatermarkContext.Provider>
 *                           : children;
 * ```
 * 这段在 **render 体**里 ⇒ 改 `inherit` 会真的加/减 Provider（且子树重挂 ⇒ ref 回调重跑）。
 * 本仓写成 `if (props.inherit) provide(...)` —— `provide` 只在 setup 跑一次
 * ⇒ 挂载后改 `inherit` **完全不生效**。
 *
 * 观测手段：`usePanelRef` 注册进去的面板元素会被 `appendWatermark` 塞一个带
 * `background-image` 的 div；用它的 `background-size` 区分「被哪一层水印覆盖」
 * （`markWidth` 来自 `width` prop ⇒ 外层 width:10 / 内层 width:20 可区分）。
 */

import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import { usePanelRef } from '../context';
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

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => ctxMock as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
    () => 'data:image/png;base64,TEST',
  );
});

afterAll(() => {
  vi.restoreAllMocks();
});

const flushFrame = async (): Promise<void> => {
  await nextTick();
  await new Promise((r) => setTimeout(r, 40));
  await nextTick();
};

/** 消费 `usePanelRef` 的面板：把注册回调绑到自己的根元素上。 */
const Panel = defineComponent({
  name: 'WmPanel',
  setup() {
    const panelRef = usePanelRef();
    return () => h('div', { class: 'panel-root', ref: panelRef });
  },
});

/** 面板根元素自己的水印 div 的 `background-size`（null = 没被任何一层覆盖）。 */
const markSizeOf = (wrapper: { find: (s: string) => { element: Element } }): string | null => {
  const root = wrapper.find('.panel-root').element as HTMLElement;
  const child = Array.from(root.children).find((c) => (c as HTMLElement).style.backgroundImage) as
    | HTMLElement
    | undefined;
  return child ? child.style.backgroundSize : null;
};

describe('Watermark · Issue #49 inherit 动态切换', () => {
  it('[A] 单层：inherit false→true 后面板应被覆盖（核心回归）', async () => {
    const inherit = ref(false);
    const wrapper = mount(() =>
      h(Watermark, { inherit: inherit.value, content: 'x' }, { default: () => h(Panel) }),
    );
    await flushFrame();

    // `inherit=false` ⇒ 不 provide ⇒ 面板没登记（与上游一致）
    expect(markSizeOf(wrapper)).toBeNull();

    inherit.value = true;
    await flushFrame();

    // 上游：Provider 出现 ⇒ 面板登记上去 ⇒ 被覆盖
    expect(markSizeOf(wrapper)).not.toBeNull();

    wrapper.unmount();
  });

  it('[B] 嵌套两层：内层 inherit true→false→true，覆盖层应在外层/内层之间切换', async () => {
    const inherit = ref(true);
    const wrapper = mount(() =>
      h(Watermark, { content: 'x', width: 10 }, () =>
        h(Watermark, { content: 'x', width: 20, inherit: inherit.value }, () => h(Panel)),
      ),
    );
    await flushFrame();

    const innerSize = markSizeOf(wrapper);
    expect(innerSize).not.toBeNull();

    // 内层关掉 ⇒ 面板不再由内层覆盖，应回落到外层（上游：Provider 摘掉 ⇒ 消费到外层 context）
    inherit.value = false;
    await flushFrame();
    const outerSize = markSizeOf(wrapper);
    expect(outerSize).not.toBeNull();
    expect(outerSize).not.toBe(innerSize);

    // 再打开 ⇒ 回到内层
    inherit.value = true;
    await flushFrame();
    expect(markSizeOf(wrapper)).toBe(innerSize);

    wrapper.unmount();
  });
});
