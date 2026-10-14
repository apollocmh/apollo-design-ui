/**
 * Avatar.Group · Issue #29 回归（1 项，先复现后修）。
 *
 * ⚠️ 与 index.test.ts 同款：`attachTo: document.body`；jsdom 无布局 ⇒ 只钉类名接线。
 */
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { Avatar, AvatarGroup } from '../index';

const P = 'apollo-avatar';
const G = `${P}-group`;

const kids = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    h(Avatar as never, { key: `k${i}` } as never, { default: () => `U${i}` }),
  );

const mountGroup = (props: Record<string, unknown> = {}, count = 4) =>
  mount(AvatarGroup, {
    props,
    slots: { default: () => kids(count) },
    attachTo: document.body,
  });

/** 溢出浮层根（Popover 的 popup 根，带 `-popover` 语义类名）。 */
const popoverRoot = () => document.querySelector<HTMLElement>(`.${G}-popover`);
const popoverContainer = () => document.querySelector<HTMLElement>('.apollo-popover-container');
const popoverArrow = () => document.querySelector<HTMLElement>('.apollo-popover-arrow');

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('#29.1 溢出 Popover 的 classNames 不能被整体覆盖', () => {
  it('[A] 用户的 root/container/arrow 三个语义槽都要保留', async () => {
    const w = mountGroup({
      max: {
        count: 2,
        popover: {
          open: true,
          classNames: {
            root: 'user-root',
            container: 'user-container',
            arrow: 'user-arrow',
          },
        },
      },
    });
    await nextTick();
    await nextTick();

    expect(popoverRoot()).not.toBeNull();
    // root：内置 `-popover` + 用户 root 都要在
    expect(popoverRoot()?.classList.contains(`${G}-popover`)).toBe(true);
    expect(popoverRoot()?.classList.contains('user-root')).toBe(true);
    // container / arrow：用户自带（含 content 槽的容器）不能被丢弃
    expect(popoverContainer()?.classList.contains('user-container')).toBe(true);
    expect(popoverArrow()?.classList.contains('user-arrow')).toBe(true);
    w.unmount();
  });

  it('[B] `rootClassName`（旧键）与 `classNames.root` 同时生效', async () => {
    const w = mountGroup({
      max: {
        count: 2,
        popover: {
          open: true,
          rootClassName: 'legacy-root',
          classNames: { root: 'user-root' },
        },
      },
    });
    await nextTick();
    await nextTick();

    const cls = popoverRoot()?.className ?? '';
    expect(cls).toContain(`${G}-popover`);
    expect(cls).toContain('legacy-root');
    expect(cls).toContain('user-root');
    w.unmount();
  });

  it('[C] 函数式 classNames 也要合并（不能被 root 顶掉）', async () => {
    const w = mountGroup({
      max: {
        count: 2,
        popover: {
          open: true,
          classNames: () => ({
            root: 'fn-root',
            container: 'fn-container',
          }),
        },
      },
    });
    await nextTick();
    await nextTick();

    const cls = popoverRoot()?.className ?? '';
    expect(cls).toContain(`${G}-popover`);
    expect(cls).toContain('fn-root');
    expect(popoverContainer()?.classList.contains('fn-container')).toBe(true);
    w.unmount();
  });

  it('[D] 守卫：不给 classNames 时内置 `-popover` 仍落根，且 trigger/placement 生效', async () => {
    const w = mountGroup({
      max: {
        count: 2,
        popover: { open: true, trigger: 'click', placement: 'bottom' },
      },
    });
    await nextTick();
    await nextTick();

    expect(popoverRoot()?.classList.contains(`${G}-popover`)).toBe(true);
    // placement 落到浮层的 placement 类
    expect(document.querySelector('.apollo-popover-placement-bottom')).not.toBeNull();
    // 触发器（+M 头像）不该被污染上 `-popover`
    const plusAvatar = Array.from(document.querySelectorAll<HTMLElement>(`.${P}`)).find((el) =>
      (el.textContent ?? '').includes('+2'),
    );
    expect(plusAvatar).toBeTruthy();
    expect(plusAvatar?.classList.contains(`${G}-popover`)).toBe(false);
    w.unmount();
  });
});
