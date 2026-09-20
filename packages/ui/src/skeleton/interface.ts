/**
 * Skeleton 的类型面。
 *
 * 契约来源：antd 6.6.4 的
 * `es/skeleton/Skeleton.d.ts` / `Element.d.ts` / `Avatar.d.ts` / `Button.d.ts` /
 * `Input.d.ts` / `Image.d.ts` / `Node.d.ts` / `Paragraph.d.ts` / `Title.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值、`@deprecated` 标记）。
 * 有意差异见 `packages/ui/src/skeleton/README.md` §5 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的四处**有据可查**的差异 ────────────────────────────────────
 *
 * 1. `children` 不在任何 Props 里（规则 C19）—— antd 的 `React.ReactNode` 在 Vue 侧是
 *    默认插槽：`Skeleton` 的 `SkeletonSlot`、`Skeleton.Node` / `Skeleton.Image` 的
 *    `SkeletonNodeSlot`。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。
 * 3. `SkeletonSemanticAllType` 是**手写**的接口而不是 `GenerateSemantic<...>` 的展开
 *    —— 与 empty / divider / space 同一条理由与同一个形态（见该接口的注释）。
 * 4. `AvatarProps` 里 `shape` 的取值被**收窄**为 `'circle' | 'square'`（antd 是
 *    `Omit<SkeletonElementProps,'shape'> & { shape?: 'circle'|'square' }`）—— 逐字保留。
 *
 * ── 一处**刻意不导出**的名字 ──────────────────────────────────────────────────
 *
 * `size` 的类型是 antd 的 `SizeType`（住在 `config-provider/SizeContext`）。
 * 本文件只 **import type**，不在 `index.ts` 里重名导出 `SizeType`
 * —— 与 divider 同源（避免与 config-provider 的导出重名）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';

// ---------------------------------------------------------------------------
// Element（骨架屏的最小几何原语）
// ---------------------------------------------------------------------------

/**
 * Element 的语义化槽位。与 antd 的 `ElementSemanticType` 一致。
 *
 * `root` 落在最外层 `<div class="{prefixCls}-element">` 上，
 * `content` 落在内层 `<span class="{prefixCls}-{kind}">` 上。
 */
export interface SkeletonElementSemanticClassNames {
  root?: string;
  content?: string;
}

export interface SkeletonElementSemanticStyles {
  root?: CSSProperties;
  content?: CSSProperties;
}

/** 与 antd 的 `ElementSemanticType` 一致（不含函数式）。 */
export interface SkeletonElementSemanticType {
  classNames?: SkeletonElementSemanticClassNames;
  styles?: SkeletonElementSemanticStyles;
}

/**
 * 形状。与 antd 的 `SkeletonElementProps['shape']` 一致。
 *
 * `'default'` 不产生任何形状类名（antd 的三个 `shapeCls` 判据只认
 * `circle` / `square` / `round`）。
 */
export type SkeletonShape = 'circle' | 'square' | 'round' | 'default';

/**
 * `size` 的取值。与 antd 的 `SizeType | number | 'default'` 一致。
 *
 * ⚠️ `number` 是**像素数**：antd 的 `isNumber(size)` 分支会把它落成
 * `width` / `height` / `line-height` 三个内联样式。`'default'` 已废弃
 * （`@deprecated` 见 `SkeletonElementProps.size`）。
 */
export type SkeletonElementSize = SizeType | number | 'default';

/**
 * Element 的 props。逐字段对齐 antd 的 `SkeletonElementProps`。
 *
 * 它是 `Skeleton.Avatar` / `Skeleton.Button` / `Skeleton.Input` / `Skeleton.Node` 的公共基座。
 */
export interface SkeletonElementProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在**内层** `<span>` 上（`rootClassName` 落在外层 `<div>` 上）。 */
  className?: string;
  /** 落在**外层** `<div class="{prefixCls}-element">` 上。 */
  rootClassName?: string;
  /** 内层 `<span>` 的内联样式，**覆盖** `styles.content`。 */
  style?: CSSProperties;
  /**
   * @deprecated `'default'` 已废弃，请用 `'medium'`。
   *
   * 传 `'default'` 时输出开发期告警（与 antd 的废弃节奏一致）。
   */
  size?: SkeletonElementSize;
  /** 形状。 */
  shape?: SkeletonShape;
  /**
   * 是否播放微光动画。
   *
   * ⚠️ Element **自己不消费**这个 prop —— antd 的 `Element` 只解构
   *    `prefixCls / className / style / size / shape`，`active` 靠**根元素**上的
   *    `-active` 类名生效。这里保留声明是为了与上游类型面一致。
   */
  active?: boolean;
  /** 语义化类名。 */
  classNames?: SkeletonElementSemanticClassNames;
  /** 语义化样式。 */
  styles?: SkeletonElementSemanticStyles;
}

// ---------------------------------------------------------------------------
// Avatar / Button / Input / Node / Image
// ---------------------------------------------------------------------------

