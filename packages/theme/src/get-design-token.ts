import compactAlgorithm from './algorithms/compact';
import darkAlgorithm from './algorithms/dark';
import defaultAlgorithm from './algorithms/default';
import formatToken from './alias';
import { defaultSeedToken } from './seed';
import type {
  AliasToken,
  MappingAlgorithm,
  MapToken,
  SeedToken,
  ThemeAppearance,
  ThemeConfig,
  ThemeTokenOverrides,
} from './types';

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
export function resolveThemeAppearance(
  config: ThemeConfig,
  system: ThemeAppearance = 'light',
): ThemeAppearance {
  const explicit = Array.isArray(config.algorithm)
    ? config.algorithm
    : config.algorithm
      ? [config.algorithm]
      : undefined;
  if (explicit) {
    for (const algorithm of [...explicit].reverse()) {
      if (algorithm === darkAlgorithm) return 'dark';
      if (algorithm === defaultAlgorithm) return 'light';
    }
    if (explicit.length === 0 || explicit.includes(compactAlgorithm)) return 'light';
  }
  return config.mode === 'system' ? system : (config.mode ?? 'light');
}

export function getDesignToken(
  config: ThemeConfig = {},
  systemAppearance: ThemeAppearance = 'light',
): AliasToken {
  const appearance = resolveThemeAppearance(config, systemAppearance);
  const scheme = config.preset?.[appearance];
  const algorithm =
    config.algorithm ??
    scheme?.algorithm ??
    (appearance === 'dark' ? darkAlgorithm : defaultAlgorithm);
  const list: MappingAlgorithm[] = Array.isArray(algorithm) ? algorithm : [algorithm];
  const [first = defaultAlgorithm, ...following] = list;

  const overrides: ThemeTokenOverrides = Object.fromEntries(
    [config.preset?.token, scheme?.token, config.token].flatMap((layer) =>
      Object.entries(layer ?? {}).filter(([, value]) => value !== undefined),
    ),
  );
  const seed: SeedToken = { ...defaultSeedToken, ...overrides };

  const derivativeToken = following.reduce<MapToken>(
    (result, fn) => fn(seed, result),
    first(seed, undefined),
  );

  return formatToken({ ...derivativeToken, override: overrides });
}
