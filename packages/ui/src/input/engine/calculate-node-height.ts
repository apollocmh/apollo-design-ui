/**
 * TextArea 自适应高度量测 —— `@rc-component/input` 的 `calculateNodeHeight.js`
 * 行为等价物（算法源自 react-textarea-autosize，上游注释写明）。
 *
 * 量测思路：**隐藏 textarea 影子节点**复制所有影响高度的样式（SIZING_STYLE
 * 19 项），写入相同文本后读 `scrollHeight`，再按 `box-sizing` 折算
 * padding / border —— 这是浏览器里唯一可靠的「文本自然高度」测量方式。
 *
 * ⚠️ 必须逐字保留的三条：
 *  1. `minRows/maxRows` 的单行高度 = `scrollHeight - paddingSize`（影子节点值设为空格）。
 *  2. `box-sizing: border-box` 加 border、`content-box` 减 padding。
 *  3. 溢出判据：`overflowY = height > maxHeight ? undefined : 'hidden'`（**超过**
 *     最大高度才给滚动条）。
 */

const HIDDEN_TEXTAREA_STYLE = `
  min-height:0 !important;
  max-height:none !important;
  height:0 !important;
  visibility:hidden !important;
  overflow:hidden !important;
  position:absolute !important;
  z-index:-1000 !important;
  top:0 !important;
  right:0 !important;
  pointer-events: none !important;
`;

const SIZING_STYLE = [
  'letter-spacing',
  'line-height',
  'padding-top',
  'padding-bottom',
  'font-family',
  'font-weight',
  'font-size',
  'font-variant',
  'text-rendering',
  'text-transform',
  'width',
  'text-indent',
  'padding-left',
  'padding-right',
  'border-width',
  'box-sizing',
  'word-break',
  'white-space',
];

export interface AutoSizeStyle {
  height: number;
  overflowY?: string;
  resize: string;
  minHeight?: number;
  maxHeight?: number;
}

let hiddenTextarea: HTMLTextAreaElement | null = null;

function getHiddenTextarea(): HTMLTextAreaElement {
  if (!hiddenTextarea) {
    const el = document.createElement('textarea');
    el.setAttribute('tab-index', '-1');
    el.setAttribute('aria-hidden', 'true');
    // 表单元素应有 name，否则浏览器自动填充会异常（上游注释引 MDN）
    el.setAttribute('name', 'hiddenTextarea');
    document.body.appendChild(el);
    hiddenTextarea = el;
  }
  return hiddenTextarea;
}

/**
 * 计算自适应高度样式。
 *
 * @param uiTextNode 真实 textarea
 * @param minRows / maxRows 为 null 表示不约束
 */
export function calculateAutoSizeStyle(
  uiTextNode: HTMLTextAreaElement,
  minRows: number | null = null,
  maxRows: number | null = null,
): AutoSizeStyle {
  const hidden = getHiddenTextarea();

  // wrap="off" 兼容（上游 issue 6577）
  const wrap = uiTextNode.getAttribute('wrap');
  if (wrap) {
    hidden.setAttribute('wrap', wrap);
  } else {
    hidden.removeAttribute('wrap');
  }

  const style = window.getComputedStyle(uiTextNode);
  const boxSizing: string =
    style.getPropertyValue('box-sizing') ||
    style.getPropertyValue('-moz-box-sizing') ||
    style.getPropertyValue('-webkit-box-sizing');
  const paddingSize =
    parseFloat(style.getPropertyValue('padding-bottom')) +
    parseFloat(style.getPropertyValue('padding-top'));
  const borderSize =
    parseFloat(style.getPropertyValue('border-bottom-width')) +
    parseFloat(style.getPropertyValue('border-top-width'));
  const sizingStyle = SIZING_STYLE.map((name) => `${name}:${style.getPropertyValue(name)}`).join(
    ';',
  );

  hidden.setAttribute('style', `${sizingStyle};${HIDDEN_TEXTAREA_STYLE}`);
  hidden.value = uiTextNode.value || uiTextNode.placeholder || '';

  let height = hidden.scrollHeight;
  if (boxSizing === 'border-box') {
    height += borderSize;
  } else if (boxSizing === 'content-box') {
    height -= paddingSize;
  }

  let minHeight: number | undefined;
  let maxHeight: number | undefined;
  let overflowY: string | undefined;

  if (minRows !== null || maxRows !== null) {
    hidden.value = ' ';
    const singleRowHeight = hidden.scrollHeight - paddingSize;
    if (minRows !== null) {
      minHeight = singleRowHeight * minRows;
      if (boxSizing === 'border-box') {
        minHeight = minHeight + paddingSize + borderSize;
      }
      height = Math.max(minHeight, height);
    }
    if (maxRows !== null) {
      maxHeight = singleRowHeight * maxRows;
      if (boxSizing === 'border-box') {
        maxHeight = maxHeight + paddingSize + borderSize;
      }
      overflowY = height > maxHeight ? undefined : 'hidden';
      height = Math.min(maxHeight, height);
    }
  }

  const result: AutoSizeStyle = { height, overflowY, resize: 'none' };
  if (minHeight !== undefined) {
    result.minHeight = minHeight;
  }
  if (maxHeight !== undefined) {
    result.maxHeight = maxHeight;
  }
  return result;
}

/** `autoSize` prop 的归一化：`true | { minRows?, maxRows? }` ⇒ [minRows, maxRows]。 */
export function resolveAutoSize(
  autoSize: boolean | { minRows?: number; maxRows?: number } | undefined,
): { enabled: boolean; minRows: number | null; maxRows: number | null } {
  if (!autoSize) {
    return { enabled: false, minRows: null, maxRows: null };
  }
  if (autoSize === true) {
    return { enabled: true, minRows: null, maxRows: null };
  }
  return {
    enabled: true,
    minRows: typeof autoSize.minRows === 'number' ? autoSize.minRows : null,
    maxRows: typeof autoSize.maxRows === 'number' ? autoSize.maxRows : null,
  };
}
