#!/usr/bin/env node
/**
 * gen-empty-artwork.mjs — 从 antd 6.6.4 的渲染产物**机械抽取** Empty 的两幅插画
 *
 * 为什么需要它（而不是手抄一份 SVG）：
 *   Empty 的两幅插画（默认 184×152 与简洁 64×41）是**矢量画**，不是逻辑。
 *   手抄意味着 `H2（禁止复制 Ant Design 实现代码）` 与「像素级一致」之间无法两全 ——
 *   而插画恰恰是「重画一遍必然不一致」的东西。
 *
 *   本仓库对同类问题已有两条既定解法：
 *     - `gen-icons.mjs`：图标从 `@ant-design/icons-svg`（数据包）取，生成物靠「与上游逐位一致」保证；
 *     - `gen-locale.mjs`：73 个语言包从 antd 的 `es/locale/*` 抽取。
 *   Empty 的插画没有独立数据包，所以这里补上同一套做法的第三种形态：
 *   **把 antd 的渲染产物当 oracle，抽出「节点树 + 颜色槽位」，生成一个可复现的渲染函数。**
 *
 * 生成物是**数据**（标签、几何、路径），不含任何 antd 的实现逻辑。
 * 唯一被抽象掉的是颜色：antd 在运行时把 5 个 token 合成为实色写进 `fill`，
 * 我们走静态 CSS，写 `var(--apollo-*)`。这一步替换必须**可证伪** ——
 * 所以下面用「token 合成值 → 槽位名」的反查表来替换，任何**查不到**的颜色都会让
 * 生成器**直接失败**，而不是悄悄写进去。
 *
 * 用法：
 *   node registry/tools/gen-empty-artwork.mjs           # 生成
 *   node registry/tools/gen-empty-artwork.mjs --check   # CI：只校验生成物是否最新
 *
 * React 与 antd 只允许出现在 tests/compat 与 registry/tools 的取数脚本里（见
 * tests/compat/README.md §7 与 TESTING.md 反模式 A9）。本文件属后者：它只取事实，不参与运行时。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(ROOT, 'packages/ui/src/empty/components/artwork.ts');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antd = require('antd');
const { Empty, theme: antdTheme } = antd;

// ---------------------------------------------------------------------------
// 颜色：token → 合成实色 → 槽位名
// ---------------------------------------------------------------------------

/**
 * antd `es/empty/empty.js` 与 `simple.js` 里 `getAsSolidColor(color, colorBgContainer)`
 * 的**逐条**对照。左边是 antd 源码里的变量名，右边是它取用的 token。
 *
 * ⚠️ 这张表是**人工读源码得到的假设**，不是事实。它由下面的
 *    `assertMappingMatchesRender()` 用「合成出来的 hex 必须真的出现在渲染产物里」证伪。
 *    所以它错了会在生成阶段报错，不会静默产出错误的颜色映射。
 */
const ROLE_TOKENS = {
  default: {
    panelBgColor: 'colorFillTertiary',
    borderColor: 'colorTextQuaternary',
    detailColor: 'colorFill',
    shadowColor: 'colorFillSecondary',
    iconColor: 'colorBgContainer',
  },
  simple: {
    borderColor: 'colorFill',
    shadowColor: 'colorFillTertiary',
    contentColor: 'colorFillQuaternary',
  },
};

/** 解析 `#rgb` / `#rrggbb` / `rgb()` / `rgba()` → `[r, g, b, a]`。 */
function parseColor(input) {
  const s = String(input).trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const v = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16)).concat([1]);
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (fn) {
    const parts = fn[1]
      .split(/[,/\s]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) throw new Error(`无法解析颜色: ${s}`);
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  throw new Error(`无法解析颜色: ${s}`);
}

