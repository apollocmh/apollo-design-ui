/**
 * 环境探测：浏览器支不支持 CSS transition / animation、事件名叫什么。
 *
 * **机械移植**自 `@rc-component/motion@1.3.3` `es/util/motion.js:1-58`
 * （保留 `makePrefixMap` 的键序与 `hasOwnProperty` 检查，不做顺手优化）。
 * 这是 `supportMotion` 的默认值来源 —— 它决定走**完整步进队列**还是
 * **简队列（prepare → prepared）**，属于行为契约，不是可选优化。
 *
 * 之所以不在模块加载时就算好：SSR 下 `document` 不存在，且测试可能想换环境。
 * 但结果**会缓存** —— 探测要 createElement，不该每次调用都做。
 */

interface WinLike {
  document?: Document;
  AnimationEvent?: unknown;
  TransitionEvent?: unknown;
}

/**
 * ⚠️ 判据必须基于**注入的** win，不能用全局 window ——
 *    否则 `detectMotionSupport({})` 会用 jsdom 的 document 当 `domSupport` 的依据、
 *    又用空对象去 `createElement`，得到 `style === undefined`，
 *    `styleProp in undefined` 直接抛 TypeError。
 *    SSR 与「显式传空环境」走同一条路径，才不会出现第三种行为。
 */
function canUseDom(win: WinLike): boolean {
  return !!win.document?.createElement;
}

function makePrefixMap(styleProp: string, eventName: string): Record<string, string> {
  const prefixes: Record<string, string> = {};
  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
  prefixes[`Webkit${styleProp}`] = `webkit${eventName}`;
  prefixes[`Moz${styleProp}`] = `moz${eventName}`;
  prefixes[`ms${styleProp}`] = `MS${eventName}`;
  prefixes[`O${styleProp}`] = `o${eventName.toLowerCase()}`;
  return prefixes;
}

function getVendorPrefixes(
  domSupport: boolean,
  win: WinLike,
): Record<string, Record<string, string>> {
  const prefixes: Record<string, Record<string, string>> = {
    animationend: makePrefixMap('Animation', 'AnimationEnd'),
    transitionend: makePrefixMap('Transition', 'TransitionEnd'),
  };
  if (domSupport) {
    // 没有对应的 Event 构造器 ⇒ 浏览器不认识**无前缀**的事件名
    if (!('AnimationEvent' in win)) {
      delete prefixes.animationend?.animation;
    }
    if (!('TransitionEvent' in win)) {
      delete prefixes.transitionend?.transition;
    }
  }
  return prefixes;
}

export interface MotionSupport {
  /** 两者都有 ⇒ 支持动画。为 false 时步进队列退化为 `prepare → prepared` */
  supported: boolean;
  /** 实际要监听的 animationend 事件名（可能带前缀） */
  animationEndName: string;
  /** 实际要监听的 transitionend 事件名 */
  transitionEndName: string;
}

let cached: MotionSupport | null = null;

/**
 * 探测并缓存结果。
 *
 * @param win 注入点，仅测试用。默认取全局 `window`。
 */
export function detectMotionSupport(win?: WinLike): MotionSupport {
  if (cached && !win) return cached;

  const target: WinLike =
    win ?? (typeof window !== 'undefined' ? (window as unknown as WinLike) : {});
  const domSupport = canUseDom(target);
  const vendorPrefixes = getVendorPrefixes(domSupport, target);

  let style: Record<string, unknown> = {};
  if (domSupport) {
    style = target.document?.createElement('div').style as unknown as Record<string, unknown>;
  }

  const prefixedEventNames: Record<string, string> = {};

  function getVendorPrefixedEventName(eventName: string): string {
    if (prefixedEventNames[eventName]) {
      return prefixedEventNames[eventName];
    }
    const prefixMap = vendorPrefixes[eventName];
    if (prefixMap) {
      const stylePropList = Object.keys(prefixMap);
      for (const styleProp of stylePropList) {
        if (Object.hasOwn(prefixMap, styleProp) && styleProp in style) {
          prefixedEventNames[eventName] = prefixMap[styleProp] ?? '';
          return prefixedEventNames[eventName];
        }
      }
    }
    return '';
  }

  const animationEnd = getVendorPrefixedEventName('animationend');
  const transitionEnd = getVendorPrefixedEventName('transitionend');

  const result: MotionSupport = {
    supported: !!(animationEnd && transitionEnd),
    animationEndName: animationEnd || 'animationend',
    transitionEndName: transitionEnd || 'transitionend',
  };

  if (!win) cached = result;
  return result;
}

/** 只取布尔值 —— `useMotionStatus` 的 `supportMotion` 默认值。 */
export function detectSupportMotion(): boolean {
  return detectMotionSupport().supported;
}
