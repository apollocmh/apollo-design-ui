/**
 * Tour · L4 DOM 契约 + 语义化槽位。
 *
 * 基准：`tests/compat/baselines/tour.dom.json`（机械 oracle，10 个用例），
 * 由 `tests/compat/baseline/tour.mjs` 生成。`keepStyle: false`。
 *
 * ⚠️ Tour 本体在 SSR 渲染门恒为 null（layout effect 不跑）⇒ 两个本体用例是
 *    「空串契约」；完整面板 DOM 只能靠 PurePanel 钉。
 * 语义槽部分：antd `index.test.tsx` 的 `support custom styles` 用例（12 槽全量）+
 * `useSemanticRootStyle(..., 'mask')` 的 **root → mask 双落点**（分析文档 §2.3）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import baseline from '../../../../../tests/compat/baselines/tour.dom.json';
import { Tour, TourPurePanel } from '../index';

// ---------------------------------------------------------------------------
// domContractTest（与 antd 基线逐用例比对）
// ---------------------------------------------------------------------------

const BP = { prefixCls: 'apollo-tour' };
const COVER_IMG = h('img', {
  draggable: false,
  alt: 'tour.png',
  src: 'https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png',
});

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const CASES: Record<string, () => DomRenderResult> = {
  // Tour 本体：SSR 渲染门 ⇒ 空串（两侧同构）
  'tour:open-with-steps': () =>
    h(Tour, { ...BP, open: true, steps: [{ title: 't', description: 'd' }] }),
  'tour:closed': () => h(Tour, { ...BP, open: false, steps: [{ title: 't' }] }),

  // PurePanel：静态面板完整 DOM
  'tour:pure-panel': () =>
    h(TourPurePanel, { ...BP, title: 'Hello World!', description: 'Hello World?!' }),
  'tour:pure-panel-cover': () =>
    h(
      TourPurePanel,
      { ...BP, title: 'Hello World!', description: 'Hello World?!', current: 5, total: 7 },
      { cover: () => COVER_IMG },
    ),
  'tour:pure-panel-primary': () =>
    h(TourPurePanel, {
      ...BP,
      title: 'Hello World!',
      description: 'Hello World?!',
      type: 'primary',
      current: 4,
      total: 5,
    }),
  'tour:pure-panel-close-icon-false': () =>
    h(TourPurePanel, { ...BP, title: 't', closeIcon: false }),
  'tour:pure-panel-custom-close-icon': () =>
    h(TourPurePanel, {
      ...BP,
      title: 't',
      closeIcon: h('span', { class: 'custom-close' }, 'Close'),
    }),
  'tour:pure-panel-button-props': () =>
    h(TourPurePanel, {
      ...BP,
      title: 't',
      nextButtonProps: { children: 'Go', class: 'custom-next' },
      prevButtonProps: { children: 'Back' },
    }),
  'tour:pure-panel-single-step': () => h(TourPurePanel, { ...BP, title: 'only' }),
  'tour:pure-panel-class-name': () =>
    h(TourPurePanel, {
      ...BP,
      title: 't',
      description: 'd',
      className: 'custom-root',
      style: { padding: 20 },
    }),
};

domContractTest('Tour', {
  baseline,
  keepStyle: false,
  allow: {},
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Tour semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
});

describe('Tour · 用例覆盖', () => {
  it('CASES 与基线一一对应（不多不少）', () => {
    const baselineIds = baseline.cases.map((c) => c.id).sort();
    const caseIds = Object.keys(CASES).sort();
    expect(caseIds).toEqual(baselineIds);
  });
});

// ---------------------------------------------------------------------------
// 语义化槽位（antd `support custom styles` 用例全量）
// ---------------------------------------------------------------------------

const customClassnames = {
  mask: 'custom-mask',
  actions: 'custom-actions',
  title: 'custom-title',
  header: 'custom-header',
  section: 'custom-section',
  footer: 'custom-footer',
  description: 'custom-description',
  cover: 'custom-cover',
  indicator: 'custom-indicator',
  indicators: 'custom-indicators',
  root: 'custom-root',
  close: 'custom-close',
};
const customStyles: Record<string, Record<string, string>> = {
  mask: { color: 'rgb(255, 255, 255)' },
  actions: { color: 'rgb(0, 0, 255)' },
  title: { fontSize: '20px' },
  header: { backgroundColor: 'rgb(128, 128, 128)' },
  section: { margin: '5px' },
  footer: { borderTop: '1px solid rgb(0, 0, 0)' },
  description: { fontStyle: 'italic' },
  cover: { color: 'rgb(255, 0, 0)' },
  indicator: { color: 'rgb(0, 128, 0)' },
  indicators: { color: 'rgb(255, 255, 0)' },
  root: { backgroundColor: 'rgb(255, 200, 255)' },
  close: { padding: '3px' },
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Tour · 语义化 12 槽（antd custom styles 用例全量）', () => {
  it('classNames / styles 落到各自槽位', async () => {
    const target = document.createElement('button');
    document.body.appendChild(target);
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        classNames: customClassnames,
        styles: customStyles,
        steps: [
          {
            title: '创建',
            description: '创建一条数据',
            cover: 'cover-node',
            target: () => target,
          },
          { title: 'Save', description: 'Save your changes.', target: () => target },
        ],
      },
    });
    await vi
      .waitUntil(() => document.querySelector<HTMLElement>('.apollo-tour-panel') !== null, {
        timeout: 2000,
      })
      .catch(() => {});
    await nextTick();

    const q = (sel: string) => document.querySelector<HTMLElement>(sel);
    const maskEl = q('.apollo-tour-mask');
    const actionsEl = q('.apollo-tour-actions');
    const titleEl = q('.apollo-tour-title');
    const headerEl = q('.apollo-tour-header');
    const sectionEl = q('.apollo-tour-section');
    const footerEl = q('.apollo-tour-footer');
    const descriptionEl = q('.apollo-tour-description');
    const coverEl = q('.apollo-tour-cover');
    const indicatorEl = q('.apollo-tour-indicator');
    const indicatorsEl = q('.apollo-tour-indicators');
    const closeEl = q('.apollo-tour-close');

    // ── classNames ──
    expect(maskEl).toHaveClass('custom-mask');
    expect(actionsEl).toHaveClass('custom-actions');
    expect(titleEl).toHaveClass('custom-title');
    expect(headerEl).toHaveClass('custom-header');
    expect(sectionEl).toHaveClass('custom-section');
    expect(footerEl).toHaveClass('custom-footer');
    expect(descriptionEl).toHaveClass('custom-description');
    expect(coverEl).toHaveClass('custom-cover');
    expect(indicatorEl).toHaveClass('custom-indicator');
    expect(indicatorsEl).toHaveClass('custom-indicators');
    expect(closeEl).toHaveClass('custom-close');
    // classNames.root 双落点：popup 根（mergedRootClassName）与 mask 都有
    expect(panelRoot()).toHaveClass('custom-root');
    expect(maskEl).toHaveClass('custom-root');

    // ── styles ──
    expect(maskEl?.getAttribute('style')).toContain('color: rgb(255, 255, 255)');
    expect(actionsEl?.getAttribute('style')).toContain('color: rgb(0, 0, 255)');
    expect(titleEl?.getAttribute('style')).toContain('font-size: 20px');
    expect(headerEl?.getAttribute('style')).toContain('background-color: rgb(128, 128, 128)');
    expect(sectionEl?.getAttribute('style')).toContain('margin: 5px');
    expect(footerEl?.getAttribute('style')).toContain('border-top: 1px solid rgb(0, 0, 0)');
    expect(descriptionEl?.getAttribute('style')).toContain('font-style: italic');
    expect(coverEl?.getAttribute('style')).toContain('color: rgb(255, 0, 0)');
    expect(indicatorEl?.getAttribute('style')).toContain('color: rgb(0, 128, 0)');
    expect(indicatorsEl?.getAttribute('style')).toContain('color: rgb(255, 255, 0)');
    expect(closeEl?.getAttribute('style')).toContain('padding: 3px');
    target.remove();
  });

  it('顶层 style 双落点：placeholder（rc 协议）与 mask（useSemanticRootStyle）', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        style: { backgroundColor: 'rgb(255, 200, 255)' },
        steps: [{ title: 'a' }],
      },
    });
    await vi
      .waitUntil(() => document.querySelector<HTMLElement>('.apollo-tour-panel') !== null, {
        timeout: 2000,
      })
      .catch(() => {});
    await nextTick();
    const maskEl = document.querySelector<HTMLElement>('.apollo-tour-mask');
    // style（顶层）→ mask（antd `useSemanticRootStyle(style, 'mask')`）
    expect(maskEl?.getAttribute('style')).toContain('background-color: rgb(255, 200, 255)');
    // style（顶层）→ placeholder（rc-tour 的 Placeholder style 摊平）
    const placeholder = document.querySelector<HTMLElement>('.apollo-tour-target-placeholder');
    expect(placeholder?.getAttribute('style')).toContain('background-color: rgb(255, 200, 255)');
  });

  it('函数式 classNames/styles（裁决 empty-semantic-fn = B）', async () => {
    mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        classNames: () => ({ title: 'fn-title' }),
        styles: () => ({ title: { color: 'rgb(1, 2, 3)' } }),
        steps: [{ title: 'a' }],
      },
    });
    await vi
      .waitUntil(() => document.querySelector<HTMLElement>('.apollo-tour-panel') !== null, {
        timeout: 2000,
      })
      .catch(() => {});
    await nextTick();
    const titleEl = document.querySelector<HTMLElement>('.apollo-tour-title');
    expect(titleEl).toHaveClass('fn-title');
    expect(titleEl?.getAttribute('style')).toContain('color: rgb(1, 2, 3)');
  });
});

/** popup 根（Trigger 的浮层 div）。 */
function panelRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.apollo-tour');
}