/** `Skeleton.Avatar` 的 props。与 antd 的 `AvatarProps` 一致（`shape` 收窄为两值）。 */
export interface SkeletonAvatarOwnProps extends Omit<SkeletonElementProps, 'shape'> {
  shape?: 'circle' | 'square';
}

/** `Skeleton` 的 `avatar` prop。与 antd 的 `SkeletonAvatarProps = Omit<AvatarProps,'active'>` 一致。 */
export type SkeletonAvatarProps = Omit<SkeletonAvatarOwnProps, 'active'>;

/** `Skeleton.Button` 的 props。与 antd 的 `SkeletonButtonProps` 一致。 */
export interface SkeletonButtonProps extends Omit<SkeletonElementProps, 'size'> {
  /**
   * @deprecated `'default'` 已废弃，请用 `'medium'`。
   */
  size?: SizeType | 'default';
  /** 是否撑满一行。 */
  block?: boolean;
}

/** `Skeleton.Input` 的 props。与 antd 的 `SkeletonInputProps` 一致。 */
export interface SkeletonInputProps extends Omit<SkeletonElementProps, 'size' | 'shape'> {
  /**
   * @deprecated `'default'` 已废弃，请用 `'medium'`。
   */
  size?: SizeType | 'default';
  /** 是否撑满一行。 */
  block?: boolean;
}

/**
 * `Skeleton.Node` 的 props。与 antd 的 `SkeletonNodeProps` 一致 —— **除 `children`**。
 *
 * ⚠️ antd 的 `children?: React.ReactNode` 在 Vue 侧是默认插槽（规则 C19），
 *    不进 Props；插槽类型是 `SkeletonNodeSlot`。所以这里的字段集合是
 *    `Omit<SkeletonNodeProps_antd, 'children'>`。
 */
export interface SkeletonNodeProps extends Omit<SkeletonElementProps, 'size' | 'shape'> {
  /**
   * 内层容器的类名。默认 `${prefixCls}-node`。
   *
   * ⚠️ 它是**内部**约定：`Skeleton.Image` 靠它把内层类名换成 `${prefixCls}-image`。
   *    antd 的类型里它是公开字段（`SkeletonImageProps` 才把它 omit 掉），我们保留同样的可见性。
   */
  internalClassName?: string;
}

/**
 * `Skeleton.Image` 的 props。与 antd 的 `SkeletonImageProps` 一致。
 *
 * ⚠️ 两处 omit 的**理由不同**：`internalClassName` 是「内部约定，只给 `Image` 自己用」；
 *    `children` 是因为规则 C19（Vue 侧是插槽）—— 它本就不在 `SkeletonNodeProps` 里，
 *    这里的 omit 是**为与上游类型面逐字对齐而保留的写法**（`Omit` 不存在的键是合法的）。
 */
export type SkeletonImageProps = Omit<SkeletonNodeProps, 'children' | 'internalClassName'>;

// ---------------------------------------------------------------------------
// Title / Paragraph
// ---------------------------------------------------------------------------

/** 宽度单位。与 antd 的 `widthUnit` 一致（数字按 px 处理由 CSS 层负责）。 */
export type SkeletonWidthUnit = number | string;

/** `Skeleton` 的 `title` prop。与 antd 的 `SkeletonTitleProps` 一致。 */
export interface SkeletonTitleProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  /** 标题块宽度。 */
  width?: SkeletonWidthUnit;
}

/** `Skeleton` 的 `paragraph` prop。与 antd 的 `SkeletonParagraphProps` 一致。 */
export interface SkeletonParagraphProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * 段落宽度。
   *
   * 判据（`getWidth`，逐字来自 antd）：
   *   - 数组 ⇒ 第 `index` 行的宽度（越界即 `undefined`）
   *   - 单值 ⇒ **只有最后一行**（`rows - 1 === index`）用它，其余行 `undefined`
   *
   * ⚠️ 数组分支**不**看 `rows`：`width` 比 `rows` 长时多出的项被忽略，
   *    比 `rows` 短时后几行为 `undefined`（退回 CSS 的 `width:100%`）。
   */
  width?: SkeletonWidthUnit | SkeletonWidthUnit[];
  /**
   * 行数。
   * @default 0（独立使用）/ 2 或 3（`Skeleton` 内部的 `getParagraphBasicProps`）
   */
  rows?: number;
}

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 语义化类名的六个槽位。与 antd 的 `SkeletonSemanticType['classNames']` 一致。
 *
 * | 槽位 | 落点 |
 * |---|---|
 * | `root` | 根 `<div class="{prefixCls}">` |
 * | `header` | 有 `avatar` 时的 `<div class="{prefixCls}-header">` |
 * | `section` | 有 `title` / `paragraph` 时的 `<div class="{prefixCls}-section">` |
 * | `avatar` | 头像 `<span>`（由 `Element` 承载） |
 * | `title` | `<h3 class="{prefixCls}-title">` |
 * | `paragraph` | `<ul class="{prefixCls}-paragraph">` |
 */
