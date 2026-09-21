/**
 * 响应式断点观察者 —— grid 的 useBreakpoint 的基础设施。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/responsiveObserver.js`（逐字对齐）。
 *
 * ── 与 antd 的结构差异 ────────────────────────────────────────────────────────
 *
 * antd 在 `useResponsiveObserver()` 里用 `useMemo` 创建实例（同一 token 下共享）。
 * Vue 侧断点值来自 `useToken()`（响应式），但**断点集合在一次会话里实际不变** ——
 * 简单起见这里用**模块级单例**（首个订阅者触发 register，最后一个退订触发 unregister），
 * 与 antd 的「subscribers 为空 → unregister」生命周期逐字对应。
 * ⚠️ 断点值取自**首次使用时的 token**（模块单例不随主题重算）—— screen 断点
 *    可通过 ConfigProvider 覆盖的场景在 antd 里同样会生成新 observer（useMemo 依赖
 *    token），本实现登记为已知边界；主题覆盖 screen 断点的用例出现时再改为
 *    per-context 实例。
 */

import { useToken } from '@apollo-design/theme';
import { getCurrentScope, onScopeDispose } from 'vue';

/** 断点。与 antd 的 `responsiveArray` 一致：**从大到小**。 */
export const responsiveArray = ['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;

export type Breakpoint = (typeof responsiveArray)[number];

/** 与 antd 的 `responsiveArrayReversed` 一致：从小到大（Col 响应式遍历顺序）。 */
export const responsiveArrayReversed = [...responsiveArray].reverse() as Breakpoint[];

export type Screens = Partial<Record<Breakpoint, boolean>>;

/** 确保断点 token 合法有序（antd 的 validateBreakpoints）。非法直接抛错。 */
function validateBreakpoints(token: Record<string, number>): Record<Breakpoint, string> {
  // noUncheckedIndexedAccess 下 Record 索引是 `number | undefined` —— 缺字段本身就是
  // 断点配置非法，与 antd 的 NaN 比较失败同走 throw 分支。
  const val = (name: string): number => {
    const value = token[name];
    if (typeof value !== 'number') {
      throw new Error(`${name} is not a number`);
    }
    return value;
  };
  const revBreakpoints: Breakpoint[] = [...responsiveArray].reverse();
  revBreakpoints.forEach((breakpoint, i) => {
    const breakpointUpper = breakpoint.toUpperCase();
    const screenMin = `screen${breakpointUpper}Min`;
    const screen = `screen${breakpointUpper}`;
    if (!(val(screenMin) <= val(screen))) {
      throw new Error(`${screenMin}<=${screen} fails : !(${val(screenMin)}<=${val(screen)})`);
    }
    if (i < revBreakpoints.length - 1) {
      const screenMax = `screen${breakpointUpper}Max`;
      if (!(val(screen) <= val(screenMax))) {
        throw new Error(`${screen}<=${screenMax} fails : !(${val(screen)}<=${val(screenMax)})`);
      }
      const next = revBreakpoints[i + 1];
      if (next === undefined) {
        return;
      }
      const nextBreakpointUpperMin = next.toUpperCase();
      const nextScreenMin = `screen${nextBreakpointUpperMin}Min`;
      if (!(val(screenMax) <= val(nextScreenMin))) {
        throw new Error(
          `${screenMax}<=${nextScreenMin} fails : !(${val(screenMax)}<=${val(nextScreenMin)})`,
        );
      }
    }
  });
  return getResponsiveMap(token as never);
}

/** 断点 → media query（antd 的 getResponsiveMap：xs 用 max-width，其余 min-width）。 */
function getResponsiveMap(token: {
  screenXSMax: number;
  [key: `screen${string}Min`]: number;
}): Record<Breakpoint, string> {
  return {
    xs: `(max-width: ${token.screenXSMax}px)`,
    sm: `(min-width: ${token.screenSMMin}px)`,
    md: `(min-width: ${token.screenMDMin}px)`,
    lg: `(min-width: ${token.screenLGMin}px)`,
    xl: `(min-width: ${token.screenXLMin}px)`,
    xxl: `(min-width: ${token.screenXXLMin}px)`,
    xxxl: `(min-width: ${token.screenXXXLMin}px)`,
  } as Record<Breakpoint, string>;
}

/**
 * 按 responsiveArray 顺序（从大到小）找到第一个命中的 screens 值。
 * antd 的 `matchScreen` 逐字对齐。
 */
export function matchScreen<T>(
  screens: Screens | undefined | null,
  screenSizes: {
    [key in Breakpoint]?: T;
  },
): T | undefined {
  if (!screens) {
    return undefined;
  }
  for (const breakpoint of responsiveArray) {
    if (screens[breakpoint] && screenSizes?.[breakpoint] !== undefined) {
      return screenSizes[breakpoint];
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// 模块级单例（生命周期与 antd 的 subscribers Map 一致）
// ---------------------------------------------------------------------------

const subscribers = new Map<number, (screens: Screens) => void>();
let subUid = -1;
let screens: Screens = {};
/** register 时使用的断点表（测试重置 unregister 需要） */
let activeMap: Record<Breakpoint, string> | undefined;
const matchHandlers: Record<
  string,
  { mql: MediaQueryList; listener: (event: MediaQueryListEvent) => void }
> = {};

function dispatch(pointMap: Screens): boolean {
  screens = pointMap;
  subscribers.forEach((func) => {
    func(screens);
  });
  return subscribers.size >= 1;
}

function register(responsiveMap: Record<Breakpoint, string>): void {
  activeMap = responsiveMap;
  Object.entries(responsiveMap).forEach(([screen, mediaQuery]) => {
    const listener = (event: MediaQueryListEvent): void => {
      dispatch({ ...screens, [screen]: event.matches });
    };
    const mql = window.matchMedia(mediaQuery);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', listener);
    }
    matchHandlers[mediaQuery] = { mql, listener };
    // antd：注册时立即按当前 match 状态 dispatch 一次（初始化 screens）
    listener({ matches: mql.matches } as MediaQueryListEvent);
  });
}

function unregister(responsiveMap: Record<Breakpoint, string>): void {
  Object.values(responsiveMap).forEach((mediaQuery) => {
    const handler = matchHandlers[mediaQuery];
    if (handler && typeof handler.mql.removeEventListener === 'function') {
      handler.mql.removeEventListener('change', handler.listener);
    }
    delete matchHandlers[mediaQuery];
  });
}

/**
 * 测试辅助：重置单例状态（jsdom 里 matchMedia 桩随测试变化，跨测试必须重置，
 * 否则上一个测试的 screens 会泄漏到下一个 —— 同 utils 的 resetResizeObserver 范式）。
 * @internal 仅供测试使用。
 */
export function resetResponsiveObserverForTests(): void {
  if (activeMap) {
    unregister(activeMap);
  }
  subscribers.clear();
  screens = {};
  subUid = -1;
}

/**
 * 订阅断点变化。返回取消订阅函数（Vue 侧习惯：`onScopeDispose` 自动退订，
 * 与 antd 的 `useLayoutEffect` cleanup 同语义）。
 *
 * ⚠️ subscribe 时**立即回调一次**当前 screens（antd 原样）—— 这是
 * 「订阅即拿到初值」的契约，调用方不需要再读一遍 matchMedia。
 */
export function useResponsiveObserver(): {
  subscribe: (func: (screens: Screens) => void) => () => void;
} {
  const token = useToken();
  const responsiveMap = validateBreakpoints(token.value as never);

  const subscribe = (func: (screens: Screens) => void): (() => void) => {
    if (subscribers.size === 0) {
      register(responsiveMap);
    }
    subUid += 1;
    subscribers.set(subUid, func);
    func(screens);
    const uid = subUid;
    const unsubscribe = (): void => {
      subscribers.delete(uid);
      if (subscribers.size === 0) {
        unregister(responsiveMap);
      }
    };
    if (getCurrentScope()) {
      onScopeDispose(unsubscribe);
    }
    return unsubscribe;
  };

  return { subscribe };
}
