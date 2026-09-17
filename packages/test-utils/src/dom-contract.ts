/**
 * L4 · DOM 契约：结构化投影 + 对称归一化 + 可读差异。
 *
 * ── 为什么需要这一层 ──────────────────────────────────────────────────────────
 * `tests/compat/baselines/*.dom.json` 存的是 React 侧的**原始 HTML 字符串**。
 * 直接拿字符串比对我们渲染出的 DOM 是不行的，原因在 `tests/compat/README.md` §4：
 * 属性顺序、`style` 的序列化方式、`-ms-` 前缀这些东西两侧本来就不同，
 * 而它们都**不是**对外契约。直接比字符串会得到一堆噪音，然后被「顺手加白」绕过。
 *
 * 所以两侧都走同一条流水线：`HTML 字符串 → HTML 解析器 → 投影`。
 * **归一化必须对称**：本文件里没有任何一处只作用于单侧的分支。
 * 投影档（`profile`）是一个**入参**，两侧拿到的是同一个值。
 *
 * ── 两档投影（各自的依据）─────────────────────────────────────────────────────
 * | 档 | 保留 | 依据 |
 * |---|---|---|
 * | `contract`（默认） | 标签 + 类名 + `data-*` + `role`/`aria-*` | `TESTING.md` T10 |
 * | `full` | 全部属性（`style` 归一化为声明集合） | `docs/foundation/icons-contract.md` §6.1 |
 *
 * `full` 档是对 T10 的**登记偏离**，且是**加强**而非放宽：对图标来说
 * `viewBox` / `d` / `fill` 不是「无关属性」，它们就是交付物本身 ——
 * 只投影 class + aria-* 会让「图标画错了」这类最严重的回归完全测不出来。
 *
 * ⚠️ 关于 `tests/compat/README.md` §4 的「保留 `style` 存在性」与 `TESTING.md` T10 的冲突：
 *    本文件以 **T10 为准**（`AGENTS.md` §5 的事实来源优先级里，`TESTING.md` 是本仓库规范文件，
 *    而 `tests/compat/README.md` 是其下位文档）。`contract` 档默认**不含 `style`**；
 *    需要断言 `styles` 覆盖优先级时显式传 `keepStyle: true`。
 *
 * ── 默认开启的一条归一化：剔除 CSS-in-JS 哈希类名 ───────────────────────────────
 * 依据是 `tests/compat/README.md` §4 明列的「移除 hash 类名（形如 `css-xxxx`）」，与
 * `H6`（禁止 `@ant-design/cssinjs`）直接相关：我们走静态 CSS，**不可能**产出这类类名，
 * 留着它只会让每个用例都多一条无信息量的差异。规则见 {@link CSSINJS_HASH_CLASS}。
 *
 * 它是**对称**的（两侧过同一个过滤器），`dropCssInJsClasses: false` 可关掉。
 *
 * ── id 的处理（两档不同，理由在各自那一档）─────────────────────────────────────
 * `contract` 档：`id` 本身不进契约（随机 ID 不可比），但**引用关系进** ——
 *   按文档序把 `id` 值映射成 `{i0}` `{i1}`…，`aria-*` 引用属性按空白拆 token 查表，
 *   查不到（引用树外元素）映射为 `{ext}`。
 *   于是「引用是否自洽」变成可断言的：漏渲染被引用的节点 → 两侧 token 不同 → 红。
 *   （`tests/compat/README.md` §4 的要求：「忽略 id，改为比对引用关系是否自洽」。）
 * `full` 档：`id` **原样保留**。icons 的基线里有 `props:passthrough` 用例专门断言
 *   `id="my-icon"` 的透传，归一化掉它会**丢掉一条真实契约**。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**像素**一致（那是 L6）
 *   - 没证明属性**语义**正确：只证明两侧投影后相同。若上游本身错了，我们会跟着错
 *     （这正是「对齐上游」的定义；有意不跟的缺陷登记在 `COMPATIBILITY.md` §9）
 */

import { expect } from 'vitest';
import type { Component, VNodeChild } from 'vue';
import { assertAllowance } from './allowance';
import { mountCase, resolveRenderable } from './render';
import type { Allowance } from './types';

/** 投影档。 */
export type ProjectionProfile = 'contract' | 'full';

/** 归一化后的单个 DOM 节点。 */
export interface DomNode {
  /** 小写标签名。 */
  tag: string;
  /** 类名 token，**已排序**。 */
  class: string[];
  /** 除 `class` / `style` 外的属性，**已按属性名排序**。 */
  attrs: [string, string][];
  /** 归一化后的 style 声明，**已排序**；未保留或为空时为 undefined。 */
  style?: string[];
  children: DomNode[];
}

