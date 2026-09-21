/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）
 *
 * ── 基准是什么 ────────────────────────────────────────────────────────────────
 *
 * `tests/compat/baselines/skeleton.dom.json`（48 个用例），由
 * `tests/compat/baseline/skeleton.mjs` **直接调用 `react-dom/server.renderToStaticMarkup`
 * 渲染 antd 的 `Skeleton`** 产出。是机械 oracle，不是「我们读了源码之后写下的期望值」。
 *
 * ── 归一化 ───────────────────────────────────────────────────────────────────
 *
 * 两侧都走 `@apollo-design/test-utils` 的 `parse → project` 流水线，且**对称**：
 * 属性按名排序、类名按名排序、`style` 归一化为声明集合、剔除 CSS-in-JS 的
 * `css-dev-only-do-not-override-*` / `css-var-*` 类名（D5）。
 *
 * 这里用 **`keepStyle: true`**：`width` 的落地形态（title 的 38%/50%、
 * paragraph 的逐行宽度数组）是本组件最容易写错的地方，只投影 class 会让它测不到。
 *
 * ── 两侧传同一个 prefixCls ────────────────────────────────────────────────────
 *
 * `PREFIX = 'apollo'`，与基线生成器里的常量必须一致。
 * ⚠️ 传 `prefixCls="apollo"` 时 `getPrefixCls('skeleton','apollo')` **直接返回** `apollo`
 * （不加 `-skeleton` 后缀）—— 所以基线里的类名是 `apollo` / `apollo-title` 这种形态。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6：`tests/visual`，24/24 exact）
 *   - 没证明**行为**（`loading` 的切换、用户对象覆盖）—— 那是 L1
 *   - ⚠️ 基线**没有覆盖** `Skeleton.Avatar` / `.Button` / `.Input` / `.Image` / `.Node`
 *     五个子组件的独立渲染（它们是复合组件，走各自 props）。这条缺口登记在 README §7。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { defineComponent, h, provide, type VNodeChild } from 'vue';
import baseline from '../../../../../tests/compat/baselines/skeleton.dom.json';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
} from '../../config-provider/context';
import { Skeleton } from '../index';

/** 两侧共用的前缀。与 `tests/compat/baseline/skeleton.mjs` 里的 `PREFIX` 必须一致。 */
const PREFIX = 'apollo';

/** `blocks:` 用例里 `unset` 表示「键不存在」——Vue 侧等价于**不传**（值 undefined）。 */
const fromTag = (v: string): boolean | undefined => {
  if (v === 'unset') return undefined;
  return v === 'true';
};

/** `loading:false+children` 的替身内容 —— 两侧同形。 */
const CHILD = () => h('span', null, 'X');

/**
 * 每个基线 id → 一次 Vue 渲染。
 *
 * ⚠️ 必须覆盖基线里的**每一个** id —— `domContractTest` 对缺项会失败而不是静默跳过。
 */
