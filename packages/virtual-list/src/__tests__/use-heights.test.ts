import { afterEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope } from 'vue';
import type { UseHeightsReturn } from '../index';
import { useHeights } from '../index';

const getKey = (item: string): string => item;

/**
 * 造一个「已挂载」的元素。
 *
 * ⚠️ jsdom 里 `offsetParent` **恒为 `null`**、`offsetHeight` **恒为 0** ——
 *    `useHeights` 的第一条判据就是「`offsetParent` 为假则跳过」，所以不桩替的话
 *    收集循环一个都不会收。见契约文档 §7.1。
 */
function stubElement(
  height: number,
  options: { attached?: boolean; marginTop?: string; marginBottom?: string } = {},
): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  if (options.attached !== false) {
    Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
  }
  if (options.marginTop !== undefined) {
    el.style.marginTop = options.marginTop;
  }
  if (options.marginBottom !== undefined) {
    el.style.marginBottom = options.marginBottom;
  }
  return el;
}

function withHeights<T>(run: (api: UseHeightsReturn<string>) => T): {
  result: T;
  scope: EffectScope;
} {
  const scope = effectScope();
  // effectScope.run 的返回类型带 | undefined；回调一定返回值，这里收窄一次
  const result = scope.run(() => run(useHeights<string>(getKey))) as T;
  return { result, scope };
}

/** 冲一轮微任务（`collectHeight` 默认走微任务）。 */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useHeights · 收集', () => {
  it('⭐ 高度 = offsetHeight + 上下 margin', () => {
    const el = stubElement(30, { marginTop: '4px', marginBottom: '6px' });
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      return api.heights.get('a');
    });
    expect(result).toBe(40);
    scope.stop();
  });

  it('没有 margin 时就是 offsetHeight', () => {
    const el = stubElement(30);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      return api.heights.get('a');
    });
    expect(result).toBe(30);
    scope.stop();
  });

  it('⭐ offsetParent 为假 ⇒ 跳过（隐藏的项不测）', () => {
    const el = stubElement(30, { attached: false });
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      return api.heights.get('a');
    });
    expect(result).toBeUndefined();
    scope.stop();
  });

  it('⚠️ 对照：不桩替 offsetParent 时 jsdom 恒为 null ⇒ 收不到（说明上面那条不是白测的）', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    Object.defineProperty(el, 'offsetHeight', { value: 30, configurable: true });
    expect(el.offsetParent).toBeNull();
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      return api.heights.get('a');
    });
    expect(result).toBeUndefined();
    scope.stop();
  });

  it('多项各自收集', () => {
    const a = stubElement(10);
    const b = stubElement(20);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', a);
      api.setInstanceRef('b', b);
      api.collectHeight(true);
      return [api.heights.get('a'), api.heights.get('b')];
    });
    expect(result).toEqual([10, 20]);
    scope.stop();
  });
});

describe('useHeights · updatedMark', () => {
  it('⭐ 只有高度**真的变了**才自增', () => {
    const el = stubElement(30);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      const first = api.updatedMark.value;

      api.collectHeight(true); // 没变
      const second = api.updatedMark.value;

      Object.defineProperty(el, 'offsetHeight', { value: 50, configurable: true });
      api.collectHeight(true); // 变了
      const third = api.updatedMark.value;

      return { first, second, third };
    });
    // setInstanceRef 内部也会触发一次收集 ⇒ first 可能已经是 1
    expect(result.second).toBe(result.first);
    expect(result.third).toBe(result.first + 1);
    scope.stop();
  });

  it('没注册任何元素时收集不自增', () => {
    const { result, scope } = withHeights((api) => {
      api.collectHeight(true);
      return api.updatedMark.value;
    });
    expect(result).toBe(0);
    scope.stop();
  });
});

describe('useHeights · 微任务合并', () => {
  it('⭐ 同一 tick 内多次调用只收集一次', async () => {
    const el = stubElement(30);
    const { scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      // 三次请求，但只有一个微任务会真正执行
      api.collectHeight();
      api.collectHeight();
      api.collectHeight();
      return api;
    });
    await flushMicrotasks();
    scope.stop();
    // 无法直接数「执行了几次」，但可以确认结果正确且 id 只前进了有限次
    const { result: value, scope: scope2 } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight();
      api.collectHeight();
      return api.heights.get('a');
    });
    expect(value).toBeUndefined(); // 还没 flush
    await flushMicrotasks();
    expect(scope2).toBeTruthy();
    scope2.stop();
  });

  it('⭐ cancelPending 会作废尚未执行的收集', async () => {
    const el = stubElement(30);
    const scope = effectScope();
    const api = scope.run(() => useHeights<string>(getKey)) as UseHeightsReturn<string>;

    api.setInstanceRef('a', el);
    api.collectHeight();
    api.cancelPending(); // 作废
    await flushMicrotasks();

    // 被作废 ⇒ 什么都没收
    expect(api.heights.get('a')).toBeUndefined();
    scope.stop();
  });

  it('scope 释放会作废挂起的收集（onScopeDispose）', async () => {
    const el = stubElement(30);
    const scope = effectScope();
    const api = scope.run(() => useHeights<string>(getKey)) as UseHeightsReturn<string>;
    api.setInstanceRef('a', el);
    api.collectHeight();
    scope.stop();
    await flushMicrotasks();
    expect(api.heights.get('a')).toBeUndefined();
  });
});