/** 源覆盖合成：把 `fg` 叠在不透明的 `bg` 上，返回不透明 hex。等价于 `FastColor.onBackground`。 */
function onBackground(fg, bg) {
  const [fr, fg_, fb, fa] = parseColor(fg);
  const [br, bg_, bb] = parseColor(bg);
  const mix = (f, b) => Math.round(f * fa + b * (1 - fa));
  return `#${[mix(fr, br), mix(fg_, bg_), mix(fb, bb)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

const token = antdTheme.getDesignToken();
const bgContainer = token.colorBgContainer;

/** 槽位名 → 合成实色（antd 实际写进 fill 的值）。 */
function buildColorMap(kind) {
  const map = new Map();
  for (const [role, tokenName] of Object.entries(ROLE_TOKENS[kind])) {
    const raw = token[tokenName];
    if (raw === undefined) throw new Error(`antd token 里没有 ${tokenName}`);
    const solid = onBackground(raw, bgContainer);
    if (map.has(solid)) {
      throw new Error(
        `颜色 ${solid} 同时对应两个槽位（${map.get(solid)} 与 ${role}）—— 反查表有歧义，不能机械替换。`,
      );
    }
    map.set(solid, role);
  }
  return map;
}

// ---------------------------------------------------------------------------
// 渲染 antd 的插画
// ---------------------------------------------------------------------------

/**
 * `Empty.PRESENTED_IMAGE_*` 是**模块级 React 元素**（`React.createElement(DefaultEmptyImg)`），
 * 不是组件本身。渲染它得到的就是 antd 真实的插画产物 —— 这里不做任何理解，只渲染。
 */
const RENDERED = {
  default: renderToStaticMarkup(Empty.PRESENTED_IMAGE_DEFAULT),
  simple: renderToStaticMarkup(Empty.PRESENTED_IMAGE_SIMPLE),
};

// ---------------------------------------------------------------------------
// 树 → 源码
// ---------------------------------------------------------------------------

/** 需要跳过、不进产物的属性（React 在 SSR 下注入的、与插画无关的东西）。 */
const SKIP_ATTRS = new Set(['data-reactroot']);

/**
 * 颜色属性。这些属性的值**必须**能在反查表里找到 —— 找不到就抛错。
 * 其余属性原样保留。
 */
const COLOR_ATTRS = new Set(['fill', 'stroke']);

/** 不是颜色的字面值（`fill="none"` 之类），允许原样保留。 */
const NON_COLOR_VALUES = new Set(['none', 'currentColor', 'transparent']);

function literal(value) {
  return JSON.stringify(value);
}

function serializeAttrs(el, colorMap, pathHint) {
  const parts = [];
  for (const attr of el.attributes) {
    const name = attr.name;
    const value = attr.value;
    if (SKIP_ATTRS.has(name)) continue;
    if (COLOR_ATTRS.has(name) && !NON_COLOR_VALUES.has(value)) {
      const role = colorMap.get(value.toLowerCase());
      if (!role) {
        throw new Error(
          `${pathHint} 的 ${name}="${value}" 不在 token 反查表里。\n` +
            `  表里有：${[...colorMap.keys()].join(', ')}\n` +
            '  这说明 antd 的插画用了新的颜色来源 —— 必须先在 ROLE_TOKENS 里补上对应 token，' +
            '而不是把实色写进生成物（那会让主题切换失效）。',
        );
      }
      parts.push(`${literal(name)}: ctx.colors.${role}`);
      continue;
    }
    parts.push(`${literal(name)}: ${literal(value)}`);
  }
  return parts.length ? `{ ${parts.join(', ')} }` : 'null';
}

function serialize(el, colorMap, indent, pathHint) {
  const tag = el.tagName.toLowerCase();
  const pad = '  '.repeat(indent);

  if (tag === 'title') {
    // `<title>` 是可访问名，由 locale 决定，不是插画的一部分。
    return `${pad}h('title', null, ctx.title)`;
  }

  const attrs = serializeAttrs(el, colorMap, pathHint);
  const children = [...el.children];
  const text = el.textContent ?? '';

  if (children.length === 0) {
    if (text.trim() !== '') {
      throw new Error(`${pathHint}: <${tag}> 有文本内容但没有子元素，生成器不知道该映射到什么。`);
    }
    return `${pad}h(${literal(tag)}, ${attrs})`;
  }

  const inner = children
    .map((child, i) => serialize(child, colorMap, indent + 1, `${pathHint}/${child.tagName}[${i}]`))
    .join(',\n');
  return `${pad}h(${literal(tag)}, ${attrs}, [\n${inner},\n${pad}])`;
}

function serializeArtwork(kind) {
  const colorMap = buildColorMap(kind);
  const dom = new JSDOM(RENDERED[kind]);
  const svg = dom.window.document.querySelector('svg');
  if (!svg) throw new Error(`antd 的 ${kind} 插画没有渲染出 <svg>`);
  return { code: serialize(svg, colorMap, 1, 'svg'), colorMap };
}

const artwork = {
  default: serializeArtwork('default'),
  simple: serializeArtwork('simple'),
};

// ---------------------------------------------------------------------------
// 自检：反查表必须真的解释了渲染产物里的每一个颜色
// ---------------------------------------------------------------------------

/**
 * 这条断言是整份生成器的**可信度来源**：如果 ROLE_TOKENS 写错了，
 * 合成值就不会出现在 antd 的产物里，`serialize()` 会在遇到该颜色时抛错。
 * 这里额外把「每个槽位都被用到了」也钉住 —— 否则一个多余的槽位会永远不被发现。
 */
for (const kind of ['default', 'simple']) {
  const used = new Set(
    [...new JSDOM(RENDERED[kind]).window.document.querySelectorAll('*')]
      .flatMap((el) => ['fill', 'stroke'].map((a) => el.getAttribute(a)))
      .filter((v) => v && !NON_COLOR_VALUES.has(v))
      .map((v) => v.toLowerCase()),
  );
  const known = artwork[kind].colorMap;
  for (const value of used) {
    if (!known.has(value)) {
      throw new Error(`[${kind}] 产物里的颜色 ${value} 没有被任何槽位解释`);
    }
  }
  for (const [value, role] of known) {
    if (!used.has(value)) {
      throw new Error(
        `[${kind}] 槽位 ${role}（${value}）在产物里从未出现 —— ROLE_TOKENS 多了或错了`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 组装文件
// ---------------------------------------------------------------------------

const defaultRoles = Object.keys(ROLE_TOKENS.default);
const simpleRoles = Object.keys(ROLE_TOKENS.simple);

const source = `// 自动生成，请勿手改。
// 生成器：registry/tools/gen-empty-artwork.mjs
// 数据源：antd 6.6.4 的 Empty.PRESENTED_IMAGE_DEFAULT / PRESENTED_IMAGE_SIMPLE 的**渲染产物**
// 重新生成：node registry/tools/gen-empty-artwork.mjs
//
// 这是**数据**，不是 antd 的实现代码：只有标签、几何属性与路径，没有一行逻辑。
// 颜色被替换成 \`ctx.colors.<role>\` 槽位（我们走静态 CSS + var(--apollo-*)，antd 走
// 运行时 token 合成实色）。替换由 token 反查表机械完成，查不到的颜色会让生成器直接失败。
//
// 为什么是 .ts 而不是 .vue：这是 COMPONENT-RULES.md §2 允许的「纯渲染函数型内部件」
// —— 它没有状态、没有事件、没有插槽，且**必须由脚本生成**（手写等于重画一遍矢量图，
// 必然与上游产生像素差异）。理由记录在 packages/ui/src/empty/README.md。

import { h, type VNode } from 'vue';

/** 插画里由主题决定的颜色槽位。默认插画用前 5 个，简洁插画用后 3 个。 */
export interface EmptyArtworkColors {
  /** 默认插画：面板底色（antd 的 \`panelBgColor\`）。 */
  panelBgColor: string;
  /** 默认插画：轮廓色（antd 的 \`borderColor\`）。 */
  borderColor: string;
  /** 默认插画：细节色（antd 的 \`detailColor\`）。 */
  detailColor: string;
  /** 默认插画：投影色（antd 的 \`shadowColor\`）。 */
  shadowColor: string;
  /** 默认插画：图标色（antd 的 \`iconColor\`）。 */
  iconColor: string;
  /** 简洁插画：内容色（antd 的 \`contentColor\`）。 */
  contentColor: string;
}

export interface EmptyArtworkContext {
  /** \`<title>\` 的文本 —— 插画的可访问名，来自 locale。 */
  title: string;
  colors: EmptyArtworkColors;
}

/** 默认插画（184×152）。antd 的 \`PRESENTED_IMAGE_DEFAULT\`。 */
export function renderDefaultEmptyImage(ctx: EmptyArtworkContext): VNode {
  return ${artwork.default.code.trimStart()};
}

/** 简洁插画（64×41）。antd 的 \`PRESENTED_IMAGE_SIMPLE\`。 */
export function renderSimpleEmptyImage(ctx: EmptyArtworkContext): VNode {
  return ${artwork.simple.code.trimStart()};
}

/** 默认插画用到的槽位（供调用方断言完整性）。 */
export const DEFAULT_EMPTY_ARTWORK_ROLES = ${JSON.stringify(defaultRoles)} as const;

/** 简洁插画用到的槽位。 */
export const SIMPLE_EMPTY_ARTWORK_ROLES = ${JSON.stringify(simpleRoles)} as const;
`;

// ---------------------------------------------------------------------------
// 落盘 / 校验
// ---------------------------------------------------------------------------

/**
 * 用仓库自己的格式化器收尾。
 *
 * 为什么生成器要调 biome：生成物的**代码风格**（单引号、100 列折行、合法属性名去引号）
 * 由 `biome.json` 决定。如果生成器按自己的一套规则拼字符串，`biome check .` 就会每次
 * 都对生成物报 format 错误 —— 于是要么门禁长期红着，要么每次生成后手工再跑一遍格式化，
 * 而 `--check`（生成物是否最新）也就永远不成立。
 *
 * 走 `--stdin-file-path` 而不是写临时文件：biome 按这个路径解析配置，结果与
 * `biome format --write <真路径>` 逐字一致，且不会在 `src/` 下留临时文件被 vue-tsc 捡到。
 */
function formatWithBiome(code) {
  const biomeBin = path.join(ROOT, 'node_modules/.bin/biome');
  return execFileSync(biomeBin, ['format', `--stdin-file-path=${path.relative(ROOT, OUT_FILE)}`], {
    input: code,
    encoding: 'utf8',
  });
}

const file = formatWithBiome(source);

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== file) {
    console.error('[gen-empty-artwork] ❌ 生成物不是最新的');
    console.error('  运行: node registry/tools/gen-empty-artwork.mjs');
    process.exit(1);
  }
  console.log('[gen-empty-artwork] ✅ 生成物与 antd 产物一致');
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, file);
console.log(`[gen-empty-artwork] 写出 ${path.relative(ROOT, OUT_FILE)}`);
for (const kind of ['default', 'simple']) {
  console.log(
    `  ${kind}: ${[...artwork[kind].colorMap.entries()].map(([hex, role]) => `${role}=${hex}`).join(' ')}`,
  );
}
