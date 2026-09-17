/**
 * 纯数据侧 —— 容器解析与 z-index 层级计算。
 *
 * 契约来源：
 *   · `@rc-component/portal@2.1.0` `es/Portal.js:9-23`（resolveContainer）
 *   · antd 6.6.4 `components/_util/hooks/useZIndex.ts`（z-index 全部）
 *
 * 这一层**不碰 Vue、不碰 DOM 全局**（除了 `resolveContainer` 需要 `document` 来 querySelector，
 * 它以参数注入，测试可传假文档），因此可以被穷举测试。
 */

import { canUseDom } from '@apollo-design/utils';

// ---------------------------------------------------------------------------
// z-index 常量（useZIndex.ts:18-51）
// ---------------------------------------------------------------------------

/** Container 之间的间隔 */
export const CONTAINER_OFFSET = 100;
/** 最多允许嵌套多少层 Container */
export const CONTAINER_OFFSET_MAX_COUNT = 10;
/** Container 可用的最大偏移（100 × 10 = 1000） */
export const CONTAINER_MAX_OFFSET = CONTAINER_OFFSET * CONTAINER_OFFSET_MAX_COUNT;
/** 静态方法（Modal.confirm 等）会落在 CONTAINER_MAX_OFFSET，但它仍可能有子浮层 ⇒ 再留一层 */
export const CONTAINER_MAX_OFFSET_WITH_CHILDREN = CONTAINER_MAX_OFFSET + CONTAINER_OFFSET;

/**
 * `token.zIndexPopupBase` 的默认值（`theme/themes/seed.ts:73`）。
 *
 * ⚠️ 本包**不依赖 `@apollo-design/theme`**（`dependsOn` 只有 utils）——
 *    theme 的运行时在 SSR 与某些测试环境里未必存在，而 z-index 只需要这一个标量。
 *    所以调用方（通常是 ui 层）要把 token 值传进来，不传就用这个默认。
 */
export const DEFAULT_Z_INDEX_POPUP_BASE = 1000;

export type ZIndexContainer =
  | 'Modal'
  | 'Drawer'
  | 'Popover'
  | 'Popconfirm'
  | 'Tooltip'
  | 'Tour'
  | 'FloatButton';

export type ZIndexConsumer = 'SelectLike' | 'Dropdown' | 'DatePicker' | 'Menu' | 'ImagePreview';

export type ZIndexComponentType = ZIndexContainer | ZIndexConsumer;

/** 七种容器**都是**同一个偏移 100 —— 差异化在 CSS 侧，不在这里 */
export const containerBaseZIndexOffset: Record<ZIndexContainer, number> = {
  Modal: CONTAINER_OFFSET,
  Drawer: CONTAINER_OFFSET,
  Popover: CONTAINER_OFFSET,
  Popconfirm: CONTAINER_OFFSET,
  Tooltip: CONTAINER_OFFSET,
  Tour: CONTAINER_OFFSET,
  FloatButton: CONTAINER_OFFSET,
};

/** ⭐ ImagePreview 是 1 而不是 50 —— 它是唯一一个"贴着父级走"的消费者 */
export const consumerBaseZIndexOffset: Record<ZIndexConsumer, number> = {
  SelectLike: 50,
  Dropdown: 50,
  DatePicker: 50,
  Menu: 50,
  ImagePreview: 1,
};

export function isContainerType(type: ZIndexComponentType): type is ZIndexContainer {
  return type in containerBaseZIndexOffset;
}

// ---------------------------------------------------------------------------
// z-index 计算（useZIndex.ts:59-100）
// ---------------------------------------------------------------------------

export interface ComputeZIndexInput {
  componentType: ZIndexComponentType;
  /** 组件显式指定的 z-index。给定时**完全跳过**计算 */
  customZIndex?: number;
  /** 来自 `ZIndexContext` 的父级 z-index；`undefined` = 顶层 */
  parentZIndex?: number;
  /** `token.zIndexPopupBase`；不传用 `DEFAULT_Z_INDEX_POPUP_BASE` */
  zIndexPopupBase?: number;
}

/**
 * ⭐⭐ 最容易被读错的一条契约：
 *
 * **最外层的浮层不设 z-index**（返回 `undefined`）。
 * 因为 `result[0]` 在 `parentZIndex === undefined` 时取的是 `customZIndex`（= undefined）。
 * 顶层浮层靠**容器的 DOM 顺序**决定谁压着谁（见契约文档 §3.3），
 * 只有嵌套在父浮层里的子浮层才拿到数值型 z-index。
 *
 * 第二个返回值是给 `ZIndexContext` 让子孙继承的，**永远**是算出来的数值。
 */
export function computeZIndex(input: ComputeZIndexInput): [number | undefined, number] {
  const {
    componentType,
    customZIndex,
    parentZIndex,
    zIndexPopupBase = DEFAULT_Z_INDEX_POPUP_BASE,
  } = input;
  const isContainer = isContainerType(componentType);

  if (customZIndex !== undefined) {
    return [customZIndex, customZIndex];
  }

  let zIndex = parentZIndex ?? 0;

  if (isContainer) {
    zIndex +=
      // ⭐ 有父容器时**不再叠加** zIndexPopupBase —— 否则嵌套越深 z-index 越离谱
      (parentZIndex ? 0 : zIndexPopupBase) + containerBaseZIndexOffset[componentType];
  } else {
    zIndex += consumerBaseZIndexOffset[componentType];
  }

  return [parentZIndex === undefined ? customZIndex : zIndex, zIndex];
}

