import type { AliasToken } from './types';

/** 共享变量默认前缀；自定义前缀需由对应样式消费。 */
export const DEFAULT_CSS_VAR_PREFIX = 'apollo';

/**
 * 这些 token 虽然是 number，但**不加 px**。
 *
 * 初始清单参考 antd 6.6.4 的 `es/theme/useToken.js`；单位由当前 Token 契约决定。
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
 * CSS 变量名是对外契约，静态 CSS 和运行时注入必须使用同一名称。
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
  token: Partial<AliasToken>,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): TransformResult {
  const vars: Record<string, string> = {};
  const refs: Array<[string, string | number]> = [];

  for (const [key, value] of Object.entries(token)) {
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (Object.hasOwn(PRESERVE, key)) {
      refs.push([key, value]);
      continue;
    }
    if (!Object.hasOwn(IGNORE, key)) {
      const cssVar = token2CSSVar(key, prefix);
      vars[cssVar] =
        typeof value === 'number' && !Object.hasOwn(UNITLESS, key) ? `${value}px` : String(value);
      refs.push([key, `var(${cssVar})`]);
    }
  }

  return { vars, refs: Object.fromEntries(refs) };
}

/**
 * 零运行时路径：产出一段可直接落盘的 CSS。
 *
 * 例：`getCSSVarDeclarations(token)` → `:root{--apollo-color-primary:#1677ff;...}`
 *     `getCSSVarDeclarations(token, { selector: '[data-apollo-theme=dark]' })` → 作用域覆盖
 */
export function getCSSVarDeclarations(
  token: Partial<AliasToken>,
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
  apply: (token: Partial<AliasToken>) => void;
  /** 释放本 scope 的变量，恢复仍活跃的 scope 或原有 inline 值 */
  remove: () => void;
  /** 当前已写入的变量名 */
  readonly keys: string[];
}

interface InlineValue {
  value: string;
  priority: string;
}

interface OwnedVariable {
  base: InlineValue;
  lastWritten: InlineValue;
  visible: boolean;
  owners: Map<symbol, string>;
}

// DOM ownership is weakly held; releasing the last owner also drops its variable entry.
const ownedVariables = new WeakMap<HTMLElement | SVGElement, Map<string, OwnedVariable>>();

function readInline(el: HTMLElement | SVGElement, name: string): InlineValue {
  return { value: el.style.getPropertyValue(name), priority: el.style.getPropertyPriority(name) };
}

function sameInline(first: InlineValue, second: InlineValue): boolean {
  return first.value === second.value && first.priority === second.priority;
}

function writeInline(el: HTMLElement | SVGElement, name: string, inline: InlineValue): void {
  if (inline.value) el.style.setProperty(name, inline.value, inline.priority);
  else el.style.removeProperty(name);
}

function claimVariable(
  el: HTMLElement | SVGElement,
  name: string,
  owner: symbol,
  value: string,
): void {
  let variables = ownedVariables.get(el);
  if (!variables) {
    variables = new Map();
    ownedVariables.set(el, variables);
  }
  const current = readInline(el, name);
  let variable = variables.get(name);
  if (!variable) {
    variable = { base: current, lastWritten: current, visible: false, owners: new Map() };
    variables.set(name, variable);
  } else if (!variable.visible || !sameInline(current, variable.lastWritten)) {
    // A later external/one-shot write becomes the value restored after all owners leave.
    variable.base = current;
  }
  variable.owners.delete(owner);
  variable.owners.set(owner, value);
  writeInline(el, name, { value, priority: '' });
  variable.lastWritten = readInline(el, name);
  variable.visible = true;
}

function releaseVariable(el: HTMLElement | SVGElement, name: string, owner: symbol): void {
  const variables = ownedVariables.get(el);
  const variable = variables?.get(name);
  if (!variables || !variable?.owners.delete(owner)) return;

  const current = readInline(el, name);
  if (variable.visible && sameInline(current, variable.lastWritten)) {
    const previous = Array.from(variable.owners.values()).at(-1);
    const next = previous === undefined ? variable.base : { value: previous, priority: '' };
    if (!sameInline(current, next)) writeInline(el, name, next);
    variable.lastWritten = readInline(el, name);
    variable.visible = variable.owners.size > 0;
  } else {
    variable.base = current;
    variable.visible = false;
  }
  if (variable.owners.size === 0) variables.delete(name);
  if (variables.size === 0) ownedVariables.delete(el);
}

export function createCSSVarScope(
  el: HTMLElement | SVGElement,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): CSSVarScope {
  const owner = Symbol('css-variable-scope');
  let written: string[] = [];

  return {
    apply(token: Partial<AliasToken>): void {
      const { vars } = transformToken(token, prefix);
      for (const name of written) {
        if (!Object.hasOwn(vars, name)) releaseVariable(el, name, owner);
      }
      for (const [name, value] of Object.entries(vars)) {
        claimVariable(el, name, owner, value);
      }
      written = Object.keys(vars);
    },
    remove(): void {
      for (const name of written) releaseVariable(el, name, owner);
      written = [];
    },
    get keys(): string[] {
      return [...written];
    },
  };
}

/** 一次性写入（无后续移除需求的场景，如 SSR 后的客户端挂载） */
export function applyCSSVar(
  el: HTMLElement | SVGElement,
  token: Partial<AliasToken>,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): void {
  for (const [name, value] of Object.entries(transformToken(token, prefix).vars)) {
    el.style.setProperty(name, value);
    const variable = ownedVariables.get(el)?.get(name);
    if (variable) {
      variable.base = readInline(el, name);
      variable.lastWritten = variable.base;
      variable.visible = false;
    }
  }
}
