/**
 * Typography 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/{Typography,Text,Title,Paragraph,Link}.d.ts`
 * 与 `es/typography/Base/index.d.ts`。**逐字段对齐**，包括可选性、`@internal` 标记与
 * 默认值。有意差异见 `packages/ui/src/typography/README.md` 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的**有据可查**的差异 ─────────────────────────────────────────
 *
 * 1. `children` 不在 Props 里（规则 C19）—— antd 的 `children?: React.ReactNode`
 *    在 Vue 侧是默认插槽。
 * 2. `EditConfig` / `AutoSizeType` 在 antd 里是**非导出**的 interface（`Base/index.d.ts`
 *    里没有 `export`）。我们**导出**它们 —— 否则 Vue 使用者无法引用 `editable` 的配置类型。
 *    登记为 D-typography-1（INTENDED）。
 * 3. `React.CSSProperties` → Vue 的 `CSSProperties`；`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。
 * 4. `component?: keyof JSX.IntrinsicElements` → `component?: string`（Vue 没有
 *    `JSX.IntrinsicElements`）。登记为 D-typography-6（PLATFORM）。
 * 5. `EllipsisConfig.tooltip` 的 `TooltipProps` 分支收窄为 `TypographyTooltipProps`
 *    （只有 `title`）—— Tooltip 尚未落地，等它收口后再补全（见 README §7）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig, DirectionType } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 基础枚举
// ---------------------------------------------------------------------------

/**
 * 语义色。与 antd 的 `BaseType` 一致。
 *
 * ⚠️ 它**不是** `type` 属性的取值集合的全部语义：`secondary` / `success` / `warning` /
 *    `danger` 各自映射一个 `-{type}` 类名；`component === 'a'` 时还会额外加 `-link`。
 */
export type BaseType = 'secondary' | 'success' | 'warning' | 'danger';

/**
 * 自动撑高的行数配置。
 *
 * 契约来源：`@rc-component/input` 的 `AutoSizeType`（antd 只把它当类型用）。
 * 规则 C18 禁止从 `@rc-component/*` 导入类型，所以在本地重新定义。
 */
export interface AutoSizeType {
  minRows?: number;
  maxRows?: number;
}

/**
 * `EllipsisConfig.tooltip` 的对象形态。
 *
 * ⚠️ antd 这里是 `TooltipProps`（几十个字段）。Tooltip 组件尚未落地，我们只声明
 *    实际会被消费的 `title`；运行时其余字段会被原样展开（见 `useTooltipProps`）。
 *    这是**已知缺口**，登记在 README §7，Tooltip 收口后补齐。
 */
export interface TypographyTooltipProps {
  title?: VNodeChild;
}

// ---------------------------------------------------------------------------
// 配置对象
// ---------------------------------------------------------------------------

/** 复制配置。与 antd 的 `CopyConfig` 一致。 */
export interface CopyConfig {
  /** 复制的文本。函数形式支持异步（返回 Promise）。不传时用 children 拼接。 */
  text?: string | (() => string | Promise<string>);
  /** 复制完成后的回调（`copyable.onCopy`）。 */
  onCopy?: (event?: MouseEvent) => void;
  /** 图标。数组形式是 `[未复制, 已复制]`。 */
  icon?: VNodeChild | [VNodeChild, VNodeChild];
  /** 悬浮提示。数组形式是 `[未复制, 已复制]`。 */
  tooltips?: VNodeChild | [VNodeChild, VNodeChild];
  /** 剪贴板格式。 */
  format?: 'text/plain' | 'text/html';
  /** 按钮的 tabIndex。 */
  tabIndex?: number;
}

/** 操作区配置。与 antd 的 `ActionsConfig` 一致（自 6.4.0 起）。 */
export interface ActionsConfig {
  /**
   * 操作区位置。
   * @default 'end'
   */
  placement?: 'start' | 'end';
}

