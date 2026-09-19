/**
 * L1/L2 的主题矩阵：light / dark / compact / token-override 四态。
 *
 * ⚠️ 与 Divider 那份同源：本层**只做到「四态下都能渲染」**，没做到「四态下视觉正确」。
 *
 * 原因不是偷懒，而是 Space 的样式里**没有任何字面视觉值** —— 颜色 / 线宽 / 圆角 / 间距
 * 全部是 `var(--apollo-*)`（见 `style/index.ts`）。于是：
 *   - 主题切换改变的是**变量值**，不是我们的 CSS；
 *   - 断言「dark 下颜色不同」需要浏览器计算样式（jsdom 不做布局与层叠），那是 L6 的职责。
 *
 * 所以这里断言的是**这条架构性质本身**，而且 Space 可以断言得比 Divider 更硬：
 * Divider 的产物里**确实**有 4 个字面值（两个 Component Token + antd 自己写死的
 * `0.06em` / `0.9em`），只能说「每个字面值都有出处」；Space 的产物里**一个字面值都没有**，
 * 所以判据是 `toEqual([])` —— 加一个 `#f00` 或 `4px` 都会立刻红。
 *
 * 「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验（CSS 里引用的每个 `--apollo-*`
 * 都必须在 theme 的 `tokens.css` 里有声明）—— 那才是这个风险的正解。
 *
 * ── 规则条数为什么值得断言 ────────────────────────────────────────────────────
 *
 * `style/index.ts` 的文件头声称「antd 实测 49 条、我们 53 条」。声称的数目必须**可执行地**
 * 被验证，否则它会随实现漂移成一句谎话（这条就是踩出来的：初稿写的是
 * 「Addon 34 条」，实测 antd 是 29 条 —— 见 PITFALLS 114）。
 * 所以下面把 16 / 4 / 33 三个数钉死，并把 +4 的**来源**也钉死。
 */

import { themeTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { Space, SpaceAddon, SpaceCompact } from '../index';
import { genSpaceStyle } from '../style';
import { prepareComponentToken, SPACE_GAP_ALIASES } from '../style/token';

const P = 'apollo-space';
const PC = 'apollo-space-compact';
const PA = 'apollo-space-addon';

themeTest('Space', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 15,
});

/**
 * 把产物切成**规则的选择器**。
 *
 * 本生成器不产嵌套规则，每个规则恰好是「选择器行（以 `{` 结尾）+ 若干声明行 + `}`」，
 * 所以「以 `{` 结尾的行」与规则一一对应 —— 比用正则去匹配 `}` 稳（`}` 也会出现在
 * 字符串值里）。
 */
function selectorsOf(css: string): string[] {
  return css
    .split('\n')
    .filter((line) => line.endsWith('{'))
    .map((line) => line.slice(0, -1));
}

/** 按来源分组。顺序要紧：Addon 的选择器里也含 `space`，必须先摘出去。 */
function groupBySource(css: string) {
  const all = selectorsOf(css);
  const addon = all.filter((s) => s.includes(PA));
  const compact = all.filter((s) => !s.includes(PA) && s.includes(PC));
  const space = all.filter((s) => !s.includes(PA) && !s.includes(PC));
  return { all, addon, compact, space };
}

