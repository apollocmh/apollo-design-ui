/**
 * Decimal —— 任意精度十进制数（`@rc-component/mini-decimal` 的自建等价物）。
 *
 * 契约来源：`@rc-component/mini-decimal@1.1.4` 的 `BigIntDecimal.js`（175 行）+
 * `NumberDecimal.js`（115 行）+ `MiniDecimal.js`（49 行）。**按行为规格重写**：
 *
 * - BigIntDecimal 是主力：整数/小数部分分别存 BigInt，加法通过小数位对齐后的
 *   BigInt 运算完成 —— 无浮点误差（`0.1 + 0.2 = 0.3`）。
 * - NumberDecimal 是 BigInt 不可用环境的回退（现代浏览器全支持，仅保底）。
 * - `toString(true)`（safe）返回修剪后的字符串；`toString(false)` 返回 origin
 *   —— 后者是 flushInputValue 处理「非法输入回退」的通道，不能丢。
 * - `equals` 的判据两侧不同：BigInt 比 toString 串、Number 比 toNumber 值 ——
 *   对 BigIntDecimal 来说 `0` 与 `0.0` 同串等价，行为一致。
 */

import {
  getNumberPrecision,
  isE,
  isEmptyValue,
  num2str,
  supportBigInt,
  toFixed,
  trimNumber,
  validateNumber,
} from './number-util';

/** Decimal 的公共行为面（MiniDecimal 的返回类型）。 */
export interface Decimal {
  /** 原始输入字符串。 */
  readonly origin: string;
  negate(): Decimal;
  add(value: Decimal | number | string): Decimal;
  multi(value: Decimal | number | string): Decimal;
  isEmpty(): boolean;
  isNaN(): boolean;
  isInvalidate(): boolean;
  equals(target: Decimal | undefined | null): boolean;
  lessEquals(target: Decimal): boolean;
  toNumber(): number;
  toString(safe?: boolean): string;
}

// ============================ BigIntDecimal ============================

class BigIntDecimal implements Decimal {
  origin = '';
  private negative: boolean | undefined;
  private integer: bigint | undefined;
  private decimal: bigint | undefined;
  /** BigInt 会把 `0009` 变成 `9`，需要记录小数长度。 */
  private decimalLen: number | undefined;
  private empty: boolean | undefined;
  private nan: boolean | undefined;

  constructor(value: unknown) {
    if (isEmptyValue(value)) {
      this.empty = true;
      return;
    }
    this.origin = String(value);
    // 与 Number 的转换行为对齐：`'-'` 和 NaN 都不是数
    if (value === '-') {
      this.nan = true;
      return;
    }
    let mergedValue: unknown = value;
    if (isE(mergedValue)) {
      mergedValue = Number(mergedValue);
    }
    mergedValue = typeof mergedValue === 'string' ? mergedValue : num2str(mergedValue as number);
    if (validateNumber(mergedValue)) {
      const trimRet = trimNumber(mergedValue as string);
      this.negative = trimRet.negative;
      const numbers = trimRet.trimStr.split('.');
      this.integer = BigInt(numbers[0] ?? '0');
      const decimalStr = numbers[1] || '0';
      this.decimal = BigInt(decimalStr);
      this.decimalLen = decimalStr.length;
    } else {
      this.nan = true;
    }
  }

  private getMark(): string {
    return this.negative ? '-' : '';
  }

  private getIntegerStr(): string {
    return (this.integer ?? 0n).toString();
  }

  private getDecimalStr(): string {
    return (this.decimal ?? 0n).toString().padStart(this.decimalLen ?? 0, '0');
  }

  /** 对齐到相同小数长度后取 BigInt（`12.3` 在 len=3 时 → `12300`）。 */
  private alignDecimal(decimalLength: number): bigint {
    const str = `${this.getMark()}${this.getIntegerStr()}${this.getDecimalStr().padEnd(
      decimalLength,
      '0',
    )}`;
    return BigInt(str);
  }

  negate(): Decimal {
    const clone = new BigIntDecimal(this.toString());
    clone.negative = !clone.negative;
    return clone;
  }

  private cal(
    offset: BigIntDecimal,
    calculator: (a: bigint, b: bigint) => bigint,
    calDecimalLen: (len: number) => number,
  ): BigIntDecimal {
    const maxDecimalLength = Math.max(this.getDecimalStr().length, offset.getDecimalStr().length);
    const myAlignedDecimal = this.alignDecimal(maxDecimalLength);
    const offsetAlignedDecimal = offset.alignDecimal(maxDecimalLength);
    const valueStr = calculator(myAlignedDecimal, offsetAlignedDecimal).toString();
    const nextDecimalLength = calDecimalLen(maxDecimalLength);
    // 结果串要补足到 nextDecimalLength+1 位（含符号位），否则切片越界解析失败
    const { negativeStr, trimStr } = trimNumber(valueStr);
    const hydrateValueStr = `${negativeStr}${trimStr.padStart(nextDecimalLength + 1, '0')}`;
    return new BigIntDecimal(
      `${hydrateValueStr.slice(0, -nextDecimalLength)}.${hydrateValueStr.slice(-nextDecimalLength)}`,
    );
  }

