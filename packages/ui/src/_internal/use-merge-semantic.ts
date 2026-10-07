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
 * ── `schema`（嵌套语义槽）—— **2026-10-03 补齐** ──────────────────────────────
 *
 * antd 的第四参 `schema` 用 `_default` 把「字符串形态的嵌套键」落到指定子槽
 * （`classNames.popup = 'x'` ≡ `classNames.popup = { root: 'x' }`），并在最后用
 * `fillObjectBySchema` 保证嵌套键**恒为对象**。
 *
 * 本仓此前没有它，用「只要有一侧是对象就递归」绕过 —— 那在**字符串与对象混用**时
 * 会产垃圾键（`Object.keys('x')`）。antd 6.6.4 里 **9 个组件**传了 schema
 * （`select` / `cascader` / `color-picker` / `menu` / `tabs` / `image` / `splitter` /
 * `input.Search` / `table`），Table 是第一个**真的需要**它的（`body.cell` / `header.cell`）。
 *
 * ⚠️ **两条语义并存、不能合并**：不给 schema 时保持本仓既有行为（7 个消费者钉住它），
 *    给了 schema 才走 antd 的 `mergeClassNamesBySchema`。
 *    判据见 `__tests__/use-merge-semantic.test.ts` 的「反向哨兵」那一条。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明各组件的**合并顺序声明**是对的。本模块只保证「给定顺序，合并结果正确」；
 *     顺序本身由各组件的 compat 用例与 antd 对照（Empty 见 `__tests__/semantic.test.ts`）。
 *   - 没证明**所有该传 schema 的组件都传了**。schema 档 2026-10-03 实现，
 *     select / cascader / color-picker / tabs / image（×2）/ splitter 已补第四参；
 *     menu 无语义通道、`input.Search` 未实现（见 `docs/KNOWN-ISSUES.md` §2 留痕）。
 *
 *   ⚠️ 无 schema 的宽松路径（`mergeClassNames`）**仍在服务既有消费者**：它在
 *     「字符串 + 对象混用」时会产垃圾键（`Object.keys('x')`）。这条**曾**登记在
 *     `docs/KNOWN-ISSUES.md`，该文件的 §1 已于 2026-10-07 清零、登记项转入 §2 的
 *     「已修 / 已裁决」；但宽松路径本身**未改**（7 个既有消费者的用例钉住它）。
 *     若将来统一到 schema 档，需同步改这 7 处并重跑它们的 L4/L6。
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
  const acc: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source) continue;
    const record = source as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const cur = record[key];
      const prev = acc[key];
      // 嵌套语义对象（如 Select 的 classNames.popup.{root,list,listItem}）递归合并；
      // 叶子值按 clsx 拼接（select 期 AutoComplete 抓出：浅合并在 popup 上丢数据）
      if (isPlainRecord(cur) || isPlainRecord(prev)) {
        acc[key] = mergeClassNames((prev ?? {}) as never, (cur ?? {}) as never);
      } else {
        acc[key] = clsx(prev as string | undefined, cur as string | undefined);
      }
    }
  }
  return acc as Partial<CN>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// schema（嵌套语义槽）—— antd `useMergeSemantic` 的第四参
// ---------------------------------------------------------------------------

/**
 * schema 的**键名首字符**集合。
 *
 * 与 antd 的 `ValidChar`（`_util/type.ts:91`）**逐字相同**：**只有小写 a–z**。
 * 这不是「随便写的」—— 它正是让 `_default`（下划线开头）**不落进**索引签名、
 * 从而不与 `{ _default?: string }` 冲突的机制。
 * ⇒ 别「顺手」把大写或下划线加进来（会让 `SemanticSchema` 立刻变成 `never` 交叉）。
 */
type LowerChar =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';

/**
 * 嵌套语义槽的映射表。与 antd 的 `SemanticSchema` 同构。
 *
 * `_default: 'root'` 的语义（**逐条来自 antd 的 `mergeClassNames`**）：
 *   - 该键收到**普通对象** ⇒ 递归按子 schema 合并；
 *   - 该键收到**非对象**（字符串）⇒ 落到 `acc[key][_default]`（即 `classNames.popup = 'x'`
 *     ≡ `classNames.popup = { root: 'x' }`）；
 *   - **没有** `_default` 的子 schema（如 `image` 的 `placeholder: {}`）⇒ 只保证该键
 *     恒为对象（`fillObjectBySchema` 的 `||= {}`），不做字符串转换。
 */
export type SemanticSchema = { _default?: string } & {
  [key: `${LowerChar}${string}`]: SemanticSchema;
};

/**
 * 按**任意字符串键**读子 schema。
 *
 * ⚠️ 必须走这层 cast：`SemanticSchema` 的索引签名是 `` `${LowerChar}${string}` ``
 *    （antd 的 `ValidChar` 口径，见上面的注释），而 `Object.keys()` 给的是 `string`
 *    ⇒ 直接写 `schema[key]` 会 **TS7053**。这里的 cast 是**诚实的**：运行时 schema 的键
 *    本来就来自调用方写的对象字面量，`Object.keys` 拿到的正是那些键。
 */
