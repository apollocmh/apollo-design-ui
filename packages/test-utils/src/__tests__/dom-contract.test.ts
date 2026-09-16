/**
 * `dom-contract.ts` 的契约测试 —— L4 归一化与比对器本身。
 *
 * ⚠️ 关于本文件里的 `FAKE_BASELINE`
 * 它是**为了验证比对器本身而手工构造的假基线**，不是任何组件的 oracle，
 * 也永远不会被 `tests/compat/baseline/*.mjs` 生成或写入磁盘。
 * `tests/compat/README.md` 的「基线禁止手改」约束针对的是
 * `tests/compat/baselines/*.json` —— 那里面的 html 必须来自 React 渲染器。
 * 本文件测的是「拿到两份 HTML 之后，比对器判得对不对」。
 */

import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { AllowanceError } from '../allowance';
import {
  contractOf,
  diffContract,
  diffHtml,
  domContractTest,
  normalizeStyle,
  parseFragment,
  projectNode,
} from '../dom-contract';

// ---------------------------------------------------------------------------
// normalizeStyle
// ---------------------------------------------------------------------------

describe('normalizeStyle', () => {
  it('空值一律 undefined（空串、null、undefined）', () => {
    expect(normalizeStyle('')).toBeUndefined();
    expect(normalizeStyle(null)).toBeUndefined();
    expect(normalizeStyle(undefined)).toBeUndefined();
  });

  it('拆声明、属性名小写、值去空白、结果排序', () => {
    expect(normalizeStyle('COLOR: red ; background : blue')).toEqual([
      'background:blue',
      'color:red',
    ]);
  });

  it('忽略空段与没有冒号的段', () => {
    expect(normalizeStyle(';;color:red;;nonsense;;')).toEqual(['color:red']);
    expect(normalizeStyle('nonsense')).toBeUndefined();
    expect(normalizeStyle(':')).toBeUndefined();
  });

  it('⭐ 存在无前缀 transform 时剔除厂商前缀版本（D16）', () => {
    // React 侧会同时写两条，Vue 侧只写一条 —— 这是格式差异，不是契约差异。
    expect(normalizeStyle('-ms-transform:rotate(90deg);transform:rotate(90deg)')).toEqual([
      'transform:rotate(90deg)',
    ]);
  });

  it('⭐ 只有厂商前缀版本时**不**剔除 —— 否则会把真差异静默吃掉', () => {
    expect(normalizeStyle('-ms-transform:rotate(90deg)')).toEqual(['-ms-transform:rotate(90deg)']);
  });

  it('重复声明以后出现的为准（与 CSS 层叠一致）', () => {
    expect(normalizeStyle('color:red;color:blue')).toEqual(['color:blue']);
  });

  it('属性值内部的空白被全部去掉（`0 1px` → `01px`）', () => {
    // 说明：这是有意的**过归一化** —— 它牺牲「值可读」换取「两侧序列化差异不干扰比对」。
    // 若日后需要断言具体值，应当在组件自己的样式测试里做，而不是靠这里的字符串。
    expect(normalizeStyle('margin: 0 1px')).toEqual(['margin:01px']);
  });
});

// ---------------------------------------------------------------------------
// parseFragment
// ---------------------------------------------------------------------------