export interface SkeletonSemanticClassNames {
  root?: string;
  header?: string;
  section?: string;
  avatar?: string;
  title?: string;
  paragraph?: string;
}

export interface SkeletonSemanticStyles {
  root?: CSSProperties;
  header?: CSSProperties;
  section?: CSSProperties;
  avatar?: CSSProperties;
  title?: CSSProperties;
  paragraph?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<SkeletonSemanticType, SkeletonProps>` 的
 * `classNamesAndFn` / `stylesAndFn`。函数式由裁决 `empty-semantic-fn` = B 决定支持
 * （empty / divider / space / spin 已落地同形）。
 */
export type SkeletonSemanticValue<T> = T | ((info: { props: SkeletonProps }) => T);

/** antd 的 `SkeletonSemanticType`（不含函数式的形态）。 */
export interface SkeletonSemanticType {
  classNames?: SkeletonSemanticClassNames;
  styles?: SkeletonSemanticStyles;
}

/** antd 的 `SkeletonSemanticAllType`（含函数式的完整形态）。 */
export interface SkeletonSemanticAllType {
  classNames: SkeletonSemanticClassNames;
  classNamesAndFn: SkeletonSemanticValue<SkeletonSemanticClassNames>;
  styles: SkeletonSemanticStyles;
  stylesAndFn: SkeletonSemanticValue<SkeletonSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * `Skeleton` 的 props。逐字段对齐 antd 的 `SkeletonProps`。
 *
 * ── 三个**真值**判据（决定渲染哪几个块）─────────────────────────────────────
 *
 * ```
 * hasAvatar    = !!avatar        // 默认 false
 * hasTitle     = !!title         // 默认 true
 * hasParagraph = !!paragraph     // 默认 true
 * ```
 *
 * ⚠️ 是**真值**而不是「存在」：`avatar={0}` / `title=""` 都判假。
 *    `avatar` / `title` / `paragraph` 传**对象**时该块必然渲染（对象恒真）。
 *
 * ── `loading` 的三态 ────────────────────────────────────────────────────────
 *
 * antd 的判据是 `loading || !('loading' in props)` —— 注意后半段是
 * **prop 是否被传入**，不是它的值：
 *
 * | 传法 | React | 我们 |
 * |---|---|---|
 * | 不传 | 渲染骨架 | 渲染骨架 |
 * | `loading={true}` | 渲染骨架 | 渲染骨架 |
 * | `loading={false}` | 渲染 children | 渲染 children |
 * | `loading={undefined}` | 渲染 children（键存在但值为 undefined） | **渲染骨架** |
 *
 * 最后一行是唯一的差异（Vue 的 prop 没有「键存在」这个概念），
 * 登记在 `README.md` §5 与 `COMPATIBILITY.md` §9。
 */
export interface SkeletonProps {
  /** 是否播放微光动画（落在根元素上的 `-active` 类名）。 */
  active?: boolean;
  /** 为假时渲染默认插槽。不传即视为真。 */
  loading?: boolean;
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上（在 ConfigProvider 的 `className` **之前**）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 根元素的内联样式。参与语义化合并，且**覆盖** `styles.root`。 */
  style?: CSSProperties;
  /** 头像块。`true` 用默认几何（`size:'large'` + `circle`，无 `paragraph` 时改 `square`）。 */
  avatar?: SkeletonAvatarProps | boolean;
  /** 标题块。`true` 用默认几何（宽度由 `hasAvatar` / `hasParagraph` 决定）。 */
  title?: SkeletonTitleProps | boolean;
  /** 段落块。`true` 用默认几何（行数 2 或 3、宽度 61%）。 */
  paragraph?: SkeletonParagraphProps | boolean;
  /** 圆角胶囊化（标题与段落行的圆角换成 `100px`）。 */
  round?: boolean;
  /** 语义化类名。 */
  classNames?: SkeletonSemanticValue<SkeletonSemanticClassNames>;
  /** 语义化样式。 */
  styles?: SkeletonSemanticValue<SkeletonSemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `SkeletonRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但首次渲染前它同样是 `null`（`useRef(null)`），
 *    只是类型没体现。我们按真实情况声明为可空（与 `DividerRef` 同一条理由）。
 *
 * ⚠️ 第二个差异：`loading === false` 时根元素**不存在**（渲染的是 children），
 *    此时 `nativeElement` 恒为 `null`。
 */
export interface SkeletonRef {
  nativeElement: HTMLDivElement | null;
}

/** `Skeleton` 的默认插槽。antd 的 `children` 在 Vue 侧即此插槽。 */
export type SkeletonSlot = () => VNodeChild;

/** `Skeleton.Node` / `Skeleton.Image` 的默认插槽。 */
export type SkeletonNodeSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Skeleton 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `skeleton` 配置。与 antd 的
 * `SkeletonConfig = ComponentStyleConfig & Pick<SkeletonProps,'classNames'|'styles'>` 一致。
 */
export type SkeletonConfig = ComponentStyleConfig & Pick<SkeletonProps, 'classNames' | 'styles'>;