const CASES: Record<string, () => DomRenderResult> = {
  // ---- 1. loading 四态 -----------------------------------------------------
  'loading:unset': () => h(Skeleton, { prefixCls: PREFIX }),
  'loading:true': () => h(Skeleton, { prefixCls: PREFIX, loading: true }),
  'loading:false+children': () =>
    h(Skeleton, { prefixCls: PREFIX, loading: false }, { default: CHILD }),
  'loading:false+no-children': () => h(Skeleton, { prefixCls: PREFIX, loading: false }),
  // ⚠️ 与 `loading:unset` **必须分开**：React 的判据是 `'loading' in props`，
  //    显式传 undefined 时键存在 ⇒ 上游渲染 children。这是唯一的兼容性差异（PLATFORM）。
  'loading:explicit-undefined': () =>
    h(Skeleton, { prefixCls: PREFIX, loading: undefined }, { default: CHILD }),

  // ---- 2. 三块互锁推导矩阵（8 种存在性组合，基线里是 27 条）------------------
  // 由下面的循环填充。

  // ---- 3. 用户对象覆盖 -----------------------------------------------------
  'override:avatar-shape': () =>
    h(Skeleton, { prefixCls: PREFIX, avatar: { shape: 'square' }, paragraph: true }),
  'override:title-width': () => h(Skeleton, { prefixCls: PREFIX, title: { width: '77%' } }),
  'override:paragraph-rows': () => h(Skeleton, { prefixCls: PREFIX, paragraph: { rows: 4 } }),
  'override:paragraph-width-array': () =>
    h(Skeleton, { prefixCls: PREFIX, paragraph: { rows: 3, width: ['10%', '20%', '30%'] } }),
  'override:paragraph-width-scalar': () =>
    h(Skeleton, { prefixCls: PREFIX, title: false, paragraph: { rows: 3, width: '42%' } }),

  // ---- 4. 类名 -------------------------------------------------------------
  'class:active': () => h(Skeleton, { prefixCls: PREFIX, active: true }),
  'class:round': () => h(Skeleton, { prefixCls: PREFIX, round: true }),
  'class:active+round': () => h(Skeleton, { prefixCls: PREFIX, active: true, round: true }),
  'class:className': () => h(Skeleton, { prefixCls: PREFIX, className: 'my-class' }),
  'class:rootClassName': () => h(Skeleton, { prefixCls: PREFIX, rootClassName: 'root-class' }),
  'prefix-cls:no-props': () => h(Skeleton, {}),

  // ---- 5. 属性透传 ---------------------------------------------------------
  'attrs:passthrough': () =>
    h(Skeleton, { prefixCls: PREFIX, 'data-testid': 'x', id: 'my-skeleton' }),

  // ---- 6. 语义化 -----------------------------------------------------------
  'semantic:classNames-root': () =>
    h(Skeleton, { prefixCls: PREFIX, classNames: { root: 'cn-root' } }),
  'semantic:classNames-all': () =>
    h(Skeleton, {
      prefixCls: PREFIX,
      classNames: {
        root: 'cn-root',
        header: 'cn-header',
        section: 'cn-section',
        avatar: 'cn-avatar',
        title: 'cn-title',
        paragraph: 'cn-paragraph',
      },
    }),
  'semantic:styles-all': () =>
    h(Skeleton, {
      prefixCls: PREFIX,
      styles: {
        root: { color: 'red' },
        header: { margin: '1px' },
        section: { margin: '2px' },
        avatar: { margin: '3px' },
        title: { margin: '4px' },
        paragraph: { margin: '5px' },
      },
    }),
};

// ---- 2. 三块互锁推导矩阵（由基线生成器里的三重循环一一对应）------------------

for (const avatar of ['unset', 'false', 'true']) {
  for (const title of ['unset', 'false', 'true']) {
    for (const paragraph of ['unset', 'false', 'true']) {
      const id = `blocks:avatar:${avatar}+title:${title}+paragraph:${paragraph}`;
      CASES[id] = () =>
        h(Skeleton, {
          prefixCls: PREFIX,
          avatar: fromTag(avatar),
          title: fromTag(title),
          paragraph: fromTag(paragraph),
        });
    }
  }
}

// ---- 7. ConfigProvider ------------------------------------------------------

/**
 * `config:className` —— antd 侧用真的 `<ConfigProvider skeleton={{className}}>`；
 * Vue 侧对应物是 `provide(configContextKey, ...)`。两者是同一件事的两种写法。
 *
 * ⚠️ 组件级配置挂在 **`context.components.<name>`** 下，不是顶层同名键 ——
 *    `useComponentConfig()` 读的是 `context.components?.[propName]`
 *    （`config-provider/context.ts:262`）。我第一次写成顶层 `skeleton: {...}`，
 *    于是「配置没生效」，差点误判成组件的 bug。
 */
