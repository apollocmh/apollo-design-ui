/**
 * Issue #20 回归：Drawer 的 push 链路 / 关闭时焦点恢复 / 标题 ARIA 动态一致。
 *
 * 1. `push` 是外层公开 prop，但 `h(RcDrawer, …)` 里没带 ⇒ 落到引擎时走 DrawerPopup 的
 *    默认兜底（`pushDistance = distance ?? parent ?? 180`）⇒ 自定义距离永远不生效。
 * 2. 引擎 `Drawer` 渲染期 `if (!mergedOpen) lastActiveRef = null` —— 上游 rc 只在
 *    `mergedOpen` 变真时记录、从不清空 ⇒ 关闭动效结束后的 `afterOpenChange(false)`
 *    拿到的已是 null，焦点回不去触发器。
 * 3. `titleSlot` / `hasTitle` / `ariaId` 在 setup 求值 ⇒ 标题从「有」变「无」后
 *    `aria-labelledby` 仍指向已不存在的标题节点。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import RcDrawer from '../engine/Drawer';
import Drawer from '../index';

async function ticks(count = 5): Promise<void> {
  for (let i = 0; i < count; i += 1) await nextTick();
}
afterEach(() => vi.useRealTimers());

describe('Drawer · Issue #20', () => {
  describe('#20.1 push 需传到引擎', () => {
    /** 嵌套两层：内层 open 时外层应被推开 `distance`。 */
    const mountNested = async (push: unknown) => {
      const Host = defineComponent({
        setup() {
          return () =>
            h(
              Drawer as never,
              {
                open: true,
                getContainer: false,
                placement: 'right',
                push,
                prefixCls: 'apollo-drawer',
              } as never,
              {
                default: () =>
                  h(
                    Drawer as never,
                    {
                      open: true,
                      getContainer: false,
                      prefixCls: 'apollo-drawer',
                      class: 'inner',
                    } as never,
                  ),
              },
            );
        },
      });
      const w = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await ticks();
      return w;
    };

    it('[A] push={ distance: 240 } ⇒ 外层按 240 推开', async () => {
      const w = await mountNested({ distance: 240 });
      const wrappers = Array.from(document.querySelectorAll('.apollo-drawer-content-wrapper'));
      const styles = wrappers.map((el) => (el as HTMLElement).style.transform ?? '');
      expect(styles.some((s) => s.includes('-240px'))).toBe(true);
      w.unmount();
    });

    it('[B] push=false ⇒ 距离 0（不位移）', async () => {
      const w = await mountNested(false);
      const wrappers = Array.from(document.querySelectorAll('.apollo-drawer-content-wrapper'));
      const styles = wrappers.map((el) => (el as HTMLElement).style.transform ?? '');
      // `pushDistance` 为 0 ⇒ wrapperStyle 不写 transform
      expect(styles.some((s) => s.includes('-180px'))).toBe(false);
      expect(styles.some((s) => s.includes('240px'))).toBe(false);
      w.unmount();
    });
  });

  describe('#20.2 关闭后焦点回到触发器', () => {
    // 驱动真实 motion 队列：此前将 onVisibleChanged 误塞进 hooks 才导致通知缺失。
    // 关闭后必须等离场完成，而不能手动调用内部回调掩盖实际生命周期。
    const driveClose = async () => {
      vi.useFakeTimers();
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const open = ref(false);
      const Host = defineComponent({
        setup: () => () =>
          h(
            RcDrawer as never,
            {
              open: open.value,
              getContainer: false,
              prefixCls: 'apollo-drawer',
              forceRender: true,
            } as never,
            { default: () => h('button', { class: 'inner-btn' }, 'x') },
          ),
      });
      const w = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await ticks();
      open.value = true;
      await vi.runAllTimersAsync();

      const inner = document.querySelector('.inner-btn') as HTMLElement | null;
      expect(inner).toBeTruthy();
      inner!.focus();
      expect(document.activeElement).not.toBe(trigger);

      // 关闭：这一步在修复前会把 lastActiveRef 清掉
      open.value = false;
      await vi.runAllTimersAsync();

      const restored = document.activeElement === trigger;
      w.unmount();
      trigger.remove();
      return restored;
    };

    it('[A] 离场结束后焦点回到打开前的触发器', async () => {
      expect(await driveClose()).toBe(true);
    });
  });

  describe('#20.3 标题 ARIA 需与标题同步', () => {
    it('[A] 标题从有到无 ⇒ aria-labelledby 撤下；回到有 ⇒ 再挂上', async () => {
      const title = ref<string | undefined>('T');
      const Host = defineComponent({
        setup() {
          return () =>
            h(
              Drawer as never,
              {
                open: true,
                getContainer: false,
                prefixCls: 'apollo-drawer',
                title: title.value,
              } as never,
            );
        },
      });
      const w = mount(Host, {
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      });
      await ticks();
      const section = () => document.querySelector('.apollo-drawer-section');
      expect(document.querySelector('.apollo-drawer-title')).toBeTruthy();
      const labelled = section()!.getAttribute('aria-labelledby');
      expect(labelled).toBeTruthy();
      expect(document.getElementById(labelled as string)).toBeTruthy();

      title.value = undefined;
      await ticks();
      expect(document.querySelector('.apollo-drawer-title')).toBeFalsy();
      expect(section()!.getAttribute('aria-labelledby')).toBeFalsy();

      title.value = 'T2';
      await ticks();
      const labelled2 = section()!.getAttribute('aria-labelledby');
      expect(labelled2).toBeTruthy();
      expect(document.getElementById(labelled2 as string)?.textContent).toContain('T2');
      w.unmount();
    });
  });
});
