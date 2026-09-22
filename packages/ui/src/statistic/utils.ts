/**
 * Statistic 的计时格式化工具。
 *
 * 契约来源：antd 6.6.4 的 `es/statistic/utils.js` —— **机械移植**（变量名与
 * 求值顺序逐行对齐），timeUnits 的顺序 Y→M→D→H→m→s→S 是补零契约的一部分。
 */

import type { CountdownFormatConfig, ValueType } from './interface';

/** 时间单位表（毫秒），与 antd 逐字一致。 */
const TIME_UNITS: [string, number][] = [
  ['Y', 1000 * 60 * 60 * 24 * 365], // years
  ['M', 1000 * 60 * 60 * 24 * 30], // months
  ['D', 1000 * 60 * 60 * 24], // days
  ['H', 1000 * 60 * 60], // hours
  ['m', 1000 * 60], // minutes
  ['s', 1000], // seconds
  ['S', 1], // milliseconds
];

/**
 * 把时长格式化为字符串。
 *
 * `[...]` 段是转义文本（原样保留、不参与占位替换）；其余按 `X+` 贪婪匹配，
 * 按占位符位数对数值补零（`HH:mm:ss` → `59:28:09`）。
 */
export function formatTimeStr(duration: number, format: string): string {
  let leftDuration = duration;
  const escapeRegex = /\[[^\]]*]/g;
  const keepList = (format.match(escapeRegex) || []).map((str) => str.slice(1, -1));
  const templateText = format.replace(escapeRegex, '[]');
  const replacedText = TIME_UNITS.reduce((current, [name, unit]) => {
    if (current.includes(name)) {
      const value = Math.floor(leftDuration / unit);
      leftDuration -= value * unit;
      return current.replace(new RegExp(`${name}+`, 'g'), (match) => {
        const len = match.length;
        return value.toString().padStart(len, '0');
      });
    }
    return current;
  }, templateText);
  let index = 0;
  return replacedText.replace(escapeRegex, () => {
    const match = keepList[index];
    index += 1;
    // noUncheckedIndexedAccess：转义段与捕获一一对应，越界时原样保留（''）
    return match ?? '';
  });
}

/** Timer 的每帧格式化：countdown 取剩余（下限 0）、countup 取已过。 */
export function formatCounter(
  value: ValueType,
  config: CountdownFormatConfig,
  down: boolean,
): string {
  const { format = '' } = config;
  const target = new Date(value).getTime();
  const current = Date.now();
  const diff = down ? Math.max(target - current, 0) : Math.max(current - target, 0);
  return formatTimeStr(diff, format);
}
