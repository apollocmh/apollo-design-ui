import { afterEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, nextTick, onScopeDispose, ref } from 'vue';
import type { FocusRestoreHandle } from '../index';
import { useFocusRestore } from '../index';

const scopes: EffectScope[] = [];

/**
 * `useFocusRestore` 用了 `onScopeDispose`，必须在 effectScope 里跑 ——
 * 否则 Vue 会警告 "no active effect scope"，而且状态不会随 scope 释放。
 */
function withRestore<T>(
  container: HTMLElement,
  options: Parameters<typeof useFocusRestore>[1],
  run: (handle: FocusRestoreHandle) => T,
): { result: T; scope: EffectScope } {
  const scope = effectScope();
  scopes.push(scope);
  const result = scope.run(() => run(useFocusRestore(() => container, options))) as T;
  return { result, scope };
}

function makeButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  document.body.appendChild(button);
  return button;
}

afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  document.body.innerHTML = '';
});

describe('useFocusRestore（rc-dialog Dialog/index.js:53-95）', () => {
  it('⭐ 完整往返：记住外部焦点 → 关掉时还回去', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      handle.focusContent();
      expect(document.activeElement).toBe(container);

      handle.restore();
      expect(document.activeElement).toBe(trigger);
    });
    scope.stop();
  });

  it('门 1：save 时焦点已在容器内 ⇒ 不覆盖（嵌套浮层不会记错外部焦点）', () => {
    const outside = makeButton('outside');
    const container = document.createElement('div');
    container.tabIndex = -1;
    const inner = makeButton('inner');
    container.appendChild(inner);
    document.body.appendChild(container);

    inner.focus();
    outside.focus();
    // 焦点在 outside，此时先 save（记住 outside），再把焦点放进容器再 save —— 不该覆盖
    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      expect(document.activeElement).toBe(outside);
      inner.focus();
      handle.save(); // 门 1 生效：焦点已在容器内 ⇒ 仍然是 outside
      handle.restore();
      expect(document.activeElement).toBe(outside);
    });
    scope.stop();
  });

  it('门 1 的另一半：焦点在容器内时 save 什么都不记 ⇒ restore 不动焦点', () => {
    const container = document.createElement('div');
    container.tabIndex = -1;
    const inner = makeButton('inner');
    container.appendChild(inner);
    document.body.appendChild(container);

    inner.focus();
    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      handle.restore();
      expect(document.activeElement).toBe(inner);
    });
    scope.stop();
  });

  it('⭐ 门 2：focusContent 时焦点已在容器内 ⇒ 不抢', () => {
    const container = document.createElement('div');
    container.tabIndex = -1;
    const inner = makeButton('inner');
    container.appendChild(inner);
    document.body.appendChild(container);

    inner.focus();
    const { scope } = withRestore(container, {}, (handle) => {
      handle.focusContent();
      expect(document.activeElement).toBe(inner);
    });
    scope.stop();
  });

  it('⭐ 门 3：mask 为 false 时不恢复（上游的可观察行为，别顺手修）', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    trigger.focus();
    const { scope } = withRestore(container, { mask: false }, (handle) => {
      handle.save();
      container.focus();
      expect(document.activeElement).toBe(container);
      handle.restore();
      expect(document.activeElement).toBe(container);
    });
    scope.stop();
  });

  it('门 3：enabled（focusTriggerAfterClose）为 false 时也不恢复', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    trigger.focus();
    const { scope } = withRestore(container, { enabled: false }, (handle) => {
      handle.save();
      container.focus();
      handle.restore();
      expect(document.activeElement).toBe(container);
    });
    scope.stop();
  });

  it('两个门都默认开 —— 不传 options 时行为与 mask=true / enabled=true 一致', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    trigger.focus();
    const { scope } = withRestore(container, undefined, (handle) => {
      handle.save();
      container.focus();
      handle.restore();
      expect(document.activeElement).toBe(trigger);
    });
    scope.stop();
  });

  it('⭐ restore 只生效一次 —— 第二次什么都做', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    trigger.focus();
    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      container.focus();
      handle.restore();
      expect(document.activeElement).toBe(trigger);

      container.focus();
      handle.restore();
      expect(document.activeElement).toBe(container);
    });
    scope.stop();
  });

  it('⭐ 要恢复的元素已经不可聚焦 ⇒ 吞掉异常，不让它冒出去', () => {
    const trigger = makeButton('trigger');
    trigger.focus = () => {
      throw new Error('元素已从文档移除');
    };
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      container.focus();
      expect(() => handle.restore()).not.toThrow();
      // 异常后仍然清掉了 saved（上游把置 null 放在 try/catch 之后）
      handle.restore();
    });
    scope.stop();
  });

  it('选项是响应式的 —— 关掉 mask 后 restore 立即失效', () => {
    const trigger = makeButton('trigger');
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    const mask = ref(true);
    trigger.focus();
    const { scope } = withRestore(container, { mask }, (handle) => {
      handle.save();
      container.focus();
      mask.value = false;
      handle.restore();
      expect(document.activeElement).toBe(container);
    });
    scope.stop();
  });

  it('容器元素还没挂载时三个动作都不抛错', () => {
    const { scope } = withRestore(null as unknown as HTMLElement, {}, (handle) => {
      expect(() => {
        handle.save();
        handle.focusContent();
        handle.restore();
      }).not.toThrow();
    });
    scope.stop();
  });

  it('⭐ 没有全局 document（SSR）时三个动作都不抛错 —— 走 getActiveElement 的兜底分支', () => {
    vi.stubGlobal('document', undefined);
    try {
      const { scope } = withRestore(null as unknown as HTMLElement, {}, (handle) => {
        expect(() => {
          handle.save();
          handle.focusContent();
          handle.restore();
        }).not.toThrow();
      });
      scope.stop();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('scope 释放后不再持有被保存的元素引用', () => {
    const trigger = makeButton('trigger');
    trigger.focus();
    const container = document.createElement('div');
    container.tabIndex = -1;
    document.body.appendChild(container);

    const { scope } = withRestore(container, {}, (handle) => {
      handle.save();
      return handle;
    });
    // 只断言「stop 不抛错」：saved 是闭包私有变量，外部观察不到，
    // 这里的价值是让「释放路径被执行」这件事进覆盖率。
    expect(() => scope.stop()).not.toThrow();
  });
});

function layer(name: string) {
  const container = document.createElement('div');
  container.tabIndex = -1;
  const button = document.createElement('button');
  button.textContent = name;
  container.appendChild(button);
  document.body.appendChild(container);
  return { container, button };
}

function restoringScope(container: HTMLElement, release: () => void = () => {}) {
  const scope = effectScope();
  scopes.push(scope);
  let handle: FocusRestoreHandle | undefined;
  scope.run(() => {
    onScopeDispose(release);
    onScopeDispose(() => handle?.restore());
    handle = useFocusRestore(() => container);
  });
  if (!handle) throw new Error('Expected a focus restore handle');
  return { scope, handle };
}

function nestedLayers() {
  const opener = makeButton('external opener');
  const first = layer('first close');
  const second = layer('second close');
  const outer = restoringScope(first.container);
  const inner = restoringScope(second.container);
  opener.focus();
  outer.handle.save();
  first.button.focus();
  inner.handle.save();
  second.button.focus();
  return { opener, first, second, outer, inner };
}

describe('useFocusRestore nested teardown and deferred focus', () => {
  it('restores the surviving opener after both scopes and their real DOM are removed', async () => {
    const current = nestedLayers();
    let locked = true;
    const redirect = (event: FocusEvent) => {
      if (
        locked &&
        event.target instanceof Node &&
        !current.second.container.contains(event.target)
      ) {
        current.second.button.focus();
      }
    };
    window.addEventListener('focusin', redirect);
    const release = () => {
      locked = false;
      window.removeEventListener('focusin', redirect);
    };
    try {
      current.outer.scope.stop();
      current.first.container.remove();
      expect(document.activeElement).toBe(current.second.button);
      release();
      current.inner.scope.stop();
      current.second.container.remove();
      await nextTick();
      expect(document.activeElement).toBe(current.opener);
    } finally {
      release();
    }
  });

  it('keeps the top layer focused when its parent disappears, then returns to the outer opener', async () => {
    const current = nestedLayers();
    const redirect = (event: FocusEvent) => {
      if (event.target instanceof Node && !current.second.container.contains(event.target)) {
        current.second.button.focus();
      }
    };
    window.addEventListener('focusin', redirect);
    try {
      current.outer.scope.stop();
      current.first.container.remove();
      await nextTick();
      expect(document.activeElement).toBe(current.second.button);
    } finally {
      window.removeEventListener('focusin', redirect);
    }
    current.inner.scope.stop();
    current.second.container.remove();
    await nextTick();
    expect(document.activeElement).toBe(current.opener);
  });

  it('skips a removed immediate target and uses its captured outer opener', () => {
    const current = nestedLayers();
    current.first.button.remove();
    current.inner.handle.restore();
    expect(document.activeElement).toBe(current.opener);
  });

  it('captures the nearest owning layer when multiple registered containers contain focus', () => {
    const opener = makeButton('outermost opener');
    const first = layer('outer trigger');
    const middle = layer('middle trigger');
    first.container.appendChild(middle.container);
    const child = layer('child close');
    const outer = restoringScope(first.container);
    const parent = restoringScope(middle.container);
    const inner = restoringScope(child.container);
    opener.focus();
    outer.handle.save();
    first.button.focus();
    parent.handle.save();
    middle.button.focus();
    inner.handle.save();
    child.button.focus();
    middle.button.remove();
    inner.handle.restore();
    expect(document.activeElement).toBe(first.button);
  });

  it('copies the return chain before its parent saves a new target', () => {
    const current = nestedLayers();
    const different = makeButton('different parent opener');
    different.focus();
    current.outer.handle.save();
    current.second.button.focus();
    current.first.button.remove();
    current.inner.handle.restore();
    expect(document.activeElement).toBe(current.opener);
  });

  function redirectedRestore() {
    const opener = makeButton('retry opener');
    const temporary = layer('temporary focus lock');
    const current = layer('current preview');
    const restore = restoringScope(current.container);
    opener.focus();
    restore.handle.save();
    current.button.focus();
    const redirect = () => temporary.button.focus();
    opener.addEventListener('focusin', redirect);
    restore.handle.restore();
    expect(document.activeElement).toBe(temporary.button);
    opener.removeEventListener('focusin', redirect);
    temporary.container.remove();
    expect(document.activeElement).toBe(document.body);
    return { opener, current, restore };
  }

  it('retries once after synchronous locks disappear and focus falls back to body', async () => {
    const current = redirectedRestore();
    await nextTick();
    expect(document.activeElement).toBe(current.opener);
    current.current.button.focus();
    current.restore.handle.restore();
    await nextTick();
    expect(document.activeElement).toBe(current.current.button);
  });

  it('does not take focus back after the user focuses another control before nextTick', async () => {
    redirectedRestore();
    const chosen = makeButton('user chosen control');
    chosen.focus();
    await nextTick();
    expect(document.activeElement).toBe(chosen);
  });

  it('does not retry when another layer starts opening before its content gains focus', async () => {
    redirectedRestore();
    const next = layer('next opening layer');
    const restore = restoringScope(next.container);
    restore.handle.save();
    await nextTick();
    expect(document.activeElement).toBe(document.body);
    restore.handle.focusContent();
    expect(document.activeElement).toBe(next.container);
  });

  it('a disposed helper no longer contributes an outer fallback to future layers', () => {
    const opener = makeButton('disposed opener');
    const first = layer('disposed layer');
    const outer = withRestore(first.container, {}, (handle) => handle);
    opener.focus();
    outer.result.save();
    outer.scope.stop();
    first.button.focus();
    const second = layer('later layer');
    const inner = restoringScope(second.container);
    inner.handle.save();
    second.button.focus();
    first.container.remove();
    inner.handle.restore();
    expect(document.activeElement).toBe(second.button);
  });
});
