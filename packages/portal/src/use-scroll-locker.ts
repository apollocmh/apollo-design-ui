/**
 * `useScrollLocker` —— `@rc-component/portal@2.2.1` `es/useScrollLocker.js` 的 Vue 版。
 *
 * 作用：锁 `open` 期间把 `html body` 的纵向滚动关掉；若 body 本来就有滚动条，
 * 再用 `width: calc(100% - Npx)` 把滚动条占的宽度补回去（否则页面会横向抖一下）。
 *
 * 契约逐条对齐上游：
 *   1. 锁的 id 形如 `apollo-util-locker-{时间戳}_{序号}` —— **每个实例一个**，
 *      所以多层浮层同时锁、逐层解锁不会互相踩（`updateCSS`/`removeCSS` 按 key 幂等）；
 *   2. 解锁与**作用域销毁**都要移除（上游是 effect 的 cleanup）；
 *   3. `width` 补偿**只在 `isBodyOverflowing()` 为真时**才写（上游的 `isOverflow` 判据）。
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

/** 生成 `html body { ... }` 的锁样式（上游逐字，含那两处缩进）。 */
function lockStyle(): string {
  const scrollbarSize = getTargetScrollBarSize(document.body).width;
  const isOverflow = isBodyOverflowing();
  return `
html body {
  overflow-y: hidden;
  ${isOverflow ? `width: calc(100% - ${scrollbarSize}px);` : ''}
}`;
}

export function useScrollLocker(lock: MaybeRefOrGetter<boolean>): void {
  uuid += 1;
  const id = `${UNIQUE_ID}_${uuid}`;
  const mergedLock = computed(() => !!toValue(lock));

  watch(
    mergedLock,
    (locked) => {
      if (locked) {
        updateCSS(lockStyle(), id);
      } else {
        removeCSS(id);
      }
    },
    { immediate: true, flush: 'post' },
  );

  onScopeDispose(() => {
    removeCSS(id);
  });
}
