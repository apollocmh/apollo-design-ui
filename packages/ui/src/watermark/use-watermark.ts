/**
 * 水印元素的 append / remove / 判定。
 *
 * 参考 antd 6.6.4 的 `es/watermark/useWatermark.js`：
 * 每个容器一个水印 div；style 每次全量重写（`getStyleStr`）；移除 `class` /
 * `hidden` 属性防浏览器隐藏；`visibility: visible !important` 防外部样式；
 * 重挂（换了父容器）时触发 `onRemove`。
 */

import { getStyleStr } from './utils';

/** 防外部隐藏元素的水印（antd 的 `emphasizedStyle`）。 */
const emphasizedStyle = {
  visibility: 'visible !important',
};

/**
 * 创建水印管理器（每个组件实例一份）。
 *
 * @param getMarkStyle 取当前 markStyle（重写 style 时用最新值）
 * @param onRemove 水印换父时的回调
 */
export function useWatermark(
  getMarkStyle: () => Record<string, string | number | undefined>,
  onRemove?: () => void,
): {
  appendWatermark: (base64Url: string, markWidth: number, container: HTMLElement) => void;
  removeWatermark: (container: HTMLElement | null) => void;
  isWatermarkEle: (ele: unknown) => boolean;
  disposeAll: () => void;
} {
  const watermarkMap = new Map<HTMLElement, HTMLDivElement>();
  const appendWatermark = (base64Url: string, markWidth: number, container: HTMLElement) => {
    let watermarkEle = watermarkMap.get(container);
    const existed = !!watermarkEle;
    if (!watermarkEle) {
      watermarkEle = container.ownerDocument.createElement('div');
      watermarkMap.set(container, watermarkEle);
    }
    const style = getStyleStr({
      ...getMarkStyle(),
      backgroundImage: `url('${base64Url}')`,
      backgroundSize: `${Math.floor(markWidth)}px`,
      ...emphasizedStyle,
    });
    // 相同样式不再写 attributes，避免观察器把自己的回写当作下一次篡改。
    if (watermarkEle.getAttribute('style') !== style) watermarkEle.setAttribute('style', style);
    // Prevents using the browser `Hide Element` to hide watermarks
    watermarkEle.removeAttribute('class');
    watermarkEle.removeAttribute('hidden');
    if (watermarkEle.parentElement !== container) {
      container.append(watermarkEle);
      if (existed) onRemove?.();
    }
  };

  const removeWatermark = (container: HTMLElement | null) => {
    const watermarkEle = container ? watermarkMap.get(container) : undefined;
    watermarkEle?.remove();
    if (container) {
      watermarkMap.delete(container);
    }
  };

  const isWatermarkEle = (ele: unknown): boolean =>
    Array.from(watermarkMap.values()).some((mark) => mark === ele);

  const disposeAll = () => {
    for (const mark of watermarkMap.values()) mark.remove();
    watermarkMap.clear();
  };

  return { appendWatermark, removeWatermark, isWatermarkEle, disposeAll };
}
