/**
 * Spin 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/spin/index.d.ts`、`es/spin/Indicator/index.d.ts`、
 * `es/spin/usePercent.d.ts`、`es/config-provider/context.d.ts` 的 `SpinConfig`。
 * **逐字段对齐**，包括 `@deprecated` 标记、可选性与默认值。
 * 有意差异见 `packages/ui/src/spin/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的四处**有据可查**的差异 ─────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— antd 的 `children?: React.ReactNode`
 *    在 Vue 侧是默认插槽，见 `Spin.vue`。
 * 2. `size` 的类型名从 `SizeType` 改名为 `SpinSize`。antd 的 `SizeType` 住在
 *    `config-provider/SizeContext`，而该包尚未落地；若在这里也导出 `SizeType`，
 *    等 config-provider 落地时 `index.ts` 会出现**重名导出**。
 *    取值集合逐字一致（`'small' | 'medium' | 'middle' | 'large' | 'default'`，
 *    含 antd 已废弃的 `middle` 与 `default`）。与 divider 的 `DividerSize` 同一条理由。
 * 3. `React.ReactNode` → `VNodeChild`、`React.CSSProperties` → Vue 的 `CSSProperties`
 *    （规则 C16 / C18）。
 * 4. `SpinIndicator` 从 `React.ReactElement<HTMLElement>` 变成 `VNode`。
 *    antd 的判据是 `React.isValidElement(indicator)`（只有真元素才会被
 *    `cloneElement` 注入 `class` / `style` / `percent`）；Vue 侧的对应判据是
 *    `isVNode()`，可克隆的也只有 `VNode`。传字符串 / 数字在两侧都走默认指示器。
 *    `setDefaultIndicator` 的参数仍是 `VNodeChild`（对应 antd 的 `React.ReactNode`）。
 */

import type { CSSProperties, VNode, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 基础枚举
// ---------------------------------------------------------------------------

/**
 * 加载图标的尺寸。与 antd 的 `SizeType | 'default'` 取值逐字一致。
 *
 * ⚠️ `middle` 与 `default` 在 antd 中都已废弃（v7 移除），但**必须保留** ——
 *    `default` 会触发一条专门的废弃告警（`size="default"` → `size="medium"`），
 *    删掉它那条告警就无从触发。
 */
export type SpinSize = 'small' | 'medium' | 'middle' | 'large' | 'default';

/**
 * 自定义指示器。antd 的 `SpinIndicator = React.ReactElement<HTMLElement>`
 * 在 Vue 侧的对应物 —— 一个可被 `cloneVNode` 注入属性的 VNode。
 */
export type SpinIndicator = VNode;

/** 进度。`'auto'` 表示由组件自己模拟进度推进（每 200ms 一跳）。 */
export type SpinPercent = number | 'auto';

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 语义化类名的七个槽位。与 antd 的 `SpinSemanticType['classNames']` 一致。
 *
 * ⚠️ `tip` / `mask` 是**已废弃**的槽位，但必须保留类型 —— 用户传了要能被识别
 *    并告警（见 `Spin.vue` 的 `warning.deprecated`），删掉类型会让存量代码编译失败。
 */
export interface SpinSemanticClassNames {
  root?: string;
  section?: string;
  indicator?: string;
  description?: string;
  container?: string;
  /** @deprecated Please use `description` instead */
  tip?: string;
  /** @deprecated Please use `root` instead */
  mask?: string;
}

/** 语义化样式的七个槽位。 */
export interface SpinSemanticStyles {
  root?: CSSProperties;
  section?: CSSProperties;
  indicator?: CSSProperties;
  description?: CSSProperties;
  container?: CSSProperties;
  /** @deprecated Please use `description` instead */
  tip?: CSSProperties;
  /** @deprecated Please use `root` instead */
  mask?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<SpinSemanticType, SpinProps>` 的
 * `classNamesAndFn` / `stylesAndFn`。函数式由裁决 `empty-semantic-fn` = B 决定支持
 * （该裁决是对 `useMergeSemantic` 的全局裁决，不是 empty 专属）。
 */
export type SpinSemanticValue<T> = T | ((info: { props: SpinProps }) => T);

/** antd 的 `SpinSemanticType`（不含函数式的形态）。 */
export interface SpinSemanticType {
  classNames?: SpinSemanticClassNames;
  styles?: SpinSemanticStyles;
}

/** antd 的 `SpinSemanticAllType`（含函数式的完整形态）。 */
export interface SpinSemanticAllType {
  classNames: SpinSemanticClassNames;
  classNamesAndFn: SpinSemanticValue<SpinSemanticClassNames>;
  styles: SpinSemanticStyles;
  stylesAndFn: SpinSemanticValue<SpinSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpinProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上（在 ConfigProvider 的 `className` 之后）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /**
   * 是否处于加载中。
   * @default true
   */
  spinning?: boolean;
  /** 根元素的内联样式。会**覆盖** `styles.root`（与 antd 的合并顺序一致）。 */
  style?: CSSProperties;
  /**
   * 尺寸。
   *
   * ⚠️ `default` 已废弃（v7 移除，改用 `medium`），传它会输出告警。
   *    `middle` 同样已废弃但**不告警**（antd 只对 `default` 写了告警）。
   */
  size?: SpinSize;
  /**
   * 加载文案。
   * @deprecated Please use `description` instead
   */
  tip?: VNodeChild;
  /** 加载文案。**只在有 children 或 fullscreen 之外也渲染** —— 见 README §4.3。 */
  description?: VNodeChild;
  /**
   * 延迟显示加载的毫秒数（防止闪烁）。
   * @default 0
   */
  delay?: number;
  /**
   * 有 children 时包裹层的类名。
   * @deprecated Please use `classNames.root` instead
   */
  wrapperClassName?: string;
  /** 自定义加载指示器。传了它就不渲染默认的四点 Looper。 */
  indicator?: SpinIndicator | null;
  /** 进度。数字按 0~100 归一化到圆环；`'auto'` 由组件模拟推进。 */
  percent?: SpinPercent;
  /** 是否全屏遮罩。 */
  fullscreen?: boolean;
  /** 语义化类名。 */
  classNames?: SpinSemanticValue<SpinSemanticClassNames>;
  /** 语义化样式。 */
  styles?: SpinSemanticValue<SpinSemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `SpinRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但 `useImperativeHandle` 读的是
 *    `nativeElementRef.current!`，首次渲染前它同样是 `null`，只是类型没体现。
 *    我们按真实情况声明为可空 —— 让类型是真的（与 `EmptyRef` / `DividerRef` 同一条理由）。
 */
export interface SpinRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Spin 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `spin` 配置。与 antd 的
 * `SpinConfig = ComponentStyleConfig & Pick<SpinProps, 'indicator' | 'classNames' | 'styles'>`
 * 逐字一致 —— 注意它比 Divider 多了 `indicator`（Spin 是少数几个在 ConfigProvider
 * 上有非样式配置的组件）。
 */
export type SpinConfig = ComponentStyleConfig &
  Pick<SpinProps, 'indicator' | 'classNames' | 'styles'>;

/** 默认插槽的签名。antd 的 `children` 在 Vue 侧即此插槽。 */
export type SpinSlot = () => VNodeChild;
