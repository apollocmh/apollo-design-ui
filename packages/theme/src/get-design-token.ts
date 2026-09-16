import compactAlgorithm from './algorithms/compact';
import darkAlgorithm from './algorithms/dark';
import defaultAlgorithm from './algorithms/default';
import formatToken from './alias';
import { defaultSeedToken } from './seed';
import type { AliasToken, MappingAlgorithm, MapToken, SeedToken, ThemeConfig } from './types';

export { compactAlgorithm, darkAlgorithm, defaultAlgorithm };

/**
 * 三个算法。
 *
 * 可组合：`algorithm: [darkAlgorithm, compactAlgorithm]` —— 顺序有意义，
 * 后者在前者结果上继续派生（antd 的 `Theme.getDerivativeToken` 是 reduce）。
 */
export const algorithms = {
  default: defaultAlgorithm,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
} as const;

/**
 * 计算完整 Token。**纯函数**：同一入参必得同一出参，不读全局状态、不碰 DOM。
 *
 * 与 antd 的 `theme.getDesignToken()` 契约等价。实现上复现了
 * `@ant-design/cssinjs` 的两行胶水（已核对 cssinjs@2.1.2 源码）：
 *
 *   derivativeToken = algorithms.reduce((result, fn) => fn(seed, result), undefined)
 *   token           = formatToken({ ...derivativeToken, override: config.token })
 *
 * 之所以要复现而不是照抄：那两行属于 React 生态包，本项目禁止依赖（AGENTS.md H6）。
 * 复现的依据写在 `registry/tools/gen-theme-baseline.mjs` 的文件头。
 */
export function getDesignToken(config: ThemeConfig = {}): AliasToken {
  const list: MappingAlgorithm[] = config.algorithm
    ? Array.isArray(config.algorithm)
      ? config.algorithm
      : [config.algorithm]
    : [defaultAlgorithm];

  const seed: SeedToken = { ...defaultSeedToken, ...config.token };

  const derivativeToken = list.reduce<MapToken | undefined>(
    (result, fn) => fn(seed, result),
    undefined,
  ) as MapToken;

  return formatToken({ ...derivativeToken, override: config.token });
}