/** 投影选项。两侧必须传**同一个**对象，否则归一化不对称。 */
export interface ContractOptions {
  /** 投影档。默认 `'contract'`。 */
  profile?: ProjectionProfile;
  /**
   * 是否保留 `style`（归一化为排序后的声明集合）。
   * 默认：`full` 档为 `true`，`contract` 档为 `false`（T10 未列 style）。
   */
  keepStyle?: boolean;
  /** 逐节点忽略的属性名。在档位筛选**之后**生效（所以它只能减，不能加）。 */
  ignoreAttrs?: readonly string[];
  /**
   * 是否剔除 CSS-in-JS 注入的类名（见 {@link CSSINJS_HASH_CLASS}）。
   * 默认 `true`。两侧共用同一条规则 —— 归一化必须对称。
   */
  dropCssInJsClasses?: boolean;
}

/** 厂商前缀的 transform。与无前缀的 `transform` 语义等价（`COMPATIBILITY.md` D16）。 */
const VENDOR_PREFIXED_TRANSFORM = /^-(?:ms|webkit|moz|o)-transform$/;

/**
 * `aria-*` 里值为「id 引用列表」的属性。
 *
 * 只列 `aria-*`：`contract` 档按 T10 只保留 `data-*` / `role` / `aria-*`，
 * 把 `for` / `headers` / `list` 也列进来会得到一段永远走不到的死代码。
 */
const ID_REF_ATTRS = new Set([
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
]);

/** `contract` 档保留的属性名判定（T10：`data-*` + `role` + `aria-*`）。 */
function isContractAttr(name: string): boolean {
  return name === 'role' || name.startsWith('data-') || name.startsWith('aria-');
}

/**
 * antd 的 CSS-in-JS 在根元素上注入的**哈希类名**。
 *
 * `tests/compat/README.md` §4 把「移除 hash 类名（形如 `css-xxxx`）」列为 DOM 归一化的
 * **标准步骤**，理由与本项目 `H6`（禁止 `@ant-design/cssinjs`）直接相关：
 * 我们走静态 CSS，没有运行时样式注入，因此**不可能**产出这类类名。
 *
 * 实测 antd 6.6.4 在 `renderToStaticMarkup` 下的形态（两条都要覆盖）：
 *   - 开发态：`css-dev-only-do-not-override-19u5a7b`（hash 随构建变化）
 *   - 生产态：`css-19u5a7b`
 *   - 另有固定名 `css-var-root`（cssVar 模式的根标记，不在 hash 正则里，单独列出）
 *
 * ⚠️ 这条规则**对两侧一视同仁**（都过同一个过滤器），所以不是「只作用于单侧的归一化」。
 *    它的效果确实只落在 antd 一侧 —— 那正是因为只有 antd 会产生它。
 *
 * ⚠️ 它确实会**少测**一件事：「antd 的根元素上有这两个类名」。这是有意的：
 *    断言它们等于断言我们**没有**实现 cssinjs，没有信息量。
 *    差异登记见 `COMPATIBILITY.md` 的 D1。
 */
const CSSINJS_HASH_CLASS = /^css-(?:dev-only-do-not-override-)?[a-z0-9]+$/;

/** 不含 hash 的固定 CSS-in-JS 类名。 */
const CSSINJS_EXACT_CLASS = new Set(['css-var-root']);

/** 该 class token 是否来自 CSS-in-JS 运行时。 */
function isCssInJsClass(token: string): boolean {
  return CSSINJS_EXACT_CLASS.has(token) || CSSINJS_HASH_CLASS.test(token);
}

interface ProjectionContext {
  profile: ProjectionProfile;
  keepStyle: boolean;
  ignoreAttrs: ReadonlySet<string>;
  dropCssInJsClasses: boolean;
  /** `id` 值 → 稳定 token。 */
  ids: ReadonlyMap<string, string>;
}

function createContext(options: ContractOptions | undefined): ProjectionContext {
  const profile = options?.profile ?? 'contract';
  return {
    profile,
    keepStyle: options?.keepStyle ?? profile === 'full',
    ignoreAttrs: new Set(options?.ignoreAttrs ?? []),
    dropCssInJsClasses: options?.dropCssInJsClasses ?? true,
    ids: new Map(),
  };
}