/**
 * dev 下的越界告警（`useZIndex.ts:86-97`）。
 * 只在「没给 customZIndex」且「算出来超过 base + 1100」时告警。
 */
export function shouldWarnZIndex(input: {
  customZIndex?: number;
  currentZIndex?: number;
  zIndexPopupBase?: number;
}): boolean {
  const { customZIndex, currentZIndex, zIndexPopupBase = DEFAULT_Z_INDEX_POPUP_BASE } = input;
  const maxZIndex = zIndexPopupBase + CONTAINER_MAX_OFFSET_WITH_CHILDREN;
  return customZIndex === undefined && (currentZIndex || 0) > maxZIndex;
}

// ---------------------------------------------------------------------------
// 容器解析（Portal.js:9-23）
// ---------------------------------------------------------------------------

/**
 * 可以是元素，也可以挂进 shadow DOM —— antd 6 的类型是
 * `(triggerNode?: HTMLElement) => HTMLElement | ShadowRoot`。
 *
 * ⚠️ 这里用 `Element` 而不是 `HTMLElement`：antd 的 `document.querySelector` 分支
 *    对**任何** Element 都照收不误（包括 SVG），我们不该替它筛。
 */
export type ContainerLike = Element | ShadowRoot;

export type GetContainer =
  | ContainerLike
  /** `false` ⇒ 内联渲染，不 teleport（`Portal.js:10-12`） */
  | false
  /** 选择器字符串 */
  | string
  | (() => ContainerLike | null | undefined)
  | null
  | undefined;

/**
 * 解析结果 —— ⚠️ **四态，`null` 与 `undefined` 不是一回事**：
 *
 * | 值 | 含义 | 后果 |
 * |---|---|---|
 * | `false` | 内联渲染 | 不 teleport |
 * | 元素 | 用这个容器 | — |
 * | `null` | **解析过了**，但没有容器 | 交给默认容器 |
 * | `undefined` | ⭐ **还没解析好**（典型：`getContainer()` 依赖 ref，首次返回 undefined） | **首帧不渲染**，等 effect 里再解析一次 |
 *
 * 第三条是 SSR 安全的一部分，见 `Portal.js:81` 的
 * `innerContainer === undefined ⇒ return null`。归一化成 `null` 会让
 * 「依赖 ref 的容器」在首帧错误地渲染到默认容器里。
 */
export type ResolvedContainer = ContainerLike | false | null | undefined;

/**
 * 机械移植自 `getPortalContainer`。
 *
 * @param doc 注入点。默认取全局 `document`。SSR 或单元测试可传假文档。
 */
export function resolveContainer(
  getContainer: GetContainer,
  doc?: Document | null,
): ResolvedContainer {
  if (getContainer === false) {
    return false;
  }

  // ⚠️ `canUseDom()` 用的是**全局** window —— 这是 antd 的语义（SSR 下直接返回 null，
  //    连选择器都不会去查）。注入的 doc 只用于 querySelector。
  if (!canUseDom() || !getContainer) {
    return null;
  }

  if (typeof getContainer === 'string') {
    const target = doc ?? (typeof document !== 'undefined' ? document : null);
    return target?.querySelector(getContainer) ?? null;
  }

  if (typeof getContainer === 'function') {
    // ⚠️ 这里**不能**写 `?? null`。
    //    antd 的 `getPortalContainer` 原样返回 `getContainer()` —— 可能是 `undefined`；
    //    `?? null` 只发生在它那个 effect 里（`setInnerContainer(customizeContainer ?? null)`）。
    //    归一化的后果：「依赖 ref 的容器」在首帧会被当成「解析过了但没有」，
    //    于是内容会错误地渲染到默认容器里再跳走 —— 正是 `Portal.js:77` 注释要防的事。
    return getContainer();
  }

  return getContainer;
}

// ---------------------------------------------------------------------------
// 嵌套顺序队列（useDom.js:26-30）
// ---------------------------------------------------------------------------

export type AppendFn = () => void;

/**
 * ⭐ 新的排**前面**（`[appendFn, ...origin]`），而 flush 时按数组顺序执行
 * ⇒ **后登记的先 append**。
 *
 * 这一条决定了兄弟 Portal 的最终 DOM 次序，反直觉但必须照抄 ——
 * 详见契约文档 §3.3.1 的完整推导。
 */
export function enqueueAppend(queue: readonly AppendFn[], appendFn: AppendFn): AppendFn[] {
  return [appendFn, ...queue];
}

/** flush：按队列顺序执行（后进先执行） */
export function flushAppendQueue(queue: readonly AppendFn[]): void {
  for (const appendFn of queue) {
    appendFn();
  }
}