describe('Space · 主题无关性', () => {
  it('四态下的 DOM 完全相同（差异全在 CSS 变量里）', () => {
    const html = mount(Space, { slots: { default: () => ['a', 'b'] } }).html();
    // 组件本身不读任何 token 值，所以同一份 HTML 在四态下都成立。
    // 这条断言的作用是：一旦有人往组件里塞进「按主题分支」的逻辑，它会红。
    expect(html).not.toContain('data-apollo-theme');
    expect(html).toContain(`class="${P}`); // 类名以 apollo-space 开头
  });

  it('Compact / Addon 同样不读主题（DOM 里没有主题痕迹）', () => {
    const compact = mount(SpaceCompact, { slots: { default: () => ['a', 'b'] } }).html();
    const addon = mount(SpaceAddon, { slots: { default: () => 'x' } }).html();
    for (const html of [compact, addon]) {
      expect(html).not.toContain('data-apollo-theme');
    }
  });

  it('样式里引用的变量名全部是 `--apollo-*` 形态', () => {
    const vars = [...genSpaceStyle('apollo').matchAll(/var\((--[a-z0-9-]+)\)/g)].map(
      (m) => m[1] ?? '',
    );
    expect(vars.length).toBeGreaterThan(0);
    for (const name of vars) {
      expect(name.startsWith('--apollo-')).toBe(true);
    }
  });

  it('前缀不同则产物不同（否则 prefixCls 参数是摆设）', () => {
    expect(genSpaceStyle('apollo')).not.toBe(genSpaceStyle('ant'));
    expect(genSpaceStyle('ant')).toContain('.ant-space-compact-block');
    expect(genSpaceStyle('ant')).toContain('.ant-space-addon-compact-item');
  });

  it('★ 产物里**一个字面视觉值都没有**（H7 的最强形态：`toEqual([])`）', () => {
    const css = genSpaceStyle('apollo');
    const literals = [
      ...new Set(
        css.match(/#[0-9a-f]{3,8}\b|rgba?\(|\b\d+(?:\.\d+)?(?:px|em|rem|s|deg)\b|\b\d+\.\d+\b/g) ??
          [],
      ),
    ].sort();

    // 与 Divider 的差别：Divider 是 `toEqual(['0.05','0.06em','0.9em','1em'])`（4 个有出处的
    // 字面值），Space 是**空的** —— 因为 Space 没有字面量 Component Token，antd 也没写死任何
    // 视觉值。所以这里可以断言「一个都不许有」，而不是「每个都要能解释」。
    expect(literals).toEqual([]);

    // 颜色一律不许硬编码（全部走 var(--apollo-*)）—— 上面那条已覆盖，这里留一条更窄的
    // 断言是为了让失败信息更直白（「你加了个颜色」比「字面值集合变了」好读）。
    expect(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
  });
});

describe('Space · 样式产物的规则条数（文件头声称的数目必须可执行地成立）', () => {
  const css = genSpaceStyle('apollo');
  const groups = groupBySource(css);

  it('★ Space 恰好 16 条，且选择器逐条与 antd 实测产物一致', () => {
    // 16 = 1 基座 + 1 rtl + 1 vertical + 1 align + 4 align-* + 2 item 相关 + 6 gap
    expect(groups.space).toEqual([
      `.${P}`,
      `.${P}-rtl`,
      `.${P}-vertical`,
      `.${P}-align`,
      `.${P}-align-center`,
      `.${P}-align-start`,
      `.${P}-align-end`,
      `.${P}-align-baseline`,
      `.${P} .${P}-item:empty`,
      `.${P} .${P}-item>.apollo-badge-not-a-wrapper:only-child`,
      `.${P}-gap-row-small`,
      `.${P}-gap-row-medium,.${P}-gap-row-middle`,
      `.${P}-gap-row-large`,
      `.${P}-gap-col-small`,
      `.${P}-gap-col-medium,.${P}-gap-col-middle`,
      `.${P}-gap-col-large`,
    ]);
  });

  it('★ Compact 恰好 4 条，逐条一致', () => {
    expect(groups.compact).toEqual([`.${PC}`, `.${PC}-block`, `.${PC}-vertical`, `.${PC}-rtl`]);
  });

  it('★ Addon 恰好 33 条 = antd 实测 29 条 + D7 展开的 4 条', () => {
    // antd 是 29 条：genCommonStyle 的 4 条重置 + genSpaceAddonStyle 的 20 条 +
    // genCompactItemStyle({focus:false}) 的 5 条 = 29。
    // 我们多 4 条，因为 status 在 antd 里只改中间变量、不额外产规则，
    // 展开成「status+variant」复合选择器后每种组合各占一条。
    expect(groups.addon).toHaveLength(33);
  });

  it('★ +4 的来源逐条列出（不是「多抄了 4 条」）', () => {
    const expansion = [
      `.${PA}-status-error.${PA}-variant-outlined`,
      `.${PA}-status-warning.${PA}-variant-outlined`,
      `.${PA}-status-error.${PA}-variant-filled`,
      `.${PA}-status-warning.${PA}-variant-filled`,
    ];
    for (const selector of expansion) {
      expect(groups.addon, selector).toContain(selector);
    }
    // 4 = 2 个 status × 2 个「消费被 status 改写的那个变量的 variant」。
    // outlined 消费 `--addon-border-color-outlined`，filled 消费 `--addon-background-filled`
    // （见 antd `style/addon.ts` 的 Variants / Status 两段）。borderless / underlined
    // 直接写 `border:none;background:transparent`，**不**消费中间变量 ⇒ 不参与展开。
    expect(expansion).toHaveLength(4);
  });

  it('★ Space / Compact **没有** genCommonStyle 的重置规则（`resetStyle: false` 的可执行判据）', () => {
    // 上游 `genStyleHooks(['Space','Compact'], …, { resetStyle: false })` 显式关掉了
    // `genCommonStyle`（Space 的注释：'Space component don't apply extra font style'）。
    // Addon 走默认值，所以**有**那四条 `[class^=…]{box-sizing}`。
    const resetShape = /\[class\^="/;
    expect(groups.space.filter((s) => resetShape.test(s))).toEqual([]);
    expect(groups.compact.filter((s) => resetShape.test(s))).toEqual([]);
    expect(groups.addon.filter((s) => resetShape.test(s))).toHaveLength(2);
  });

  it('总条数 = 16 + 4 + 33 = 53（文件头表格里的那个数）', () => {
    expect(groups.space).toHaveLength(16);
    expect(groups.compact).toHaveLength(4);
    expect(groups.addon).toHaveLength(33);
    expect(groups.all).toHaveLength(53);
  });

  it('★ 六条 gap 规则的取值全部来自别名 token（不是内联定值）', () => {
    // 这是「预设尺寸随主题自适应」的机制：`small`/`middle`/`large` 三档分别派生自
    // paddingXS / padding / paddingLG，落成变量引用。
    expect(css).toContain(`.${P}-gap-row-small{\n  row-gap:var(--apollo-padding-xs);\n}`);
    expect(css).toContain(
      `.${P}-gap-row-medium,.${P}-gap-row-middle{\n  row-gap:var(--apollo-padding);\n}`,
    );
    expect(css).toContain(`.${P}-gap-row-large{\n  row-gap:var(--apollo-padding-lg);\n}`);
    expect(css).toContain(`.${P}-gap-col-small{\n  column-gap:var(--apollo-padding-xs);\n}`);
    expect(css).toContain(
      `.${P}-gap-col-medium,.${P}-gap-col-middle{\n  column-gap:var(--apollo-padding);\n}`,
    );
    expect(css).toContain(`.${P}-gap-col-large{\n  column-gap:var(--apollo-padding-lg);\n}`);
  });

  it('★ `-gap-row-medium` 与 `-gap-row-middle` 是同一条规则的**两个选择器**（不是两条）', () => {
    // `medium` 是新名字、`middle` 是存量名字，两者必须指向同一个值。
    // 若有人「顺手拆成两条」，条数会变成 55 —— 这条断言是那条漂移的哨兵。
    const gapMedium = groups.space.filter((s) => s.includes('gap-row-medium'));
    expect(gapMedium).toHaveLength(1);
    expect(gapMedium[0]).toBe(`.${P}-gap-row-medium,.${P}-gap-row-middle`);
  });
});

describe('Space · Addon 的「顺序即契约」（变异验证逼出来的用例）', () => {
  const css = genSpaceStyle('apollo');
  const addon = groupBySource(css).addon;

  it('★ variant → status → status×variant → filled+disabled 的**相对顺序**逐条钉死', () => {
    // ── 为什么必须有这条断言 ─────────────────────────────────────────────────
    //
    // `style/index.ts` 的文件头把「disabled 那条必须排在 status 之后」写成了一条
    // 契约，理由是**特异性相同**：
    //   `.addon-status-error.addon-variant-filled`   → 0,2,0
    //   `.addon-variant-filled.addon-disabled`       → 0,2,0
    // 在 antd 那边两者靠的是**不同的中间变量**（一个改 `--bg-filled`、一个直接写
    // `background`），展开成复合选择器之后特异性拉平，只能靠**声明顺序**决胜。
    // 顺序写反 ⇒ 「filled + error + disabled」的 Addon 背景会变成 error 色而不是
    // disabled 色。
    //
    // ⚠️ 这条用例是**变异验证逼出来的**：把那条规则挪到 status 之前，
    //    22 条断言全绿 —— 也就是说文件头声称的契约当时**没有任何断言**。
    //    顺序类契约必须显式断言「谁在谁前面」，断言条数是抓不住它的。
    //
    // ⚠️ 为什么是「断言顺序」而不是「断言计算样式」：jsdom 不加载静态 CSS
    //    （我们的样式是构建期产物，测试环境不注入），拿不到层叠结果。
    //    真正的层叠验证在 L6（真实浏览器）；这里退一步钉住**顺序**这个可判定的代理量。
    const region = addon.filter(
      (s) =>
        s.includes('-variant-outlined') ||
        s.includes('-variant-filled') ||
        s.includes('-variant-borderless') ||
        s.includes('-variant-underlined') ||
        s.includes('-status-error') ||
        s.includes('-status-warning'),
    );

    expect(region).toEqual([
      `.${PA}-variant-outlined`,
      `.${PA}-variant-filled`,
      `.${PA}-variant-borderless`,
      `.${PA}-variant-underlined`,
      `.${PA}-status-error`,
      `.${PA}-status-warning`,
      `.${PA}-status-error.${PA}-variant-outlined`,
      `.${PA}-status-warning.${PA}-variant-outlined`,
      `.${PA}-status-error.${PA}-variant-filled`,
      `.${PA}-status-warning.${PA}-variant-filled`,
      `.${PA}-variant-filled.${PA}-disabled`,
    ]);
  });

  it('★ 那条决胜规则必须排在**所有** status 规则之后（顺序写反 = 视觉缺陷）', () => {
    const lastStatus = Math.max(
      addon.indexOf(`.${PA}-status-error.${PA}-variant-filled`),
      addon.indexOf(`.${PA}-status-warning.${PA}-variant-filled`),
    );
    const decisive = addon.indexOf(`.${PA}-variant-filled.${PA}-disabled`);
    expect(decisive).toBeGreaterThan(lastStatus);
    // 而且它必须是**变体/状态这一段**的最后一条 —— 后面紧接着就是
    // `genCompactItemStyle` 产出的紧凑项规则（那些用 `:not(.类名)`，与上面的
    // `:not(:伪类)` 在字面上可区分）。
    const firstCompactItemRule = addon.findIndex((s) => s.includes('-compact-item:not(.'));
    expect(firstCompactItemRule).toBeGreaterThan(decisive);
    expect(addon.slice(decisive + 1, firstCompactItemRule)).toEqual([]);
  });

  it('★ 决胜规则把颜色**还原成默认值**（不是设成 status 色）', () => {
    // 「filled + error + disabled」应当拿到 disabled 背景，而不是 error 背景。
    // 判据是这条规则的声明内容 —— 它必须回到 `colorBorder` / `colorBgContainerDisabled`
    // （也就是 `.addon-variant-filled` 的默认值），而不是 `colorErrorBg`。
    const block = css.slice(css.indexOf(`.${PA}-variant-filled.${PA}-disabled{`));
    const body = block.slice(0, block.indexOf('}'));
    expect(body).toContain('border-color:var(--apollo-color-border)');
    expect(body).toContain('background:var(--apollo-color-bg-container-disabled)');
    expect(body).not.toContain('color-error');
  });

  it('★ `genCompactItemStyle` 那一段排在**最后**（它要压过上面的 border-radius）', () => {
    // antd 的导出顺序是 `genStyleHooks('Addon', (token) => [genSpaceAddonStyle(token),
    // genCompactItemStyle(token, { focus: false })])` —— 紧凑项那段在后。
    // 它要压过 `-compact-last-item` / `-compact-first-item` 的圆角设置。
    const lastBase = addon.indexOf(`.${PA}-compact-item:not(:first-child)`);
    const firstCompactItem = addon.findIndex((s) => s.includes('-compact-item:not(.'));
    expect(firstCompactItem).toBeGreaterThan(lastBase);
  });
});

describe('Space · Component Token', () => {
  it('★ Component Token 是**空的** —— `prepareComponentToken` 返回 `{}`', () => {
    // antd 6.6.4 `components/space/style/index.ts:7-8`：
    //   // biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
    //   export interface ComponentToken {}
    //   export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
    // 所以用户**无法**通过 `theme.components.Space` 覆盖任何东西。
    // 判据是 `toEqual({})` 而不是「没写」—— 后者区分不了「确认过是空的」与「忘了写」。
    const prepared = prepareComponentToken({} as never);
    expect(prepared).toEqual({});
    expect(Object.keys(prepared)).toEqual([]);
  });

  it('★ 三个**内部** gap token 的别名来源与 antd 的 `mergeToken` 逐条一致', () => {
    // antd 的 `genStyleHooks` 回调里：
    //   mergeToken<SpaceToken>(token, {
    //     spaceGapSmallSize:  token.paddingXS,
    //     spaceGapMiddleSize: token.padding,
    //     spaceGapLargeSize:  token.paddingLG,
    //   })
    // 它们**不在** ComponentToken 里（用户覆盖不了），但是六条 gap 规则的取值来源。
    expect(SPACE_GAP_ALIASES).toEqual({
      small: 'paddingXS',
      middle: 'padding',
      large: 'paddingLG',
    });
    // 数量也是契约：多一个少一个都算漂移。
    expect(Object.keys(SPACE_GAP_ALIASES).sort()).toEqual(['large', 'middle', 'small']);
  });

  it('★ `Compact` / `Addon` 的 ComponentToken 同样是空的（D7 之外的另一半契约）', () => {
    // 本模块只导出一份 `prepareComponentToken`（Space 的）—— 这是**有意的**：
    // antd 的 `style/compact.ts` / `style/addon.ts` 也是空接口 + `genStyleHooks` 默认
    // token 函数，两者都不贡献任何用户可覆盖的字段。所以 registry 的 `tokenCount` 是 0，
    // `registry/tokens.json` 里**不**加条目。
    // 这条断言的作用是钉住「我们没有偷偷少实现一个 token 函数」——
    // 入口只有这一个，而它返回空。
    expect(Object.keys(prepareComponentToken({} as never))).toEqual([]);
  });
});
