/**
 * Issue #19 回归：Modal 的 Wrapper 透传契约 + 前缀动态同步。
 *
 * 1. `wrapStyle` / `wrapProps` 已声明却没传给 DialogWrap（静态调用链：Modal.ts 的
 *    `h(DialogWrap, …)` 里没有这两个键）⇒ 调用方的 wrapper 样式/ARIA/自定义 DOM 属性丢失。
 *    判据（engine/Dialog.ts:191-196 / 258-263）：wrapper 上是
 *    `zIndex → wrapStyle → styles.wrapper → display`，`wrapProps` 最后展开。
 * 2. `prefixCls` / `rootPrefixCls` 是 setup 期普通字符串 ⇒ 局部前缀运行时变更后
 *    mask/wrap/panel 类名与动效名不跟着换。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Modal from '../index';

async function ticks(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) await nextTick();
}

const wrap = (): HTMLElement | null => document.body.querySelector('.apollo-modal-wrap');

describe('Modal · Issue #19', () => {
  describe('#19.1 wrapStyle / wrapProps 需转到 DialogWrap', () => {
    it('[A] wrapStyle 落到 wrapper 节点（且不被 styles.wrapper 覆盖顺序错乱）', async () => {
      const w = mount(Modal, {
        props: {
          open: true,
          wrapStyle: { pointerEvents: 'auto', backgroundColor: 'rgb(1, 2, 3)' } as never,
        } as never,
        attachTo: document.body,
      });
      await ticks();
      expect(wrap()).toBeTruthy();
      const style = wrap()!.getAttribute('style') ?? '';
      expect(style).toContain('pointer-events: auto');
      expect(style).toContain('background-color');
      w.unmount();
    });

    it('[B] wrapProps 的 data-* / aria-* 落到 wrapper 节点', async () => {
      const w = mount(Modal, {
        props: {
          open: true,
          wrapProps: { 'data-test-wrap': 'yes', 'aria-label': 'wrap-label' } as never,
        } as never,
        attachTo: document.body,
      });
      await ticks();
      expect(wrap()).toBeTruthy();
      expect(wrap()!.getAttribute('data-test-wrap')).toBe('yes');
      expect(wrap()!.getAttribute('aria-label')).toBe('wrap-label');
      w.unmount();
    });

    it('[C] styles.wrapper 优先级高于 wrapStyle（Dialog 的合并顺序）', async () => {
      const w = mount(Modal, {
        props: {
          open: true,
          wrapStyle: { inset: '1px' } as never,
          styles: { wrapper: { inset: '2px' } } as never,
        } as never,
        attachTo: document.body,
      });
      await ticks();
      expect(wrap()!.style.inset).toBe('2px');
      w.unmount();
    });

    it('[D] wrapStyle 运行时更新同步', async () => {
      const w = mount(Modal, {
        props: { open: true, wrapStyle: { inset: '1px' } as never } as never,
        attachTo: document.body,
      });
      await ticks();
      expect(wrap()!.style.inset).toBe('1px');
      await w.setProps({ wrapStyle: { inset: '5px' } } as never);
      await ticks();
      expect(wrap()!.style.inset).toBe('5px');
      w.unmount();
    });
  });

  describe('#19.2 prefixCls 需响应式', () => {
    it('[A] 局部 prefixCls 运行时变更 ⇒ mask/wrap/panel 类名同步', async () => {
      const w = mount(Modal, {
        props: { open: true, prefixCls: 'apollo-modal' } as never,
        attachTo: document.body,
      });
      await ticks();
      expect(document.body.querySelector('.apollo-modal-wrap')).toBeTruthy();
      expect(document.body.querySelector('.apollo-modal-container')).toBeTruthy();
      expect(document.body.querySelector('.apollo-modal-mask')).toBeTruthy();
      expect(document.body.querySelector('.apollo-modal-close-icon')).toBeTruthy();

      await w.setProps({ prefixCls: 'custom-modal' });
      await ticks();
      expect(document.body.querySelector('.custom-modal-wrap')).toBeTruthy();
      expect(document.body.querySelector('.custom-modal-container')).toBeTruthy();
      expect(document.body.querySelector('.custom-modal-mask')).toBeTruthy();
      // 兜底关闭图标的类名也带前缀（fallback 必须随前缀重算）
      expect(document.body.querySelector('.custom-modal-close-icon')).toBeTruthy();
      w.unmount();
    });

    it('[B] 面板选择器（panelRef 注册面）跟随前缀', async () => {
      const w = mount(Modal, {
        props: { open: true, prefixCls: 'apollo-modal' } as never,
        attachTo: document.body,
      });
      await ticks();
      await w.setProps({ prefixCls: 'custom-modal' });
      await ticks();
      // 前缀换了还能找到新前缀的 container（选择器若用旧前缀会连不上）
      expect(document.body.querySelector('.custom-modal-container')).toBeTruthy();
      w.unmount();
    });
  });
});
