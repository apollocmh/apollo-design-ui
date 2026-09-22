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

export function getFontSize(font: WatermarkFont, ratio = 1): number {
  return Number(font.fontSize) * ratio;
}

export function getCanvasFont(font: WatermarkFont, ratio = 1, lineHeight?: number): string {
  const mergedLineHeight = lineHeight === undefined ? '' : `/${lineHeight}px`;
  return `${font.fontStyle} normal ${font.fontWeight} ${getFontSize(font, ratio)}px${mergedLineHeight} ${font.fontFamily}`;
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
          font: { ...font, ...(item.font ?? {}) },
        };
      }
      return { text: item as string, font };
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
