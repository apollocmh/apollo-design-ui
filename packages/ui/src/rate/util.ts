/**
 * rc-rate `util.js` 的逐字移植 —— 半星判定的横向偏移。
 *
 * rc 逐字：getClientPosition（boundingRect - clientLeft/Top）+ pageXOffset。
 * jsdom 下 getBoundingClientRect 返回 0 ⇒ 测试用 mock 或走 0 值路径。
 */

function getScroll(w: Window): number {
  let ret = w.pageXOffset;
  const method = 'scrollLeft';
  if (typeof ret !== 'number') {
    const d = w.document;
    ret = d.documentElement[method];
    if (typeof ret !== 'number') {
      ret = d.body[method];
    }
  }
  return ret;
}

function getClientPosition(elem: Element): { left: number; top: number } {
  let x: number;
  let y: number;
  const doc = elem.ownerDocument;
  const { body } = doc;
  // `doc` 是 `elem.ownerDocument`（非空）⇒ 原来的 `doc && …` 是多余的守卫
  const docElem = doc.documentElement;
  const box = elem.getBoundingClientRect();
  x = box.left;
  y = box.top;
  x -= docElem.clientLeft || body.clientLeft || 0;
  y -= docElem.clientTop || body.clientTop || 0;
  return { left: x, top: y };
}

export function getOffsetLeft(el: Element): number {
  const pos = getClientPosition(el);
  const doc = el.ownerDocument;
  // IE 专用 `parentWindow`（rc 逐字）—— 标准环境恒走 defaultView
  const w = doc.defaultView ?? (doc as Document & { parentWindow?: Window }).parentWindow ?? null;
  pos.left += w ? getScroll(w) : 0;
  return pos.left;
}
