/**
 * ConfigProvider 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/index.d.ts` 与 `context.d.ts`。
 *
 * ── ⭐ 渐进式类型形态（`docs/analysis/config-provider.md` §6.1，差异 **D25**）─────────
 *
 * antd 的 `ConfigProviderProps` 有 **56 个组件配置 prop**，且每个的类型都
 * `import type { XxxProps } from '../xxx'`（见 `context.ts` 顶部 60 行 import）。
 * 本仓只落地了 3 个组件 ⇒ 照搬会直接编译失败。
 *
 * 所以这里取**双通道**：
 *
 *   (A) 已落地组件：精确 prop，类型逐字段与 antd 同名 —— `divider` / `empty` / `spin`
 *   (B) 未落地组件：`components?: Record<string, ComponentConfigLike>` 弱类型逃生口
 *
 * 两条通道在 `ConfigProvider` 内部汇成**同一个** `components` map，消费侧只有一条
 * 读取路径（`useComponentConfig(name)`）。每落地一个新组件，就把它从 (B) 提升成 (A)。
 *
 * **为什么不用 `[key: string]: unknown` 索引签名**替代 (B)：索引签名会让 `keyof` 退化成
 * `string`、让拼错的 prop 静默通过、类型测试的负例也写不出来 —— 那是把「渐进」做成「放弃」。
 */

import type { Locale, ValidateMessages } from '@apollo-design/locale';
import type { WarningContextValue } from '@apollo-design/utils';
import type { ComputedRef } from 'vue';
import type { DividerConfig } from '../divider/interface';
import type { EmptyConfig } from '../empty/interface';
import type { SpinConfig } from '../spin/interface';
import type {
  CSPConfig,
  ComponentStyleConfig,
  DirectionType,
  GetPopupContainer,
  GetTargetContainer,
  PopupOverflow,
  RenderEmptyHandler,
  Variant,
  WaveConfig,
} from './context';
import type { ConfigProviderThemeConfig } from './hooks/use-theme';
import type { SizeType } from './size-context';

export type {
  CSPConfig,
  ComponentStyleConfig,
  DirectionType,
  GetPopupContainer,
  GetTargetContainer,
  PopupOverflow,
  RenderEmptyComponentName,
  RenderEmptyHandler,
  Variant,
  WaveConfig,
} from './context';
export type { ConfigProviderThemeConfig } from './hooks/use-theme';
export type { SizeType } from './size-context';

/**
 * (B) 逃生口里的值形态。
 *
 * 至少具备 antd 所有组件配置都有的 `className` / `style`（`ComponentStyleConfig`），
 * 其余键开放 —— 未落地组件的配置键尚无类型可依。
 */
export type ComponentConfigLike = ComponentStyleConfig & { [key: string]: unknown };

/**
 * `form` 配置。
 *
 * antd 的 `FormConfig` 还 `Pick` 了 `requiredMark` / `colon` / `scrollToFirstError` /
 * `variant` / `tooltip` / `labelAlign` / `labelWrap` —— 那些键的类型来自尚未落地的
 * `FormProps`（`packages/ui/src/form/` 只有骨架，`interface.ts` 里没有这些字段）。
 * ⇒ 这里只落**本组件真正会消费**的 `validateMessages`（走 form-core 的 `FormProvider`），
 *   其余等 `Form` 落地时按 (A) 的方式补齐。
 */
export type FormConfig = ComponentStyleConfig & {
  validateMessages?: ValidateMessages;
};

/**
 * ConfigProvider 的 props。
 *
 * ⚠️ 与 antd 的**结构性**差异：56 个组件配置里只保留了 3 个精确 prop，
 *    其余走 `components`（D25）；`tooltip` / `popover` / `popconfirm` 三个
 *    **完全不声明**（`UniqueProvider` 未实现，声明了就是静默 no-op，D29）。
 */
export interface ConfigProviderProps {
  // ---------------------------------------------------------------- 容器与前缀
  getTargetContainer?: GetTargetContainer;
  getPopupContainer?: GetPopupContainer;
  prefixCls?: string;
  iconPrefixCls?: string;

  // ---------------------------------------------------------------- 全局开关
  /** @descCN 语言包。 @descEN Language package. */
  locale?: Locale;
  componentSize?: SizeType;
  componentDisabled?: boolean;
  /** @descCN 布局方向。 @descEN Direction of layout. @default ltr */
  direction?: DirectionType;
  /** @descCN 是否开启虚拟滚动。 @descEN Virtual scrolling. @default true */
  virtual?: boolean;
  variant?: Variant;
  theme?: ConfigProviderThemeConfig;
  /** @descCN 告警行为（`strict: false` 时聚合 deprecated 告警）。 */
  warning?: WarningContextValue;
  csp?: CSPConfig;
  wave?: WaveConfig;
  renderEmpty?: RenderEmptyHandler;
  popupMatchSelectWidth?: boolean;
  popupOverflow?: PopupOverflow;

  // ---------------------------------------------------------------- 已废弃
  /** @deprecated 用 `components.button.autoInsertSpace` */
  autoInsertSpaceInButton?: boolean;
  /** @deprecated 用 `popupMatchSelectWidth` */
  dropdownMatchSelectWidth?: boolean;

  // ---------------------------------------------------------------- 组件配置
  /** (B) 未落地组件的弱类型逃生口 */
  components?: Record<string, ComponentConfigLike>;
  /** (A) 已落地组件 */
  divider?: DividerConfig;
  empty?: EmptyConfig;
  spin?: SpinConfig;
  form?: FormConfig;
}

/**
 * `ConfigProvider.config()` 的入参。与 antd 的 `GlobalConfigProps` 对齐。
 *
 * `holderRender` **不实现**（React 特有：把 children 再包一层；Vue 用插槽即可，D30）。
 */
export interface GlobalConfigProps {
  prefixCls?: string;
  iconPrefixCls?: string;
  theme?: ConfigProviderThemeConfig;
}

/**
 * `ConfigProvider.useConfig()` 的返回。
 *
 * ⚠️ 两个值都是 **`ComputedRef`**（要 `.value`），而不是 antd 那样的裸值：
 *    裸值在 Vue 里等于把配置在 setup 期定死，`componentSize` 之后再变就读不到了
 *    （同 D27 的「解构即快照」）。要在模板里直接用就解包到 `setup` 返回值里。
 */
export interface UseConfigResult {
  componentDisabled: ComputedRef<boolean>;
  componentSize: ComputedRef<SizeType | undefined>;
}
