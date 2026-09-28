/**
 * progress 的工具函数 —— antd `progress/utils.ts` + `Line.tsx` 的 gradient 部分逐字语义。
 *
 * FastColor.isLight 以自研亮度判定替代（@ant-design/fast-color 为 H6 关联禁用包；
 * 行为对齐：luminance threshold 128）。
 */

/** antd `@ant-design/colors` 的 presetPrimaryColors.blue（gradient 默认 from/to）。 */
export const PRESET_BLUE = '#1677ff';

/** antd 逐字：validProgress。 */
export function validProgress(progress?: number): number {
  if (!progress || progress < 0) {
    return 0;
  }
  if (progress > 100) {
    return 100;
  }
  return progress;
}

/** antd 逐字：getSuccessPercent。 */
export function getSuccessPercent(props: { success?: { percent?: number } }): number | undefined {
  let percent: number | undefined;
  if (props.success && 'percent' in props.success) {
    percent = props.success.percent;
  }
  return percent;
}

/** antd 逐字：getPercentage（circle 的分段）。 */
export const getPercentage = (props: { percent?: number; success?: { percent?: number } }) => {
  const realSuccessPercent = validProgress(getSuccessPercent(props));
  return [
    realSuccessPercent,
    validProgress(validProgress(props.percent ?? 0) - realSuccessPercent),
  ];
};

/** antd 逐字：getStrokeColor（success 段绿色兜底）。 */
export const getStrokeColor = (props: {
  success?: { strokeColor?: string };
  strokeColor?: string | Record<PropertyKey, string> | null;
}): (string | Record<PropertyKey, string> | null)[] => {
  const successColor = props.success?.strokeColor;
  return [successColor || '#52c41a', (props.strokeColor as string) || null].map((c) => c) as never;
};

/** antd 逐字：getSize（line/step/circle 三套解析）。 */
export const getSize = (
  size:
    | number
    | [number | string, number]
    | string
    | { width?: number; height?: number }
    | undefined,
  type: 'line' | 'circle' | 'dashboard' | 'step',
  extra?: { steps?: number; strokeWidth?: number },
): [number, number] => {
  let width = -1;
  let height = -1;
  if (type === 'step') {
    const steps = extra!.steps!;
    const strokeWidth = extra!.strokeWidth!;
    if (typeof size === 'string' || typeof size === 'undefined') {
      width = size === 'small' ? 2 : 14;
      height = strokeWidth ?? 8;
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else if (Array.isArray(size)) {
      width = (size[0] as number) ?? 14;
      height = (size[1] as number) ?? 8;
    } else {
      width = size.width ?? 14;
      height = size.height ?? 8;
    }
    width *= steps;
  } else if (type === 'line') {
    const strokeWidth = extra?.strokeWidth;
    if (typeof size === 'string' || typeof size === 'undefined') {
      height = strokeWidth || (size === 'small' ? 6 : 8);
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else if (Array.isArray(size)) {
      width = (size[0] as number) ?? -1;
      height = (size[1] as number) ?? 8;
    } else {
      width = size.width ?? -1;
      height = size.height ?? 8;
    }
  } else if (type === 'circle' || type === 'dashboard') {
    if (typeof size === 'string' || typeof size === 'undefined') {
      [width, height] = size === 'small' ? [60, 60] : [120, 120];
    } else if (typeof size === 'number') {
      [width, height] = [size, size];
    } else if (Array.isArray(size)) {
      width = (size[0] ?? size[1] ?? 120) as number;
      height = (size[0] ?? size[1] ?? 120) as number;
    }
  }
  return [width, height];
};

// ---------------------------------------------------------------------------
// gradient（antd Line.tsx 的 sortGradient / handleGradient 逐字语义）
// ---------------------------------------------------------------------------

export type StringGradients = Record<string, string>;

/** antd 逐字：多键渐变按 % 排序拼接。 */
export const sortGradient = (gradients: StringGradients): string => {
  let tempArr: { key: number; value?: string }[] = [];
  Object.keys(gradients).forEach((key) => {
    const formattedKey = Number.parseFloat(key.replace(/%/g, ''));
    if (!Number.isNaN(formattedKey)) {
      tempArr.push({ key: formattedKey, value: gradients[key] });
    }
  });
  tempArr = tempArr.sort((a, b) => a.key - b.key);
  return tempArr.map(({ key, value }) => `${value} ${key}%`).join(', ');
};

/** antd LineStrokeColorVar（产物逐字：无组件前缀）。 */
export const LineStrokeColorVar = '--progress-line-stroke-color';

/** antd 逐字：handleGradient（from/to/多键 → background + 变量）。 */
export const handleGradient = (
  strokeColor: StringGradients & { from?: string; to?: string; direction?: string },
  directionConfig?: string,
): Record<string, string> => {
  const {
    from = PRESET_BLUE,
    to = PRESET_BLUE,
    direction = directionConfig === 'rtl' ? 'to left' : 'to right',
    ...rest
  } = strokeColor;
  if (Object.keys(rest).length !== 0) {
    const sortedGradients = sortGradient(rest as StringGradients);
    const background = `linear-gradient(${direction}, ${sortedGradients})`;
    return { background, [LineStrokeColorVar]: background };
  }
  const background = `linear-gradient(${direction}, ${from}, ${to})`;
  return { background, [LineStrokeColorVar]: background };
};

// ---------------------------------------------------------------------------
// isLight（FastColor.isLight 的替代：亮度 > 128 判亮）
// ---------------------------------------------------------------------------

const parseColorChannel = (value: string): [number, number, number] | null => {
  const hex = value.trim();
  if (hex.startsWith('#')) {
    const body = hex.slice(1);
    const full =
      body.length === 3
        ? body
            .split('')
            .map((c) => c + c)
            .join('')
        : body.slice(0, 6);
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ];
  }
  const m = hex.match(/rgba?\(([^)]+)\)/);
  if (m && m[1] !== undefined) {
    const parts = m[1].split(',').map((s) => Number.parseFloat(s));
    const [r, g, b] = parts;
    if (r !== undefined && g !== undefined && b !== undefined && parts.length >= 3) {
      return [r, g, b];
    }
  }
  return null;
};

/** FastColor(color).isLight() 的替代：RGB 亮度均值 > 128 判亮。 */
export const isLightColor = (color: string): boolean => {
  const rgb = parseColorChannel(color);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  // FastColor 的 isLight：基于亮度公式（ITU-R 601）threshold 128
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
};

/**
 * Vue 无 React 的「数字 style 自动加 px」行为（CSSOM `el.style.height = 8` 静默失败）
 * —— antd 的 CSSProperties 数字值必须手动转 px（Progress 期抓出）。
 */
export const px = (value?: number | string | null): string | number | undefined =>
  typeof value === 'number' ? `${value}px` : (value ?? undefined);
