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
 * 颜色在**运行时**从 useToken() 的 token 计算（onBackground 合成，同 antd
 * `empty.js` 的 getAsSolidColor）—— 2026-09-22 修正 2026-09-18 的「build 期钉 hex」
 * 结论：antd 6.6.4 的插画色随主题变化（dark 算法下 fill 是 #3e3e3e 等），theme-dark
 * 的 L6 视觉比对实测抓出。生成器只负责把渲染产物的 hex 反查成 token 槽位。
 */

import { useLocale } from '@apollo-design/locale';
import { useToken } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';
import { computed, defineComponent, markRaw } from 'vue';
import { renderDefaultEmptyImage, renderSimpleEmptyImage } from './artwork';

/**
 * antd `empty/utils.js` 的 getAsSolidColor：把半透明色合成到背景上的实色。
 * 任何一方是 CSS var（cssVar 模式的 token）时原样返回 —— 我们与 antd 同构。
 */
function onBackground(color: string, background: string): string {
  if (color.startsWith('var(') || background.startsWith('var(')) return color;
  const c = new Color(color).toRgb();
  const b = new Color(background).toRgb();
  const a = c.a + b.a * (1 - c.a);
  const mix = (x: number, y: number) => Math.round((x * c.a + y * b.a * (1 - c.a)) / a);
  const hex = [mix(c.r, b.r), mix(c.g, b.g), mix(c.b, b.b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  const alpha = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  return alpha === 'ff' ? `#${hex}` : `#${hex}${alpha}`;
}

/**
 * 插画的五个颜色槽位（antd `empty.js` 的 useMemo 逐字同构：角色 → token → 实色）。
 */
function useArtworkColors() {
  const token = useToken();
  return computed(() => ({
    panelBgColor: onBackground(token.value.colorFillTertiary, token.value.colorBgContainer),
    borderColor: onBackground(token.value.colorTextQuaternary, token.value.colorBgContainer),
    detailColor: onBackground(token.value.colorFill, token.value.colorBgContainer),
    shadowColor: onBackground(token.value.colorFillSecondary, token.value.colorBgContainer),
    iconColor: token.value.colorBgContainer,
  }));
}

/** 简洁插画的角色集（antd `simple.js`：borderColor/shadowColor/contentColor）。 */
function useSimpleArtworkColors() {
  const token = useToken();
  return computed(() => ({
    borderColor: onBackground(token.value.colorFill, token.value.colorBgContainer),
    shadowColor: onBackground(token.value.colorFillTertiary, token.value.colorBgContainer),
    contentColor: onBackground(token.value.colorFillQuaternary, token.value.colorBgContainer),
  }));
}

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
      const colors = useArtworkColors();
      return () => renderDefaultEmptyImage({ title, colors: colors.value });
    },
  }),
);

/** 简洁插画（64×41）。对应 antd 的 `PRESENTED_IMAGE_SIMPLE`。`markRaw` 理由同上。 */
export const SimpleEmptyImage = markRaw(
  defineComponent({
    name: 'ASimpleEmptyImage',
    setup() {
      const title = useArtworkTitle();
      const colors = useSimpleArtworkColors();
      return () => renderSimpleEmptyImage({ title, colors: colors.value });
    },
  }),
);
