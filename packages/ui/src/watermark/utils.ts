/**
 * Watermark 的工具函数。
 *
 * 契约来源：antd 6.6.4 的 `es/watermark/utils.js` —— **机械移植**
 * （变量名与求值顺序逐行对齐）。
 */

import { isPlainObject } from '@apollo-design/utils';
import type { WatermarkContent, WatermarkFont } from './interface';

/** camelCase → kebab-case（antd 的 `toLowercaseSeparator`）。 */
export function toLowercaseSeparator(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** style 对象 → 内联样式串（水印防篡改 div 用）。 */
export function getStyleStr(style: Record<string, string | number | undefined>): string {
  return Object.keys(style)
    .map((key) => `${toLowercaseSeparator(key)}: ${style[key]};`)
    .join(' ');
}

/** 设备物理像素 / CSS 像素。 */
export function getPixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/** 内容项是否为对象形态（WatermarkText）—— 类型守卫版。 */
export function isWatermarkText(
  content: WatermarkContent,
): content is Extract<WatermarkContent, { text: string }> {
  return isPlainObject(content);
}

/** Let canvas parse the input unit, then use its normalized pixels for the existing geometry. */
export function setCanvasFont(
  context: CanvasRenderingContext2D,
  font: WatermarkFont,
  ratio = 1,
  lineHeight?: number,
): number {
  const size = Number.isFinite(Number(font.fontSize)) ? `${font.fontSize}px` : font.fontSize;
  const prefix = `${font.fontStyle} normal ${font.fontWeight}`;
  const requested = `${prefix} ${size} ${font.fontFamily}`;
  // Invalid assignments are ignored by canvas. Two distinct sentinels distinguish that from a
  // valid font which happens to equal the previous value, without parsing CSS input ourselves.
  context.font = '1px sans-serif';
  context.font = requested;
  const normalized = context.font;
  context.font = '2px sans-serif';
  context.font = requested;
  if (context.font !== normalized)
    throw new TypeError(`Invalid Watermark canvas font: ${requested}`);
  const pixels = /(?:^|\s)(\d+(?:\.\d+)?)px(?=\s|\/|$)/.exec(normalized)?.[1];
  if (pixels === undefined)
    throw new TypeError(`Canvas did not normalize a pixel font: ${normalized}`);
  const fontSize = Number(pixels) * ratio;
  const height = lineHeight === undefined ? '' : `/${lineHeight}px`;
  context.font = `${prefix} ${fontSize}px${height} ${font.fontFamily}`;
  return fontSize;
}

/**
 * content 归一化成行列表（antd 的 `getContentLines` = `toList(content,{skipEmpty})`）：
 * 数组展平、跳过空值（`''` / `null` / `undefined`）、对象形态按行合并 font。
 */
export function getContentLines(
  content: WatermarkContent | WatermarkContent[] | undefined,
  font: WatermarkFont,
): { text: string; font: WatermarkFont }[] {
  const list: WatermarkContent[] = Array.isArray(content)
    ? content
    : content !== undefined && content !== null
      ? [content]
      : [];
  return list
    .filter((item) => item !== undefined && item !== null && item !== '')
    .map((item) => {
      if (isWatermarkText(item)) {
        return {
          text: item.text ?? '',
          font: {
            color: item.font?.color ?? font.color,
            fontSize: item.font?.fontSize ?? font.fontSize,
            fontWeight: item.font?.fontWeight ?? font.fontWeight,
            fontStyle: item.font?.fontStyle ?? font.fontStyle,
            fontFamily: item.font?.fontFamily ?? font.fontFamily,
            textAlign: item.font?.textAlign ?? font.textAlign,
          },
        };
      }
      return { text: item, font };
    });
}

/** 这次 mutation 是否需要重绘水印（删除了水印节点 / 改了水印元素属性）。 */
export function reRendering(
  mutation: MutationRecord,
  isWatermarkEle: (ele: unknown) => boolean,
): boolean {
  let flag = false;
  // Whether to delete the watermark node
  if (mutation.removedNodes.length) {
    flag = Array.from(mutation.removedNodes).some(isWatermarkEle);
  }
  // Whether the watermark dom property value has been modified
  if (mutation.type === 'attributes' && isWatermarkEle(mutation.target)) {
    flag = true;
  }
  return flag;
}
