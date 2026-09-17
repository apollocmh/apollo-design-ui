/**
 * Empty 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/empty/index.d.ts`。**逐字段对齐**，包括
 * `@deprecated` 标记与可选性。有意差异见 `packages/ui/src/empty/README.md`。
 */

import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/** 语义化类名的四个槽位。与 antd 的 `EmptySemanticType['classNames']` 一致。 */
export interface EmptySemanticClassNames {
  root?: string;
  image?: string;
  description?: string;
  footer?: string;
}

/** 语义化样式的四个槽位。 */
export interface EmptySemanticStyles {
  root?: CSSProperties;
  image?: CSSProperties;
  description?: CSSProperties;
  footer?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<EmptySemanticType, EmptyProps>` 的
 * `classNamesAndFn` / `stylesAndFn`。函数式由裁决 `empty-semantic-fn` = B 决定支持。
 */
export type EmptySemanticValue<T> = T | ((info: { props: EmptyProps }) => T);

/**
 * antd 的 `EmptySemanticType`（不含函数式的形态）。
 *
 * 与 antd 一致地导出 —— 它是**用户写自定义封装时的类型锚点**，
 * 少了它迁移代码只能靠 `typeof props.classNames` 反推。
 */
export interface EmptySemanticType {
  classNames?: EmptySemanticClassNames;
  styles?: EmptySemanticStyles;
}

/** antd 的 `EmptySemanticAllType`（含函数式的完整形态）。 */
export interface EmptySemanticAllType {
  classNames: EmptySemanticClassNames;
  classNamesAndFn: EmptySemanticValue<EmptySemanticClassNames>;
  styles: EmptySemanticStyles;
  stylesAndFn: EmptySemanticValue<EmptySemanticStyles>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * `image` 的取值。
 *
 * ⚠️ 与 antd 的 `React.ReactNode` 有一处**平台差异**（PLATFORM）：
 *    antd 允许传「React 元素」（`<MyImage />` 的求值结果），Vue 没有等价的「元素」概念
 *    —— 对应物是**组件本身**。所以这里额外接受 `Component`，
 *    而 `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE` 正是两个组件对象。
 *
 * 判据（三选一，按顺序）：
 *   - `string` → 渲染成 `<img draggable={false} alt src>`
 *   - VNode   → 原样渲染
 *   - 组件    → `h(component)` 渲染
 */
export type EmptyImage = VNodeChild | Component;

export interface EmptyProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上（在 ConfigProvider 的 `className` 之后）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 根元素的内联样式。会**覆盖** `styles.root`（与 antd 的合并顺序一致）。 */
  style?: CSSProperties;
  /**
   * @deprecated Please use `styles.image` instead
   *
   * 与 `styles.image` **合并**（`{...imageStyle, ...styles.image}`），后者覆盖前者。
   * 保留并输出开发期告警，与 antd 的废弃节奏一致。
   */
  imageStyle?: CSSProperties;
  /** 自定义插画。字符串时渲染成 `<img>`。默认 `PRESENTED_IMAGE_DEFAULT`。 */
  image?: EmptyImage;
  /**
   * 描述文案。
   *
   * 可以是 `false` —— 此时**不渲染** `-description` 节点。
   * 不传（`undefined`）时取 locale 的 `Empty.description`。
   */
  description?: VNodeChild;
  /** 语义化类名。 */
  classNames?: EmptySemanticValue<EmptySemanticClassNames>;
  /** 语义化样式。 */
  styles?: EmptySemanticValue<EmptySemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `EmptyRef` 有一处差异（PLATFORM）：antd 声明 `nativeElement: HTMLDivElement`，
 *    但它在首次渲染前同样是 `null`（`useRef(null)`），只是类型没体现。
 *    我们按真实情况声明为可空 —— 让类型是真的。
 */
export interface EmptyRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Empty 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `empty` 配置。与 antd 的
 * `EmptyConfig = ComponentStyleConfig & Pick<EmptyProps, 'classNames' | 'styles' | 'image'>` 一致。
 */
export interface EmptyConfig extends ComponentStyleConfig, EmptySemanticType {
  image?: EmptyImage;
}
