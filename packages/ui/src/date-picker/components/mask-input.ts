/**
 * 掩码模式的输入框行为（S3）—— 上游 `PickerInput/Selector/Input.js`（**360 行**）里
 * `format` 存在时才生效的那一半的移植。
 *
 * 读源码作规格（**重新定义**，不搬运实现，H2）。
 *
 * ── 上游怎么做的（三个关键事实）──────────────────────────────────────────────
 *
 * 1. **DOM 不变**：掩码模式**不**渲染多个格子 —— 还是**一个 `<input>`**。
 *    「分段」只体现在 `setSelectionRange(字段的 [start, end))` 上。
 *    ⇒ 这也是本仓把逻辑放进 `Selector` 的 `<input>` 而不是新开组件的原因。
 * 2. **文本是「本地状态」**：上游 `Input` 有 `internalInputValue`，
 *    由 `useEffect([value])` 从受控值同步；键入时先改本地、合法才往外发 `onChange`。
 * 3. **原生 `input` 事件在掩码模式是空实现**（`onInternalChange` 的 `if (!format)`）
 *    ⇒ 全部键入走 `keydown`。所以掩码模式**必须**绑 `keydown` 并自己写文本。
 *
 * ── 🚨 五条「写错也不会报错」的判据 ──────────────────────────────────────────
 *
 * 1. **键值过滤只认数字**（`!isNaN(Number(key))`）—— 注意 `Number(' ') === 0`、
 *    `Number('') === 0` ⇒ **空格键会被当成 `0`**。这是上游形态，别「修正」成
 *    `/^\d$/`，那会与 antd 分叉。
 * 2. **`Backspace` / `Delete` 一样**（都清空当前字段并回填字段模板）——
 *    上游把两个 case 合并，没有「删一个字符」的语义。
 * 3. **`leftPad` 回填**：`nextFillText` 会被补到字段长度（`'1'` → `'0001'`）
 *    ⇒ 键入 `1` 到 `YYYY` 得到 `0001`。这是上游的「补零」形态。
 * 4. **`match()` 只查前缀**（见 `mask-format.ts`）⇒ 更长的文本也算匹配，
 *    于是「不匹配就重置成模板」那条不会把长文本吃掉。
 * 5. **必须主动「打一拍」强制重渲染**：React 的受控 `value` 每次渲染都会写回 DOM，
 *    Vue 只在 vnode 重新 patch 时写。不主动 `syncTick += 1` 的话，
 *    「按了不生效的键」（如字母）会让原生字符**留在 DOM 里**。
 */

import { leftPad, offsetCellValue } from '@apollo-design/picker';
import { raf } from '@apollo-design/utils';
import { type ComputedRef, computed, ref, watch } from 'vue';
import { createMaskFormat } from './mask-format';

/** 最多两个 field（单值 1 个、范围 2 个）。上游是「每个 `Input` 实例一份状态」。 */
const MAX_FIELDS = 2;

export interface UseMaskInputOptions {
  /** 掩码格式串；空串 / `undefined` ⇒ 非掩码模式（本 composable 全部逻辑短路）。 */
  maskFormat: () => string | undefined;
  /** 每个 field 的**受控**文本（父级格式化后的值）。 */
  valueTexts: () => string[];
  /** 「聚焦且是当前 field」的激活态（决定失焦时是否还原文本）。 */
  active: (index: number) => boolean;
  preserveInvalidOnBlur: () => boolean;
  /** 文本是否可解析（= `picker-typing.ts` 的 `validateFormat` 的布尔化）。 */
  validateFormat: (text: string) => boolean;
  /** 文本变化（上游 `useInputProps` 的 `onChange`：`onInputChange` + 解析 + `onInvalid`）。 */
  onChange: (index: number, text: string) => void;
  /** 上游 `onModify`：文本 ≠ 模板且 ≠ 受控值时通知外层「去打开浮层」。 */
  onHelp: (index: number) => void;
  /** `Enter` + 文本合法 ⇒ 提交（上游 `Input.onSharedKeyDown`）。 */
  onSubmit: (index: number) => void;
  /** 共享的 `keydown`（Tab / Escape / 用户的 deprecated `onKeyDown`）。 */
  onKeyDown: (index: number, event: KeyboardEvent) => void;
  onFocus: (index: number, event: FocusEvent) => void;
  onBlur: (index: number, event: FocusEvent) => void;
}

