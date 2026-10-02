/**
 * L7 主题 —— Timeline 的 Component Token（6 个，其中 **2 个刻意不声明**）
 * + 3 个 `mergeToken` 派生（**上游是死派生**）+ 与 Steps 的跨包耦合面。
 *
 * ── 这个文件证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：
 *   1. `prepareComponentToken` 的**键、顺序、默认值来源**与 antd 6.6.4 逐条一致；
 *   2. `genTokenDecls` 的 **4** 条声明（变量名 + 构建期解析值）与 antd 产物里
 *      `--ant-timeline-*` 的 css-var 块**逐条同构**（含 4 个**交叉验证的硬值**：
 *      `rgba(5,5,5,0.06)` / `2px` / `2px` / `20px`）；
 *   3. 🚨 **`dotSize` / `dotBg` 被引用但刻意不声明** —— 这是本组件最需要理解的一处，
 *      见 `style/token.ts` 文件头：`var(--…-dot-size-custom, var(--…-dot-size-origin))`
 *      的两层回退链**依赖「未声明」**（未声明 ⇒ `-custom` 无效 ⇒ 回退 Steps 的 `-origin`）；
 *   4. 🚨 **双向检查**：声明块真的在根规则内部；引用的 `--apollo-timeline-*`
 *      除那 2 个例外全部有落点（拼错 = 静默失效）；没有死变量；
 *   5. 🚨 **跨包耦合面**：Timeline 引用的每一个 `--apollo-cmp-steps-*`
 *      **在 steps 的产物里有声明**（否则 `var()` 全失效 + B7 报未声明变量）；
 *   6. 3 个 `mergeToken` 派生（`itemHeadSize` / `customHeadPaddingVertical` /
 *      `paddingInlineEnd`）**在本仓与上游都是死派生**（上游 6.6.4 的样式函数从不消费）。
 *
 * 不证明：这些值被正确消费进 CSS（那是 L4/L6 的事）、视觉正确（L6 逐像素）。
 *
 * ── 🚨 第 4 条为什么必须写（breadcrumb 实测踩到）──────────────────────────────
 *
 * `genTimelineStyle` 若**忘了** `...genTokenDecls(p)`（本仓约定：声明块内联在组件根规则里），
 * 4 个 `--apollo-timeline-*` **全部未声明** ⇒ `padding:var(...)` / `background:var(...)`
 * 静默失效（未定义 var 不是回退默认值，而是 invalid at computed-value time）⇒ 视觉全错，
 * 而 `lint:types` / L1 / L3 / L5 **全都是绿的**。只有 L6 与这条检查能发现它。
 */

import { themeTest } from '@apollo-design/test-utils';
import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { genStepsStyle } from '../../steps/style';
import { genTimelineStyle, genTokenDecls } from '../style';
import { prepareComponentToken } from '../style/token';

const PREFIX = 'apollo';
const CLS = `.${PREFIX}-timeline`;

/** 与 antd 的 css-var 块逐字对齐的顺序（`--ant-timeline-*` 的声明顺序）。 */
const EXPECTED_VARS = [
  '--apollo-timeline-tail-color',
  '--apollo-timeline-tail-width',
  '--apollo-timeline-dot-border-width',
  '--apollo-timeline-item-padding-bottom',
];

/**
 * 🚨 **刻意不声明**的两个 Component Token（`dotSize` / `dotBg`）。
 *
 * 它们**被规则引用**（`var(--apollo-timeline-dot-size)`），但**不在** `genTokenDecls` 里。
 * 判据见 `style/token.ts` 文件头：上游把默认值写成 `undefined` ⇒ cssinjs 的 cssVar
 * 模式跳过声明 ⇒ `var(custom, origin)` 回退到 Steps 的 origin。
 */
const DELIBERATELY_UNDECLARED = ['--apollo-timeline-dot-size', '--apollo-timeline-dot-bg'];

/**
 * 规则**内联声明**的 `--apollo-timeline-*`（**不是** Component Token）。
 *
 * 它们是 Timeline 自己的中间量（栅格占比 / 交错间距 / 横向高度），
 * 与 Component Token 走的是**两条**声明路径 —— 别混。
 */
