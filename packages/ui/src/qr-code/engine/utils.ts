/**
 * QRCode 的编码引擎工具（vendored 移植）。
 *
 * 契约来源：
 * - `@rc-component/qrcode@2.0.0/es/utils.js`（逐行对拍；其头注释声明逻辑来自
 *   `qrcode.react`，ISC License）
 * - `libs/qrcodegen.js`（Project Nayuki，MIT）—— vendor 在 `./qrcodegen.ts`，
 *   与 antd 6.6.4 的 QR 链路**同源** ⇒ 矩阵与 SVG path 逐字节一致
 *   （registry `dependencies.json` 的 strategy=reuse：复用纯 JS 算法库，不重写）。
 */

import { Ecc, QrCode, QrSegment } from './qrcodegen';

// =================== ERROR_LEVEL ==========================
export const ERROR_LEVEL_MAP = {
  L: Ecc.LOW,
  M: Ecc.MEDIUM,
  Q: Ecc.QUARTILE,
  H: Ecc.HIGH,
} as const;

// =================== DEFAULT_VALUE ==========================
export const DEFAULT_SIZE = 128;
export const DEFAULT_LEVEL = 'L';
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
export const DEFAULT_FRONT_COLOR = '#000000';
export const DEFAULT_NEED_MARGIN = false;
export const DEFAULT_MINVERSION = 1;
export const SPEC_MARGIN_SIZE = 4;
export const DEFAULT_MARGIN_SIZE = 0;
export const DEFAULT_IMG_SCALE = 0.1;

// =================== UTILS ==========================
/**
 * Generate a path string from modules
 * @param modules
 * @param margin
 * @returns
 */
export const generatePath = (modules: boolean[][], margin = 0): string => {
  const ops: string[] = [];
  modules.forEach((row, y) => {
    let start: number | null = null;
    row.forEach((cell, x) => {
      if (!cell && start !== null) {
        ops.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`);
        start = null;
        return;
      }
      if (x === row.length - 1) {
        if (!cell) {
          return;
        }
        if (start === null) {
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`);
        } else {
          ops.push(`M${start + margin},${y + margin} h${x + 1 - start}v1H${start + margin}z`);
        }
        return;
      }
      if (cell && start === null) {
        start = x;
      }
    });
  });
  return ops.join('');
};

/**
 * Excavate modules
 * @param modules
 * @param excavation
 * @returns
 */
export const excavateModules = (
  modules: boolean[][],
  excavation: { x: number; y: number; w: number; h: number },
): boolean[][] => {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) {
      return row;
    }
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) {
        return cell;
      }
      return false;
    });
  });
};

export interface ImageSettings {
  src: string;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
  excavate?: boolean;
  opacity?: number;
  crossOrigin?: string;
}

export interface CalculatedImageSettings {
  x: number;
  y: number;
  h: number;
  w: number;
  excavation: { x: number; y: number; w: number; h: number } | null;
  opacity: number;
  crossOrigin: string | undefined;
}

/**
 * Get image settings
 * @param cells The modules of the QR code
 * @param size The size of the QR code
 * @param margin
 * @param imageSettings
 * @returns
 */
export const getImageSettings = (
  cells: boolean[][],
  size: number,
  margin: number,
  imageSettings?: ImageSettings,
): CalculatedImageSettings | null => {
  if (imageSettings == null) {
    return null;
  }
  const numCells = cells.length + margin * 2;
  const defaultSize = Math.floor(size * DEFAULT_IMG_SCALE);
  const scale = numCells / size;
  const w = (imageSettings.width || defaultSize) * scale;
  const h = (imageSettings.height || defaultSize) * scale;
  const x = imageSettings.x == null ? cells.length / 2 - w / 2 : imageSettings.x * scale;
  const y = imageSettings.y == null ? cells.length / 2 - h / 2 : imageSettings.y * scale;
  const opacity = imageSettings.opacity == null ? 1 : imageSettings.opacity;
  let excavation: { x: number; y: number; w: number; h: number } | null = null;
  if (imageSettings.excavate) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const ceilW = Math.ceil(w + x - floorX);
    const ceilH = Math.ceil(h + y - floorY);
    excavation = {
      x: floorX,
      y: floorY,
      w: ceilW,
      h: ceilH,
    };
  }
  const crossOrigin = imageSettings.crossOrigin;
  return {
    x,
    y,
    h,
    w,
    excavation,
    opacity,
    crossOrigin,
  };
};

/**
 * Get margin size
 * @param needMargin Whether need margin
 * @param marginSize Custom margin size
 * @returns
 */
export const getMarginSize = (needMargin: boolean, marginSize?: number): number => {
  if (marginSize != null) {
    return Math.max(Math.floor(marginSize), 0);
  }
  return needMargin ? SPEC_MARGIN_SIZE : DEFAULT_MARGIN_SIZE;
};

/**
 * Check if Path2D is supported
 */
export const isSupportPath2d = (() => {
  try {
    new Path2D().addPath(new Path2D());
  } catch {
    return false;
  }
  return true;
})();

// =================== 编码入口（useQRCode 的纯函数部分） ==========================

export interface QrComputeInput {
  value: string | string[];
  level: 'L' | 'M' | 'Q' | 'H';
  minVersion: number;
  includeMargin: boolean;
  marginSize?: number;
  imageSettings?: ImageSettings;
  size: number;
  boostLevel?: boolean;
}

export interface QrComputeResult {
  cells: boolean[][];
  margin: number;
  numCells: number;
  calculatedImageSettings: CalculatedImageSettings | null;
  qrcode: QrCode;
}

/** `useQRCode` 的纯函数主体（Vue 侧由 `useQrCompute` 包成 computed）。 */
export function computeQr(opt: QrComputeInput): QrComputeResult {
  const { value, level, minVersion, includeMargin, marginSize, imageSettings, size, boostLevel } =
    opt;
  const values = Array.isArray(value) ? value : [value];
  const segments = values.reduce<QrSegment[]>((acc, val) => {
    acc.push(...QrSegment.makeSegments(val));
    return acc;
  }, []);
  const qrcode = QrCode.encodeSegments(
    segments,
    ERROR_LEVEL_MAP[level],
    minVersion,
    undefined,
    undefined,
    boostLevel,
  );
  const cs = qrcode.getModules();
  const mg = getMarginSize(includeMargin, marginSize);
  const ncs = cs.length + mg * 2;
  const cis = getImageSettings(cs, size, mg, imageSettings);
  return {
    cells: cs,
    margin: mg,
    numCells: ncs,
    calculatedImageSettings: cis,
    qrcode,
  };
}
