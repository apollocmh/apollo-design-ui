/**
 * Esc 关闭的**层级栈**。
 *
 * 契约来源：`@rc-component/portal@2.2.1/es/useEscKeyDown.js`
 * （`@rc-component/trigger@3.10.1` 声明 `^2.2.1`）。
 * 逐条对照见 `docs/foundation/overlay-contract.md` §3.11。
 *
 * ---------------------------------------------------------------------------
 * ⭐ 这段代码不在 trigger 里
 * ---------------------------------------------------------------------------
 *
 * `@rc-component/trigger` 3.10.1 的产物里**没有任何 `Escape` / `keydown` 字样**
 * （全 `es/` 目录 grep 为空）。Esc 的监听与顶层判定在 rc-portal，trigger 只在
 * `index.js:232-236` 消费回调：
 *
 * ```js
 * function onEsc({ top }) { if (top) triggerOpen(false); }
 * ```
 *
 * 也就是说：**本包承接的是 rc-portal 的那部分能力**，不是 trigger 的 ——
 * 因为 `portal-contract.md` §3.6 已把 Esc 排除出 `@apollo-design/portal`
 * （Modal 的 rationale：「焦点陷阱 + 滚动锁定 + Esc」属交互语义）。
 * 裁决见契约 §8 P2。
 *
 * ---------------------------------------------------------------------------
 * 三条必须照抄的行为
 * ---------------------------------------------------------------------------
 *
 * 1. 入栈顺序 = **开启顺序** ⇒ 栈顶 = 最后开的浮层。
 * 2. **栈内每个成员都会收到回调**，靠 `top` 区分 —— 不是"只通知栈顶"。
 * 3. **IME 锁**：`compositionend` 之后 200ms 内的 Esc 被丢弃。
 *    中文输入法候选框的 Esc 不应该关掉弹层。
 */

/** 输入法组合结束后多久内的 Esc 视为"输入法的 Esc"。rc 的 `IME_LOCK_DURATION`。 */
export const IME_LOCK_DURATION = 200;

/** 只需要这两个字段，便于测试构造假事件（jsdom 的 KeyboardEvent 也满足）。 */
export interface EscEventLike {
  readonly key: string;
  readonly isComposing?: boolean;
}

export interface EscCallbackInfo {
  /** 当前浮层是否是**最后开启**的那个。只有它为 `true` 时才该真的关闭。 */
  readonly top: boolean;
  readonly event: EscEventLike;
}

export interface EscStackEntry {
  readonly id: string;
  readonly onEsc: (info: EscCallbackInfo) => void;
}

export interface EscStackOptions {
  /** 时间源。测试用 fake timers 时注入。 */
  now?: () => number;
  /** 事件宿主。`null` 表示 SSR / 无 DOM —— 此时 `attach()` 是空操作。 */
  win?: Window | null;
}

export interface EscStack {
  /** 入栈（同 id 幂等，与 rc 的 `ensure` 一致）。 */
  push: (entry: EscStackEntry) => void;
  /** 出栈。 */
  remove: (id: string) => void;
  /** 派发一次 Esc。**从栈顶到栈底全部通知**。 */
  dispatch: (event: EscEventLike) => void;
  /** 挂/摘全局监听。栈空时才该摘（rc 的 `detachGlobalEventListeners`）。 */
  attach: () => void;
  detach: () => void;
  /** 清空。测试隔离用 —— 栈是模块级单例，用例之间必须重置。 */
  reset: () => void;
  readonly size: number;
  readonly attached: boolean;
}

export function createEscStack(options: EscStackOptions = {}): EscStack {
  const { now = () => Date.now(), win = null } = options;

  let stack: EscStackEntry[] = [];
  let lastCompositionEndTime = 0;
  let listening = false;

  const handleKeyDown = (event: EscEventLike): void => {
    if (event.key !== 'Escape' || event.isComposing) {
      return;
    }
    if (now() - lastCompositionEndTime < IME_LOCK_DURATION) {
      return;
    }
    const len = stack.length;
    // 从栈顶到栈底，**每个**都通知
    for (let i = len - 1; i >= 0; i -= 1) {
      const entry = stack[i];
      if (entry) {
        entry.onEsc({ top: i === len - 1, event });
      }
    }
  };

  const onCompositionEnd = (): void => {
    lastCompositionEndTime = now();
  };

  /** 桥接 `addEventListener`：参数类型从 `Event` 窄化成 Esc 事件。 */
  const onKeyDown = (rawEvent: Event): void => {
    handleKeyDown(rawEvent as unknown as EscEventLike);
  };

  return {
    push(entry) {
      if (!stack.some((item) => item.id === entry.id)) {
        stack.push(entry);
      }
    },

    remove(id) {
      stack = stack.filter((item) => item.id !== id);
    },

    dispatch(event) {
      handleKeyDown(event);
    },

    attach() {
      if (listening || !win) {
        return;
      }
      win.addEventListener('keydown', onKeyDown);
      win.addEventListener('compositionend', onCompositionEnd);
      listening = true;
    },

    detach() {
      if (!listening || !win) {
        return;
      }
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('compositionend', onCompositionEnd);
      listening = false;
    },

    reset() {
      stack = [];
      lastCompositionEndTime = 0;
    },

    get size() {
      return stack.length;
    },

    get attached() {
      return listening;
    },
  };
}
