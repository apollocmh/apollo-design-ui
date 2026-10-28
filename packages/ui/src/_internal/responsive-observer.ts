/** Shared media observations, isolated by the current breakpoint query set.
 * Equal maps share listeners; each subscription owns an idempotent release.
 * Theme replacements move subscribers between maps without remounting content.
 * Static Col CSS media queries retain their separately documented defaults.
 * Reference: antd 6.6.4 responsiveObserver; Vue lifecycle and ownership are native.
 */
import { type AliasToken, useToken } from '@apollo-design/theme';
import { computed, getCurrentScope, onScopeDispose, watch } from 'vue';

export const responsiveArray = ['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
export type Breakpoint = (typeof responsiveArray)[number];
export const responsiveArrayReversed: Breakpoint[] = [...responsiveArray].reverse();
export type Screens = Partial<Record<Breakpoint, boolean>>;
type ResponsiveMap = Record<Breakpoint, string>;
type Subscriber = (screens: Screens) => void;

function validateBreakpoints(token: AliasToken): ResponsiveMap {
  const points = [
    { name: 'XS', min: token.screenXSMin, value: token.screenXS, max: token.screenXSMax },
    { name: 'SM', min: token.screenSMMin, value: token.screenSM, max: token.screenSMMax },
    { name: 'MD', min: token.screenMDMin, value: token.screenMD, max: token.screenMDMax },
    { name: 'LG', min: token.screenLGMin, value: token.screenLG, max: token.screenLGMax },
    { name: 'XL', min: token.screenXLMin, value: token.screenXL, max: token.screenXLMax },
    { name: 'XXL', min: token.screenXXLMin, value: token.screenXXL, max: token.screenXXLMax },
    { name: 'XXXL', min: token.screenXXXLMin, value: token.screenXXXL, max: undefined },
  ];
  for (const [index, point] of points.entries()) {
    if (!(point.min <= point.value)) {
      throw new Error(
        `screen${point.name}Min<=screen${point.name} fails : !(${point.min}<=${point.value})`,
      );
    }
    const next = points[index + 1];
    if (next) {
      if (point.max === undefined || !(point.value <= point.max)) {
        throw new Error(
          `screen${point.name}<=screen${point.name}Max fails : !(${point.value}<=${point.max})`,
        );
      }
      if (!(point.max <= next.min)) {
        throw new Error(
          `screen${point.name}Max<=screen${next.name}Min fails : !(${point.max}<=${next.min})`,
        );
      }
    }
  }
  return {
    xs: `(max-width: ${token.screenXSMax}px)`,
    sm: `(min-width: ${token.screenSMMin}px)`,
    md: `(min-width: ${token.screenMDMin}px)`,
    lg: `(min-width: ${token.screenLGMin}px)`,
    xl: `(min-width: ${token.screenXLMin}px)`,
    xxl: `(min-width: ${token.screenXXLMin}px)`,
    xxxl: `(min-width: ${token.screenXXXLMin}px)`,
  };
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

interface Observer {
  screens: Screens;
  subscribers: Map<symbol, Subscriber>;
  handlers: Array<{ mql: MediaQueryList; listener: (event: MediaQueryListEvent) => void }>;
}
const observers = new Map<string, Observer>();
const mapKey = (map: ResponsiveMap) => responsiveArray.map((point) => map[point]).join('|');

function unregister(observer: Observer): void {
  for (const { mql, listener } of observer.handlers) {
    mql.removeEventListener?.('change', listener);
  }
  observer.handlers.length = 0;
}

function attach(map: ResponsiveMap, func: Subscriber): () => void {
  const key = mapKey(map);
  let observer = observers.get(key);
  if (!observer) {
    const current: Observer = { screens: {}, subscribers: new Map(), handlers: [] };
    try {
      for (const point of responsiveArray) {
        const mql = window.matchMedia(map[point]);
        const listener = (event: MediaQueryListEvent): void => {
          current.screens = { ...current.screens, [point]: event.matches };
          for (const subscriber of current.subscribers.values()) subscriber(current.screens);
        };
        mql.addEventListener?.('change', listener);
        current.handlers.push({ mql, listener });
        current.screens[point] = mql.matches;
      }
    } catch (error) {
      unregister(current);
      throw error;
    }
    observers.set(key, current);
    observer = current;
  }
  const owner = observer;
  const uid = Symbol('responsive-subscriber');
  owner.subscribers.set(uid, func);
  func(owner.screens);
  return () => {
    owner.subscribers.delete(uid);
    if (owner.subscribers.size === 0) {
      unregister(owner);
      if (observers.get(key) === owner) observers.delete(key);
    }
  };
}

/** @internal Reset all registered browser listeners between media-query test environments. */
export function resetResponsiveObserverForTests(): void {
  observers.forEach(unregister);
  observers.clear();
}

/** Subscribe to the current viewport immediately and observe subsequent changes.
 * SSR creates no browser listeners. Token updates only reconnect if queries change.
 */
export function useResponsiveObserver(): {
  subscribe: (func: Subscriber) => () => void;
} {
  const token = useToken();
  const responsiveMap = computed(() => validateBreakpoints(token.value));
  // Validate during setup, including SSR, without observing browser globals.
  mapKey(responsiveMap.value);
  const subscribe = (func: Subscriber): (() => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    const stop = watch(
      () => mapKey(responsiveMap.value),
      (_key, _previous, onCleanup) => {
        onCleanup(attach(responsiveMap.value, func));
      },
      { immediate: true, flush: 'sync' },
    );
    let disposed = false;
    const unsubscribe = (): void => {
      if (disposed) return;
      disposed = true;
      stop();
    };
    if (getCurrentScope()) onScopeDispose(unsubscribe);
    return unsubscribe;
  };
  return { subscribe };
}
