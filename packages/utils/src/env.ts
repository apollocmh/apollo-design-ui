/**
 * 统一的 dev / prod 判定。
 *
 * 为什么必须集中在这一个文件（依据：docs/foundation/rc-util-contract.md §6.4）：
 *
 *   1. antd 用 `process.env.NODE_ENV !== 'production'` 门控**全部**告警。
 *      我们必须在语义上一致，否则「生产环境静默」这条契约会被破坏。
 *   2. 但我们的产物是纯 ESM，且要同时被 Vite / webpack / Rollup / 裸浏览器消费。
 *      裸写 `process.env` 在裸浏览器下会直接抛 `process is not defined`。
 *   3. Vite 的 `import.meta.env.DEV` 是编译期常量，是最准确的信号；
 *      但它不是通用标准，其它打包器下为 undefined。
 *
 * 因此判定顺序：import.meta.env → process.env → 兜底按 dev 处理。
 * 兜底选 dev 而不是 prod 的理由：多打一条告警只是噪音，少打一条会掩盖真实的用法错误。
 *
 * ⚠️ 已知取舍：`isDev` 是模块级常量，打包器**无法**据此做死代码消除。
 *    antd 能做到（它把判断内联在每个函数里）是以「必须用 process.env」为代价换来的。
 *    我们选择跨打包器正确性，代价是 dev 分支会进入产物。
 *    L7 构建测试会断言：`NODE_ENV=production` 下 `warning()` 静默。
 *
 * ---------------------------------------------------------------------------
 * 为什么判定逻辑要拆成 `resolveDev` / `resolveTest` 两个纯函数
 * ---------------------------------------------------------------------------
 *
 *   真实判定结果在**模块加载时**就固化成常量了，测试无法在不重启进程的前提下
 *   覆盖「Vite 环境 / 只有 process.env / 什么都没有」这三条分支。
 *   把逻辑抽成纯函数后，分支可以被穷举验证，而生产路径仍然只在模块加载时求值一次
 *   —— 不牺牲任何运行时成本。
 *
 *   `readImportMetaEnv` 接受可选入参也是同一目的：让 `catch` 分支能被真的触发一次，
 *   而不是留一段"看起来在防御、其实从没执行过"的死代码。
 */

/** 与 Vite 的 `import.meta.env` 形状对齐（只取我们需要的字段）。 */
export interface ImportMetaEnvLike {
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
}

/**
 * `process.env` 中我们关心的字段。
 *
 * ⚠️ 索引签名不是装饰，是必需的（2026-09-17 修）。
 *    `process.env` 的真实类型是 `NodeJS.ProcessEnv extends Dict<string>`，
 *    即 `{ [key: string]: string | undefined }` —— 它**没有任何具名属性**。
 *    而本接口只声明了两个可选属性 ⇒ 它是一个 "weak type"，TS 会要求源类型
 *    至少命中一个同名属性，否则报 TS2559（`Type 'ProcessEnv' has no properties
 *    in common with type 'ProcessEnvLike'`）。加上同形状的索引签名后，
 *    结构关系成立，`currentProcessEnv()` 不再需要 `as` 断言。
 *    具名的两个属性仍然保留：它们是「我们实际读取什么」的文档，
 *    也让测试注入 `{ NODE_ENV: 'production' }` 这类字面量时得到精确提示。
 */
export interface ProcessEnvLike {
  NODE_ENV?: string;
  VITEST?: string;
  [key: string]: string | undefined;
}

/**
 * 读取 `import.meta.env`。
 *
 * `import.meta` 在 CJS 下不存在，且 `import.meta.env` 在极端配置（unbuild 的
 * CJS 输出 + 未替换的 `import.meta`）下可能是个抛错的 getter。用 try 包裹是为了不炸。
 *
 * @param meta 仅供测试注入（模拟抛错的 getter）。生产调用不传。
 */
export function readImportMetaEnv(
  meta?: ImportMeta & { env?: ImportMetaEnvLike },
): ImportMetaEnvLike | undefined {
  try {
    const source = meta ?? (import.meta as ImportMeta & { env?: ImportMetaEnvLike });
    return source.env;
  } catch {
    return undefined;
  }
}

/**
 * 纯函数形态的 dev 判定。**优先级顺序是契约的一部分**：
 *   `DEV` → `PROD` → `MODE` → `process.env.NODE_ENV` → 兜底 `true`（按 dev 处理）
 *
 * ⚠️ 不进 `@apollo-design/utils` 的公共 barrel —— 它是内部实现细节，
 *    导出只是为了测试与 L7 构建测试能复用同一套规则。
 */
export function resolveDev(
  viteEnv: ImportMetaEnvLike | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (viteEnv) {
    if (typeof viteEnv.DEV === 'boolean') return viteEnv.DEV;
    if (typeof viteEnv.PROD === 'boolean') return !viteEnv.PROD;
    if (typeof viteEnv.MODE === 'string') return viteEnv.MODE !== 'production';
  }

  if (nodeEnv) return nodeEnv !== 'production';

  return true;
}

/**
 * 纯函数形态的测试环境判定。
 *
 * 注意与 `resolveDev` 的**独立**关系：测试环境既是 dev 也是 test，
 * 但 `NODE_ENV=test` 在 Vite 下 `import.meta.env.DEV` 仍为 `true`，
 * 所以两个常量各自判定、不互相派生。
 */
export function resolveTest(
  viteEnv: ImportMetaEnvLike | undefined,
  processEnv: ProcessEnvLike | undefined,
): boolean {
  if (viteEnv?.MODE === 'test') return true;
  if (processEnv) {
    return processEnv.NODE_ENV === 'test' || processEnv.VITEST === 'true';
  }
  return false;
}

function currentProcessEnv(): ProcessEnvLike | undefined {
  return typeof process !== 'undefined' && process.env ? process.env : undefined;
}

function detectDev(): boolean {
  return resolveDev(readImportMetaEnv(), currentProcessEnv()?.NODE_ENV);
}

function detectTest(): boolean {
  return resolveTest(readImportMetaEnv(), currentProcessEnv());
}

/** 当前是否处于开发（非生产）环境。模块加载时求值一次。 */
export const isDev: boolean = detectDev();

/** 当前是否处于生产环境。 */
export const isProd: boolean = !isDev;

/**
 * 当前是否处于测试环境。
 *
 * 用途：antd 在测试环境下每打一条告警就自动 `resetWarned()`，
 * 避免「同一个测试文件里的后续用例因为去重而看不到告警」。
 * 这是一个**测试便利**而非运行时契约，但保留它能让告警断言写法与 antd 一致。
 */
export const isTest: boolean = detectTest();