  add(value: Decimal | number | string): Decimal {
    if (this.isInvalidate()) {
      return new BigIntDecimal(value);
    }
    const offset = new BigIntDecimal(value);
    if (offset.isInvalidate()) {
      return this;
    }
    return this.cal(
      offset,
      (num1, num2) => num1 + num2,
      (len) => len,
    );
  }

  multi(value: Decimal | number | string): Decimal {
    const target = new BigIntDecimal(value);
    if (this.isInvalidate() || target.isInvalidate()) {
      return new BigIntDecimal(NaN);
    }
    return this.cal(
      target,
      (num1, num2) => num1 * num2,
      (len) => len * 2,
    );
  }

  isEmpty(): boolean {
    return this.empty === true;
  }

  isNaN(): boolean {
    return this.nan === true;
  }

  isInvalidate(): boolean {
    return this.isEmpty() || this.isNaN();
  }

  equals(target: Decimal | undefined | null): boolean {
    return this.toString() === (target === null || target === undefined ? '' : target.toString());
  }

  lessEquals(target: Decimal): boolean {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }

  toNumber(): number {
    if (this.isNaN()) {
      return NaN;
    }
    return Number(this.toString());
  }

  toString(safe = true): string {
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }
    return trimNumber(`${this.getMark()}${this.getIntegerStr()}.${this.getDecimalStr()}`).fullStr;
  }
}

// ============================ NumberDecimal ============================

class NumberDecimal implements Decimal {
  origin = '';
  private number: number | undefined;
  private empty: boolean | undefined;

  constructor(value: unknown) {
    if (isEmptyValue(value)) {
      this.empty = true;
      return;
    }
    this.origin = String(value);
    this.number = Number(value);
  }

  negate(): Decimal {
    return new NumberDecimal(-this.toNumber());
  }

  add(value: Decimal | number | string): Decimal {
    if (this.isInvalidate()) {
      return new NumberDecimal(value);
    }
    const target = Number(value);
    if (Number.isNaN(target)) {
      return this;
    }
    const number = (this.number ?? 0) + target;
    // 超安全整数直接钳（legacy 行为，BigIntDecimal 才有真精度）
    if (number > Number.MAX_SAFE_INTEGER) {
      return new NumberDecimal(Number.MAX_SAFE_INTEGER);
    }
    if (number < Number.MIN_SAFE_INTEGER) {
      return new NumberDecimal(Number.MIN_SAFE_INTEGER);
    }
    const maxPrecision = Math.max(getNumberPrecision(this.number), getNumberPrecision(target));
    return new NumberDecimal(number.toFixed(maxPrecision));
  }

  multi(value: Decimal | number | string): Decimal {
    const target = Number(value);
    if (this.isInvalidate() || Number.isNaN(target)) {
      return new NumberDecimal(NaN);
    }
    const number = (this.number ?? 0) * target;
    if (number > Number.MAX_SAFE_INTEGER) {
      return new NumberDecimal(Number.MAX_SAFE_INTEGER);
    }
    if (number < Number.MIN_SAFE_INTEGER) {
      return new NumberDecimal(Number.MIN_SAFE_INTEGER);
    }
    const maxPrecision = Math.max(getNumberPrecision(this.number), getNumberPrecision(target));
    return new NumberDecimal(number.toFixed(maxPrecision));
  }

  isEmpty(): boolean {
    return this.empty === true;
  }

  isNaN(): boolean {
    return Number.isNaN(this.number);
  }

  isInvalidate(): boolean {
    return this.isEmpty() || this.isNaN();
  }

  equals(target: Decimal | undefined | null): boolean {
    return this.toNumber() === (target === null || target === undefined ? NaN : target.toNumber());
  }

  lessEquals(target: Decimal): boolean {
    return this.add(target.negate().toString()).toNumber() <= 0;
  }

  toNumber(): number {
    return this.number as number;
  }

  toString(safe = true): string {
    if (!safe) {
      return this.origin;
    }
    if (this.isInvalidate()) {
      return '';
    }
    if (isE(this.number) && getNumberPrecision(this.number) > 100) {
      return String(this.number);
    }
    return num2str(this.number as number);
  }
}

// ============================== 工厂 ==============================

/** BigInt 可用 ⇒ BigIntDecimal（真精度）；否则 NumberDecimal（保底）。 */
export function getMiniDecimal(value: unknown): Decimal {
  if (supportBigInt()) {
    return new BigIntDecimal(value);
  }
  return new NumberDecimal(value);
}

/**
 * 供 `toFixed` 进位用的字符串加法器（避免 number-util ↔ decimal 循环依赖：
 * toFixed 的进位通过「原数 + 0.0…5」完成，工厂注入而非互相 import）。
 */
const decimalAdd = (a: string, b: string): string => getMiniDecimal(a).add(b).toString();

/**
 * toFixed 的完整形态（进位用 Decimal 字符串加法，见 number-util 的 adder 注入说明）。
 * InputNumber 全部调用走这里，不直接用五参底座。
 */
export function toFixedDecimal(
  numStr: string,
  precision: number,
  separatorStr = '.',
  cutOnly = false,
): string {
  return toFixed(numStr, separatorStr, precision, cutOnly, decimalAdd);
}
