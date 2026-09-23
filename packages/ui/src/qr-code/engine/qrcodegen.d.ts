/**
 * `qrcodegen.js` 的类型声明（vendored 第三方库的手写 API 面）。
 *
 * 只声明本仓消费的成员（`QrCode` / `QrSegment` / `Ecc` / `Mode` 的公开 API）；
 * 完整文档见 https://www.nayuki.io/page/qr-code-generator-library
 */

export declare class Ecc {
  static LOW: Ecc;
  static MEDIUM: Ecc;
  static QUARTILE: Ecc;
  static HIGH: Ecc;
  readonly ordinal: number;
  readonly formatBits: number;
  private constructor();
}

export declare class Mode {
  static NUMERIC: Mode;
  static ALPHANUMERIC: Mode;
  static BYTE: Mode;
  static KANJI: Mode;
  readonly modeBits: number;
  readonly numBitsCharCount: [number, number, number];
  private constructor();
}

export declare class QrSegment {
  static makeSegments(text: string): QrSegment[];
  static makeBytes(data: number[] | Uint8Array): QrSegment;
  static makeNumeric(digits: string): QrSegment;
  static makeAlphanumeric(text: string): QrSegment;
  static makeSegmentsByMode?: never;
  constructor(mode: Mode, numChars: number, bitData: number[]);
  readonly mode: Mode;
  readonly numChars: number;
  getData(): number[];
}

export declare class QrCode {
  static encodeSegments(
    segs: QrSegment[],
    ecl: Ecc,
    minVersion?: number,
    maxVersion?: number,
    mask?: number,
    boostEcl?: boolean,
  ): QrCode;
  static encodeText(text: string, ecl: Ecc): QrCode;
  static encodeBinary(data: number[] | Uint8Array, ecl: Ecc): QrCode;
  static NUM_ERROR_CORRECTION_BLOCKS: number[];
  static MAX_VERSION: number;
  constructor(version: number, ecl: Ecc, dataCodewords: number[], msk: number);
  readonly version: number;
  readonly size: number;
  readonly mask: number;
  getModules(): boolean[][];
  getModule(x: number, y: number): boolean;
}
