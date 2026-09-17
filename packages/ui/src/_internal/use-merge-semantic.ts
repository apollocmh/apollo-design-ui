/**
 * 语义化 `classNames` / `styles` 的合并。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/hooks/useMergeSemantic/index.js`（**逐条对齐**）。
 *
 * 为什么单独抽出来：72 个组件里有 60 多个都有 `classNames` / `styles`，合并语义
 * 一旦不一致，就会出现「Button 的覆盖优先级和 Empty 不一样」这类只有用户才会发现的问题。
 * 所以合并规则集中在这里，组件只声明「合并哪些来源、按什么顺序」。
 *
 * ── 与 antd 的对应关系（合并顺序是契约，不能改）────────────────────────────────
 *
 * ```
 * // antd（Empty）
 * const [mergedClassNames, mergedStyles] = useMergeSemantic(
 *   [contextClassNames, classNames],                          // classNamesList
 *   [contextStyles, contextStyleRoot, styles, styleRoot],     // stylesList
 *   { props },
 * );
 * ```
 *
 * 其中 `contextStyleRoot = useSemanticRootStyle(contextStyle)`、`styleRoot = useSemanticRootStyle(style)`，
 * 即把 `style` 这个平铺的 prop 包成 `{ root: style }` 再进合并。
 *
 * 三条必须逐字保留的判据：
 *   1. **classNames 是「拼接」不是「覆盖」** —— `clsx(acc[key], curVal)`，同名键会连起来。
 *   2. **styles 是「逐键浅合并、后者胜」** —— 与 classNames 不同，这里不是拼接。
 *   3. **`style` prop 排在 `styles.root` 之后** —— 所以 `style` 会**覆盖** `styles.root`。
 *      这条最反直觉，也最容易被「顺手改成更合理的顺序」。
 *
 * ── 函数式变体（裁决 `empty-semantic-fn` = B：支持）───────────────────────────
 *
 * antd 允许传 `(info: { props }) => 对象`。我们在 `resolveSemantic` 里逐字对应：
 * 判据是 `isFunction(value) ? value(info) : value`，**没有**额外的「只在需要时求值」优化
 * —— 那种优化会让函数式与对象式的行为出现差异。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明各组件的**合并顺序声明**是对的。本模块只保证「给定顺序，合并结果正确」；
 *     顺序本身由各组件的 compat 用例与 antd 对照（Empty 见 `__tests__/semantic.test.ts`）。
 *   - 没覆盖 antd 的 `schema` 分支（嵌套语义对象）。Empty 的 schema 是 `undefined`，
 *     而 schema 分支要等出现第一个**嵌套**语义对象（如 Table 的 `header.cell`）再实现 ——
 *     提前写等于凭想象实现一条没人用过的路径。
 */

import { isFunction } from '@apollo-design/utils';
import {
  type ComputedRef,
  type CSSProperties,
  computed,
  type MaybeRefOrGetter,
  toValue,
} from 'vue';

/** 函数式语义化拿到的上下文。与 antd 的 `{ props }` 同构。 */
export interface SemanticInfo<P> {
  props: P;
}

/** 对象式或函数式的语义化输入。 */
export type SemanticInput<T, P> = T | ((info: SemanticInfo<P>) => T);

/** 任意可响应化的输入。普通值、ref、getter 都接受（与 `toValue` 同构）。 */
export type MaybeSource<T> = MaybeRefOrGetter<T>;

/** `clsx` 在本仓库的等价物：过滤假值后用空格连接。 */
function clsx(...values: unknown[]): string {
  return values.filter((v) => typeof v === 'string' && v !== '').join(' ');
}

/**
 * 求值一个语义化输入。
 *
 * 与 antd 的 `resolveStyleOrClass(value, info)` 逐字对应 —— 包括
 * **只在 `isFunction` 时求值**这一点：传 `null` / `undefined` 会原样返回，
 * 由下游的 `filter(Boolean)` 丢掉。
 */
export function resolveSemantic<T, P>(
  value: SemanticInput<T, P> | undefined | null,
  info: SemanticInfo<P>,
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return isFunction(value) ? (value as (i: SemanticInfo<P>) => T)(info) : value;
}

/**
 * 合并 classNames。**拼接**语义：同名键连起来，不覆盖。
 *
 * 与 antd 的 `mergeClassNames(schema, ...classNames)` 在 `schema === undefined` 时等价。
 *
 * ⚠️ 实现里有一次类型断言（`as Record<string, string | undefined>`）。
 *    它**不是**类型漏洞，而是「语义键集合由调用方的泛型决定」这一事实的必然结果：
 *    函数体只做键的遍历与字符串拼接，不认识任何具体键。用 `as any` 才是漏洞，
 *    这里断言到的是精确的中间形态。
 */
