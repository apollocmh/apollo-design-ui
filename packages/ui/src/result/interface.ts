/** Native Vue Result props, semantic configuration and complete content slots. */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/** 异常状态（数字与字符串均可）。 */
export type ExceptionStatusType = 403 | 404 | 500 | '403' | '404' | '500';

/** 全部合法状态。 */
export type ResultStatusType = ExceptionStatusType | 'success' | 'error' | 'info' | 'warning';

/** 语义槽位（六个）。 */
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
  /** false/null disables the default status graphic; an existing #icon slot takes priority. */
  icon?: boolean | null;
  /** 结果状态。 */
  status?: ResultStatusType;
  /** 标题（文本；富内容走 #title slot，优先于 prop）。 */
  title?: string;
  /** 副标题（文本；富内容走 #subTitle slot，优先于 prop）。 */
  subTitle?: string;
  classNames?: ResultSemanticValue<ResultSemanticClassNames>;
  styles?: ResultSemanticValue<ResultSemanticStyles>;
}

export type ResultSemanticValue<T> = T | ((info: { props: ResultProps }) => T);

/** Configuration applies to the owning Result, including all six semantic parts. */
export type ResultConfig = ComponentStyleConfig & Pick<ResultProps, 'classNames' | 'styles'>;

/** Slots render complete native Vue content; a present empty slot overrides fallback. */
export interface ResultSlots {
  default?: () => VNodeChild;
  icon?: () => VNodeChild;
  title?: () => VNodeChild;
  subTitle?: () => VNodeChild;
  extra?: () => VNodeChild;
}

/** 组件实例暴露。 */
export interface ResultRef {
  nativeElement: HTMLElement | null;
}
