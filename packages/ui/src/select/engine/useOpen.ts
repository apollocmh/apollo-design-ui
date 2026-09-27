/**
 * rc-select `hooks/useOpen.js` + `hooks/useLock.js` 的 Vue 版。
 *
 * ── 为什么要单独一个文件（这是本组件最容易写错的地方）──────────────────────
 *
 * 1. **关闭是延迟的**：`toggleOpen(false)` 走 `MessageChannel`（宏任务）才落地，
 *    目的是让「点击浮层内部」能在同一个任务里把开关掰回来（rc 的 `taskIdRef`
 *    机制：后发的调用让先发的作废）。
 * 2. **打开是同步的**：`toggleOpen(true)` 立即生效。
 * 3. **`rawOpen` 与 `mergedOpen` 会分叉**：`postOpen`（disabled / 空列表）可以把
 *    「想开」压成「不开」，但 `rawOpen` 保留用户意图 —— 清搜索值只看 `rawOpen`
 *    （否则 `notFoundContent={null}` 且无匹配时，用户的输入会被自己吃掉）。
 * 4. **SSR**：挂载前恒 false（本仓 Portal 在 SSR 下不可用，与 rc 同源）。
 */

import { useControlledValue } from '@apollo-design/utils';
import { computed, onMounted, type Ref, ref } from 'vue';

/** rc 的 `internalMacroTask`：MessageChannel 一次宏任务。 */
function macroTask(fn: () => void, times = 1): void {
  if (times <= 0 || typeof MessageChannel === 'undefined') {
    fn();
    return;
  }
  const channel = new MessageChannel();
  channel.port1.onmessage = () => {
    macroTask(fn, times - 1);
  };
  channel.port2.postMessage(null);
}

export interface UseOpenOptions {
  defaultOpen: () => boolean | undefined;
  getOpen: () => boolean | undefined;
  /** 受控/非受控的统一出口（onPopupVisibleChange + update:open）。 */
  onOpen: (open: boolean) => void;
  /** rc 的 `postOpen`：把「想开」压成「实际开」。 */
  postOpen: (open: boolean) => boolean;
}

export interface UseOpenReturn {
  /** 用户意图上的 open（未经 postOpen）。 */
  rawOpen: Ref<boolean>;
  /** 实际生效的 open。 */
  mergedOpen: Ref<boolean>;
  /** `next` 省略 = toggle。 */
  toggleOpen: (next?: boolean, config?: { cancelFun?: () => boolean }) => void;
  /** 关闭期间锁住选项列表（防止关闭动画期间列表被替换）。 */
  lock: Ref<boolean>;
}

export function useOpen(options: UseOpenOptions): UseOpenReturn {
  const [internalOpen, setInternalOpen] = useControlledValue<boolean>({
    defaultValue: () => options.defaultOpen() ?? false,
    getValue: () => options.getOpen(),
    onChange: (next: boolean) => options.onOpen(next),
  });

  const rendered = ref(false);
  onMounted(() => {
    rendered.value = true;
  });

  const rawOpen = computed(() => (rendered.value ? internalOpen.value : false));
  const mergedOpen = computed(() => options.postOpen(rawOpen.value));

  const lock = ref(false);
  let taskId = 0;

  const toggleOpen = (next?: boolean, config: { cancelFun?: () => boolean } = {}): void => {
    taskId += 1;
    const id = taskId;
    const nextOpen = typeof next === 'boolean' ? next : !mergedOpen.value;
    lock.value = !nextOpen;

    const triggerUpdate = (): void => {
      if (id !== taskId) return;
      if (config.cancelFun?.()) return;
      if (mergedOpen.value !== nextOpen) {
        setInternalOpen(nextOpen);
      }
      lock.value = false;
    };

    if (nextOpen) {
      triggerUpdate();
    } else {
      macroTask(triggerUpdate);
    }
  };

  return { rawOpen, mergedOpen, toggleOpen, lock };
}

/**
 * rc `hooks/useLock.js`：短时锁。
 *
 * `setLock(true)` 后 250ms 内 `getLock()` 恒为 true（即使中间 setLock(false)），
 * 用于「Backspace 只在**首次**按下且搜索为空时删 tag」。
 */
export function useLock(duration = 250): [() => boolean | null, (locked: boolean) => void] {
  const lockRef = ref<boolean | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const doLock = (locked: boolean): void => {
    if (locked || lockRef.value === null) {
      lockRef.value = locked;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      lockRef.value = null;
    }, duration);
  };

  return [() => lockRef.value, doLock];
}
