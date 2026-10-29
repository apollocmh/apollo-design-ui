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
 * 未指定算法或给出空数组时使用默认算法。非空数组把前一项 Map 传给后一项。
 * undefined 覆盖等同省略，避免合法 Partial 输入破坏完整 AliasToken 返回值。
 * 历史算法对照仍由 baseline.test.ts 保留，不定义 Apollo 的输入契约。
 */
export function getDesignToken(config: ThemeConfig = {}): AliasToken {
  const list: MappingAlgorithm[] = Array.isArray(config.algorithm)
    ? config.algorithm
    : [config.algorithm ?? defaultAlgorithm];
  const [first = defaultAlgorithm, ...following] = list;

  const overrides = Object.fromEntries(
    Object.entries(config.token ?? {}).filter(([, value]) => value !== undefined),
  );
  const seed: SeedToken = { ...defaultSeedToken, ...overrides };

  const derivativeToken = following.reduce<MapToken>(
    (result, fn) => fn(seed, result),
    first(seed, undefined),
  );

  return formatToken({ ...derivativeToken, override: config.token });
}