const INLINE_INTERNAL_VARS = [
  '--apollo-timeline-head-span',
  '--apollo-timeline-head-span-ptg',
  '--apollo-timeline-alternate-gap',
  '--apollo-timeline-content-height',
  '--apollo-timeline-alternate-content-offset',
];

const token = getDesignToken();
const decls = genTokenDecls(PREFIX);
const css = genTimelineStyle(PREFIX);

/** `--apollo-timeline-x:value;` → `['--apollo-timeline-x', 'value']`。 */
const splitDecl = (decl: string): [string, string] => {
  const trimmed = decl.trim().replace(/;$/, '');
  const at = trimmed.indexOf(':');
  return [trimmed.slice(0, at), trimmed.slice(at + 1)];
};

/** 从 CSS 文本里取所有 `--apollo-<ns>-*` 的**声明**名（带 `:`）。 */
const declaredNames = (source: string, ns: string): Set<string> =>
  new Set(
    [...source.matchAll(new RegExp(`(--apollo-${ns}-[a-z0-9-]+):`, 'g'))].map(
      (m) => m[1] as string,
    ),
  );

/** 从 CSS 文本里取所有 `var(--apollo-<ns>-*)` 的**引用**名。 */
const referencedNames = (source: string, ns: string): Set<string> =>
  new Set(
    [...source.matchAll(new RegExp(`var\\((--apollo-${ns}-[a-z0-9-]+)`, 'g'))].map(
      (m) => m[1] as string,
    ),
  );

// ── 四态渲染（light / dark / compact / token-override）────────────────────────
themeTest('Timeline', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
  // 🚨 与 `demo.test.ts` 同一豁免：上游把 `Timeline.Item` / `pending` / `pendingDot` /
  //    `mode=left|right` 与四个项级字段都废弃了 ⇒ 挂载即发多条 `console.error`。
  //    这是**有意的**（`pending-legacy` demo 的存在就是为了演示废弃 API）。
  allow: [
    {
      match: 'is deprecated',
      reason:
        'D91 家族：上游废弃了 `Timeline.Item` / `pending` / `pendingDot` / `mode=left|right` 与四个项级字段；本仓保留同款告警，demo 用到即有。',
    },
  ],
});

describe('Timeline · Component Token 判定值', () => {
  it('`prepareComponentToken` 的**键与顺序**与上游一致（6 个，含 2 个显式 undefined）', () => {
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toEqual([
      'tailColor',
      'tailWidth',
      'dotBorderWidth',
      'dotBg',
      'dotSize',
      'itemPaddingBottom',
    ]);
  });

  it('默认值逐条来自对应的别名 token / 算式（上游 `prepareComponentToken`）', () => {
    const t = prepareComponentToken(token);
    expect(t.tailColor).toBe(token.colorSplit);
    expect(t.tailWidth).toBe(token.lineWidthBold);
    expect(t.dotBorderWidth).toBe(token.lineWidthBold);
    // 🚨 这两个是**判据**，不是遗漏：必须是 `undefined`（见文件头 / `token.ts` 文件头）
    expect(t.dotBg).toBeUndefined();
    expect(t.dotSize).toBeUndefined();
    expect(t.itemPaddingBottom).toBe(token.padding * 1.25);
  });

  it('`genTokenDecls` 产出 **4** 条声明，变量名与顺序与 antd 的 css-var 块一致', () => {
    expect(decls).toHaveLength(4);
    expect(decls.map((d) => splitDecl(d)[0])).toEqual(EXPECTED_VARS);
  });

  it('声明值是**构建期解析值**（颜色是字面量、尺寸带 `px`）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-timeline-tail-color')).toBe(String(token.colorSplit));
    expect(map.get('--apollo-timeline-tail-width')).toBe(`${token.lineWidthBold}px`);
    expect(map.get('--apollo-timeline-dot-border-width')).toBe(`${token.lineWidthBold}px`);
    expect(map.get('--apollo-timeline-item-padding-bottom')).toBe(`${token.padding * 1.25}px`);
  });

  /**
   * 🚨 4 个**交叉验证的硬值** —— 逐字来自 antd 6.6.4 的真实产物
   * （`extract-timeline-css.mjs` 的 css-var 块）：
   *
   * ```
   * --ant-timeline-tail-color:rgba(5,5,5,0.06);
   * --ant-timeline-tail-width:2px;
   * --ant-timeline-dot-border-width:2px;
   * --ant-timeline-item-padding-bottom:20px;
   * ```
   *
   * 这条用例是**防腐断言**：如果哪天本仓的 `colorSplit` / `lineWidthBold` / `padding`
   * 等别名 token 漂了，它会在 G3 就报出来（而不是等到 L6 才发现整片间距/颜色变了）。
   */
  it('🚨 四个值 == antd 产物里的硬值（防腐断言）', () => {
    const map = new Map(decls.map(splitDecl));
    expect(map.get('--apollo-timeline-tail-color')).toBe('rgba(5,5,5,0.06)');
    expect(map.get('--apollo-timeline-tail-width')).toBe('2px');
    expect(map.get('--apollo-timeline-dot-border-width')).toBe('2px');
    expect(map.get('--apollo-timeline-item-padding-bottom')).toBe('20px');
  });
});

