/**
 * Result 的类型定义。
 *
 * 契约来源：antd 6.6.4 的 `es/result/index.d.ts`。
 * **逐字段对齐**（规则 R7）。差异：children 不在 Props（规则 C19，默认插槽）。
 */

import type { CSSProperties } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** 异常状态（数字与字符串都收 —— antd 的 ExceptionStatusType 逐字）。 */
export type ExceptionStatusType = 403 | 404 | 500 | '403' | '404' | '500';

/** 全部合法状态。 */
export type ResultStatusType = ExceptionStatusType | 'success' | 'error' | 'info' | 'warning';

/** 语义槽位（六个，antd 的 ResultSemanticType 逐字）。 */
export interface ResultSemanticClassNames {
  root?: string;
  title?: string;
  subTitle?: string;
  body?: string;
  extra?: string;
  icon?: string;
}

export interface ResultSemanticStyles {
  root?: CSSProperties;
  title?: CSSProperties;
  subTitle?: CSSProperties;
  body?: CSSProperties;
  extra?: CSSProperties;
  icon?: CSSProperties;
}

export interface ResultProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo-result`。 */
  prefixCls?: string;
  /** 自定义图标：null/false 显式禁用（undefined 走 IconMap）；富图标改 #icon slot。 */
  icon?: boolean | null;
  /** 结果状态。 */
  status?: ResultStatusType;
  /** 标题（文本；富内容走 #title slot，优先于 prop）。 */
  title?: string;
  /** 副标题（文本；富内容走 #subTitle slot，优先于 prop）。 */
  subTitle?: string;
  /** 操作区：VNode 主导，已删除 prop，改 #extra slot。 */
  extra?: never;
  classNames?: ResultSemanticClassNames;
  styles?: ResultSemanticStyles;
}

/** ConfigProvider 上的组件配置。与 antd 的 `ResultConfig` 逐字一致。 */
export interface ResultConfig extends ComponentStyleConfig {
  classNames?: ResultSemanticClassNames;
  styles?: ResultSemanticStyles;
}

/** ConfigProvider 上的组件配置。与 antd 的 `ResultConfig` 逐字一致。 */
export interface ResultConfig extends ComponentStyleConfig {
  classNames?: ResultSemanticClassNames;
  styles?: ResultSemanticStyles;
}

/** 组件实例暴露（antd 的 ResultRef）。 */
export interface ResultRef {
  nativeElement: HTMLElement | null;
}
