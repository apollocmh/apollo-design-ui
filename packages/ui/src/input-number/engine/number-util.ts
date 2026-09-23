/**
 * 数值字符串工具 —— `@rc-component/input-number` 的 `utils/numberUtil` +
 * `@rc-component/mini-decimal` 的 `numberUtil` 合并自建版（H5：不依赖 rc-*）。
 *
 * 契约来源：`@rc-component/mini-decimal@1.1.4`（es/numberUtil.js 161 行）+
 * rc-input-number@1.6.2 的 `getDecupleSteps`。**按行为规格重写，不是逐行翻译**
 * （H2/H3）—— 正则与判定顺序逐字保留，因为它们就是行为本身：
 *
 * 1. `trimNumber` 的三条 replace 链（去小数尾 0 → 去孤立小数点 → 去整数前导 0）
 *    顺序不可换，否则 `1.100` → `1.1` 会变成 `1.1` 前多 0。
 * 2. `validateNumber` 三条正则各覆盖一种书写形态（11.28 / `1.` / `.1`）。
 * 3. `toFixed` 的进位走 `getMiniDecimal.add`（字符串十进制加法），**不是**
 *    `Number.toFixed` —— 后者在 0.5 边界受二进制浮点影响（`1.005.toFixed(2)`）。
 */

/** `supportUtil.js`：当前环境是否支持 BigInt。 */
export function supportBigInt(): boolean {
  return typeof BigInt === 'function';
}

/** `numberUtil.isEmpty`：空串 / null / undefined / 纯空白 ⇒ 空。 */
export function isEmptyValue(value: unknown): boolean {
  return (
    (!value && value !== 0 && !Number.isNaN(value)) || (typeof value === 'string' && !value.trim())
  );
}

export interface TrimNumberResult {
  negative: boolean;
  negativeStr: string;
  trimStr: string;
  integerStr: string;
  decimalStr: string;
  fullStr: string;
}

/** 把数字字符串修剪成规范形态（`0001.100` → `1.1`）。 */
export function trimNumber(numStr: string): TrimNumberResult {
  let str = numStr.trim();
  let negative = str.startsWith('-');
  if (negative) {
    str = str.slice(1);
  }
  str = str
    // 去小数尾 0：`1.000` → `1.`、`1.100` → `1.1`
    .replace(/(\.\d*[^0])0*$/, '$1')
    // 去孤立小数点：`1.` → `1`
    .replace(/\.0*$/, '')
    // 去整数前导 0：`0001` → `1`、`000.1` → `.1`
    .replace(/^0+/, '');
  if (str.startsWith('.')) {
    str = `0${str}`;
  }
  const trimStr = str || '0';
  const splitNumber = trimStr.split('.');
  const integerStr = splitNumber[0] || '0';
  const decimalStr = splitNumber[1] || '0';
  // `-0` 不是负数
  if (integerStr === '0' && decimalStr === '0') {
    negative = false;
  }
  const negativeStr = negative ? '-' : '';
  return {
    negative,
    negativeStr,
    trimStr,
    integerStr,
    decimalStr,
    fullStr: `${negativeStr}${trimStr}`,
  };
}

/** 科学计数法形态（`1e-9`）。 */
export function isE(number: unknown): boolean {
  const str = String(number);
  return !Number.isNaN(Number(str)) && str.includes('e');
}

interface ParsedScientific {
  decimal: string;
  digits: string;
  exponent: number;
  integer: string;
  negative: boolean;
}

/** 把 `1.23e-5` 拆成尾数与指数的可复用部分。 */
function parseScientificNotation(numStr: string): ParsedScientific {
  const parts = numStr.toLowerCase().split('e');
  const mantissa = parts[0] ?? '0';
  const exponent = parts[1] ?? '0';
  const negative = mantissa.startsWith('-');
  const unsignedMantissa = negative ? mantissa.slice(1) : mantissa;
  const mantissaParts = unsignedMantissa.split('.');
  const integer = mantissaParts[0] ?? '0';
  const decimal = mantissaParts[1] ?? '';
  const digits = `${integer}${decimal}`.replace(/^0+/, '') || '0';
  return { decimal, digits, exponent: Number(exponent), integer, negative };
}