describe('Timeline · 声明 ↔ 引用（双向）', () => {
  it('🚨 声明块**必须在根规则内部**（漏了它 = 4 个变量全未声明、整片样式静默失效）', () => {
    const rootStart = css.indexOf(`${CLS}{`);
    expect(rootStart).toBeGreaterThanOrEqual(0);
    const rootRule = css.slice(rootStart, css.indexOf('}', rootStart));

    for (const decl of decls) {
      expect(rootRule).toContain(decl.trim());
    }
  });

  it('🚨 `genTokenDecls` 的每条都被规则引用（没有死变量）', () => {
    for (const decl of decls) {
      expect(css).toContain(`var(${splitDecl(decl)[0]})`);
    }
  });

  it('🚨 `dotSize` / `dotBg` **被引用但刻意不声明**（保住 `var(custom, origin)` 两层回退链）', () => {
    // ① 引用真的在（否则「不声明」无从谈起）
    for (const name of DELIBERATELY_UNDECLARED) {
      expect(css).toContain(`var(${name})`);
    }
    // ② 它们**不在** `genTokenDecls` 里
    const declaredBlock = decls.join('\n');
    for (const name of DELIBERATELY_UNDECLARED) {
      expect(declaredBlock).not.toContain(`${name}:`);
    }
    // ③ 也不在规则内联声明里（否则同样会盖掉 Steps 的 origin）
    const inlineDeclared = declaredNames(css, 'timeline');
    for (const name of DELIBERATELY_UNDECLARED) {
      expect(inlineDeclared).not.toContain(name);
    }
  });

  it('🚨 引用的 `--apollo-timeline-*` 全部有落点（唯二例外见上一条）', () => {
    const declared = new Set([...decls.map((d) => splitDecl(d)[0]), ...INLINE_INTERNAL_VARS]);
    const referenced = referencedNames(css, 'timeline');

    expect(referenced.size).toBeGreaterThan(0);
    const unresolved = [...referenced].filter(
      (name) => !declared.has(name) && !DELIBERATELY_UNDECLARED.includes(name),
    );
    expect(unresolved).toEqual([]);

    // 反空转：声明的 4 条与内联的 5 条**真的都被引用**（否则 `declared` 里的豁免是白写的）
    for (const name of [...declared]) {
      expect(referenced).toContain(name);
    }
  });

  it('🚨 规则引用的**全局** `--apollo-*` token 都在 `tokens.css` 里有声明', () => {
    // ⚠️ `getCSSVarDeclarations(token, options)` 返回的是一段 **CSS 文本**
    //    （`:root{--apollo-color-primary:#1677ff;…}`），不是声明数组。
    const globalCss = getCSSVarDeclarations(getDesignToken());
    const declaredGlobals = new Set(
      [...globalCss.matchAll(/(--apollo-[a-z0-9-]+):/g)].map((m) => m[1] as string),
    );

    const referenced = [...css.matchAll(/var\((--apollo-[a-z0-9-]+)\)/g)]
      .map((m) => m[1] as string)
      // 自有变量（`--apollo-timeline-*`）走 `genTokenDecls` / 规则内联，不在 tokens.css 里
      .filter((name) => !name.startsWith('--apollo-timeline-'))
      // Steps 的内部变量（`--apollo-cmp-steps-*`）由 steps 的产物声明 —— 下一条单独证
      .filter((name) => !name.startsWith('--apollo-cmp-steps-'));

    expect(referenced.length).toBeGreaterThan(0);
    for (const name of new Set(referenced)) {
      expect(declaredGlobals).toContain(name);
    }
  });
});

