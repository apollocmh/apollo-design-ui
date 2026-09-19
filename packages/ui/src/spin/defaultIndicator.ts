/**
 * `Spin.setDefaultIndicator` 的全局默认指示器。
 *
 * ── 为什么它是一个独立模块，而不是 `Spin.vue` 里的模块级变量 ────────────────────
 *
 * antd 把它写成 `spin/index.tsx` 里的一个模块级 `let defaultIndicator`。
 * Vue 的 `<script setup>` **每个组件实例都会执行一遍**（它编译成 `setup()`），
 * 写在里面就变成了实例级变量 —— `setDefaultIndicator` 改的会是「某个实例的那一份」，
 * 语义完全不同且极难发现。
 *
 * 独立的 `.ts` 模块才是真正的模块单例（ESM 语义），与 antd 的模块级 `let` 同构。
 *
 * ── 它不是响应式的，这是**有意的** ────────────────────────────────────────────
 *
 * antd 的 `defaultIndicator` 是普通变量：改它**不会**让已挂载的 Spin 重新渲染
 * （只有下次渲染才生效）。我们逐字保留 —— 加 `ref` 会凭空多出一个 upstream 没有的
 * 「全局响应式配置」，那是超出规格的承诺。
 */

import type { VNodeChild } from 'vue';

let defaultIndicator: VNodeChild | undefined;

/** 读取当前全局默认指示器。 */
export function getDefaultIndicator(): VNodeChild | undefined {
  return defaultIndicator;
}

/**
 * 设置全局默认指示器。与 antd 的 `Spin.setDefaultIndicator` 同语义。
 *
 * 传 `undefined` / `null` 即恢复「没有默认值」（回落到内置 Looper）。
 */
export function setDefaultIndicator(indicator: VNodeChild): void {
  defaultIndicator = indicator;
}
