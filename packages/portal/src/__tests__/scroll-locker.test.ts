/**
 * `useScrollLocker` —— 滚动锁。
 *
 * 契约（`@rc-component/portal@2.2.1` `es/useScrollLocker.js`）：
 *   1. 锁时往 head 注入 `html body { overflow-y: hidden; }`；
 *   2. **每个实例一个 key** ⇒ 两层同时锁、解锁一层不影响另一层；
 *   3. 解锁 / 作用域销毁都要移除；
 *   4. `isBodyOverflowing()` 为真时才补 `width: calc(100% - Npx)`。
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { useScrollLocker } from '../use-scroll-locker';

const locks = () =>
  Array.from(document.head.querySelectorAll('style[data-apollo-css-key]')).filter((el) =>
    el.textContent?.includes('overflow-y: hidden'),
  );

afterEach(() => {
  for (const el of Array.from(document.head.querySelectorAll('style[data-apollo-css-key]'))) {
    el.remove();
  }
});

describe('useScrollLocker', () => {
  it('lock=true ⇒ 注入；lock=false ⇒ 移除', async () => {
    const lock = ref(true);
    const scope = effectScope();
    scope.run(() => useScrollLocker(lock));
    await nextTick();

    expect(locks()).toHaveLength(1);
    expect(locks()[0]!.textContent).toContain('overflow-y: hidden');

    lock.value = false;
    await nextTick();
    expect(locks()).toHaveLength(0);

    scope.stop();
  });

  it('两层同时锁 ⇒ 两个 key；解锁一层另一层还在', async () => {
    const a = ref(true);
    const b = ref(true);
    const scope = effectScope();
    scope.run(() => {
      useScrollLocker(a);
      useScrollLocker(b);
    });
    await nextTick();
    expect(locks()).toHaveLength(2);

    a.value = false;
    await nextTick();
    expect(locks()).toHaveLength(1);

    b.value = false;
    await nextTick();
    expect(locks()).toHaveLength(0);
    scope.stop();
  });

  it('作用域销毁 ⇒ 移除（即使还锁着）', async () => {
    const scope = effectScope();
    scope.run(() => useScrollLocker(ref(true)));
    await nextTick();
    expect(locks()).toHaveLength(1);

    scope.stop();
    expect(locks()).toHaveLength(0);
  });

  it('body 溢出时补滚动条宽度（`isBodyOverflowing` 为真）', async () => {
    // jsdom 里 scrollHeight/innerHeight/offsetWidth 全是 0 ⇒ 默认不溢出；
    // 这里把判据需要的三个量撑起来，逼出 `width: calc(100% - Npx)` 分支
    const body = document.body;
    const spy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(100);
    const spyWidth = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800);
    Object.defineProperty(body, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(body, 'offsetWidth', { value: 700, configurable: true });

    const scope = effectScope();
    scope.run(() => useScrollLocker(ref(true)));
    await nextTick();

    expect(locks()[0]!.textContent).toContain('width: calc(100% -');

    scope.stop();
    spy.mockRestore();
    spyWidth.mockRestore();
  });
});