/**
 * Timeline 是 `Steps` 的**薄壳**（`style/index.ts` 文件头），它的样式表不画自己的 DOM，
 * 而是大量**覆盖** Steps 的中间变量（`--apollo-cmp-steps-*`）把「步骤条」改造成「时间轴」。
 *
 * ⇒ 这些变量名**必须真的在 steps 的产物里存在**。写错一个字的后果不是报错，而是
 * `var()` 静默失效 + B7 报未声明变量（实测踩过：把 `--apollo-cmp-steps-*` 写成
 * `--ant-cmp-steps-*`，`ant` 变体直接产出 3 个未声明变量）。
 */
describe('Timeline · 与 Steps 的跨包耦合面（本组件唯一的耦合）', () => {
  const stepsDeclared = declaredNames(genStepsStyle(), 'cmp-steps');
  /** Timeline 自己也会**声明**一部分 `--apollo-cmp-steps-*`（覆盖 Steps 的中间量）。 */
  const selfDeclared = declaredNames(css, 'cmp-steps');
  const referenced = referencedNames(css, 'cmp-steps');

  it('steps 的产物确实声明了这些变量（反空转：不是两个空集合互比）', () => {
    expect(stepsDeclared.size).toBeGreaterThan(0);
    expect(referenced.size).toBeGreaterThan(0);
  });

  it('🚨 引用的每个 `--apollo-cmp-steps-*` 都有落点（steps 声明 ∪ 本组件内联覆盖）', () => {
    const available = new Set([...stepsDeclared, ...selfDeclared]);
    const unresolved = [...referenced].filter((name) => !available.has(name));
    expect(unresolved).toEqual([]);
  });

  it('🚨 覆盖的是 Steps 的变量，**不是**自己另起一套（前缀必须是 `cmp-steps`）', () => {
    // 上游 `genCssVar(antCls, 'cmp-steps')` —— 命名空间是 `cmp-steps`，不是 `steps`。
    // 写成 `--apollo-steps-*` 会「引用得到、语义错」，且 steps 里恰好也有同名变量时**静默生效**。
    for (const name of selfDeclared) {
      expect(name.startsWith('--apollo-cmp-steps-')).toBe(true);
    }
    expect(selfDeclared.size).toBeGreaterThan(0);
  });
});

/**
 * 上游 `genStyleHooks` 里 `mergeToken(token, { itemHeadSize: 10,
 * customHeadPaddingVertical: token.paddingXXS, paddingInlineEnd: 2 })`。
 *
 * 🚨 但 antd 6.6.4 的三个样式函数（`genTimelineStyle` / `genVerticalStyle` /
 * `genHorizontalStyle`）**从不消费**这三个字段 —— 全仓 grep 零命中
 * （可复现：`grep -rn "itemHeadSize\|customHeadPaddingVertical" /tmp/antd-src/package/es/timeline/`）。
 * ⇒ 它们是**死派生**。本仓照做（不引入），并且**断言它不出现** ——
 * 免得后人「照着上游补上」反而引入三个永不生效的变量。
 */
describe('Timeline · 3 个 `mergeToken` 派生是**死派生**（UPSTREAM quirk）', () => {
  it('它们**不**是 Component Token（`ComponentToken` 只有 6 个字段，与本仓 `token.ts` 一致）', () => {
    const t = prepareComponentToken(token);
    expect(Object.keys(t)).toHaveLength(6);
    expect(Object.keys(t)).not.toContain('itemHeadSize');
    expect(Object.keys(t)).not.toContain('customHeadPaddingVertical');
    expect(Object.keys(t)).not.toContain('paddingInlineEnd');
  });

  it('本仓照做：不引入它们（不产生永不生效的变量/声明）', () => {
    // 这三个是**驼峰**标识符，正常 CSS 产物里不会出现 —— 若有人「照着上游补上」
    // 把它们内联进样式，就会以 `--apollo-timeline-item-head-size` 之类出现。
    const haystack = `${css}\n${decls.join('\n')}`;
    expect(haystack).not.toContain('item-head-size');
    expect(haystack).not.toContain('custom-head-padding-vertical');
    expect(haystack).not.toContain('padding-inline-end');
  });
});