/**
 * 把 `style` 属性归一化为排序后的 `prop:value` 列表。
 *
 * 三步，都对两侧一视同仁：
 *   1. 拆成声明、属性名小写、值去掉全部空白
 *      （React 写 `-ms-transform:rotate(90deg);transform:rotate(90deg)`，
 *       Vue 写 `transform: rotate(90deg);` —— 只差格式）
 *   2. 若已存在无前缀的 `transform`，剔除厂商前缀版本（D16：我们不输出 `msTransform`）
 *   3. 排序 —— 声明顺序无语义
 */
export function normalizeStyle(raw: string | null | undefined): string[] | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;

  const decls = new Map<string, string>();
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (trimmed === '') continue;
    const idx = trimmed.indexOf(':');
    if (idx < 0) continue;
    const prop = trimmed.slice(0, idx).trim().toLowerCase();
    const value = trimmed.slice(idx + 1).replace(/\s+/g, '');
    if (prop !== '') decls.set(prop, value);
  }

  // 只在无前缀项存在时剔除，避免把「一侧只有 -ms-transform」这种真差异静默吃掉。
  if (decls.has('transform')) {
    for (const key of [...decls.keys()]) {
      if (VENDOR_PREFIXED_TRANSFORM.test(key)) decls.delete(key);
    }
  }

  if (decls.size === 0) return undefined;
  return [...decls.entries()].map(([prop, value]) => `${prop}:${value}`).sort();
}

/** 用 HTML 解析器把字符串变成 DOM。两侧共用，保证解析行为一致。 */
export function parseFragment(html: string): Element[] {
  const template = document.createElement('template');
  template.innerHTML = html;
  // `.children` 只含元素节点：注释（Vue 渲染 `null` 会产生 `<!---->`）与文本都不进契约。
  return Array.from(template.content.children);
}

/**
 * 按**文档序**收集 `id` → `{iN}` 映射。
 *
 * 只看出现顺序、不看字面值：两侧的自动 ID 完全不同，但结构顺序应当相同。
 */
function collectIds(roots: readonly Element[]): Map<string, string> {
  const table = new Map<string, string>();
  const walk = (el: Element): void => {
    const id = el.getAttribute('id');
    if (id !== null && id !== '' && !table.has(id)) {
      table.set(id, `{i${table.size}}`);
    }
    for (const child of Array.from(el.children)) walk(child);
  };
  for (const root of roots) walk(root);
  return table;
}

/** 把「空白分隔的 id 引用列表」映射成 token；引用树外元素时为 `{ext}`。 */
function mapIdRefs(value: string, ids: ReadonlyMap<string, string>): string {
  return value
    .split(/\s+/)
    .filter((token) => token !== '')
    .map((token) => ids.get(token) ?? '{ext}')
    .join(' ');
}

function projectElement(el: Element, ctx: ProjectionContext): DomNode {
  const classTokens: string[] = [];
  const attrs: [string, string][] = [];
  let style: string[] | undefined;

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;

    if (name === 'class') {
      for (const token of attr.value.split(/\s+/)) {
        if (token === '') continue;
        if (ctx.dropCssInJsClasses && isCssInJsClass(token)) continue;
        classTokens.push(token);
      }
      continue;
    }

    if (name === 'style') {
      if (ctx.keepStyle) style = normalizeStyle(attr.value);
      continue;
    }

    if (ctx.profile === 'contract') {
      // `id` 本身不进契约，但引用关系进（见文件头）。
      if (name === 'id') continue;
      if (!isContractAttr(name)) continue;
    }

    if (ctx.ignoreAttrs.has(name)) continue;

    if (ctx.profile === 'contract' && ID_REF_ATTRS.has(name)) {
      attrs.push([name, mapIdRefs(attr.value, ctx.ids)]);
      continue;
    }

    attrs.push([name, attr.value]);
  }

  attrs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  classTokens.sort();

  const node: DomNode = {
    tag: el.tagName.toLowerCase(),
    class: classTokens,
    attrs,
    children: Array.from(el.children).map((child) => projectElement(child, ctx)),
  };
  if (style !== undefined) node.style = style;
  return node;
}

/**
 * 把一个元素投影成 {@link DomNode}。
 *
 * `contract` 档下 id 表在**该子树内**收集（与 {@link contractOf} 的「整棵树」略有不同）——
 * 跨根引用请用 `contractOf`，它会把所有根一起收集后再投影。
 */
export function projectNode(el: Element, options?: ContractOptions): DomNode {
  const ctx = createContext(options);
  ctx.ids = collectIds([el]);
  return projectElement(el, ctx);
}

