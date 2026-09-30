/**
 * 语义槽的归一与合并（G4 · S1）。
 *
 * 契约来源：antd 6.6.4 `es/date-picker/hooks/useMergedPickerSemantic.js`（26 行，
 * 全文已读）+ `_util/hooks/useMergeSemantic`（**本仓已有**：`_internal/use-merge-semantic.ts`）。
 *
 * ```js
 * const [mergedClassNames, mergedStyles] = useMergeSemantic(
 *   [contextClassNames, classNames],
 *   [contextStyles, contextStyleRoot, styles],
 *   { props: mergedProps },
 *   { popup: { _default: 'root' } },        // ← 本仓的 mergeClassNames 没有这个机制
 * );
 * // 之后再：
 * popup.root = clsx(mergedClassNames.popup?.root, popupClassName)
 * popup.root = { ...mergedStyles.popup?.root, ...popupStyle }
 * ```
 *
 * ── 🚨 本组件是「4 个平铺 + 7 个嵌套」，与 tabs 的「8 平铺 + 1 嵌套」不同 ────────
 *
 * ```
 * root | prefix | input | suffix            ← 平铺
 * popup: { root | header | body | content | item | footer | container }   ← 嵌套
 * ```
 *
 * ── 🚨 `_default: 'root'` 这一条本仓必须自己做（读源码 + 实测确认）────────────
 *
 * `classNames.popup` 允许两种形态：
 * - **string**（旧写法）—— 等价于 `popup.root`；
 * - **对象**（新写法）。
 *
 * antd 靠 `useMergeSemantic` 的第四个参数 `{ popup: { _default: 'root' } }` 声明
 * 「string 落到 `popup.root`」；本仓的 `mergeClassNames` **没有**这个机制
 * （它只做递归 + 叶子 clsx），所以在**归一阶段**先转成对象形态再交给它。
 *
 * ⇒ 这就是本文件存在的理由：**一个归一函数 + 一个组装 hook**，而不是在 `.vue` 里内联。
 * 归一是纯函数 ⇒ 可用 `--project unit` 的 node 环境直接测（无需 jsdom）。
 */

import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  type SemanticInfo,
  semanticRootStyle,
} from '../../_internal/use-merge-semantic';
import type {
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  PickerCommonProps,
  PickerPopupSemanticClassNames,
  PickerPopupSemanticStyles,
} from '../interface';

// ---------------------------------------------------------------------------
// 归一（纯函数）
// ---------------------------------------------------------------------------

/** `popup` 只有对象形态的 classNames（归一后）。 */
export interface NormalizedSemanticClassNames extends Omit<DatePickerSemanticClassNames, 'popup'> {
  popup?: PickerPopupSemanticClassNames;
}

/** `popup` 只有对象形态的 styles（归一后）。 */
export interface NormalizedSemanticStyles extends Omit<DatePickerSemanticStyles, 'popup'> {
  popup?: PickerPopupSemanticStyles;
}

/**
 * 把 `classNames.popup` 的 **string 形态**归一成 `{ root: string }`。
 *
 * 上游等价物：`useMergeSemantic` 的 `{ popup: { _default: 'root' } }`。
 * 本仓的 `mergeClassNames` 不认这个配置 ⇒ 在这里先转。
 *
 * ⚠️ 判据是 **`typeof === 'string'`**，不是真值判断 —— `popup: ''`（空串）
 * 也应归一成 `{ root: '' }`（`mergeClassNames` 会把空串当无效值跳过，行为一致，
 * 但形状必须正确，否则后续 `popup.root` 的拼接会写到 `undefined` 上）。
 */
export function normalizePopupClassNames(
  classNames: DatePickerSemanticClassNames | undefined,
): NormalizedSemanticClassNames {
  if (!classNames) {
    return {};
  }
  const { popup, ...rest } = classNames;
  if (typeof popup === 'string') {
    return { ...rest, popup: { root: popup } };
  }
  return { ...rest, ...(popup ? { popup } : {}) };
}

/** `styles.popup` 上游只有对象形态，但防御性归一（`null` ⇒ 不设）。 */
export function normalizePopupStyles(
  styles: DatePickerSemanticStyles | undefined,
): NormalizedSemanticStyles {
  if (!styles) {
    return {};
  }
  const { popup, ...rest } = styles;
  return { ...rest, ...(popup ? { popup } : {}) };
}

/**
 * 把 **deprecated** 的 `popupClassName` / `dropdownClassName` 拼进 `popup.root`。
 *
 * 上游：`popup.root = clsx(mergedClassNames.popup?.root, popupClassName)`。
 * ⚠️ 顺序是「已合并的在前、deprecated prop 在后」（`clsx` 后写在后）。
 */
