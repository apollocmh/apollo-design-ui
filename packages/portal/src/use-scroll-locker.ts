/**
 * `useScrollLocker` —— `@rc-component/portal@2.2.1` `es/useScrollLocker.js` 的 Vue 版。
 *
 * 作用：锁 `open` 期间把 `html body` 的纵向滚动关掉；若 body 本来就有滚动条，
 * 再用 `width: calc(100% - Npx)` 把滚动条占的宽度补回去（否则页面会横向抖一下）。
 *
 * 原始契约来自上游，当前按实际所属文档执行：
 *   1. 锁的 id 形如 `apollo-util-locker-{时间戳}_{序号}` —— **每个实例一个**，
 *      所以多层浮层同时锁、逐层解锁不会互相踩（`updateCSS`/`removeCSS` 按 key 幂等）；
 *   2. 解锁与**作用域销毁**都要移除（上游是 effect 的 cleanup）；
 *   3. `width` 补偿只在所属body溢出且实测滚动条宽度>0时写；覆盖式滚动条不改宽度。
 *
 * ⚠️ 与上游的差异：上游在 `useLayoutEffect` 里做（首帧前生效）；Vue 侧用
 * `flush: 'post'` 的 watch —— 语义等价（都在 DOM 提交后、绘制前）。
 */
import {
  getTargetScrollBarSize,
  isBodyOverflowing,
  removeCSS,
  updateCSS,
} from '@apollo-design/utils';
import { computed, type MaybeRefOrGetter, onScopeDispose, toValue, watch } from 'vue';

const UNIQUE_ID = `apollo-util-locker-${Date.now()}`;

let uuid = 0;

/** Per-document body rule; overlay scrollbars require no width compensation. */
function lockStyle(doc: Document): string {
  const scrollbarSize = getTargetScrollBarSize(doc.body).width;
  const isOverflow = isBodyOverflowing(doc);
  return `
html body {
  overflow-y: hidden;
  ${isOverflow && scrollbarSize > 0 ? `width: calc(100% - ${scrollbarSize}px);` : ''}
}`;
}

export function useScrollLocker(lock: MaybeRefOrGetter<boolean>): void {
  useDocumentScrollLocker(lock, () => (typeof document === 'undefined' ? null : document));
}

/** Internal Portal variant: the public composable retains its document default. */
export function useDocumentScrollLocker(
  lock: MaybeRefOrGetter<boolean>,
  owner: MaybeRefOrGetter<Document | null>,
): void {
  uuid += 1;
  const id = `${UNIQUE_ID}_${uuid}`;
  const mergedLock = computed(() => !!toValue(lock));

  watch(
    [mergedLock, () => toValue(owner)],
    ([locked, doc]) => {
      removeCSS(id);
      if (locked && doc?.head && doc.body) updateCSS(lockStyle(doc), id, doc.head);
    },
    { immediate: true, flush: 'post' },
  );

  onScopeDispose(() => {
    removeCSS(id);
  });
}
