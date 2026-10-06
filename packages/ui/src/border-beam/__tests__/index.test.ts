/**
 * L1 · 单元测试（BorderBeam）
 *
 * ── L2 适用面 ────────────────────────────────────────────────────────────────
 *
 * 无事件/受控/焦点。流光的 offset-path 动画在 jsdom 无效（@supports 全不过）——
 * L1 钉的是「结构与样式串」：Effect 挂进宿主 DOM、CSS 变量值、inset-offset 计算、
 * count/duration 等判据。视觉由 L6（真实浏览器）覆盖。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { BorderBeam, DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient } from '../index';

const mountInHost = (props = {}, hostProps = {}) =>
  mount(
    {
      setup() {
        return () =>
          h(
            'div',
            { 'data-host': true, style: 'border: 2px solid #ddd; padding: 8px', ...hostProps },
            [
              h(BorderBeam, props, {
                default: () => h('div', { class: 'inner', style: 'border: 2px solid #ddd' }, 'x'),
              }),
            ],
          );
      },
    },
    {
      attachTo: document.body,
      // VTU 默认把 Teleport 换成不渲染内容的 stub —— 打开 renderStubDefaultSlot
      // 让 portal 进宿主 DOM 的 Effect 真实出现在查询范围内。
      global: { renderStubDefaultSlot: true },
    },
  );

describe('BorderBeam · 结构', () => {
  it('Effect（portal）挂进宿主 DOM：aria-hidden + 根类名', async () => {
    const w = mountInHost();
    await nextTick();
    await nextTick();
    const effect = w.element.querySelector('.apollo-border-beam');
    expect(effect).not.toBeNull();
    expect(effect?.getAttribute('aria-hidden')).toBe('true');
    // Effect 是宿主的**子元素**（portal 语义）
    expect(w.element.contains(effect)).toBe(true);
  });

  it('inset-offset：随宿主 border 取负（数字 -2px；0 边写 0px）', async () => {
    const w = mountInHost();
    await nextTick();
    await nextTick();
    const effect = w.element.querySelector('.apollo-border-beam') as HTMLElement;
    const style = effect?.getAttribute('style') ?? '';
    // 宿主 border 2px 全边 → inset: -2px -2px -2px -2px（四值展开）
    expect(style).toContain('--apollo-border-beam-inset-offset: -2px -2px -2px -2px');
  });

  it('outset 覆盖四边统一（字符串走 calc）', async () => {
    const w = mountInHost({ outset: 6 });
    await nextTick();
    await nextTick();
    expect(
      (w.element.querySelector('.apollo-border-beam') as HTMLElement).getAttribute('style'),
    ).toContain('--apollo-border-beam-inset-offset: -6px;');
    const w2 = mountInHost({ outset: '0.5rem' });
    await nextTick();
    await nextTick();
    expect(
      (w2.element.querySelector('.apollo-border-beam') as HTMLElement).getAttribute('style'),
    ).toContain('--apollo-border-beam-inset-offset: calc(-1 * 0.5rem);');
  });

  it('count/duration/lineWidth/size 写运行时 CSS 变量', async () => {
    const w = mountInHost({ count: 3, duration: 9, lineWidth: 8, size: 160 });
    await nextTick();
    await nextTick();
    const effects = w.element.querySelectorAll('.apollo-border-beam');
    expect(effects.length).toBe(3);
    const style = (effects[0] as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('--apollo-border-beam-duration: 9s');
    expect(style).toContain('--apollo-border-beam-line-width: 8px');
    expect(style).toContain('--apollo-border-beam-size: 160px');
    // delay 错相：index=1 → -3s；index=2 → -6s
    expect((effects[1] as HTMLElement).getAttribute('style')).toContain(
      '--apollo-border-beam-delay: -3s;',
    );
    expect((effects[2] as HTMLElement).getAttribute('style')).toContain(
      '--apollo-border-beam-delay: -6s;',
    );
  });

  it('color 写 beam-gradient 变量', async () => {
    const w = mountInHost({ color: 'blue' });
    await nextTick();
    await nextTick();
    expect(
      (w.element.querySelector('.apollo-border-beam') as HTMLElement).getAttribute('style'),
    ).toContain(
      // 纯色 → 单 stop 0%，fillGradientEnd 复制一份置 100%（映射到 70%）
      '--apollo-border-beam-beam-gradient: linear-gradient(to left, blue 0%, blue 70%, transparent);',
    );
  });

  it('count 归一：非法值回落 1', async () => {
    for (const bad of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      const w = mountInHost({ count: bad });
      await nextTick();
      await nextTick();
      expect(w.element.querySelectorAll('.apollo-border-beam').length).toBe(1);
    }
  });

  it('宿主不可挂 ref（纯文本）→ 无 Effect', () => {
    const w = mount(
      { setup: () => () => h('div', [h(BorderBeam, {}, { default: () => 'plain text' })]) },
      { attachTo: document.body },
    );
    expect(w.element.querySelector('.apollo-border-beam')).toBeNull();
    expect(w.element.textContent).toContain('plain text');
  });

  it('getBorderBeamGradient 判据（纯函数直测）', () => {
    // 纯色 → 单 stop 0% + fillGradientEnd 复制置 100%（映射后 0%/70%）
    expect(getBorderBeamGradient('blue')).toBe(
      'linear-gradient(to left, blue 0%, blue 70%, transparent)',
    );
    // 0-100 线性映射到 0-70
    expect(
      getBorderBeamGradient([
        { color: '#722ed1', percent: 20 },
        { color: '#2db7f5', percent: 100 },
      ]),
    ).toBe('linear-gradient(to left, #722ed1 14%, #2db7f5 70%, transparent)');
    // 末 stop 非 100 → 复制置 100（30 → 21%，100 → 70%）
    expect(getBorderBeamGradient([{ color: 'red', percent: 30 }])).toBe(
      'linear-gradient(to left, red 21%, red 70%, transparent)',
    );
    // 越界截断到 0-100 再映射
    expect(getBorderBeamGradient([{ color: 'red', percent: 150 }])).toBe(
      'linear-gradient(to left, red 70%, red 70%, transparent)',
    );
    // undefined → undefined（回落 CSS 默认渐变）
    expect(getBorderBeamGradient(undefined)).toBeUndefined();
  });

  it('默认导出常量', () => {
    expect(DEFAULT_BORDER_BEAM_DURATION).toBe(6);
  });

  /**
   * 语义槽 `classNames.effect` / `styles.effect`（**本仓自有 API**）。
   *
   * ⚠️ `BorderBeam` 是 renderless —— 它**没有自己的 DOM 根**（把 Effect 层注入宿主的
   * children），所以「根类名」在 Vue 里无处可放；槽位给这个落点一个 Vue-native 的名字，
   * 取代上游那两个 React 名（`className` / `style`）。
   */
  it('classNames.effect / styles.effect 落在 Effect 层（每个流光一个）', async () => {
    const w = mountInHost({
      count: 2,
      classNames: { effect: 'my-effect' },
      styles: { effect: { marginTop: '9px' } },
    });
    await nextTick();
    await nextTick();
    const effects = w.element.querySelectorAll('.apollo-border-beam');
    expect(effects.length).toBe(2);
    for (const el of effects) {
      expect((el as HTMLElement).classList.contains('my-effect')).toBe(true);
      expect((el as HTMLElement).getAttribute('style')).toContain('margin-top: 9px');
    }
  });

  it('deprecated 的 className / style 仍生效，且排在槽位之后（旧代码行为不变）', async () => {
    const w = mountInHost({
      classNames: { effect: 'from-slot' },
      className: 'from-legacy',
      styles: { effect: { marginTop: '1px' } },
      style: { marginTop: '2px' },
    });
    await nextTick();
    await nextTick();
    const effect = w.element.querySelector('.apollo-border-beam') as HTMLElement;
    expect(effect.classList.contains('from-slot')).toBe(true);
    expect(effect.classList.contains('from-legacy')).toBe(true);
    // 后者覆盖前者
    expect(effect.getAttribute('style')).toContain('margin-top: 2px');
  });
});

