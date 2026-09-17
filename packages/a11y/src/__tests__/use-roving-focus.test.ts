import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import type { UseRovingFocusOptions, UseRovingFocusReturn } from '../index';
import { NO_ACTIVE_INDEX, useRovingFocus } from '../index';

/** 组合式里没有全局监听，但 `watch` 需要作用域 —— 统一在 effectScope 里跑。 */
function withRoving(
  options: UseRovingFocusOptions,
  run: (api: UseRovingFocusReturn) => void,
): void {
  const scope = effectScope();
  scope.run(() => run(useRovingFocus(options)));
  scope.stop();
}

/** 造 n 个真实 button，并返回 [元素数组, 取元素的函数]。 */
function makeItems(n: number): [HTMLButtonElement[], (index: number) => HTMLElement | null] {
  const items = Array.from({ length: n }, (_, i) => {
    const el = document.createElement('button');
    el.textContent = `item-${i}`;
    document.body.appendChild(el);
    return el;
  });
  return [items, (index: number) => items[index] ?? null];
}

function keyEvent(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
  // jsdom 的 KeyboardEvent 构造函数不认 ctrlKey 之类的修饰键以外的 key 语义，
  // 但 key 本身是构造参数，够用了
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useRovingFocus · tabindex 形态', () => {
  it('只有当前项是 0，其余全 -1', () => {
    withRoving({ count: 3, activeIndex: 1 }, (api) => {
      expect(api.getTabIndex(0)).toBe(-1);
      expect(api.getTabIndex(1)).toBe(0);
      expect(api.getTabIndex(2)).toBe(-1);
    });
  });

  it('没有当前项时整组都是 -1', () => {
    withRoving({ count: 3 }, (api) => {
      expect(api.activeIndex.value).toBe(NO_ACTIVE_INDEX);
      expect(api.getTabIndex(0)).toBe(-1);
    });
  });

  it('count 为 0 时 setActive 得到哨兵，不会越界', () => {
    withRoving({ count: 0 }, (api) => {
      api.setActive(2);
      expect(api.activeIndex.value).toBe(NO_ACTIVE_INDEX);
    });
  });
});

describe('useRovingFocus · 键盘导航', () => {
  it('⭐ ArrowDown 向后移动并真的 focus 到目标元素', () => {
    const [items, getItem] = makeItems(3);
    const focusSpies = items.map((el) => vi.spyOn(el, 'focus'));
    withRoving({ count: 3, activeIndex: 0, getItem }, (api) => {
      expect(api.onKeyDown(keyEvent('ArrowDown'))).toBe(true);
      expect(api.activeIndex.value).toBe(1);
      expect(focusSpies[1]).toHaveBeenCalledTimes(1);
    });
  });

  it('ArrowUp 向前移动', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 2, getItem }, (api) => {
      api.onKeyDown(keyEvent('ArrowUp'));
      expect(api.activeIndex.value).toBe(1);
    });
  });

  it('⭐ 消费掉的键会 preventDefault（方向键默认是滚页面）', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 0, getItem }, (api) => {
      const consumed = keyEvent('ArrowDown');
      api.onKeyDown(consumed);
      expect(consumed.defaultPrevented).toBe(true);
    });
  });

  it('⭐ 未参与导航的键**不**消费也不 preventDefault（否则会吃掉别处的导航）', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 0, orientation: 'vertical', getItem }, (api) => {
      const ignored = keyEvent('ArrowRight');
      expect(api.onKeyDown(ignored)).toBe(false);
      expect(ignored.defaultPrevented).toBe(false);
      expect(api.activeIndex.value).toBe(0);
    });
  });

  it('vertical 不管左右，horizontal 不管上下', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 1, orientation: 'horizontal', getItem }, (api) => {
      expect(api.onKeyDown(keyEvent('ArrowDown'))).toBe(false);
      expect(api.onKeyDown(keyEvent('ArrowRight'))).toBe(true);
      expect(api.activeIndex.value).toBe(2);
    });
  });

  it('⭐ horizontal + RTL 时左右互换', () => {
    const [, getItem] = makeItems(3);
    withRoving(
      { count: 3, activeIndex: 1, orientation: 'horizontal', rtl: true, getItem },
      (api) => {
        api.onKeyDown(keyEvent('ArrowRight'));
        expect(api.activeIndex.value).toBe(0);
        api.onKeyDown(keyEvent('ArrowLeft'));
        expect(api.activeIndex.value).toBe(1);
      },
    );
  });

  it('both 时四个方向都移动', () => {
    const [, getItem] = makeItems(5);
    withRoving({ count: 5, activeIndex: 2, orientation: 'both', getItem }, (api) => {
      expect(api.onKeyDown(keyEvent('ArrowDown'))).toBe(true);
      expect(api.activeIndex.value).toBe(3);
      expect(api.onKeyDown(keyEvent('ArrowRight'))).toBe(true);
      expect(api.activeIndex.value).toBe(4);
    });
  });

  it('Home / End 跳到首尾', () => {
    const [, getItem] = makeItems(4);
    withRoving({ count: 4, activeIndex: 2, getItem }, (api) => {
      expect(api.onKeyDown(keyEvent('End'))).toBe(true);
      expect(api.activeIndex.value).toBe(3);
      expect(api.onKeyDown(keyEvent('Home'))).toBe(true);
      expect(api.activeIndex.value).toBe(0);
    });
  });

  it('默认环绕：末尾再往后回到开头', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 2, getItem }, (api) => {
      api.onKeyDown(keyEvent('ArrowDown'));
      expect(api.activeIndex.value).toBe(0);
    });
  });

  it('⭐ loop=false 时停在边界，不环绕', () => {
    const [, getItem] = makeItems(3);
    withRoving({ count: 3, activeIndex: 2, loop: false, getItem }, (api) => {
      api.onKeyDown(keyEvent('ArrowDown'));
      expect(api.activeIndex.value).toBe(2);
    });
  });

  it('无关的键（字母 / Enter）返回 false', () => {
    withRoving({ count: 3, activeIndex: 0 }, (api) => {
      expect(api.onKeyDown(keyEvent('a'))).toBe(false);
      expect(api.onKeyDown(keyEvent('Enter'))).toBe(false);
      expect(api.onKeyDown(keyEvent('Escape'))).toBe(false);
    });
  });
});