/** `HTML 字符串 → 契约树`。React 基线与 Vue 渲染结果都走这一条路。 */
export function contractOf(html: string, options?: ContractOptions): DomNode[] {
  const ctx = createContext(options);
  const roots = parseFragment(html);
  // 先收集整棵树的 id，再投影 —— 否则跨根的 `aria-controls` 会被误判成 `{ext}`。
  ctx.ids = collectIds(roots);
  return roots.map((root) => projectElement(root, ctx));
}

function attrsToMap(attrs: [string, string][]): Map<string, string> {
  return new Map(attrs);
}

function diffNode(left: DomNode, right: DomNode, path: string, out: string[]): void {
  if (left.tag !== right.tag) {
    out.push(`${path}: 标签不同 <${left.tag}> vs <${right.tag}>`);
  }

  const leftClass = left.class.join(' ');
  const rightClass = right.class.join(' ');
  if (leftClass !== rightClass) {
    out.push(`${path}: 类名不同 [${leftClass}] vs [${rightClass}]`);
  }

  const leftAttrs = attrsToMap(left.attrs);
  const rightAttrs = attrsToMap(right.attrs);
  for (const key of new Set([...leftAttrs.keys(), ...rightAttrs.keys()])) {
    const a = leftAttrs.get(key);
    const b = rightAttrs.get(key);
    if (a === undefined && b !== undefined) out.push(`${path}: 我们多出属性 ${key}="${b}"`);
    else if (a !== undefined && b === undefined) out.push(`${path}: 我们缺少属性 ${key}="${a}"`);
    else if (a !== b) out.push(`${path}: 属性 ${key} 不同 "${a}" vs "${b}"`);
  }

  const leftStyle = (left.style ?? []).join(';');
  const rightStyle = (right.style ?? []).join(';');
  if (leftStyle !== rightStyle) {
    out.push(`${path}: style 不同 [${leftStyle}] vs [${rightStyle}]`);
  }

  if (left.children.length !== right.children.length) {
    out.push(`${path}: 子节点数不同 ${left.children.length} vs ${right.children.length}`);
    return;
  }
  for (let i = 0; i < left.children.length; i += 1) {
    const a = left.children[i];
    const b = right.children[i];
    if (a === undefined || b === undefined) continue;
    diffNode(a, b, `${path}/${a.tag}[${i}]`, out);
  }
}

/**
 * 比对两棵契约树，返回**逐条可读**的差异（空数组 = 一致）。
 *
 * 返回差异列表而不是布尔值，是为了让「唯一差异」成为**可证伪**的断言：
 * 有意差异（如 D17）的用例可以断言 `diff` 恰好等于某一条，
 * 于是任何**额外**的漂移都会让该用例失败，而不是被「反正有差异」掩盖。
 */
export function diffContract(left: DomNode[], right: DomNode[]): string[] {
  const out: string[] = [];
  if (left.length !== right.length) {
    out.push(`$: 根节点数不同 ${left.length} vs ${right.length}`);
    return out;
  }
  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    if (a === undefined || b === undefined) continue;
    diffNode(a, b, `$/${a.tag}[${i}]`, out);
  }
  return out;
}

/** 便捷组合：两侧 HTML → 差异列表。 */
export function diffHtml(leftHtml: string, rightHtml: string, options?: ContractOptions): string[] {
  return diffContract(contractOf(leftHtml, options), contractOf(rightHtml, options));
}

/** 机械 oracle 基线里的一个用例。 */
export interface DomBaselineCase {
  /** 用例标识，与 React 侧构造一一对应（如 `props:rotate:90`）。 */
  id: string;
  /** React 侧 `renderToStaticMarkup` 的**原始产物**。 */
  html: string;
}

/**
 * 机械 oracle 基线。只要求 `cases` 这一个字段 ——
 * 其余字段（版本号、统计、`$comment`…）由生成脚本决定，本包不锁定它们。
 */
export interface DomBaseline {
  cases?: DomBaselineCase[];
  [key: string]: unknown;
}

/**
 * Vue 侧的渲染结果：HTML 字符串、vnode，或**组件本身**。
 *
 * 必须接受组件本身 —— 否则调用方要为每一行写 `h(AButton, props)` 这种噪音，
 * 而且与 `resolveRenderable` 的运行时行为不一致（它接受组件并自动 `h()` 包一层）。
 * 「类型层拒绝、运行时接受」是最难查的一类不一致：类型测试会红，但没人知道为什么。
 */
export type DomRenderResult = string | VNodeChild | Component;

