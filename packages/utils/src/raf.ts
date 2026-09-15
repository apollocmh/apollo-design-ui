/**
 * `raf` —— 带取消能力的「下一帧执行」调度器。
 *
 * 契约来源：`@rc-component/util/raf`。
 *
 * ⚠️ 三个必须逐字保留的行为（测试会锁定）：
 *
 *   1. **返回的是包装 id，不是真实的 rAF handle。**
 *      调用方拿到的是自增整数，内部用 `Map<包装id, 真实id>` 映射。
 *      为什么要多一层：`requestAnimationFrame` 的返回值在不同浏览器里类型不同
 *      （甚至可能是对象），统一成 `number` 才能安全地跨模块传递与比较。
 *
 *   2. **`times = 0` 是同步立即执行。**
 *      `callRef(0)` 直接调 `callback()`，不经过任何调度。
 *      这让「跳 0 帧」这个看似无意义的入参有了明确语义，且被 `throttleByAnimationFrame` 之外的地方用到。
 *
 *   3. **`cancel` 必须对任何 id 幂等且不抛错。**
 *      回调执行前已经从 map 里删掉了自己，所以「执行完再 cancel」是常态操作。
 *      此时 `map.get(id)` 返回 `undefined`，`cancelAnimationFrame(undefined)` 必须安全。
 *
 * 环境退化：没有 `requestAnimationFrame`（老浏览器 / 部分 SSR polyfill）时退化为 `setTimeout(cb, 16)`，
 * 约等于 60fps 的一帧。
 */

import { isDev } from './env';

type RafCallback = () => void;

interface WrapperRaf {
  (callback: RafCallback, times?: number): number;
  cancel(id: number): void;
  /** 仅 dev 环境存在。测试用它断言「没有泄漏的待执行帧」。 */
  ids?: () => Map<number, number>;
}

const hasNativeRaf = typeof window !== 'undefined' && 'requestAnimationFrame' in window;

let raf = (callback: FrameRequestCallback): number => setTimeout(callback, 16) as unknown as number;
let caf = (handle: number): void => {
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
};

if (hasNativeRaf) {
  raf = (callback) => window.requestAnimationFrame(callback);
  caf = (handle) => window.cancelAnimationFrame(handle);
}

let rafUUID = 0;
/** 包装 id → 最后一次调度的真实 handle。 */
const rafIds = new Map<number, number>();

function cleanup(id: number): void {
  rafIds.delete(id);
}

const wrapperRaf = ((callback: RafCallback, times = 1): number => {
  rafUUID += 1;
  const id = rafUUID;

  function callRef(leftTimes: number): void {
    if (leftTimes === 0) {
      // 先清理再执行：让「回调里再 cancel 自己」成为安全的空操作
      cleanup(id);
      callback();
      return;
    }
    const realId = raf(() => {
      callRef(leftTimes - 1);
    });
    rafIds.set(id, realId);
  }

  callRef(times);
  return id;
}) as WrapperRaf;

wrapperRaf.cancel = (id: number): void => {
  const realId = rafIds.get(id);
  cleanup(id);
  // realId 可能是 undefined —— caf 必须容忍
  caf(realId as number);
};

// `ids()` 只在 dev 暴露：生产环境没必要为调试保留一个常驻 Map 的读取入口。
// 用 `raf.ids?.()` 而不是 `raf.ids()` 访问，否则生产构建会抛 TypeError。
// L7 构建测试会断言：生产产物里 `raf.ids === undefined`。
if (isDev) {
  wrapperRaf.ids = () => rafIds;
}

export { wrapperRaf as raf };
export default wrapperRaf;

/** 取消一个由 {@link wrapperRaf} 返回的 id。等价于 `raf.cancel(id)`。 */
export function cancelRaf(id: number): void {
  wrapperRaf.cancel(id);
}
