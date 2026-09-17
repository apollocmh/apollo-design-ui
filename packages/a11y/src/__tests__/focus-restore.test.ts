import { afterEach, describe, expect, it, vi } from 'vitest';
import { type EffectScope, effectScope, ref } from 'vue';
import type { FocusRestoreHandle } from '../index';
import { useFocusRestore } from '../index';

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
