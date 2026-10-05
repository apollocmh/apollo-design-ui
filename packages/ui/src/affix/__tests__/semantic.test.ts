/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准 ─────────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/affix.dom.json`（11 个用例），由
 * `tests/compat/baseline/affix.mjs` 用 `renderToStaticMarkup` 直出 antd 的 `Affix` 产出。
 *
 * ── ⚠️ 只覆盖「未固钉」的静态形态 ─────────────────────────────────────────────
 *
 * SSR/挂载时没有布局 ⇒ `getBoundingClientRect()` 全 0 ⇒ **两侧都不固钉**：
 * - 外层与内层的 `class` 都是**空**（内层的 `apollo-affix` 类名只在固钉时出现）
 * - 占位层不渲染
 * ⇒ 固钉态不在本文件范围内（jsdom 测不了，见 `docs/analysis/affix.md` §8），
 *    **不要**往基线里塞「应该固钉」的用例 —— 那只会产出预期错位的假基线。
 *
 * ── `keepStyle: true` ─────────────────────────────────────────────────────────
 *
 * `style` 透传落在**外层**（占位测量层），且 `contextStyle` 与 `style` 的合并顺序
 * 是契约（后者胜）。只投影 class 会测不到。
 *
 * ── `restProps` 透传 ──────────────────────────────────────────────────────────
 *
 * antd 把 `...restProps` 落在**外层**。Vue 侧对应 `inheritAttrs: false` +
 * 外层 `v-bind="attrs"` —— 这条是我实现里的**真 bug**（漏了 `$attrs`），
 * 被 `attrs:passthrough` 用例抓出来的。见 `Affix.vue` 的注释。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/affix.dom.json';
import { Affix } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/affix.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** 默认子内容（两侧同形）。 */
const CHILD = (): VNodeChild => h('span', null, 'X');

/**
 * 每个基线 id → 一次 Vue 渲染。
 * ⚠️ 必须覆盖基线里的**每一个** id —— `domContractTest` 对缺项会失败而不是静默跳过。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. 基础形态（SSR 恒不固钉）------------------------------------------
  basic: () => h(Affix, { prefixCls: PREFIX }, { default: CHILD }),
  'children:none': () => h(Affix, { prefixCls: PREFIX }),

  // ---- 2. 偏移（SSR 下不影响渲染结果，钉住 props 透传不崩）-------------------
  'offset:top': () => h(Affix, { prefixCls: PREFIX, offsetTop: 64 }, { default: CHILD }),
  'offset:bottom': () => h(Affix, { prefixCls: PREFIX, offsetBottom: 64 }, { default: CHILD }),
  'offset:both': () =>
    h(Affix, { prefixCls: PREFIX, offsetTop: 64, offsetBottom: 64 }, { default: CHILD }),
  'offset:zero': () => h(Affix, { prefixCls: PREFIX, offsetTop: 0 }, { default: CHILD }),

  // ---- 3. 类名与样式 --------------------------------------------------------
  // The antd className oracle case maps to Vue's native `class` fallthrough attr.
  'class:className': () => h(Affix, { prefixCls: PREFIX, class: 'my-class' }, { default: CHILD }),
  // The React-only rootClassName baseline is intentionally rendered without that Vue prop.
  'class:rootClassName': () => h(Affix, { prefixCls: PREFIX }, { default: CHILD }),
  'style:passthrough': () =>
    h(Affix, { prefixCls: PREFIX, style: { color: 'red' } }, { default: CHILD }),

  // ---- 4. 属性透传（restProps 落在外层）--------------------------------------
  'attrs:passthrough': () =>
    h(Affix, { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-affix' }, { default: CHILD }),

  // ---- 5. ConfigProvider（antd 的 Affix 没有组件级 className 配置入口）--------
  'config:className': () => h(Affix, { prefixCls: PREFIX }, { default: CHILD }),
};

/**
 * 目前**没有**豁免。
 *
 * ⚠️ `domContractTest` 用 `toEqual` 而不是 `toContain` —— 豁免的 diff 必须**恰好**出现，
 * 多一条少一条都算失败（防腐烂）。
 * 前缀两侧一致（`apollo`），类名逐字比对；SSR 下两层 `class=""` 的空值形态
 * 由夹具的对称归一化处理，不需要豁免。
 */
const ALLOW = {} as const;

domContractTest('Affix', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Affix semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});