export function mergeClassNames<CN extends object>(
  ...sources: readonly (Partial<CN> | undefined)[]
): Partial<CN> {
  const acc: Record<string, string | undefined> = {};
  for (const source of sources) {
    if (!source) continue;
    const record = source as Record<string, string | undefined>;
    for (const key of Object.keys(record)) {
      acc[key] = clsx(acc[key], record[key]);
    }
  }
  return acc as Partial<CN>;
}

/**
 * 合并 styles。**逐键浅合并、后者胜** —— 注意与 classNames 的语义不同。
 *
 * 与 antd 的 `mergeStyles(...styles)` 等价。断言理由同 `mergeClassNames`。
 */
export function mergeStyles<ST extends object>(
  ...sources: readonly (Partial<ST> | undefined)[]
): Partial<ST> {
  const acc: Record<string, CSSProperties | undefined> = {};
  for (const source of sources) {
    if (!source) continue;
    const record = source as Record<string, CSSProperties | undefined>;
    for (const key of Object.keys(record)) {
      acc[key] = { ...acc[key], ...record[key] };
    }
  }
  return acc as Partial<ST>;
}

/**
 * 把平铺的 `style` 包成 `{ root: style }`。
 *
 * 与 antd 的 `useSemanticRootStyle(style, key = 'root')` 等价 —— 包括
 * 「`style` 为空时返回 `undefined` 而不是 `{ root: undefined }`」这一点：
 * 后者会让 `mergeStyles` 多产出一个 `root` 键，进而在 DOM 上多出一个空的 `style=""`。
 */
export function semanticRootStyle(
  style: CSSProperties | undefined,
  key = 'root',
): Record<string, CSSProperties> | undefined {
  return style ? { [key]: style } : undefined;
}

/**
 * 把「可能为空的样式」转成可以直接 `v-bind` 的属性对象。
 *
 * 空样式返回 `{}`（**连 `style` 这个键都没有**），非空返回 `{ style }`。
 *
 * ── 为什么必须做这一步（2026-09-18，empty 实测）──────────────────────────────
 *
 * `mergeStyles()` 的返回值**恒**是对象（可能是 `{}`）。直接绑 `:style` 时：
 *
 * | 渲染路径 | 结果 |
 * |---|---|
 * | 客户端 | `patchStyle` 会把空样式移除 —— 没有 `style` 属性 ✓ |
 * | **SSR** | `ssrRenderAttrs` 对 `style` 键是**无条件**输出的 ⇒ 渲染出 `style=""` ✗ |
 *
 * React（antd）在样式为空时**不输出该属性**。所以 SSR 产物会与上游有差异，
 * 而且每个元素多 9 字节 —— 72 个组件 × 多层结构累积起来是可观的体积。
 *
 * 实测：Empty 一层就有 3 个元素带 `style=""`；改成 `v-bind="styleAttrs(x)"` 后归零。
 *
 * ⚠️ 这个差异 L4 **测不出来** —— 投影会把「没有 style 属性」与 `style=""`
 *    都归一化成空串（`(node.style ?? []).join(';')` 两边都是 `''`）。
 *    它是被渲染 SSR 预览页时肉眼发现的，所以既有 L1 断言也有这里。
 *
 * ⚠️ 所有用 `useMergeSemantic` 的组件都应该这样绑样式，而不是 `:style="mergedStyles.x"`。
 */
export function styleAttrs(style: CSSProperties | undefined): { style?: CSSProperties } {
  if (!style) return {};
  const record = style as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (record[key] !== undefined) return { style };
  }
  return {};
}

export interface UseMergeSemanticResult<CN extends object, ST extends object> {
  classNames: ComputedRef<Partial<CN>>;
  styles: ComputedRef<Partial<ST>>;
}

/**
 * 响应式版本的 `useMergeSemantic`。
 *
 * 与 antd 的差别只有一处、且是平台差异（PLATFORM）：antd 每次渲染都重跑一遍合并，
 * 我们用 `computed` 缓存 —— 语义相同，但**依赖必须可追踪**，所以来源要用
 * `() => value` 的形式传，而不是先取值再传。
 *
 * @param classNamesSources 按优先级从低到高排列（后者拼接在前者之后）
 * @param stylesSources 按优先级从低到高排列（后者覆盖前者）
 * @param props 传给函数式变体的 `info.props`
 */
export function useMergeSemantic<P extends object, CN extends object, ST extends object>(
  classNamesSources: readonly MaybeSource<SemanticInput<Partial<CN>, P> | undefined>[],
  stylesSources: readonly MaybeSource<SemanticInput<Partial<ST>, P> | undefined>[],
  props: P,
): UseMergeSemanticResult<CN, ST> {
  const info: SemanticInfo<P> = { props };

  const classNames = computed(() =>
    mergeClassNames<CN>(
      ...classNamesSources.map((source) => resolveSemantic<Partial<CN>, P>(toValue(source), info)),
    ),
  );

  const styles = computed(() =>
    mergeStyles<ST>(
      ...stylesSources.map((source) => resolveSemantic<Partial<ST>, P>(toValue(source), info)),
    ),
  );

  return { classNames, styles };
}
