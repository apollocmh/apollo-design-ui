import type { Locale } from '@apollo-design/locale';
import type { WarningContextValue } from '@apollo-design/utils';
import type { ComputedRef, VNodeChild } from 'vue';
import type { DividerConfig } from '../divider/interface';
import type { EmptyConfig } from '../empty/interface';
import type { FormProps } from '../form/interface';
import type { SpinConfig } from '../spin/interface';
import type {
  ComponentStyleConfig,
  DirectionType,
  GetPopupContainer,
  GetTargetContainer,
  RenderEmptyHandler,
  Variant,
} from './context';
import type { ConfigProviderThemeConfig } from './hooks/use-theme';
import type { SizeType } from './size-context';

export type {
  ComponentStyleConfig,
  DirectionType,
  GetPopupContainer,
  GetTargetContainer,
  RenderEmptyComponentName,
  RenderEmptyHandler,
  Variant,
} from './context';
export type { ConfigProviderThemeConfig } from './hooks/use-theme';
export type { SizeType } from './size-context';

/** Open component configuration map values. Components define the consumed keys. */
export type ComponentConfigLike = ComponentStyleConfig & { [key: string]: unknown };

/** Global form defaults already consumed by Form and FormItem. */
export type FormConfig = ComponentStyleConfig &
  Pick<
    FormProps,
    | 'validateMessages'
    | 'requiredMark'
    | 'colon'
    | 'labelAlign'
    | 'labelWrap'
    | 'scrollToFirstError'
    | 'tooltip'
    | 'variant'
    | 'classNames'
    | 'styles'
  >;

export interface ConfigProviderSlots {
  default?: () => VNodeChild;
}

export type ConfigProviderScopeTag = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap;

/** Subtree configuration. Undefined local values inherit from the parent. */
export interface ConfigProviderProps {
  /** Optional native scope host. Omit to keep the provider renderless. */
  scopeTag?: ConfigProviderScopeTag;
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
  renderEmpty?: RenderEmptyHandler;
  popupMatchSelectWidth?: boolean;

  // ---------------------------------------------------------------- 已废弃
  /** @deprecated 用 `components.button.autoInsertSpace` */
  autoInsertSpaceInButton?: boolean;
  /** @deprecated 用 `popupMatchSelectWidth` */
  dropdownMatchSelectWidth?: boolean;

  // ---------------------------------------------------------------- 组件配置
  /** Open configuration map, keyed by the component name used by its consumer. */
  components?: Record<string, ComponentConfigLike>;
  /** Precise component configuration aliases; these override the same map keys. */
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