describe('useRovingFocus · 受控与副作用', () => {
  it('⭐ 受控：外部 activeIndex 变化会同步进来', async () => {
    const active = ref(0);
    const scope = effectScope();
    // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
    const api = scope.run(() =>
      useRovingFocus({ count: 3, activeIndex: active }),
    ) as UseRovingFocusReturn;

    expect(api.activeIndex.value).toBe(0);
    active.value = 2;
    await nextTick();
    expect(api.activeIndex.value).toBe(2);
    scope.stop();
  });

  it('受控值回到 undefined 时**不**覆盖内部状态（undefined 表示「不管」）', async () => {
    const active = ref<number | undefined>(0);
    const scope = effectScope();
    // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
    const api = scope.run(() =>
      useRovingFocus({ count: 3, activeIndex: active }),
    ) as UseRovingFocusReturn;

    api.move(1);
    expect(api.activeIndex.value).toBe(1);

    // 外部把受控值置回 undefined —— 内部状态必须保持不变
    active.value = undefined;
    await nextTick();
    expect(api.activeIndex.value).toBe(1);
    scope.stop();
  });

  it('onChange 在每次移动后收到新下标', () => {
    const seen: number[] = [];
    withRoving({ count: 3, activeIndex: 0, onChange: (i) => seen.push(i) }, (api) => {
      api.onKeyDown(keyEvent('ArrowDown'));
      api.onKeyDown(keyEvent('ArrowDown'));
    });
    expect(seen).toEqual([1, 2]);
  });

  it('⭐ focusOnMove=false 时只改状态，不碰焦点', () => {
    const [items, getItem] = makeItems(3);
    const focusSpies = items.map((el) => vi.spyOn(el, 'focus'));
    withRoving({ count: 3, activeIndex: 0, getItem, focusOnMove: false }, (api) => {
      api.onKeyDown(keyEvent('ArrowDown'));
      expect(api.activeIndex.value).toBe(1);
      expect(focusSpies[1]).not.toHaveBeenCalled();
    });
  });

  it('没给 getItem 时移动不抛错（只改状态）', () => {
    withRoving({ count: 3, activeIndex: 0 }, (api) => {
      expect(() => api.onKeyDown(keyEvent('ArrowDown'))).not.toThrow();
      expect(api.activeIndex.value).toBe(1);
    });
  });

  it('setActive 会被 count 夹住', () => {
    withRoving({ count: 3, activeIndex: 0 }, (api) => {
      api.setActive(99);
      expect(api.activeIndex.value).toBe(2);
      api.setActive(-5);
      expect(api.activeIndex.value).toBe(0);
    });
  });

  it('moveHome / moveEnd 是 Home / End 的等价物', () => {
    withRoving({ count: 4, activeIndex: 1 }, (api) => {
      api.moveEnd();
      expect(api.activeIndex.value).toBe(3);
      api.moveHome();
      expect(api.activeIndex.value).toBe(0);
    });
  });

  it('count 是响应式的 —— 列表变短后移动被夹住', async () => {
    const count = ref(5);
    const scope = effectScope();
    // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
    const api = scope.run(() => useRovingFocus({ count, activeIndex: 4 })) as UseRovingFocusReturn;

    count.value = 2;
    await nextTick();
    api.move(1);
    expect(api.activeIndex.value).toBe(1);
    scope.stop();
  });

  it('setActive(index, false) 不移动焦点', () => {
    const [items, getItem] = makeItems(3);
    const focusSpies = items.map((el) => vi.spyOn(el, 'focus'));
    withRoving({ count: 3, activeIndex: 0, getItem }, (api) => {
      api.setActive(2, false);
      expect(api.activeIndex.value).toBe(2);
      expect(focusSpies[2]).not.toHaveBeenCalled();
    });
  });
});