describe('parseFragment', () => {
  it('注释与文本节点不进契约（Vue 渲染 null 会产生 <!---->）', () => {
    const roots = parseFragment('<!--x--><div></div>text<!---->');
    expect(roots).toHaveLength(1);
    expect(roots[0]!.tagName.toLowerCase()).toBe('div');
  });

  it('支持多根', () => {
    expect(parseFragment('<i></i><b></b>')).toHaveLength(2);
  });

  it('空串 → 空数组', () => {
    expect(parseFragment('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// contractOf · contract 档
// ---------------------------------------------------------------------------

describe('contractOf · profile: contract（默认，依据 TESTING.md T10）', () => {
  it('只保留 class + data-* + role + aria-*', () => {
    const [node] = contractOf(
      '<div id="a" class="b a" data-x="1" role="button" aria-label="L" title="t"></div>',
    );
    expect(node).toEqual({
      tag: 'div',
      class: ['a', 'b'], // 已排序
      attrs: [
        ['aria-label', 'L'],
        ['data-x', '1'],
        ['role', 'button'],
      ],
      children: [],
    });
  });

  it('id 本身不进契约（自动 ID 两侧必然不同）', () => {
    const [node] = contractOf('<div id="rc-123"></div>');
    expect(node!.attrs).toEqual([]);
  });

  it('style 默认不保留（T10 未列 style）', () => {
    const [node] = contractOf('<div style="color:red"></div>');
    expect(node).not.toHaveProperty('style');
  });

  it('keepStyle: true 时保留，且走同一套归一化', () => {
    const [node] = contractOf('<div style="color: red"></div>', { keepStyle: true });
    expect(node!.style).toEqual(['color:red']);
  });

  it('ignoreAttrs 在档位筛选**之后**生效 —— 只能减不能加', () => {
    const [node] = contractOf('<div role="button" aria-label="L" title="t"></div>', {
      ignoreAttrs: ['role', 'title'],
    });
    // `title` 本来就不在 contract 档里，忽略它不会把它加回来。
    expect(node!.attrs).toEqual([['aria-label', 'L']]);
  });

  it('子节点递归投影，且顺序保留', () => {
    const [node] = contractOf('<div class="root"><i class="b"></i><b class="a"></b></div>');
    expect(node!.children.map((child) => child.tag)).toEqual(['i', 'b']);
  });
});

describe('contractOf · profile: full（icons 的登记偏离，见 icons-contract.md §6.1）', () => {
  it('保留全部属性，且 id 原样（icons 有 id 透传用例）', () => {
    const [node] = contractOf('<svg id="my-icon" viewBox="0 0 1 1" data-icon="x"></svg>', {
      profile: 'full',
    });
    expect(node!.attrs).toEqual([
      ['data-icon', 'x'],
      ['id', 'my-icon'],
      ['viewBox', '0 0 1 1'],
    ]);
  });

  it('⭐ SVG 属性的大小写由 HTML 解析器按 SVG 命名空间还原 —— 所以 full 档能断言 viewBox', () => {
    // 这是 icons 能用 `full` 档的前提：`viewBox` / `preserveAspectRatio` 这些
    // 驼峰属性名不会被解析器压成小写。**前提是它们出现在 `<svg>` 里** ——
    // 写成 `<div viewBox=...>` 就会被压成 `viewbox`（HTML 元素的属性名不区分大小写）。
    const [svg] = contractOf('<svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"></svg>', {
      profile: 'full',
    });
    expect(svg!.attrs.map(([name]) => name)).toEqual(['preserveAspectRatio', 'viewBox']);

    const [div] = contractOf('<div viewBox="0 0 1 1"></div>', { profile: 'full' });
    expect(div!.attrs).toEqual([['viewbox', '0 0 1 1']]);
  });

  it('full 档默认保留 style', () => {
    const [node] = contractOf('<div style="fill:red"></div>', { profile: 'full' });
    expect(node!.style).toEqual(['fill:red']);
  });

  it('full 档下 keepStyle: false 可显式关掉', () => {
    const [node] = contractOf('<div style="fill:red"></div>', {
      profile: 'full',
      keepStyle: false,
    });
    expect(node).not.toHaveProperty('style');
  });
});

// ---------------------------------------------------------------------------
// id 引用归一化（tests/compat/README.md §4）
// ---------------------------------------------------------------------------

describe('id 引用归一化（contract 档）', () => {
  it('按文档序把 id 映射成 {i0} {i1} …', () => {
    const [node] = contractOf('<div aria-labelledby="x"></div><span id="x"></span>');
    expect(node!.attrs).toEqual([['aria-labelledby', '{i0}']]);
  });

  it('⭐ 引用关系而非字面值进契约：两侧 id 完全不同但结构相同 → 无差异', () => {
    const react = '<div aria-labelledby="rc-1"></div><span id="rc-1"></span>';
    const vue = '<div aria-labelledby="apollo-99"></div><span id="apollo-99"></span>';
    expect(diffHtml(react, vue)).toEqual([]);
  });

  it('⭐ 漏渲染被引用的节点 → token 不同 → 红（这是归一化的意义）', () => {
    const react = '<div aria-labelledby="rc-1"></div><span id="rc-1"></span>';
    const vue = '<div aria-labelledby="apollo-99"></div>';
    expect(diffHtml(react, vue).length).toBeGreaterThan(0);
  });

  it('引用树外元素 → {ext}', () => {
    const [node] = contractOf('<div aria-describedby="outside"></div>');
    expect(node!.attrs).toEqual([['aria-describedby', '{ext}']]);
  });

  it('多 token 引用按空白拆分，逐 token 映射', () => {
    const [node] = contractOf('<div aria-labelledby="a b"></div><span id="a"></span>');
    expect(node!.attrs).toEqual([['aria-labelledby', '{i0} {ext}']]);
  });

  it('非 aria 的 id 引用属性（for / headers / list）在 contract 档本就被丢弃', () => {
    const [node] = contractOf('<label for="x"></label><td headers="x"></td>');
    expect(node!.attrs).toEqual([]);
  });

  it('full 档不做 id 映射（原样保留）', () => {
    const [node] = contractOf('<div aria-labelledby="x"></div><span id="x"></span>', {
      profile: 'full',
    });
    expect(node!.attrs).toEqual([['aria-labelledby', 'x']]);
  });
});

describe('projectNode', () => {
  it('只在该子树内收集 id 表 —— 子树外的引用是 {ext}', () => {
    const [root] = parseFragment(
      '<div aria-labelledby="inner outside"><span id="inner"></span></div>',
    );
    const node = projectNode(root!);
    expect(node.attrs).toEqual([['aria-labelledby', '{i0} {ext}']]);
  });

  it('与 contractOf 在单根场景下结论一致', () => {
    const html = '<div class="a" aria-labelledby="x"><span id="x"></span></div>';
    expect(projectNode(parseFragment(html)[0]!)).toEqual(contractOf(html)[0]);
  });
});

// ---------------------------------------------------------------------------
// diff
// ---------------------------------------------------------------------------

describe('diffContract / diffHtml', () => {
  it('完全一致 → 空数组', () => {
    expect(diffHtml('<div class="a"></div>', '<div class="a"></div>')).toEqual([]);
  });

  it('类名顺序不同**不算**差异（已排序）', () => {
    expect(diffHtml('<div class="a b"></div>', '<div class="b a"></div>')).toEqual([]);
  });

  it('属性顺序不同**不算**差异（已排序）', () => {
    expect(
      diffHtml('<div data-a="1" role="button"></div>', '<div role="button" data-a="1"></div>'),
    ).toEqual([]);
  });

  it('根节点数不同', () => {
    expect(diffHtml('<div></div>', '<div></div><div></div>')).toEqual(['$: 根节点数不同 1 vs 2']);
  });

  it('标签不同', () => {
    expect(diffHtml('<div></div>', '<span></span>')).toEqual([
      '$/div[0]: 标签不同 <div> vs <span>',
    ]);
  });

  it('类名不同', () => {
    expect(diffHtml('<div class="a"></div>', '<div class="b"></div>')).toEqual([
      '$/div[0]: 类名不同 [a] vs [b]',
    ]);
  });

  it('属性：我们多出 / 我们缺少 / 值不同 —— 三种措辞各自可辨', () => {
    expect(diffHtml('<div></div>', '<div data-x="1"></div>')).toEqual([
      '$/div[0]: 我们多出属性 data-x="1"',
    ]);
    expect(diffHtml('<div data-x="1"></div>', '<div></div>')).toEqual([
      '$/div[0]: 我们缺少属性 data-x="1"',
    ]);
    expect(diffHtml('<div data-x="1"></div>', '<div data-x="2"></div>')).toEqual([
      '$/div[0]: 属性 data-x 不同 "1" vs "2"',
    ]);
  });

  it('style 差异（仅在两档都保留 style 时可见）', () => {
    expect(
      diffHtml('<div style="color:red"></div>', '<div style="color:blue"></div>', {
        keepStyle: true,
      }),
    ).toEqual(['$/div[0]: style 不同 [color:red] vs [color:blue]']);
  });

  it('子节点数不同 → 报一条并**停止下探**（不再产生一串级联噪音）', () => {
    expect(diffHtml('<div><i></i></div>', '<div></div>')).toEqual([
      '$/div[0]: 子节点数不同 1 vs 0',
    ]);
  });

  it('深层差异带完整路径', () => {
    const diff = diffHtml(
      '<div><i><b class="x"></b></i></div>',
      '<div><i><b class="y"></b></i></div>',
    );
    expect(diff).toEqual(['$/div[0]/i[0]/b[0]: 类名不同 [x] vs [y]']);
  });

  it('diffContract 与 diffHtml 同源（前者是后者的两半）', () => {
    const left = contractOf('<div class="a"></div>');
    const right = contractOf('<div class="b"></div>');
    expect(diffContract(left, right)).toEqual(
      diffHtml('<div class="a"></div>', '<div class="b"></div>'),
    );
  });

  it('root 数不同时直接返回，不再下探', () => {
    expect(
      diffContract(contractOf('<i></i>'), contractOf('<b class="x"></b><b class="y"></b>')),
    ).toEqual(['$: 根节点数不同 1 vs 2']);
  });
});

// ---------------------------------------------------------------------------
// domContractTest · 结构校验（在 describe 之前抛出，因此可被断言）
// ---------------------------------------------------------------------------

/**
 * 假基线。**只用于验证比对器**，不是任何组件的 oracle（见文件头）。
 */
const FAKE_BASELINE = {
  $comment: 'hand-written fixture for the comparator itself — NOT a machine oracle',
  cases: [
    { id: 'plain', html: '<div class="a">x</div>' },
    { id: 'nested', html: '<div class="a"><i class="b"></i></div>' },
  ],
};

describe('domContractTest · 结构校验', () => {
  it('基线没有 cases → 抛错并说明基线来源', () => {
    expect(() => domContractTest('x', { baseline: {}, render: () => '' })).toThrow(
      /基线里没有 cases/,
    );
    expect(() => domContractTest('x', { baseline: {}, render: () => '' })).toThrow(/机械 oracle/);
  });

  it('cases 为空数组 → 同样抛错（空基线等于没测）', () => {
    expect(() => domContractTest('x', { baseline: { cases: [] }, render: () => '' })).toThrow(
      /基线里没有 cases/,
    );
  });

  it('only 里出现基线没有的 id → 抛错，并列出可用 id', () => {
    expect(() =>
      domContractTest('x', { baseline: FAKE_BASELINE, only: ['nope'], render: () => '' }),
    ).toThrow(/only 里的 "nope" 不在基线中/);
    expect(() =>
      domContractTest('x', { baseline: FAKE_BASELINE, only: ['nope'], render: () => '' }),
    ).toThrow(/plain, nested/);
  });

  it('allow 里出现基线没有的 id → 抛错（豁免会腐烂）', () => {
    expect(() =>
      domContractTest('x', {
        baseline: FAKE_BASELINE,
        render: () => '',
        allow: { ghost: { diff: [], reason: '不该存在' } },
      }),
    ).toThrow(/allow 里的 "ghost" 不在基线中/);
  });

  it('allow 缺 reason → AllowanceError（H8 的入口守卫）', () => {
    expect(() =>
      domContractTest('x', {
        baseline: FAKE_BASELINE,
        render: () => '',
        allow: { plain: { diff: [], reason: '   ' } },
      }),
    ).toThrow(AllowanceError);
  });
});

// ---------------------------------------------------------------------------
// domContractTest · 真实注册（在收集阶段调用，产出真实用例）
// ---------------------------------------------------------------------------

const Plain = defineComponent({
  name: 'FixtureContractPlain',
  setup() {
    return () => h('div', { class: 'a' }, 'x');
  },
});

const Nested = defineComponent({
  name: 'FixtureContractNested',
  setup() {
    return () => h('div', { class: 'a' }, [h('i', { class: 'b' })]);
  },
});

/** 与基线**完全一致** → 每个用例的差异必须是空数组。 */
domContractTest('fixture-contract · 一致', {
  baseline: FAKE_BASELINE,
  render: (id) => (id === 'plain' ? Plain : Nested),
});

/** 只跑一条 —— 验证 `only` 的裁剪。 */
domContractTest('fixture-contract · only', {
  baseline: FAKE_BASELINE,
  only: ['plain'],
  render: () => Plain,
});

/** 有一处**已知**差异，且被 `allow` 精确列出 → 必须通过；多一条差异就会红。 */
domContractTest('fixture-contract · 精确豁免', {
  baseline: { cases: [{ id: 'differs', html: '<div class="a" data-extra="1">x</div>' }] },
  render: () => Plain,
  allow: {
    differs: {
      diff: ['$/div[0]: 我们缺少属性 data-extra="1"'],
      reason: '比对器自身的验证用例：这条差异是本用例刻意构造的，不是真实兼容性差异',
    },
  },
});

/** 渲染函数返回 vnode 时也能取到 HTML（内部走 mountCase）。 */
domContractTest('fixture-contract · vnode 渲染', {
  baseline: { cases: [{ id: 'vnode', html: '<div class="a">x</div>' }] },
  render: () => h(Plain),
});