/** 编辑配置。与 antd 的 `EditConfig` 一致（antd 未导出，我们导出，见文件头第 2 条）。 */
export interface EditConfig {
  /** 编辑初值。不传时取 children（仅当它是字符串）。 */
  text?: string;
  /** 受控的编辑态。 */
  editing?: boolean;
  /** 编辑图标。 */
  icon?: VNodeChild;
  /** 编辑图标的悬浮提示。传 `false` 表示不提示。 */
  tooltip?: VNodeChild | false;
  /** 进入编辑态时触发。 */
  onStart?: () => void;
  /** 保存时触发（Enter / blur）。 */
  onChange?: (value: string) => void;
  /** Esc 取消时触发。 */
  onCancel?: () => void;
  /** Enter 保存后触发。 */
  onEnd?: () => void;
  /** 输入框最大长度。 */
  maxLength?: number;
  /**
   * 输入框自动撑高。
   * @default true
   */
  autoSize?: boolean | AutoSizeType;
  /**
   * 触发编辑的方式。
   * @default ['icon']
   */
  triggerType?: ('icon' | 'text')[];
  /** 确认图标。传 `null` 时不渲染。 */
  enterIcon?: VNodeChild;
  /** 编辑图标的 tabIndex。 */
  tabIndex?: number;
}

/** 省略配置。与 antd 的 `EllipsisConfig` 一致。 */
export interface EllipsisConfig {
  /**
   * 显示的行数。
   * @default 1
   */
  rows?: number;
  /**
   * 是否可展开。`'collapsible'` 时展开后仍可收起。
   * @default false
   */
  expandable?: boolean | 'collapsible';
  /** 省略号之后的追加文本。 */
  suffix?: string;
  /** 展开/收起按钮的内容。函数形式收到 `expanded`。 */
  symbol?: VNodeChild | ((expanded: boolean) => VNodeChild);
  /**
   * 非受控的初始展开态。
   * @default false
   */
  defaultExpanded?: boolean;
  /** 受控的展开态。 */
  expanded?: boolean;
  /** 展开/收起时触发。 */
  onExpand?: (e: MouseEvent, info: { expanded: boolean }) => void;
  /** 省略状态变化时触发（**仅变化时**）。 */
  onEllipsis?: (ellipsis: boolean) => void;
  /** 省略时的悬浮提示。`true` 表示用 `editable.text ?? children`。 */
  tooltip?: VNodeChild | TypographyTooltipProps;
}

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/**
 * 语义化类名的四个槽位。与 antd 的 `TypographySemanticType['classNames']` 一致。
 *
 * ⚠️ `textarea` 只在**编辑态**落在 `<textarea>` 上。
 */
export interface TypographySemanticClassNames {
  root?: string;
  actions?: string;
  action?: string;
  textarea?: string;
}

/** 语义化样式的四个槽位。 */
export interface TypographySemanticStyles {
  root?: CSSProperties;
  actions?: CSSProperties;
  action?: CSSProperties;
  textarea?: CSSProperties;
}

/** 语义化输入：对象或函数。对应 antd `GenerateSemantic` 的 `classNamesAndFn` / `stylesAndFn`。 */
export type TypographySemanticValue<T, P = BaseTypographyProps> = T | ((info: { props: P }) => T);

/** antd 的 `TypographySemanticType`（不含函数式的形态）。 */
export interface TypographySemanticType {
  classNames?: TypographySemanticClassNames;
  styles?: TypographySemanticStyles;
}

/** antd 的 `TypographySemanticAllType`（含函数式的完整形态）。 */
export interface TypographySemanticAllType {
  classNames: TypographySemanticClassNames;
  classNamesAndFn: TypographySemanticValue<TypographySemanticClassNames>;
  styles: TypographySemanticStyles;
  stylesAndFn: TypographySemanticValue<TypographySemanticStyles>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Typography 的公共 props。与 antd 的 `BaseTypographyProps` 一致。
 *
 * ⚠️ 它是**所有** 5 个组件的类型基座（`Typography` 与 `BlockProps` 都 extends 它），
 *    也是语义化函数式拿到的 `info.props` 的类型（与 antd 的
 *    `GenerateSemantic<TypographySemanticType, BaseTypographyProps>` 一致）。
 */
export interface BaseTypographyProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 根元素的内联样式。会**覆盖** `styles.root`。 */
  style?: CSSProperties;
  /** 语义化类名。 */
  classNames?: TypographySemanticValue<TypographySemanticClassNames>;
  /** 语义化样式。 */
  styles?: TypographySemanticValue<TypographySemanticStyles>;
  /** 文字方向。不传则从 ConfigProvider 取。 */
  direction?: DirectionType;
  /**
   * 渲染的标签。
   * @internal
   */
  component?: string;
}