function subSchema(schema: SemanticSchema, key: string): SemanticSchema | undefined {
  return (schema as Record<string, SemanticSchema | undefined>)[key];
}

/**
 * 按 schema 补齐对象结构（antd `fillObjectBySchema` 逐字）。
 *
 * 两条判据：
 *   ① `_default` 键 ⇒ `newObj[key] ||= {}`（保证**至少是空对象**，不会残留 `undefined`）；
 *   ② 其余子 schema ⇒ 递归（空 schema `{}` 会让该键变成 `{}`）。
 */
export function fillObjectBySchema(
  obj: Record<string, unknown> | undefined,
  schema: SemanticSchema,
): Record<string, unknown> {
  const newObj: Record<string, unknown> = { ...(obj ?? {}) };
  for (const key of Object.keys(schema)) {
    if (subSchema(schema, key)?._default) {
      newObj[key] ||= {};
    } else {
      newObj[key] = fillObjectBySchema(
        newObj[key] as Record<string, unknown> | undefined,
        subSchema(schema, key) as SemanticSchema,
      );
    }
  }
  return newObj;
}

/**
 * **带 schema** 的 classNames 合并（antd `mergeClassNames(schema, ...classNames)` 逐字）。
 *
 * ⚠️ 与下面**无 schema** 的 `mergeClassNames` 是**两条不同的语义**，不要合并：
 *    - 无 schema：只要有一侧是对象就**递归**（本仓在 select/auto-complete 期加的行为，
 *      比 antd 更宽松，且已被 7 个组件的既有用例钉住）；
 *    - 有 schema：**只有 schema 声明过的键**才特殊处理，其余键一律 `clsx` 平铺（antd 语义）。
 *
 *    两者的差别在「字符串 vs 对象混用」时可见：
 *      `classNames: { popup: 'x' }` 与 `{ popup: { root: 'y' } }` 两个来源
 *      —— schema 版给 `popup.root = 'x y'`（正确）；无 schema 版会把 `'x'` 当对象递归
 *      （`Object.keys('x')` ⇒ 垃圾键）。这正是 antd 需要 `_default` 的原因。
 */
export function mergeClassNamesBySchema<CN extends object>(
  schema: SemanticSchema,
  ...sources: readonly (Partial<CN> | undefined)[]
): Partial<CN> {
  const acc: Record<string, unknown> = {};
  for (const source of sources) {
    if (!source) continue;
    const record = source as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const keySchema = subSchema(schema, key);
      const cur = record[key];
      if (keySchema) {
        if (isPlainRecord(cur)) {
          acc[key] = mergeClassNamesBySchema(keySchema, (acc[key] ?? {}) as never, cur as never);
        } else {
          const defaultField = keySchema._default;
          if (defaultField) {
            const target = (acc[key] ?? {}) as Record<string, unknown>;
            target[defaultField] = clsx(
              target[defaultField] as string | undefined,
              cur as string | undefined,
            );
            acc[key] = target;
          }
        }
      } else {
        acc[key] = clsx(acc[key] as string | undefined, cur as string | undefined);
      }
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
 * @param schema **嵌套语义槽**的映射表（antd 第四参）。给了它就会：
 *   ① classNames 走 `mergeClassNamesBySchema`（`_default` 的字符串→对象转换）；
 *   ② 两个结果都过一遍 `fillObjectBySchema`（保证嵌套键恒为对象）。
 *   ⚠️ 不给时**保持本仓既有行为**（无 schema 的递归合并）—— 7 个既有消费者不受影响。
 */
export function useMergeSemantic<P extends object, CN extends object, ST extends object>(
  classNamesSources: readonly MaybeSource<SemanticInput<Partial<CN>, P> | undefined>[],
  stylesSources: readonly MaybeSource<SemanticInput<Partial<ST>, P> | undefined>[],
  props: P,
  schema?: SemanticSchema,
): UseMergeSemanticResult<CN, ST> {
  const info: SemanticInfo<P> = { props };

  const classNames = computed(() => {
    const resolved = classNamesSources.map((source) =>
      resolveSemantic<Partial<CN>, P>(toValue(source), info),
    );
    const merged = schema
      ? mergeClassNamesBySchema<CN>(schema, ...resolved)
      : mergeClassNames<CN>(...resolved);
    return (schema ? fillObjectBySchema(merged as never, schema) : merged) as Partial<CN>;
  });

  const styles = computed(() => {
    const resolved = stylesSources.map((source) =>
      resolveSemantic<Partial<ST>, P>(toValue(source), info),
    );
    const merged = mergeStyles<ST>(...resolved);
    return (schema ? fillObjectBySchema(merged as never, schema) : merged) as Partial<ST>;
  });

  return { classNames, styles };
}