export function fillPopupClassName(
  merged: NormalizedSemanticClassNames,
  popupClassName: string | undefined,
): NormalizedSemanticClassNames {
  if (!popupClassName) {
    return merged;
  }
  const root = [merged.popup?.root, popupClassName].filter(Boolean).join(' ');
  return { ...merged, popup: { ...merged.popup, root } };
}

/** 把 **deprecated** 的 `popupStyle` 合进 `popup.root`（后者覆盖前者）。 */
export function fillPopupStyle(
  merged: NormalizedSemanticStyles,
  popupStyle: Record<string, string | number> | undefined,
): NormalizedSemanticStyles {
  if (!popupStyle) {
    return merged;
  }
  return { ...merged, popup: { ...merged.popup, root: { ...merged.popup?.root, ...popupStyle } } };
}

// ---------------------------------------------------------------------------
// 组装（响应式）
// ---------------------------------------------------------------------------

export interface UseMergedPickerSemanticOptions {
  /** 上下文（`ConfigProvider` 的 `datePicker.classNames`）。 */
  contextClassNames?: MaybeRefOrGetter<
    DatePickerSemanticValue<DatePickerSemanticClassNames, PickerCommonProps> | undefined
  >;
  /** 组件自己的 `classNames` prop。 */
  classNames?: MaybeRefOrGetter<
    DatePickerSemanticValue<DatePickerSemanticClassNames, PickerCommonProps> | undefined
  >;
  contextStyles?: MaybeRefOrGetter<
    DatePickerSemanticValue<DatePickerSemanticStyles, PickerCommonProps> | undefined
  >;
  /** 上下文里 `datePicker.style` 经 `semanticRootStyle` 处理后的结果。 */
  contextStyleRoot?: MaybeRefOrGetter<DatePickerSemanticStyles | undefined>;
  styles?: MaybeRefOrGetter<
    DatePickerSemanticValue<DatePickerSemanticStyles, PickerCommonProps> | undefined
  >;
  /** deprecated `popupClassName` / `dropdownClassName`。 */
  popupClassName?: MaybeRefOrGetter<string | undefined>;
  /** deprecated `popupStyle`。 */
  popupStyle?: MaybeRefOrGetter<Record<string, string | number> | undefined>;
  /** 传给函数式变体的 `info.props`。 */
  props: PickerCommonProps;
}

export interface UseMergedPickerSemanticResult {
  classNames: ComputedRef<NormalizedSemanticClassNames>;
  styles: ComputedRef<NormalizedSemanticStyles>;
}

/**
 * 合并语义槽（4 平铺 + 7 嵌套），并把两个 deprecated prop 落到 `popup.root`。
 *
 * ⚠️ 与 antd 的差别只有一处（PLATFORM）：antd 每次渲染都重跑合并，本仓用
 * `computed` 缓存（同 `_internal/use-merge-semantic.ts` 的既有取舍）。
 */
export function useMergedPickerSemantic(
  options: UseMergedPickerSemanticOptions,
): UseMergedPickerSemanticResult {
  const info: SemanticInfo<PickerCommonProps> = { props: options.props };

  const classNames = computed<NormalizedSemanticClassNames>(() => {
    // ① 各自归一（string popup ⇒ { root }），再交给既有的递归合并
    const ctx = normalizePopupClassNames(
      resolveSemantic<DatePickerSemanticClassNames, PickerCommonProps>(
        toValue(options.contextClassNames),
        info,
      ),
    );
    const own = normalizePopupClassNames(
      resolveSemantic<DatePickerSemanticClassNames, PickerCommonProps>(
        toValue(options.classNames),
        info,
      ),
    );
    // ② 合并（后者拼接在前者之后）
    const merged = mergeClassNames<NormalizedSemanticClassNames>(ctx, own);
    // ③ deprecated popupClassName / dropdownClassName ⇒ popup.root
    return fillPopupClassName(merged, toValue(options.popupClassName));
  });

  const styles = computed<NormalizedSemanticStyles>(() => {
    const ctx = normalizePopupStyles(
      resolveSemantic<DatePickerSemanticStyles, PickerCommonProps>(
        toValue(options.contextStyles),
        info,
      ),
    );
    const ctxRoot = toValue(options.contextStyleRoot);
    const own = normalizePopupStyles(
      resolveSemantic<DatePickerSemanticStyles, PickerCommonProps>(toValue(options.styles), info),
    );
    // ⚠️ 顺序对齐上游：`[contextStyles, contextStyleRoot, styles]`
    const merged = mergeStyles<NormalizedSemanticStyles>(ctx, normalizePopupStyles(ctxRoot), own);
    return fillPopupStyle(merged, toValue(options.popupStyle));
  });

  return { classNames, styles };
}

/** 供 `.vue` 复用：把上下文里的 `style` 转成语义 root style（上游 `useSemanticRootStyle`）。 */
export { semanticRootStyle };
