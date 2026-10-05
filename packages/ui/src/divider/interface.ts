/**
 * Divider 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/divider/index.d.ts`。**逐字段对齐**，包括
 * `@deprecated` 标记、可选性与默认值。有意差异见 `packages/ui/src/divider/README.md`。
 *
 * ── 与 antd 类型面的三处**有据可查**的差异 ─────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— antd 的 `children?: React.ReactNode`
 *    在 Vue 侧是默认插槽，见 `Divider.vue`。
 * 2. `size` 的类型名从 `SizeType` 改名为 `DividerSize`。antd 的 `SizeType` 住在
 *    `config-provider/SizeContext`，而该包尚未落地；若在这里也导出 `SizeType`，
 *    等 config-provider 落地时 `index.ts` 会出现**重名导出**。
 *    取值集合逐字一致（`'small' | 'medium' | 'middle' | 'large'`，含 antd 已废弃的 `middle`）。
 * 3. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 基础枚举
// ---------------------------------------------------------------------------

/**
 * 分割方向。与 antd 的 `Orientation` 一致。
 *
 * ⚠️ 注意区分两件事：`orientation` 在 v6 里**同时**承担「方向」与（废弃的）
 *    「标题位置」两种语义。当它取 `left` / `right` / `center` / `start` / `end` 时，
 *    antd 会当作**旧版的标题位置**并告警；只有 `horizontal` / `vertical` 才是方向。
 *    这条判据是 `useOrientation()` 与 `validTitlePlacement` 两个函数的交集。
 */
export type Orientation = 'horizontal' | 'vertical';

/** 标题位置。与 antd 的 `TitlePlacement` 一致（`start` / `end` 自 5.24.0 起）。 */
export type TitlePlacement = 'left' | 'right' | 'center' | 'start' | 'end';

/** 线型。与 antd 的 `variant` 取值一致（自 5.20.0 起）。 */
export type DividerVariant = 'dashed' | 'dotted' | 'solid';

/**
 * 间距大小。与 antd 的 `SizeType` 取值逐字一致。
 *
 * `middle` 在 antd 中已废弃（v7 移除，改用 `medium`），但**必须保留** ——
 * 存量代码在传它，且 `-md` 类名对两者都成立。
 */
export type DividerSize = 'small' | 'medium' | 'middle' | 'large';

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 语义化类名的三个槽位。与 antd 的 `DividerSemanticType['classNames']` 一致。
 *
 * ⚠️ `rail` 槽位**只在没有 children 时**才落到根元素上（antd 的判据是
 *    `mergedClassNames.rail && !children`）；有 children 时它落在两个 rail 子元素上。
 *    这不是笔误，是上游行为。
 */
export interface DividerSemanticClassNames {
  root?: string;
  rail?: string;
  content?: string;
}

/** 语义化样式的三个槽位。 */
export interface DividerSemanticStyles {
  root?: CSSProperties;
  rail?: CSSProperties;
  content?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<DividerSemanticType, DividerProps>` 的
 * `classNamesAndFn` / `stylesAndFn`。函数式由裁决 `empty-semantic-fn` = B 决定支持
 * （该裁决是对 `useMergeSemantic` 的全局裁决，不是 empty 专属）。
 */
export type DividerSemanticValue<T> = T | ((info: { props: DividerProps }) => T);

/** antd 的 `DividerSemanticType`（不含函数式的形态）。 */
export interface DividerSemanticType {
  classNames?: DividerSemanticClassNames;
  styles?: DividerSemanticStyles;
}

/** antd 的 `DividerSemanticAllType`（含函数式的完整形态）。 */
export interface DividerSemanticAllType {
  classNames: DividerSemanticClassNames;
  classNamesAndFn: DividerSemanticValue<DividerSemanticClassNames>;
  styles: DividerSemanticStyles;
  stylesAndFn: DividerSemanticValue<DividerSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Divider 的 Props。
 *
 * ⚠️ 根节点的 `class` / `style` 是 Vue 原生 attrs（由 `inheritAttrs: false` 后的显式
 *    `mergeProps` 落到根元素），**不**声明 `className` / `rootClassName` / `style` Props。
 *    ConfigProvider 的 `DividerConfig.className/style` 是另一回事（配置对象字段），保留。
 */
export interface DividerProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /**
   * @deprecated please use `orientation`
   *
   * 保留并输出开发期告警，与 antd 的废弃节奏一致。
   */
  type?: Orientation;
  /**
   * 分割方向。
   *
   * ⚠️ 它**优先于** `vertical`，而 `vertical` 优先于 `type`。三者都不传时兜底 `horizontal`。
   *    另外当它取标题位置的值（`left` 等）时，会被当作旧版标题位置并告警 —— 见 `Orientation`。
   */
  orientation?: Orientation;
  /** 是否垂直。与 `orientation` 同时配置时以 `orientation` 优先。 */
  vertical?: boolean;
  /** 分割线标题的位置。 */
  titlePlacement?: TitlePlacement;
  /**
   * @deprecated please use `styles.content.margin`
   *
   * 标题与最近边框之间的距离。传不带单位的字符串数字时按 px 处理。
   * 仅在 `titlePlacement` 为 `start` / `end` 时生效。
   */
  orientationMargin?: string | number;
  /** 是否虚线。等价于 `variant="dashed"`，但**两者可叠加**（会同时加两个类名）。 */
  dashed?: boolean;
  /**
   * 线型。
   * @default 'solid'
   */
  variant?: DividerVariant;
  /** 间距大小，**仅对水平布局有效**。 */
  size?: DividerSize;
  /** 文字是否显示为普通正文样式。 */
  plain?: boolean;
  /** 语义化类名。 */
  classNames?: DividerSemanticValue<DividerSemanticClassNames>;
  /** 语义化样式。 */
  styles?: DividerSemanticValue<DividerSemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `DividerRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但首次渲染前它同样是 `null`（`useRef(null)`），
 *    只是类型没体现。我们按真实情况声明为可空 —— 让类型是真的（与 `EmptyRef` 同一条理由）。
 */
export interface DividerRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Divider 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `divider` 配置。与 antd 的
 * `DividerConfig = ComponentStyleConfig & Pick<DividerProps, 'classNames' | 'styles'>` 一致。
 */
export type DividerConfig = ComponentStyleConfig & Pick<DividerProps, 'classNames' | 'styles'>;

/** 默认插槽的签名。antd 的 `children` 在 Vue 侧即此插槽。 */
export type DividerSlot = () => VNodeChild;
