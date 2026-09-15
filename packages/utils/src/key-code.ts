/**
 * `KeyCode` —— 键码常量与判定工具。
 *
 * 契约来源：`@rc-component/util/KeyCode`（antd 的 `table` / `typography` 使用）。
 *
 * ⚠️ 全部基于已废弃的 `KeyboardEvent.keyCode`，**不是** `event.key`。
 *    不能"现代化"成 `key`：`typography` 的可编辑文本用 `keyCode` 判定 Enter/Esc，
 *    `table` 用它判定方向键。改成 `key` 会在部分输入法/组合键场景下行为漂移。
 *
 * ⚠️ 与 rc-util 的一处**有意差异**（登记为 deviation，类型 INTENDED）：
 *    `isCharacterKey` 的原实现直接读 `window.navigator.userAgent`，在 SSR 或
 *    jsdom（`navigator` 被 mock 掉）下会抛错。我们的实现先判 `canUseDom()`，
 *    无 DOM 环境返回 `false`。语义差异只存在于"没有 DOM"的场景，
 *    而那种场景下"是不是字符键"本就没有意义。
 */

import canUseDom from './dom/can-use-dom';

const KeyCode = {
  MAC_ENTER: 3,
  BACKSPACE: 8,
  TAB: 9,
  /** NUMLOCK on FF/Safari Mac */
  NUM_CENTER: 12,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  ESC: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  PRINT_SCREEN: 44,
  INSERT: 45,
  DELETE: 46,
  ZERO: 48,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  FIVE: 53,
  SIX: 54,
  SEVEN: 55,
  EIGHT: 56,
  NINE: 57,
  QUESTION_MARK: 63,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  META: 91,
  WIN_KEY_RIGHT: 92,
  CONTEXT_MENU: 93,
  NUM_ZERO: 96,
  NUM_ONE: 97,
  NUM_TWO: 98,
  NUM_THREE: 99,
  NUM_FOUR: 100,
  NUM_FIVE: 101,
  NUM_SIX: 102,
  NUM_SEVEN: 103,
  NUM_EIGHT: 104,
  NUM_NINE: 105,
  NUM_MULTIPLY: 106,
  NUM_PLUS: 107,
  NUM_MINUS: 109,
  NUM_PERIOD: 110,
  NUM_DIVISION: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUMLOCK: 144,
  SEMICOLON: 186,
  DASH: 189,
  EQUALS: 187,
  COMMA: 188,
  PERIOD: 190,
  SLASH: 191,
  APOSTROPHE: 192,
  SINGLE_QUOTE: 222,
  OPEN_SQUARE_BRACKET: 219,
  BACKSLASH: 220,
  CLOSE_SQUARE_BRACKET: 221,
  WIN_KEY: 224,
  /** Firefox (Gecko) fires this for the meta key instead of 91 */
  MAC_FF_META: 224,
  WIN_IME: 229,

  /**
   * 该按键是否会输入文本（用于决定"是否应该把按键交给输入框"）。
   *
   * 组合键（Alt 无 Ctrl / Meta）与功能键 F1–F12 不会输入文本；
   * 另有一批"即使配合修饰键也无害"的键（方向键、Home/End、Esc…）返回 `false`。
   */
  isTextModifyingKeyEvent(e: KeyboardEvent): boolean {
    const { keyCode } = e;
    if (
      (e.altKey && !e.ctrlKey) ||
      e.metaKey ||
      (keyCode >= KeyCode.F1 && keyCode <= KeyCode.F12)
    ) {
      return false;
    }
    switch (keyCode) {
      case KeyCode.ALT:
      case KeyCode.CAPS_LOCK:
      case KeyCode.CONTEXT_MENU:
      case KeyCode.CTRL:
      case KeyCode.DOWN:
      case KeyCode.END:
      case KeyCode.ESC:
      case KeyCode.HOME:
      case KeyCode.INSERT:
      case KeyCode.LEFT:
      case KeyCode.MAC_FF_META:
      case KeyCode.META:
      case KeyCode.NUMLOCK:
      case KeyCode.NUM_CENTER:
      case KeyCode.PAGE_DOWN:
      case KeyCode.PAGE_UP:
      case KeyCode.PAUSE:
      case KeyCode.PRINT_SCREEN:
      case KeyCode.RIGHT:
      case KeyCode.SHIFT:
      case KeyCode.UP:
      case KeyCode.WIN_KEY:
      case KeyCode.WIN_KEY_RIGHT:
        return false;
      default:
        return true;
    }
  },

  /**
   * 该键码是否对应一个"字符"。
   *
   * Safari 对非拉丁字符会给出 `keyCode === 0`，所以 WebKit 下 0 也算字符键。
   */
  isCharacterKey(keyCode: number): boolean {
    if (keyCode >= KeyCode.ZERO && keyCode <= KeyCode.NINE) return true;
    if (keyCode >= KeyCode.NUM_ZERO && keyCode <= KeyCode.NUM_MULTIPLY) return true;
    if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z) return true;

    // 见文件头注释：rc-util 在这里直接读 window.navigator，我们加了守卫。
    // ⚠️ `?? -1` 是必需的：若只写 `window.navigator?.userAgent?.indexOf('WebKit') !== -1`，
    //    navigator 不存在时左侧是 `undefined`，`undefined !== -1` 为 **true** —— 守卫反而失效。
    const webkitIndex = canUseDom() ? (window.navigator?.userAgent?.indexOf('WebKit') ?? -1) : -1;
    if (webkitIndex !== -1 && keyCode === 0) {
      return true;
    }

    switch (keyCode) {
      case KeyCode.SPACE:
      case KeyCode.QUESTION_MARK:
      case KeyCode.NUM_PLUS:
      case KeyCode.NUM_MINUS:
      case KeyCode.NUM_PERIOD:
      case KeyCode.NUM_DIVISION:
      case KeyCode.SEMICOLON:
      case KeyCode.DASH:
      case KeyCode.EQUALS:
      case KeyCode.COMMA:
      case KeyCode.PERIOD:
      case KeyCode.SLASH:
      case KeyCode.APOSTROPHE:
      case KeyCode.SINGLE_QUOTE:
      case KeyCode.OPEN_SQUARE_BRACKET:
      case KeyCode.BACKSLASH:
      case KeyCode.CLOSE_SQUARE_BRACKET:
        return true;
      default:
        return false;
    }
  },

  /** 事件目标是否是可编辑控件（输入框 / 文本域 / 下拉 / contentEditable）。 */
  isEditableTarget(e: KeyboardEvent): boolean {
    const { target } = e;
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const { tagName } = target;
    if (
      tagName === 'INPUT' ||
      tagName === 'TEXTAREA' ||
      tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return true;
    }
    return false;
  },
};

export default KeyCode;
