/**
 * `@apollo-design/test-utils` 的公共类型。
 *
 * 契约依据见 `docs/foundation/test-utils-contract.md` §5.1（统一形状）与 §7（公开 API）。
 */

import type { Component, VNodeChild } from 'vue';

/**
 * 一条**豁免**。
 *
 * 本包所有「允许某处不达标」的入口都要求这个形状，且 `reason` 必须非空
 * （由 `assertAllowance` 强制）。这是全仓库统一的反静默机制：
 *   - `tests/compat/README.md` §3.4：fixture 的 `allow` 必须带 `reason` + `deviationId`
 *   - `TESTING.md` T16：白名单必须写明理由，禁止无理由批量加白
 *   - `registry/schema.json`：`testLayers` 的 `n/a` 必须有 `layerNotes`（E16）
 *
 * 三处不同层面、同一条原则：**不允许有沉默的例外**。
 */
export interface Allowance {
  /**
   * 为什么这条豁免是可接受的。
   *
   * ⚠️ 空字符串 / 全空白视为**未填**，`assertAllowance` 会抛错。
   * 写「暂时这样」「后续修」不是理由 —— 那属于 `TODO`，不是豁免。
   */
  reason: string;
  /** 若该豁免对应 `COMPATIBILITY.md` §9 的已登记差异，填编号（如 `'D18'`）。 */
  deviationId?: string;
}

/**
 * `import.meta.glob(..., { eager: true })` 的产物。
 *
 * ⚠️ 为什么是**调用方**传进来而不是本包自己 glob（`test-utils-contract.md` F1）：
 *    Vite 的 `import.meta.glob` 是**编译期**静态分析，模式串必须是字面量，
 *    且相对路径以**包含该调用的文件**为基准。本包无法替别的目录 glob。
 */
export type DemoModules = Record<string, unknown>;

/** 渲染工厂：返回一个 vnode（或 `null`）。 */
export type RenderFactory = () => VNodeChild;

/**
 * Provider 包装：把内容包进 Provider 树。
 *
 * 取代了上游散落在各处的 `ConfigProvider` 硬编码 —— `direction` / `getPopupContainer`
 * 这类 provide 键属于 **ui 层**的契约，本包不定义、不内置（`test-utils-contract.md` F5）。
 */
export type Wrap = (slot: () => VNodeChild) => VNodeChild;

/**
 * 渲染源：本包所有共享契约的**统一入参形状**。
 *
 * `demos` 与 `render` 二选一（都传或都不传会抛错）：
 *   - `demos`   —— 遍历一组 demo（上游 `demoTest` 的形态）
 *   - `render`  —— 单个渲染工厂（上游 `mountTest` / `rtlTest` 的形态）
 */
export interface RenderSource {
  /** 一组 demo 模块，由调用方的 `import.meta.glob(..., { eager: true })` 提供。 */
  demos?: DemoModules;
  /** 单个渲染工厂。 */
  render?: RenderFactory;
  /** Provider 包装。默认恒等。 */
  wrap?: Wrap;
  /**
   * 透传给 `mount()` 的 global 配置（stubs 等）。
   * 浮层类组件必须传 `{ stubs: { teleport: false } }` —— VTU 的 teleport-stub
   * 会在 props 翻转时重建 slot 内容，把 Portal/CSSMotion 的残骸协议全部破坏
   * （实测：关闭后子树重挂、触发递归更新）。真实 Teleport 无此问题。
   */
  global?: { stubs?: Record<string, boolean | Component> };
}

/** 带 props 的渲染工厂：`rootPropsTest` 需要往组件里注入 `class` / `style`（原生 attrs）与 `prefixCls`。 */
export type PropsRenderFactory = (props: Record<string, unknown>) => VNodeChild;

/** 一条**告警豁免**：命中 `match` 的告警文本被允许出现。 */
export interface WarningAllowance extends Allowance {
  /** 命中的**文本片段**（`String.prototype.includes` 判定，不是正则 —— 避免意外的元字符）。 */
  match: string;
}
