/**
 * 边框宽度采样器 —— `BorderBeam` 的 `useBorderSize` 专用（Issue #50）。
 *
 * ── 为什么需要轮询 ────────────────────────────────────────────────────────────
 * 宿主 `border-width` 变化**既不触发** ResizeObserver（`box-sizing: border-box` 下
 * border-box 外框尺寸不变），也没有对应事件；上游 antd 因此只在 `domNode` 变化时读一次
 * （`useEffect(..., [domNode])`）。本仓选择「跟随运行时变化」= **有意的增强**
 * （已登记在 README 差异表）。
 *
 * ── 为什么要共享 ──────────────────────────────────────────────────────────────
 * 「每实例一个 500ms 定时器」在下面两种场景下成本不可忽略，故这里做两件事：
 *   1. **共享调度**：模块级**唯一**一个定时器，实例只注册回调；实例归零即停表。
 *      500 个实例 ⇒ 1 个定时器（而不是 500 个）。
 *   2. **隐藏页跳过**：`document.hidden` 时不采样 —— 浏览器对后台标签的 interval
 *      节流（≥1s）省不掉 `getComputedStyle` 的样式重算，索性整轮跳过；
 *      **回到可见时立刻补一次**，避免状态滞后到下一个 tick。
 *
 * ⚠️ 订阅返回的退订函数必须在 scope 销毁时调用（否则定时器不会停）。
 */

/** 采样间隔（ms）。与原先的逐实例轮询保持一致。 */
const SAMPLE_INTERVAL = 500;

const readers = new Set<() => void>();

let timer: ReturnType<typeof setInterval> | undefined;
let visibilityBound = false;

const isHidden = (): boolean => typeof document !== 'undefined' && document.hidden === true;

function tick(): void {
  if (isHidden()) return;
  for (const read of readers) {
    read();
  }
}

function onVisibilityChange(): void {
  // 回到可见 ⇒ 立刻补一次（隐藏期间的样式变化不该等到下一个 tick 才反映）
  if (!isHidden()) tick();
}

function start(): void {
  if (timer === undefined) {
    timer = setInterval(tick, SAMPLE_INTERVAL);
  }
  if (!visibilityBound && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = true;
  }
}

function stop(): void {
  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }
  if (visibilityBound && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    visibilityBound = false;
  }
}

/** 注册一个采样回调；返回退订函数。第一个订阅者启动共享定时器，最后一个退订时停表。 */
export function subscribeBorderSample(read: () => void): () => void {
  readers.add(read);
  start();
  return () => {
    readers.delete(read);
    if (readers.size === 0) {
      stop();
    }
  };
}

/** 测试辅助：当前订阅者数量（生产代码不要用）。 */
export function borderSamplerSize(): number {
  return readers.size;
}
