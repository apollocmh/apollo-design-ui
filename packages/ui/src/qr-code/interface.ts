/**
 * QRCode 的类型契约（从 antd 6.6.4 的 `es/qr-code/index.d.ts` + rc
 * `@rc-component/qrcode` 的 interface **重新定义**，不复制）。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 二维码状态（非 active 时渲染覆盖层）。 */
export type QrcodeStatusType = 'active' | 'expired' | 'loading' | 'scanned';

export interface QrcodeLocale {
  expired?: string;
  refresh?: string;
  scanned?: string;
}

export interface QrCodeSemanticClassNames {
  root?: string | undefined;
  cover?: string | undefined;
}

export interface QrCodeSemanticStyles {
  root?: CSSProperties;
  cover?: CSSProperties;
}

export interface QRCodeProps {
  /** 二维码内容（string 或分段数组）。**必填** —— 缺省渲染 null + dev 告警。 */
  value?: string | string[] | undefined;
  /** 渲染形态。 */
  type?: 'canvas' | 'svg' | undefined;
  /** 中心图标 URL。 */
  icon?: string | undefined;
  /** 像素尺寸。 */
  size?: number | undefined;
  iconSize?: number | { width?: number; height?: number } | undefined;
  /** 前景色（默认 token.colorText）。 */
  color?: string | undefined;
  errorLevel?: 'L' | 'M' | 'Q' | 'H' | undefined;
  status?: QrcodeStatusType | undefined;
  bordered?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  prefixCls?: string | undefined;
  bgColor?: string | undefined;
  /** 模块静默区（覆盖 includeMargin 语义）。 */
  marginSize?: number | undefined;
  /** 5.28.0+：提升纠错级别以增强容错。 */
  boostLevel?: boolean | undefined;
  /** 图像可访问名称；svg还输出title。缺省名称为QR code。 */
  title?: string | undefined;
  classNames?: QrCodeSemanticClassNames | undefined;
  styles?: QrCodeSemanticStyles | undefined;
}

/** ref 形状（antd 的 `QRCodeRef`）。 */
export interface QRCodeRef {
  nativeElement: HTMLDivElement | null;
}

export interface QRCodeStatusSlotProps {
  status: QrcodeStatusType;
  locale: QrcodeLocale;
  /** 稳定的Vue操作；调用只发出refresh事件，不依赖父级监听存在性。 */
  refresh: () => void;
}
export interface QRCodeSlots {
  /** 非active时读取；有意为空的槽抑制默认内容。 */
  status?: (scope: QRCodeStatusSlotProps) => VNodeChild;
}
