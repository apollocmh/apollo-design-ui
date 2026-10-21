/**
 * 异步加载的「代次」守卫（2026-10-21 审计 A05）。
 *
 * 页面在路由快速切换时会并发发起多个加载；若旧请求晚于新请求 resolve，
 * 不加守卫就会用旧数据覆盖新页面。用法：
 *
 *   const guard = createRequestGuard();
 *   const token = guard.next();
 *   const data = await load();
 *   if (!guard.isCurrent(token)) return; // 已被更新的请求取代
 *   apply(data);
 */
export interface RequestGuard {
  /** 开启新一轮请求，返回本次代次。 */
  next(): number;
  /** 本次代次是否仍是当前请求。 */
  isCurrent(token: number): boolean;
}

export function createRequestGuard(): RequestGuard {
  let generation = 0;
  return {
    next(): number {
      generation += 1;
      return generation;
    },
    isCurrent(token: number): boolean {
      return token === generation;
    },
  };
}
