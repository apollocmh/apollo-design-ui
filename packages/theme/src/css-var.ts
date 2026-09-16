import type { AliasToken } from './types';

/** 默认前缀。已裁决（prefix-cls-default = A）：默认 `apollo`，可覆盖为 `ant`。 */
export const DEFAULT_CSS_VAR_PREFIX = 'apollo';

/**
 * 这些 token 虽然是 number，但**不加 px**。
 *
 * 清单逐字来自 antd 6.6.4 的 `es/theme/useToken.js`。改动它会让 CSS 变量值带上错误的单位，
 * 而且这种错误在视觉上是"看起来差不多"的 —— 所以这里写死，不接受调用方覆盖。
 */
export const UNITLESS: Record<string, true> = {
  lineHeight: true,
  lineHeightSM: true,
  lineHeightLG: true,
  lineHeightHeading1: true,
  lineHeightHeading2: true,
  lineHeightHeading3: true,
  lineHeightHeading4: true,
  lineHeightHeading5: true,
  opacityLoading: true,
  fontWeightStrong: true,
  zIndexPopupBase: true,
  zIndexBase: true,
  opacityImage: true,
};

/** 不产出 CSS 变量的 token（antd 的 `ignore`） */
export const IGNORE: Record<string, true> = {
  motionBase: true,
  motionUnit: true,
};

/** 保留原值、不转成 var() 引用的 token（antd 的 `preserve`，即断点值） */
export const PRESERVE: Record<string, true> = {
  screenXS: true,
  screenXSMin: true,
  screenXSMax: true,
  screenSM: true,
  screenSMMin: true,
  screenSMMax: true,
  screenMD: true,
  screenMDMin: true,
  screenMDMax: true,
  screenLG: true,
  screenLGMin: true,
  screenLGMax: true,
  screenXL: true,
  screenXLMin: true,
  screenXLMax: true,
  screenXXL: true,
  screenXXLMin: true,
  screenXXLMax: true,
  screenXXXL: true,
  screenXXXLMin: true,
};

/**
 * token 名 → CSS 变量名。
 *
 * 三段 replace 的顺序不能调换，也不能合并成一个"更聪明"的正则。
 * 逐字来自 `@ant-design/cssinjs` 的 `util/css-variables.js`：
 *
 *   1. `([a-z0-9])([A-Z])`   → 常规 camelCase 边界     colorPrimary → color-Primary
 *   2. `([A-Z]+)([A-Z][a-z0-9]+)` → 连续大写后的边界   XSMax → XS-Max
 *   3. `([a-z])([A-Z0-9])`   → 小写接单个大写或数字     sizeLG → size-LG
 *
 * 结果整体小写。例：`borderRadiusLG` → `--apollo-border-radius-lg`。
 * CSS 变量名是**对外契约**（用户会写 `var(--apollo-*)` 覆盖样式），所以必须与 antd 同构。
 */
export function token2CSSVar(token: string, prefix = DEFAULT_CSS_VAR_PREFIX): string {
  return `--${prefix ? `${prefix}-` : ''}${token}`
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .toLowerCase();
}

export interface TransformResult {
  /** CSS 变量名 → 值（number 且非 unitless 的会带 px） */
  vars: Record<string, string>;
  /**
   * token 名 → `var(--xxx)`。
   * `preserve` 命中的 token 保留**原始类型**（与 cssinjs 一致：断点值仍是 number，
   * 因为组件要拿它做 JS 里的比较，不能变成字符串）。
   */
  refs: Record<string, string | number>;
}

/**
 * 把 token 对象拆成「变量声明表」与「引用表」。
 *
 * 只处理 string / number —— boolean（wireframe / motion / focusOutline）不产出变量，
 * 因为 CSS 里没有对应的消费方式，且它们只影响派生过程。
 */
export function transformToken(
  token: AliasToken,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): TransformResult {
  const vars: Record<string, string> = {};
  const refs: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(token)) {
    if (PRESERVE[key]) {
      refs[key] = value as string | number;
      continue;
    }
    if ((typeof value === 'string' || typeof value === 'number') && !IGNORE[key]) {
      const cssVar = token2CSSVar(key, prefix);
      vars[cssVar] = typeof value === 'number' && !UNITLESS[key] ? `${value}px` : String(value);
      refs[key] = `var(${cssVar})`;
    }
  }

  return { vars, refs };
}

/**
 * 零运行时路径：产出一段可直接落盘的 CSS。
 *
 * 例：`getCSSVarDeclarations(token)` → `:root{--apollo-color-primary:#1677ff;...}`
 *     `getCSSVarDeclarations(token, { selector: '[data-apollo-theme=dark]' })` → 作用域覆盖
 */
export function getCSSVarDeclarations(
  token: AliasToken,
  options: { prefix?: string; selector?: string } = {},
): string {
  const { vars } = transformToken(token, options.prefix ?? DEFAULT_CSS_VAR_PREFIX);
  const selector = options.selector ?? ':root';
  const body = Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join('');
  return `${selector}{${body}}`;
}

/**
 * 运行时注入路径（开放决策 zero-runtime-mode = B：零运行时是默认，但不是唯一）。
 *
 * 与静态路径**共用同一套变量命名**（transformToken），否则两条路径会分叉 ——
 * 静态 CSS 写 `--apollo-x`、运行时写别的名字，组件样式就会拿到空值。
 *
 * 实现方式走 `CSSStyleDeclaration.setProperty`，不引入任何 CSS-in-JS 运行时：
 * 本包不生成样式表、不生成 hash 类名，只写自定义属性。
 */
export interface CSSVarScope {
  /** 把 token 写入目标元素（重复调用覆盖同名变量，不残留） */
  apply: (token: AliasToken) => void;
  /** 移除本 scope 曾经写入的全部变量 */
  remove: () => void;
  /** 当前已写入的变量名 */
  readonly keys: string[];
}

export function createCSSVarScope(el: HTMLElement, prefix = DEFAULT_CSS_VAR_PREFIX): CSSVarScope {
  let written: string[] = [];

  return {
    apply(token: AliasToken): void {
      const { vars } = transformToken(token, prefix);
      for (const [name, value] of Object.entries(vars)) {
        el.style.setProperty(name, value);
      }
      // 上一次写入、这一次不再出现的变量要清掉（否则切回 default 会残留 dark 的值）
      for (const name of written) {
        if (!(name in vars)) el.style.removeProperty(name);
      }
      written = Object.keys(vars);
    },
    remove(): void {
      for (const name of written) el.style.removeProperty(name);
      written = [];
    },
    get keys(): string[] {
      return [...written];
    },
  };
}

/** 一次性写入（无后续移除需求的场景，如 SSR 后的客户端挂载） */
export function applyCSSVar(
  el: HTMLElement,
  token: AliasToken,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): void {
  createCSSVarScope(el, prefix).apply(token);
}
