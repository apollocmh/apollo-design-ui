import type { VNodeChild } from 'vue';

/** 水印字体。与 antd 的 `WatermarkFont` 一致（字段直接喂 canvas）。 */
export interface WatermarkFont {
  color?: CanvasFillStrokeStyles['fillStyle'];
  fontSize?: number | string;
  fontWeight?: 'normal' | 'lighter' | 'bold' | 'bolder' | number;
  fontStyle?: 'normal' | 'italic' | 'oblique';
  fontFamily?: string;
  textAlign?: CanvasTextAlign;
}

/** 多行文本的一行。与 antd 的 `WatermarkText` 一致。 */
export interface WatermarkText {
  text: string;
  font?: WatermarkFont;
}

/** 水印内容。与 antd 的 `WatermarkContent` 一致。 */
export type WatermarkContent = string | WatermarkText;

export interface WatermarkProps {
  /** 水印层级。 */
  zIndex?: number;
  /** 旋转角度。@default -22 */
  rotate?: number;
  /** 单元宽度（默认文本测量 / 图片 120）。 */
  width?: number;
  /** 单元高度（默认文本测量 / 图片 64）。 */
  height?: number;
  /** 图片水印地址。 */
  image?: string;
  /** 水印内容（支持数组多行，每行可带独立 font）。 */
  content?: WatermarkContent | WatermarkContent[];
  /** 字体。@default color=colorFill, fontSize=fontSizeLG, … */
  font?: WatermarkFont;
  /** 水印间距。@default [100, 100] */
  gap?: [number, number];
  /** 水印偏移。@default gap/2 */
  offset?: [number, number];
  /** 子树是否继承水印。@default true */
  inherit?: boolean;
  /** Vue `remove` 事件监听器；首次绘制和正常卸载不触发。 */
  onRemove?: WatermarkEmits['remove'];
}

export interface WatermarkEmits {
  remove: () => void;
}

export type WatermarkSlots = {
  default?: () => VNodeChild;
};

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `WatermarkRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但首次渲染前它同样是 `null`，只是类型没体现。
 *    我们按真实情况声明为可空（Divider / StatisticRef 同一条理由）。
 */
export interface WatermarkRef {
  nativeElement: HTMLDivElement | null;
}
