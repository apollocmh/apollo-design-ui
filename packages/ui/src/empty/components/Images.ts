/**
 * Empty 的两个插画组件（默认 / 简洁）。
 *
 * 与 antd 的 `es/empty/empty.js` / `es/empty/simple.js` 一一对应。
 *
 * ── 为什么是 .ts 而不是 .vue ─────────────────────────────────────────────────
 *
 * 这两个组件**没有状态、没有事件、没有插槽**，全部内容就是「拿 locale 的可访问名，
 * 调一次生成的渲染函数」。COMPONENT-RULES.md §2 允许 `.tsx`/`.ts` 用于「纯渲染函数型
 * 内部件」，这是第一类情形。
 *
 * 更关键的是：**插画本身由脚本生成**（`registry/tools/gen-empty-artwork.mjs`），
 * 手写等于重画一遍矢量图，必然与上游产生像素差异。所以这里保持成极薄的一层，
 * 让「生成物」与「组件」的边界一眼可见。
 *
 * ── 颜色 ────────────────────────────────────────────────────────────────────
 *
 * 颜色由生成器在 build 期把 antd 的「半透明 token 在白底上合成实色」直接钉成 hex
 * 字面量写进 `artwork.ts` 的 SVG fill，所以这里**不再**维护 token → CSS 变量的映射。
 * 主题切换不影响插画（切到 dark 时插画颜色不变，靠外层主题背景接管）—— 这是与 antd
 * 一致的行为，不是退让。L6 视觉回归在 2026-09-18 抓出该差异并修正了生成器输出。
 */

import { useLocale } from '@apollo-design/locale';
import { defineComponent, markRaw } from 'vue';
import { renderDefaultEmptyImage, renderSimpleEmptyImage } from './artwork';

/**
 * 插画的 `<title>`。
 *
 * antd 是 `locale?.description || 'Empty'` —— 即「不传 locale 或 locale 没有描述时兜底
 * 字符串 `'Empty'`」。这是插画**唯一**的可访问名来源（见 L5 测试）。
 */
function useArtworkTitle(): string {
  const [locale] = useLocale('Empty');
  return locale?.description || 'Empty';
}

/**
 * ⚠️ 两个组件都套了 `markRaw`。这不是优化，是**语义正确性**的要求。
 *
 * `-normal` 类名的判据是 `mergedImage === SimpleEmptyImage`（引用相等），而
 * Vue 的 props 在部分挂载路径下（如 `@vue/test-utils` 的 `mount(Comp, { props })`）
 * 会被 `reactive()` 深代理 —— 代理后的对象 `!==` 原对象，判据静默失效。
 *
 * `markRaw` 让 Vue 跳过代理（Vue 官方对「组件对象被放进响应式容器」的建议做法），
 * 于是引用相等在任何挂载路径下都成立。
 *
 * 实测：不加 `markRaw` 时，`mount(Empty, { props: { image: PRESENTED_IMAGE_SIMPLE } })`
 * 渲染出的根元素**没有** `-normal` 类名，而 compat 路径（`domContractTest`）却正常 ——
 * 这种「换个挂载方式就变」的行为正是最该被消除的一类不确定性。
 */
export const EmptyImage = markRaw(
  defineComponent({
    name: 'AEmptyImage',
    setup() {
      const title = useArtworkTitle();
      return () => renderDefaultEmptyImage({ title });
    },
  }),
);

/** 简洁插画（64×41）。对应 antd 的 `PRESENTED_IMAGE_SIMPLE`。`markRaw` 理由同上。 */
export const SimpleEmptyImage = markRaw(
  defineComponent({
    name: 'ASimpleEmptyImage',
    setup() {
      const title = useArtworkTitle();
      return () => renderSimpleEmptyImage({ title });
    },
  }),
);