export interface DomContractOptions {
  /** 由 `tests/compat/baseline/*.mjs` 生成、**禁止手改**的 React 侧基线。 */
  baseline: DomBaseline;
  /**
   * 用例 id → Vue 侧产物。
   *
   * ⚠️ 必须覆盖基线里的**每一个**用例。少渲染一条会失败 ——
   *    否则「少测几条」会表现为「测试通过」。
   */
  render: (id: string) => DomRenderResult;
  /** 只跑基线里的这些用例（默认全部）。给了不在基线里的 id 会失败。 */
  only?: readonly string[];
  /** 投影档。两侧共用。默认 `'contract'`。 */
  profile?: ProjectionProfile;
  /** 见 {@link ContractOptions.keepStyle}。 */
  keepStyle?: boolean;
  /** 见 {@link ContractOptions.ignoreAttrs}。 */
  ignoreAttrs?: readonly string[];
  /** 见 {@link ContractOptions.dropCssInJsClasses}。默认 `true`。 */
  dropCssInJsClasses?: boolean;
  /**
   * 允许的差异，**按用例 id 逐条列出**。
   *
   * 断言是 `expect(actualDiff).toEqual(allowedDiff)` —— 即：
   * 允许的差异必须**恰好**出现。这样「这是唯一差异」本身成为可证伪的断言，
   * 任何**额外**的漂移都会让用例失败，而不是被「反正有差异」掩盖。
   */
  allow?: Readonly<Record<string, Allowance & { diff: readonly string[] }>>;
}

/**
 * 把 `DomRenderResult` 落成 HTML 字符串。
 *
 * 非字符串的产物必须经 `resolveRenderable` 解析 —— 直接把组件对象交给渲染函数，
 * Vue 不会渲染任何东西（它只认 vnode），结果是「零个根节点」这种极难定位的假失败。
 * 走同一条解析路径也保证了与 `demoTest` 对「什么叫一个可渲染产物」的定义一致（T2）。
 */
function toHtml(result: DomRenderResult, id: string): string {
  if (typeof result === 'string') return result;
  const mounted = mountCase(() => resolveRenderable(result, `domContractTest → render("${id}")`));
  try {
    return mounted.html();
  } finally {
    mounted.destroy();
  }
}

/**
 * L4 共享契约：用同一份 fixture 的**机械 oracle 基线**驱动 Vue 侧的 DOM 契约比对。
 *
 * 用法见 `TESTING.md` §5 与 `tests/compat/README.md` §3。基线由
 * `pnpm run test:compat:baseline` 从 React 参考实现生成，**不是**手写的期望值。
 */
export function domContractTest(name: string, options: DomContractOptions): void {
  const cases = options.baseline.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    throw new Error(
      `[test-utils] domContractTest('${name}')：基线里没有 cases。\n` +
        '  基线应由 tests/compat/baseline/*.mjs 生成（机械 oracle），禁止手改或手工构造。',
    );
  }

  const known = new Set(cases.map((item) => item.id));
  const selected = options.only ?? [...known];
  for (const id of selected) {
    if (!known.has(id)) {
      throw new Error(
        `[test-utils] domContractTest('${name}')：only 里的 "${id}" 不在基线中。\n` +
          `  基线里的用例：${[...known].join(', ')}`,
      );
    }
  }

  const allowances = options.allow ?? {};
  for (const [id, allowance] of Object.entries(allowances)) {
    assertAllowance(allowance, `domContractTest('${name}') → allow["${id}"]`);
    if (!known.has(id)) {
      throw new Error(
        `[test-utils] domContractTest('${name}')：allow 里的 "${id}" 不在基线中（豁免会腐烂）。`,
      );
    }
  }

  const projection: ContractOptions = {
    profile: options.profile ?? 'contract',
  };
  if (options.keepStyle !== undefined) projection.keepStyle = options.keepStyle;
  if (options.ignoreAttrs !== undefined) projection.ignoreAttrs = options.ignoreAttrs;
  if (options.dropCssInJsClasses !== undefined) {
    projection.dropCssInJsClasses = options.dropCssInJsClasses;
  }

  describe(`${name} · DOM 契约`, () => {
    for (const id of selected) {
      const baselineCase = cases.find((item) => item.id === id);
      if (baselineCase === undefined) continue;

      it(id, () => {
        const actual = diffHtml(baselineCase.html, toHtml(options.render(id), id), projection);
        const allowed = allowances[id]?.diff ?? [];
        // `toEqual` 而不是 `toContain`：允许的差异必须**恰好**出现，多一条都不行。
        expect(actual).toEqual([...allowed]);
      });
    }
  });
}