export interface MaskInputApi {
  /** 掩码模式是否启用（响应式 —— 渲染函数读它决定绑哪一套事件）。 */
  enabled: ComputedRef<boolean>;
  /** 第 `index` 个输入框应显示的文本。 */
  text: (index: number) => string;
  /** 掩码模式专属的 `<input>` 绑定（值 + 六个事件）。 */
  bind: (index: number) => Record<string, unknown>;
  /** 注册元素（`Selector` 的 `ref` 回调）。 */
  setElement: (index: number, el: HTMLInputElement | null) => void;
}

/** 上游 `Input.js` 的 `format` 分支。 */
export function useMaskInput(options: UseMaskInputOptions): MaskInputApi {
  const enabled = computed(() => {
    const format = options.maskFormat();
    return typeof format === 'string' && format !== '';
  });
  /** 掩码对象（按格式串缓存）。上游 `useMemo(() => new MaskFormat(format || ''), [format])`。 */
  const mask = computed(() => createMaskFormat(options.maskFormat() ?? ''));

  // ============================ 状态 ============================
  /** 本地文本（上游 `internalInputValue`）。**响应式**：它决定 `input.value`。 */
  const internalText = ref<string[]>(Array.from({ length: MAX_FIELDS }, () => ''));
  /** 当前字段下标（上游 `focusCellIndex`）。**响应式**：它决定 `setSelectionRange`。 */
  const focusCellIndex = ref<(number | null)[]>(Array.from({ length: MAX_FIELDS }, () => null));
  /**
   * 强制重渲染的计数器（上游 `forceSelectionSync` 的同款用途）。
   * 渲染函数会读它 ⇒ 自增一次就会重新 patch `value`。
   */
  const syncTick = ref(0);

  // 以下三项**不参与渲染** ⇒ 普通数组即可（PITFALLS 240 的三分类）
  const focused: boolean[] = Array.from({ length: MAX_FIELDS }, () => false);
  const focusCellText: string[] = Array.from({ length: MAX_FIELDS }, () => '');
  const mouseDown: boolean[] = Array.from({ length: MAX_FIELDS }, () => false);
  const elements: (HTMLInputElement | null)[] = Array.from({ length: MAX_FIELDS }, () => null);

  /** 受控值 → 本地文本（上游 `useEffect(() => setInputValue(value), [value])`）。 */
  watch(
    () => options.valueTexts().join('\u0000'),
    () => {
      internalText.value = Array.from(
        { length: MAX_FIELDS },
        (_, i) => options.valueTexts()[i] ?? '',
      );
    },
    { immediate: true },
  );

  /** 失焦后还原文本（上游 `useLockEffect(active, …)`：真值立即、假值下一帧）。 */
  for (let index = 0; index < MAX_FIELDS; index += 1) {
    watch(
      () => options.active(index),
      (next) => {
        const restore = (): void => {
          if (!options.active(index) && !options.preserveInvalidOnBlur()) {
            internalText.value[index] = options.valueTexts()[index] ?? '';
          }
        };
        if (next) {
          restore();
        } else {
          raf(restore);
        }
      },
    );
  }

  // ========================== 选择区间 ==========================
  /** 当前字段的选择区间（上游 `helped ? [0,0] : maskFormat.getSelection(focusCellIndex)`）。 */
  const selectionOf = (index: number): [number, number] =>
    mask.value.getSelection(focusCellIndex.value[index] ?? null);

  // ============================ 变更 ============================
  /**
   * 上游 `Input.triggerInputChange`（`Input.js:108-115`）。
   *
   * ⚠️ 三段顺序**不可换**：先「合法才发 onChange」，再写本地文本，最后 `onModify`。
   */
  const triggerInputChange = (index: number, text: string): void => {
    const trimmed = text.slice(0, mask.value.format.length);
    if (options.validateFormat(trimmed)) {
      options.onChange(index, trimmed);
    }
    internalText.value[index] = trimmed;
    // `onModify`：文本 ≠ 模板且 ≠ 受控值时通知外层（上游 `Input.js:95-102`）
    if (
      trimmed &&
      trimmed !== mask.value.format &&
      trimmed !== (options.valueTexts()[index] ?? '')
    ) {
      options.onHelp(index);
    }
  };

  /**
   * 上游的 `useLayoutEffect`（`Input.js:311-334`）：聚焦时把选择区间对到当前字段。
   *
   * ⚠️ 用**显式依赖**的 `watch` 而不是 `watchEffect`：下面的 `triggerInputChange`
   * 会写 `internalText`，`watchEffect` 自动追踪会**自触发**（Vue 里会成环）。
   */
  watch(
    [
      () => syncTick.value,
      () => enabled.value,
      () => focusCellIndex.value.join(','),
      () => internalText.value.join('\u0000'),
    ],
    () => {
      if (!enabled.value) {
        return;
      }
      const format = mask.value;
      for (let index = 0; index < MAX_FIELDS; index += 1) {
        const el = elements[index];
        if (!el || !focused[index] || mouseDown[index]) {
          continue;
        }
        if (!format.match(internalText.value[index] ?? '')) {
          // 文本与模板不符 ⇒ 重置成模板（首次聚焦时的「显示格式」）
          triggerInputChange(index, format.format);
          continue;
        }
        const [start, end] = selectionOf(index);
        el.setSelectionRange(start, end);
        // Chrome 的锚点位置有偏差 ⇒ 下一帧再对一次（上游逐字）
        raf(() => el.setSelectionRange(start, end));
      }
    },
    { flush: 'post' },
  );

  // ============================ 按键 ============================
  const onMaskKeydown = (index: number, event: KeyboardEvent): void => {
    // 用 mousedown 聚焦时，选择还没定下来 ⇒ 这一下按键整块拦掉（上游逐字）
    if (mouseDown[index]) {
      event.preventDefault();
      return;
    }

    // ① 共享段：Enter + 合法 ⇒ 提交；Tab / Escape；用户的 deprecated onKeyDown
    if (event.key === 'Enter' && options.validateFormat(internalText.value[index] ?? '')) {
      options.onSubmit(index);
    }
    options.onKeyDown(index, event);

    const { key } = event;
    const [selectionStart, selectionEnd] = selectionOf(index);
    const maskCellLen = selectionEnd - selectionStart;
    const cellFormat = mask.value.format.slice(selectionStart, selectionEnd);

    const offsetCellIndex = (offset: number): void => {
      const current = focusCellIndex.value[index] ?? 0;
      const next = Math.min(Math.max(current + offset, 0), Math.max(mask.value.size() - 1, 0));
      focusCellIndex.value[index] = next;
    };

    let nextCellText: string | null = null;
    let nextFillText: string | null = null;

    switch (key) {
      case 'Backspace':
      case 'Delete':
        // ⚠️ 两个键**一样**：清空当前字段并回填字段模板（上游把 case 合并）
        nextCellText = '';
        nextFillText = cellFormat;
        break;
      case 'ArrowLeft':
        nextCellText = '';
        offsetCellIndex(-1);
        break;
      case 'ArrowRight':
        nextCellText = '';
        offsetCellIndex(1);
        break;
      case 'ArrowUp':
      case 'ArrowDown': {
        nextCellText = '';
        const currentText = (internalText.value[index] ?? '').slice(selectionStart, selectionEnd);
        nextFillText = offsetCellValue(currentText, cellFormat, key === 'ArrowUp' ? 1 : -1) ?? '';
        break;
      }
      default:
        // ⚠️ 判据是 `!isNaN(Number(key))` —— 空格（`Number(' ') === 0`）也会命中
        if (!Number.isNaN(Number(key))) {
          nextCellText = (focusCellText[index] ?? '') + key;
          nextFillText = nextCellText;
        }
        break;
    }

    if (nextCellText !== null) {
      focusCellText[index] = nextCellText;
      if (nextCellText.length >= maskCellLen) {
        offsetCellIndex(1);
        focusCellText[index] = '';
      }
    }

    if (nextFillText !== null) {
      const current = internalText.value[index] ?? '';
      const nextFocusValue =
        current.slice(0, selectionStart) +
        leftPad(nextFillText, maskCellLen) +
        current.slice(selectionEnd);
      triggerInputChange(index, nextFocusValue.slice(0, mask.value.format.length));
    }

    // 上游「总是同步一次选择」—— 它同时起到**强制重渲染**的作用（见文件头判据 5）
    syncTick.value += 1;
  };

  // ============================ 绑定 ============================
  const bind = (index: number): Record<string, unknown> => {
    // 🚨 **读一下 `syncTick`**：让调用方的渲染函数**依赖**它。
    //    不读的话「主动打一拍」不会触发重渲染 ⇒ `value` 不会被 patch 回 DOM ⇒
    //    「按了不生效的键」时原生字符会留在输入框里（见文件头判据 5）。
    void syncTick.value;
    return {
      value: internalText.value[index] ?? '',
      onFocus: (event: FocusEvent) => {
        focused[index] = true;
        focusCellIndex.value[index] = 0;
        focusCellText[index] = '';
        options.onFocus(index, event);
        syncTick.value += 1;
      },
      onBlur: (event: FocusEvent) => {
        focused[index] = false;
        options.onBlur(index, event);
      },
      onKeydown: (event: KeyboardEvent) => onMaskKeydown(index, event),
      // ⚠️ 事件名**全小写**（Vue 的 DOM 事件 prop 是 `onMousedown` / `onMouseup`；
      //    写成 `onMouseDown` 会静默不绑定 —— PITFALLS 跨包判据 1）
      onMousedown: () => {
        mouseDown[index] = true;
      },
      onMouseup: (event: MouseEvent) => {
        const anchor = (event.target as HTMLInputElement).selectionStart;
        // ⚠️ `selectionStart` 的类型是 `number | null`（未聚焦 / 不支持的 input 类型时为 null）。
        //    上游是 JS、直接传下去；`getMaskCellIndex(null)` 在运行时等价于 `0`
        //    （`null >= start` / `Math.abs(null - start)` 都按 0 参与运算）
        //    ⇒ 这里显式 `?? 0`，**行为不变**，只是让类型干净。
        focusCellIndex.value[index] = mask.value.getMaskCellIndex(anchor ?? 0);
        syncTick.value += 1;
        mouseDown[index] = false;
      },
      onPaste: (event: ClipboardEvent) => {
        if (mouseDown[index]) {
          event.preventDefault();
          return;
        }
        const pasteText = event.clipboardData?.getData('text') ?? '';
        if (options.validateFormat(pasteText)) {
          triggerInputChange(index, pasteText);
        }
      },
      // 🚨 掩码模式下原生 `input` 事件**不改状态**（上游 `onInternalChange` 的 `if (!format)`）
      //    —— 但**必须自己把 DOM 值写回去**：
      //    React 在受控输入上会于事件后调 `restoreControlledState` 把 DOM 值强制还原，
      //    **Vue 没有这个机制** ⇒ 不主动打一拍的话，浏览器在 keydown 之后落进 DOM 的
      //    原生字符会**留在输入框里**（keydown 里的那次 patch 发生在默认动作**之前**）。
      //    分类 **PLATFORM**（框架差异），登记在 `README.md` §2。
      onInput: () => {
        syncTick.value += 1;
      },
    };
  };

  return {
    enabled,
    text: (index) => internalText.value[index] ?? '',
    bind,
    setElement: (index, el) => {
      elements[index] = el;
    },
  };
}
