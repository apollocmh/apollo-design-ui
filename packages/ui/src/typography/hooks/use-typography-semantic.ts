/**
 * Typography 的语义化合并。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/hooks/useTypographySemantic.js`（**逐条对齐**）。
 *
 * ── 合并顺序是契约（与 antd 一致，不能改）───────────────────────────────────────
 *
 * ```ts
 * // antd
 * const [mergedClassNames, mergedStyles] = useMergeSemantic(
 *   [contextClassNamesObject, contextClassNames, classNames],
 *   [contextStyles, contextStyleRoot, styles],
 *   { props: mergedProps },
 * );
 * ```
 *
 * 三条与 Empty 不同、容易被「顺手统一」掉的细节：
 *
 *   1. **classNames 的第一个来源是 `{ root: contextClassName }`**，不是
 *      `contextClassNames` 本身。ConfigProvider 的 `components.typography.className`
 *      在 Typography 里落在 `root` 槽位。
 *   2. **styles 的第二个来源是 `contextStyleRoot`（即 `{root: contextStyle}`）**，
 *      而**没有** `styleRoot` —— 组件的 `style` prop 不走合并，由
 *      `InternalTypography` 用 `{...styles.root, ...style}` 自己覆盖（见
 *      `InternalTypography.vue`）。Empty 是反过来的（`style` 也进合并列表）。
 *   3. **`info.props` 是「合并后的 props」**：`{...props, prefixCls: 解析后的前缀,
 *      direction: 合并后的方向}`。所以函数式 `classNames={({props}) => ...}` 拿到的是
 *      **解析后**的 `prefixCls`（`apollo-typography` 前缀的来源），不是用户传的原始值。
 *
 * ── `info.props` 的响应式（比 Empty 更进一步，PLATFORM 改进）───────────────────
 *
 * `useMergeSemantic` 的 `info` 只构造一次，`info.props` 若是快照，函数式语义化在
 * props 变化后就会读到旧值。Empty 传的是 `props` 本身（响应式，但缺 `prefixCls`/
 * `direction` 的合并结果）。
 *
 * 这里用 `Proxy` 在 `props` 之上叠加两个计算属性 —— 读 `info.props.prefixCls` 会在
 * 外层 `computed` 里追踪到 `prefixCls`，其余键原样透传到响应式 `props`。
 * 于是「antd 的 `{...props, prefixCls, direction}`」在 Vue 里既**完整**又**响应式**。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明各组件的合并顺序声明是对的。顺序由 compat 用例与 antd 对照
 *     （见 `__tests__/semantic.test.ts`）。
 *   - `contextClassName` / `contextStyle` 是**快照**（`useComponentConfig` 的
 *     `Object.assign` 把字符串/对象值复制进了新对象）。ConfigProvider 之后改
 *     `components.typography.className` 不会触发更新 —— 与 Empty 同一处限制，
 *     登记在 README §7。`direction` 走 `useDirection()` 避开了这一点（差异 D27）。
 */

import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

import { semanticRootStyle, useMergeSemantic } from '../../_internal/use-merge-semantic';
import {
  type DirectionType,
  useComponentConfig,
  useDirection,
} from '../../config-provider/context';
import type {
  BaseTypographyProps,
  TypographyConfig,
  TypographySemanticClassNames,
  TypographySemanticStyles,
  TypographySemanticValue,
} from '../interface';

export interface UseTypographySemanticResult {
  classNames: ComputedRef<TypographySemanticClassNames>;
  styles: ComputedRef<TypographySemanticStyles>;
  prefixCls: ComputedRef<string>;
  direction: ComputedRef<DirectionType | undefined>;
}

/**
 * @param props 组件自己的 props（响应式）。用作 `info.props` 的底，也是函数式语义化的 `props` 字段。
 * @param customizePrefixCls 用户传的 `prefixCls`（`undefined` 时从 ConfigProvider 取）
 * @param classNames `classNames` prop
 * @param styles `styles` prop
 * @param typographyDirection `direction` prop
 */
export function useTypographySemantic<P extends BaseTypographyProps>(
  props: P,
  customizePrefixCls: MaybeRefOrGetter<string | undefined>,
  classNames: MaybeRefOrGetter<
    TypographySemanticValue<TypographySemanticClassNames, P> | undefined
  >,
  styles: MaybeRefOrGetter<TypographySemanticValue<TypographySemanticStyles, P> | undefined>,
  typographyDirection: MaybeRefOrGetter<DirectionType | undefined>,
): UseTypographySemanticResult {
  const {
    getPrefixCls,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles,
  } = useComponentConfig<TypographyConfig>('typography');

  // ⚠️ 不用 `useComponentConfig()` 返回的 `direction`：它是 setup 期的快照，
  //    ConfigProvider 之后改 `direction` 不会更新（差异 D27）。antd 的
  //    `useContext` 每次渲染都重读，`useDirection()` 才是它的等价物。
  const contextDirection = useDirection();

  const prefixCls = computed(() => getPrefixCls('typography', toValue(customizePrefixCls)));
  const direction = computed(() => toValue(typographyDirection) ?? contextDirection.value);

  // ConfigProvider 的 `components.typography.className` 落在 `root` 槽位（见文件头第 1 条）。
  const contextClassNamesObject: TypographySemanticClassNames = { root: contextClassName };

  /**
   * `info.props`：`props` 的响应式视图，其中 `prefixCls` / `direction` 换成**解析后**的值。
   *
   * 断言到 `P` 是安全的：Proxy 对未覆盖的键原样透传，`P` 的全部键都在 `props` 上。
   */
  const semanticProps = new Proxy(props, {
    get(target, key, receiver) {
      if (key === 'prefixCls') return prefixCls.value;
      if (key === 'direction') return direction.value;
      return Reflect.get(target, key, receiver);
    },
  }) as P;

  const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
    P,
    TypographySemanticClassNames,
    TypographySemanticStyles
  >(
    [() => contextClassNamesObject, () => contextClassNames, () => toValue(classNames)],
    [() => contextStyles, () => semanticRootStyle(contextStyle), () => toValue(styles)],
    semanticProps,
  );

  return {
    classNames: mergedClassNames,
    styles: mergedStyles,
    prefixCls,
    direction,
  };
}