CASES['config:className'] = () =>
  defineComponent({
    name: 'ASkeletonCompatConfigProbe',
    setup() {
      const config: Partial<ConfigContextValue> = {
        components: { skeleton: { className: 'cfg-class' } },
      };
      provide(configContextKey, { ...DEFAULT_CONFIG_CONTEXT, ...config });
      return (): VNodeChild => h(Skeleton, { prefixCls: PREFIX });
    },
  });

// ---------------------------------------------------------------------------
// 豁免
// ---------------------------------------------------------------------------

/**
 * 两条豁免，都是**已登记**的差异（`COMPATIBILITY.md` §9 / `README.md` §7），
 * 不是「为了让红灯变绿」。
 *
 * ⚠️ `domContractTest` 用的是 `toEqual` 而不是 `toContain` —— 豁免的 diff 必须
 * **恰好**出现，多一条少一条都算失败（防腐烂）。
 */
const ALLOW = {
  /**
   * ⭐ **本组件唯一的行为差异**（PLATFORM）。
   *
   * React 的判据是 `loading || !('loading' in props)` —— **看「键是否存在」**。
   * 显式传 `loading={undefined}` 时键**存在** ⇒ 上游渲染 children；
   * 而 Vue 的 prop 没有「键存在」这个概念（未传时值同样是 `undefined`），
   * 两者不可区分 ⇒ 我们渲染骨架。
   *
   * 四态对照见 `index.zh-CN.md`；「不传」那一态由 `loading:unset` 覆盖（✅ 一致）。
   */
  'loading:explicit-undefined': {
    reason:
      "React 的判据 `!('loading' in props)` 区分「键不存在」与「键存在但值为 undefined」：" +
      '显式传 `loading={undefined}` 时上游渲染 children。Vue 的 prop 没有「键存在」概念，' +
      '两者不可区分 ⇒ 我们渲染骨架。属 PLATFORM 差异（同 D21 家族），非实现错误。' +
      '「不传」那一态与上游一致，由 `loading:unset` 独立覆盖。',
    diff: [
      '$/span[0]: 标签不同 <span> vs <div>',
      '$/span[0]: 类名不同 [] vs [apollo]',
      '$/span[0]: 子节点数不同 0 vs 1',
    ],
  },

  /**
   * 默认前缀差异（D6 家族）：两侧都不传 `prefixCls` 时，
   * antd 用 `ant-skeleton`、我们用 `apollo-skeleton`（裁决 `prefix-cls-default` = A）。
   *
   * ⚠️ 这条用例是**刻意**把默认值不同钉成断言的 —— 其余用例两侧都显式传
   * `prefixCls="apollo"`，所以类名可以逐字比对，不会把「我们根本没读 prefixCls」
   * 这个 bug 一起归一化掉。
   */
  'prefix-cls:no-props': {
    reason:
      '默认前缀不同（D6）：antd 是 `ant-*`，我们是 `apollo-*`（裁决 `prefix-cls-default` = A）。' +
      '其余用例两侧显式传同一个 prefixCls，因此类名逐字比对；本用例专门钉住默认值的差异。',
    diff: [
      '$/div[0]: 类名不同 [ant-skeleton] vs [apollo-skeleton]',
      '$/div[0]/div[0]: 类名不同 [ant-skeleton-section] vs [apollo-skeleton-section]',
      '$/div[0]/div[0]/h3[0]: 类名不同 [ant-skeleton-title] vs [apollo-skeleton-title]',
      '$/div[0]/div[0]/ul[1]: 类名不同 [ant-skeleton-paragraph] vs [apollo-skeleton-paragraph]',
    ],
  },
} as const;

domContractTest('Skeleton', {
  baseline,
  // `render` 必须覆盖基线里的每一个 id —— 少一条会让测试失败，而不是静默跳过。
  render: (id) => {
    const build = CASES[id];
    if (!build) {
      throw new Error(
        `[Skeleton semantic.test] 基线里有用例 "${id}"，但 CASES 里没有对应构造。\n` +
          `  基线里的用例：${baseline.cases.map((c) => c.id).join(', ')}`,
      );
    }
    return build();
  },
  keepStyle: true,
  allow: ALLOW,
});