/**
 * `Typography` 本体的 props。与 antd 的 `TypographyProps` 一致。
 *
 * ⚠️ 用 type alias 而非 `interface ... extends ... {}`：空接口会被 biome 的
 *    `noEmptyInterface` 拦下，而加一个占位成员又会污染类型面。
 */
export type TypographyProps = BaseTypographyProps;

/**
 * `Text` / `Title` / `Paragraph` / `Link` 的公共 props。与 antd 的 `BlockProps` 一致。
 *
 * ⚠️ 与 `TypographyProps` 的区别：这里才有 `ellipsis` / `copyable` / `editable` / `type` /
 *    `disabled` 与七个装饰开关。`Typography` 本体**不支持**这些（antd 亦如此）。
 */
export interface BlockProps extends TypographyProps {
  /**
   * 操作区位置。
   * @since 6.4.0
   */
  actions?: ActionsConfig;
  /** 原生 title。也是省略号悬浮提示的候选文案。 */
  title?: string;
  /** 编辑能力。 */
  editable?: boolean | EditConfig;
  /** 复制能力。 */
  copyable?: boolean | CopyConfig;
  /** 语义色。 */
  type?: BaseType;
  /** 禁用态。 */
  disabled?: boolean;
  /** 省略能力。 */
  ellipsis?: boolean | EllipsisConfig;
  /** 加粗。 */
  code?: boolean;
  /** 标记。 */
  mark?: boolean;
  /** 下划线。 */
  underline?: boolean;
  /** 删除线。 */
  delete?: boolean;
  /** 加粗（`<strong>`）。 */
  strong?: boolean;
  /** 键盘按键（`<kbd>`）。 */
  keyboard?: boolean;
  /** 斜体（`<i>`）。 */
  italic?: boolean;
}

/**
 * `Text` 的 props。与 antd 的 `TextProps` 一致。
 *
 * ⚠️ `ellipsis` **不支持** `expandable` / `rows` / `onExpand`（antd 用 `Omit` 表达，
 *    并在运行时对传了这两个键的情况告警）。
 */
export interface TextProps extends BlockProps {
  ellipsis?: boolean | Omit<EllipsisConfig, 'expandable' | 'rows' | 'onExpand'>;
}

/**
 * `Title` 的 props。与 antd 的 `TitleProps` 一致。
 *
 * ⚠️ `strong` 被 `Omit` 掉 —— 标题本身就是加粗的，`strong` 无意义（antd 的行为）。
 */
export interface TitleProps extends Omit<BlockProps, 'strong'> {
  /**
   * 标题级别（映射到 `h1`…`h5`）。
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5;
}

/** `Paragraph` 的 props。与 antd 的 `ParagraphProps` 一致。 */
export interface ParagraphProps extends BlockProps {}

/** `Link` 的 props。与 antd 的 `LinkProps` 一致（`ellipsis` **仅布尔**）。 */
export interface LinkProps extends Omit<BlockProps, 'ellipsis'> {
  ellipsis?: boolean;
  /** `target="_blank"` 且未传 `rel` 时自动补 `noopener noreferrer`。 */
  rel?: string;
  target?: string;
}

// ---------------------------------------------------------------------------
// Ref
// ---------------------------------------------------------------------------

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `ref` 有一处差异（PLATFORM）：antd 直接 `forwardRef` 到根元素，
 *    首次渲染前同样是 `null`。我们如实声明为可空 —— 让类型是真的
 *    （与 `EmptyRef` / `DividerRef` 同一条理由）。
 */
export interface TypographyRef {
  nativeElement: HTMLElement | null;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Typography 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `typography` 配置。与 antd 的
 * `TypographyConfig = ComponentStyleConfig & Pick<TypographyProps, 'classNames' | 'styles'>` 一致。
 */
export type TypographyConfig = ComponentStyleConfig &
  Pick<BaseTypographyProps, 'classNames' | 'styles'>;

// ---------------------------------------------------------------------------
// 插槽
// ---------------------------------------------------------------------------

/** 默认插槽的签名。antd 的 `children` 在 Vue 侧即此插槽。 */
export type TypographySlot = () => VNodeChild;