/**
 * 宿主 attrs 透传（registry `VNA-ATTRS-01`）。
 *
 * 本组件是 **renderless**（装饰的是子节点那个元素，没有自己的 DOM 根）⇒ 调用方的
 * attrs 唯一合理落点就是**宿主**。此前 `inheritAttrs: false` 且从不读 attrs
 * ⇒ `data-*` / `aria-*` 全部静默丢弃。
 */
describe('BorderBeam · 宿主 attrs 透传（VNA-ATTRS-01）', () => {
  it('data-* / aria-* 落到宿主元素上', async () => {
    const w = mountInHost({}, { 'data-testid': 'host', 'aria-describedby': 'hint' });
    await nextTick();
    await nextTick();
    // ⚠️ `w.element` **本身就是**宿主（`mountInHost` 的最外层 div）—— querySelector 只搜后代
    const host = w.element as HTMLElement;
    expect(host.getAttribute('data-testid')).toBe('host');
    expect(host.getAttribute('aria-describedby')).toBe('hint');
  });

  it('调用方 class 与宿主自己的 class **叠加**（不是覆盖）', async () => {
    const w = mountInHost({}, { class: 'from-caller' });
    await nextTick();
    await nextTick();
    // ⚠️ `w.element` **本身就是**宿主（`mountInHost` 的最外层 div）—— querySelector 只搜后代
    const host = w.element as HTMLElement;
    expect(host.classList.contains('from-caller')).toBe(true);
    // 宿主原有的内联 style 不能被顶掉
    expect(host.getAttribute('style')).toContain('border');
  });
});
