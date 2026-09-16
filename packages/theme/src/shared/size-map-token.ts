import type { SeedToken, SizeMapToken } from '../types';

/**
 * 默认尺寸梯度（9 档）。
 *
 * 注意 `sizeMS` 与 `size` 同值 —— antd 的冗余定义，保留。
 */
export function genSizeMapToken(token: Pick<SeedToken, 'sizeUnit' | 'sizeStep'>): SizeMapToken {
  const { sizeUnit, sizeStep } = token;
  return {
    sizeXXL: sizeUnit * (sizeStep + 8),
    sizeXL: sizeUnit * (sizeStep + 4),
    sizeLG: sizeUnit * (sizeStep + 2),
    sizeMD: sizeUnit * (sizeStep + 1),
    sizeMS: sizeUnit * sizeStep,
    size: sizeUnit * sizeStep,
    sizeSM: sizeUnit * (sizeStep - 1),
    sizeXS: sizeUnit * (sizeStep - 2),
    sizeXXS: sizeUnit * (sizeStep - 3),
  };
}

/**
 * 紧凑模式的尺寸梯度。
 *
 * 与默认的区别不只是整体缩小：`sizeMD` 与 `sizeLG` 同值、`size` 与 `sizeSM` 同值、
 * `sizeXS` 与 `sizeXXS` 同值。这是 antd 紧凑模式的设计取舍（合并相邻档位），
 * 不能用「默认梯度整体减 2」代替。
 */
export function genCompactSizeMapToken(
  token: Pick<SeedToken, 'sizeUnit' | 'sizeStep'>,
): SizeMapToken {
  const { sizeUnit, sizeStep } = token;
  const compactSizeStep = sizeStep - 2;
  return {
    sizeXXL: sizeUnit * (compactSizeStep + 10),
    sizeXL: sizeUnit * (compactSizeStep + 6),
    sizeLG: sizeUnit * (compactSizeStep + 2),
    sizeMD: sizeUnit * (compactSizeStep + 2),
    sizeMS: sizeUnit * (compactSizeStep + 1),
    size: sizeUnit * compactSizeStep,
    sizeSM: sizeUnit * compactSizeStep,
    sizeXS: sizeUnit * (compactSizeStep - 1),
    sizeXXS: sizeUnit * (compactSizeStep - 1),
  };
}
