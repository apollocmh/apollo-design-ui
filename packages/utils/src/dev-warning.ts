/**
 * 开发期告警的「组件层」。
 *
 * 契约来源：antd `es/_util/warning.js`。它在 rc-util 的 `warning` 之上加了三件事：
 *
 *   1. **组件名前缀**：`[apollo: Button] xxx`
 *   2. **deprecated 聚合**：当 `WarningContext.strict === false` 时，
 *      不再逐条打印 deprecated 告警，而是把「组件 → 已废弃属性列表」攒起来，
 *      只在**第一次**打印一次汇总。这是给「从 antd 迁移过来、短期无法清完告警」的项目用的。
 *   3. **测试环境自动去重重置**：见 env.ts 的 `isTest` 说明。
 *
 * Vue 映射：
 *   React 的 `React.useContext(WarningContext)` → Vue 的 `inject(warningContextKey)`。
 *   antd 在 `if (NODE_ENV !== 'production')` 块里调用 `devUseWarning('Empty')`，
 *   我们的 `useDevWarning` 必须在 `setup()` 同步阶段调用（`inject` 的限制），
 *   但内部做了 `getCurrentInstance()` 守卫，setup 之外调用会退化为「无 context」而不是抛错。
 */

import { getCurrentInstance, type InjectionKey, inject } from 'vue';
import { BRAND_BRACKET, warningPrefix } from './brand';
import { isDev, isTest } from './env';
import { resetWarned, warning } from './warning';

/** `WarningContext` 的值。与 antd 的 `ConfigProvider` 的 `warning` 配置同构。 */
export interface WarningContextValue {
  /**
   * `false` 时把 deprecated 告警聚合为一次性汇总。
   * `undefined` / `true` 时逐条打印。
   */
  strict?: boolean;
}

/**
 * 注入键。`ConfigProvider` 用 `provide(warningContextKey, value)` 提供。
 *
 * 用 `Symbol` 而不是字符串：避免与用户自己的 provide 键冲突。
 * 键名 `apolloWarning` 只在 devtools 中可见。
 */
export const warningContextKey: InjectionKey<WarningContextValue> = Symbol('apolloWarning');

/** 默认 context：空对象 → `strict` 为 `undefined` → 逐条打印（与 antd 默认一致）。 */
const EMPTY_WARNING_CONTEXT: WarningContextValue = {};

/**
 * 组件 → 已废弃属性消息列表。
 * `null` 表示「还没有发生过任何聚合告警」，用于判断"是不是第一次"。
 */
let deprecatedWarnList: Record<string, string[]> | null = null;

/** 同时重置 rc 层去重表与本层的 deprecated 聚合表。测试之间必须调用。 */
export function resetDevWarned(): void {
  deprecatedWarnList = null;
  resetWarned();
}

export interface DevWarning {
  /** 通用告警。`valid` 为 `false` 时输出。 */
  (valid: boolean, message: string): void;
  /**
   * 废弃属性告警。
   * @param valid 已废弃属性**未**被使用时为 `true`
   * @param oldProp 旧属性名
   * @param newProp 新属性名
   * @param message 附加说明，会以空格拼接在末尾
   */
  deprecated(valid: boolean, oldProp: string, newProp: string, message?: string): void;
}

function createNoopWarning(): DevWarning {
  const noop = (() => {}) as unknown as DevWarning;
  noop.deprecated = () => {};
  return noop;
}

/**
 * 创建一个带组件名前缀的告警函数。
 *
 * ⚠️ 必须在 `setup()` 同步阶段调用（内部用 `inject`）。
 *    生产环境下直接返回 noop，不做任何 context 查找。
 *
 * @param component 组件名，用于前缀。与 antd 一致用 PascalCase（如 `'Button'`、`'Empty'`）。
 */
export function useDevWarning(component: string): DevWarning {
  if (!isDev) return createNoopWarning();

  const instance = getCurrentInstance();
  const context = instance
    ? inject(warningContextKey, EMPTY_WARNING_CONTEXT)
    : EMPTY_WARNING_CONTEXT;

  const typeWarning = (valid: boolean, type: 'normal' | 'deprecated', message: string): void => {
    if (valid) return;

    if (context.strict === false && type === 'deprecated') {
      const isFirstEver = deprecatedWarnList === null;
      if (!deprecatedWarnList) deprecatedWarnList = {};
      deprecatedWarnList[component] ??= [];
      const list = deprecatedWarnList[component];
      if (!list.includes(message)) list.push(message);
      // 只在「第一次发生聚合」时打印一次
      if (isFirstEver) {
        console.warn(
          `${BRAND_BRACKET} There exists deprecated usage in your code:`,
          deprecatedWarnList,
        );
      }
      return;
    }

    warning(false, `${warningPrefix(component)} ${message}`);
    if (isTest) resetDevWarned();
  };

  const devWarning = ((valid: boolean, message: string) => {
    typeWarning(valid, 'normal', message);
  }) as DevWarning;

  devWarning.deprecated = (valid: boolean, oldProp: string, newProp: string, message = '') => {
    typeWarning(
      valid,
      'deprecated',
      `\`${oldProp}\` is deprecated. Please use \`${newProp}\` instead.${message ? ` ${message}` : ''}`,
    );
  };

  return devWarning;
}

/** antd 的别名。保留两个名字是为了让「迁移对照」时更容易搜索。 */
export const devUseWarning = useDevWarning;