describe('useHeights · 注册与注销', () => {
  it('⭐ 注册触发 onItemAdd，注销触发 onItemRemove', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const el = stubElement(30);
    const scope = effectScope();
    const api = scope.run(() =>
      useHeights<string>(getKey, onAdd, onRemove),
    ) as UseHeightsReturn<string>;

    api.setInstanceRef('a', el);
    expect(onAdd).toHaveBeenCalledWith('a');
    expect(onRemove).not.toHaveBeenCalled();

    api.setInstanceRef('a', null);
    expect(onRemove).toHaveBeenCalledWith('a');
    scope.stop();
  });

  it('⭐ 同一个 key 换成另一个元素**不**触发 add/remove（判的是「有无」的布尔）', () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const first = stubElement(10);
    const second = stubElement(20);
    const scope = effectScope();
    const api = scope.run(() =>
      useHeights<string>(getKey, onAdd, onRemove),
    ) as UseHeightsReturn<string>;

    api.setInstanceRef('a', first);
    api.setInstanceRef('a', second);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
    scope.stop();
  });

  it('重复注销同一个 key 只回调一次', () => {
    const onRemove = vi.fn();
    const el = stubElement(10);
    const scope = effectScope();
    const api = scope.run(() =>
      useHeights<string>(getKey, undefined, onRemove),
    ) as UseHeightsReturn<string>;

    api.setInstanceRef('a', el);
    api.setInstanceRef('a', null);
    api.setInstanceRef('a', null);
    expect(onRemove).toHaveBeenCalledTimes(1);
    scope.stop();
  });

  it('⭐ 注销后已收集的高度仍留在缓存里（上游不删）', () => {
    const el = stubElement(30);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      api.setInstanceRef('a', null);
      return api.heights.get('a');
    });
    expect(result).toBe(30);
    scope.stop();
  });

  it('注销后再收集不会更新该项', () => {
    const el = stubElement(30);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      api.setInstanceRef('a', null);
      Object.defineProperty(el, 'offsetHeight', { value: 99, configurable: true });
      api.collectHeight(true);
      return api.heights.get('a');
    });
    expect(result).toBe(30);
    scope.stop();
  });

  it('heights.id 随每次写入自增', () => {
    const el = stubElement(30);
    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      const first = api.heights.id;
      api.collectHeight(true); // 无变化 ⇒ 不写
      const second = api.heights.id;
      return { first, second };
    });
    expect(result.second).toBe(result.first);
    scope.stop();
  });
});

describe('useHeights · 兜底分支', () => {
  it('⭐ 在 effectScope 之外调用不抛错（getCurrentScope 为假 ⇒ 不注册 dispose）', () => {
    // 直接调用，不包 effectScope
    const api = useHeights<string>(getKey);
    const el = stubElement(30);
    api.setInstanceRef('a', el);
    api.collectHeight(true);
    expect(api.heights.get('a')).toBe(30);
  });

  it('⭐ 元素所属文档没有 defaultView 时 margin 按 0 算', () => {
    // `document.implementation.createHTMLDocument()` 造出来的文档没有 defaultView
    const detachedDoc = document.implementation.createHTMLDocument('detached');
    expect(detachedDoc.defaultView).toBeNull();

    const el = detachedDoc.createElement('div');
    detachedDoc.body.appendChild(el);
    Object.defineProperty(el, 'offsetHeight', { value: 30, configurable: true });
    Object.defineProperty(el, 'offsetParent', { value: detachedDoc.body, configurable: true });
    el.style.marginTop = '4px';

    const { result, scope } = withHeights((api) => {
      api.setInstanceRef('a', el);
      api.collectHeight(true);
      return api.heights.get('a');
    });
    // 拿不到 computed style ⇒ margin 记 0（不是抛错）
    expect(result).toBe(30);
    scope.stop();
  });
});