/** 把科学计数法展开成普通小数字符串。 */
function expandScientificNotation(parsed: ParsedScientific): string {
  const { decimal, digits, exponent, integer, negative } = parsed;
  if (digits === '0') {
    return '0';
  }
  const integerDigits = integer.replace(/^0+/, '').length;
  const leadingDecimalZeros = (decimal.match(/^0*/) || [''])[0].length;
  const initialDecimalIndex = integerDigits || -leadingDecimalZeros;
  const decimalIndex = initialDecimalIndex + exponent;
  let expanded: string;
  if (decimalIndex <= 0) {
    expanded = `0.${'0'.repeat(-decimalIndex)}${digits}`;
  } else if (decimalIndex >= digits.length) {
    expanded = `${digits}${'0'.repeat(decimalIndex - digits.length)}`;
  } else {
    expanded = `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  }
  return `${negative ? '-' : ''}${expanded}`;
}

function getScientificPrecision(parsed: ParsedScientific): number {
  if (parsed.exponent >= 0) {
    return Math.max(0, parsed.decimal.length - parsed.exponent);
  }
  return Math.abs(parsed.exponent) + parsed.decimal.length;
}

/** 小数位数（`1e-9` → 9；可能丢精度的 legacy 行为，上游注释明说）。 */
export function getNumberPrecision(number: unknown): number {
  const numStr = String(number);
  if (isE(number)) {
    return getScientificPrecision(parseScientificNotation(numStr));
  }
  return numStr.includes('.') && validateNumber(numStr)
    ? numStr.length - numStr.indexOf('.') - 1
    : 0;
}

/** 数字（含科学计数法）→ `-xxx.yyy` 形态字符串。 */
export function num2str(number: number | string): string {
  let numStr = String(number);
  if (isE(number)) {
    const num = Number(number);
    if (num > Number.MAX_SAFE_INTEGER) {
      return String(supportBigInt() ? BigInt(numStr) : Number.MAX_SAFE_INTEGER);
    }
    if (num < Number.MIN_SAFE_INTEGER) {
      return String(supportBigInt() ? BigInt(numStr) : Number.MIN_SAFE_INTEGER);
    }
    const parsed = parseScientificNotation(numStr);
    const precision = getScientificPrecision(parsed);
    // 精度 >100 时 toFixed 会先炸，展开成普通字符串（上游注释：legacy 行为）
    numStr = precision > 100 ? expandScientificNotation(parsed) : num.toFixed(precision);
  }
  return trimNumber(numStr).fullStr;
}

/** 是否是可解析的数字（三种书写形态 + number 类型）。 */
export function validateNumber(num: unknown): boolean {
  if (typeof num === 'number') {
    return !Number.isNaN(num);
  }
  if (!num) {
    return false;
  }
  const str = String(num);
  return (
    // 正常形态：11.28
    /^\s*-?\d+(\.\d+)?\s*$/.test(str) ||
    // 小数点尾随：1.
    /^\s*-?\d+\.\s*$/.test(str) ||
    // 小数点开头：.1
    /^\s*-?\.\d+\s*$/.test(str)
  );
}

/**
 * `toFixed`：精度截取 + 四舍五入（`1.5 → 2` 方向，与 Number.toFixed 的银行家
 * 争议无关 —— 进位通过 Decimal 字符串加法完成）。
 *
 * @param cutOnly true 时只截不进（triggerValueUpdate 处理 toFixed 后重新越界的回退）
 */
export function toFixed(
  numStr: string,
  separatorStr: string,
  precision: number,
  cutOnly = false,
  // 循环依赖用延迟 import 不现实（同步调用链），改为注入：decimal.ts 传入自身工厂
  adder: (a: string, b: string) => string,
): string {
  if (numStr === '') {
    return '';
  }
  const { negativeStr, integerStr, decimalStr } = trimNumber(numStr);
  const precisionDecimalStr = `${separatorStr}${decimalStr}`;
  const numberWithoutDecimal = `${negativeStr}${integerStr}`;
  if (precision >= 0) {
    // 取 precision 位上的数字判断是否进位
    const advancedNum = Number(decimalStr[precision]);
    if (advancedNum >= 5 && !cutOnly) {
      const advancedDecimal = adder(
        numStr,
        `${negativeStr}0.${'0'.repeat(precision)}${10 - advancedNum}`,
      );
      return toFixed(advancedDecimal, separatorStr, precision, cutOnly, adder);
    }
    if (precision === 0) {
      return numberWithoutDecimal;
    }
    return `${numberWithoutDecimal}${separatorStr}${decimalStr
      .padEnd(precision, '0')
      .slice(0, precision)}`;
  }
  // precision < 0：不截断，只规范化
  if (precisionDecimalStr === '.0') {
    return numberWithoutDecimal;
  }
  return `${numberWithoutDecimal}${precisionDecimalStr}`;
}

/**
 * shift 键的 ×10 步数（`1 → 10`、`0.1 → 1`、`1.2 → 12`）。
 *
 * 契约来源：rc-input-number 的 `utils/numberUtil.js`（8 行，逐字行为）。
 */
export function getDecupleSteps(step: number | string): string {
  const stepStr = typeof step === 'number' ? num2str(step) : trimNumber(step).fullStr;
  const hasPoint = stepStr.includes('.');
  if (!hasPoint) {
    return `${step}0`;
  }
  return trimNumber(stepStr.replace(/(\d)\.(\d)/g, '$1$2.')).fullStr;
}
