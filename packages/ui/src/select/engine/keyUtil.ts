/**
 * rc-select `utils/keyUtil.js` 的 Vue 版。
 *
 * `isValidateOpenKey`：按下这个键**应该打开下拉**（rc 把它挂在搜索输入上）。
 * 排除的是「系统功能键 / 方向键 / F1–F12」，因为它们是导航而不是输入。
 *
 * ⚠️ `DOWN` 故意**不排除**（rc 源码的注释就是注释掉的）：关闭态按下箭头要能打开下拉。
 */

import { KeyCode } from '@apollo-design/utils';

const IGNORED: number[] = [
  // 系统功能键
  KeyCode.ESC,
  KeyCode.SHIFT,
  KeyCode.BACKSPACE,
  KeyCode.TAB,
  KeyCode.WIN_KEY,
  KeyCode.ALT,
  KeyCode.META,
  KeyCode.WIN_KEY_RIGHT,
  KeyCode.CTRL,
  KeyCode.SEMICOLON,
  KeyCode.EQUALS,
  KeyCode.CAPS_LOCK,
  KeyCode.CONTEXT_MENU,
  // 方向键（UP 排除；DOWN 不排除 —— 见文件头）
  KeyCode.UP,
  KeyCode.LEFT,
  KeyCode.RIGHT,
  // F1–F12
  KeyCode.F1,
  KeyCode.F2,
  KeyCode.F3,
  KeyCode.F4,
  KeyCode.F5,
  KeyCode.F6,
  KeyCode.F7,
  KeyCode.F8,
  KeyCode.F9,
  KeyCode.F10,
  KeyCode.F11,
  KeyCode.F12,
];

export function isValidateOpenKey(currentKeyCode: number | undefined): boolean {
  // Undefined for Edge bug: https://github.com/ant-design/ant-design/issues/51292
  if (!currentKeyCode) return false;
  return !IGNORED.includes(currentKeyCode);
}
