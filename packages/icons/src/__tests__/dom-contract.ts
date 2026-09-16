/**
 * L4 DOM 契约：结构化投影 + 对称归一化 + 可读差异。
 *
 * ── 为什么需要这一层 ──────────────────────────────────────────────────────────
 * `tests/compat/baselines/icons.dom.json` 存的是 React 的**原始 HTML 字符串**。
 * 直接拿字符串比对我们渲染出的 DOM 是不行的，原因在 `tests/compat/README.md` §4：
 * 属性顺序、style 的序列化方式、`-ms-` 前缀这些东西两侧本来就不同，
 * 而它们都**不是**对外契约。直接比字符串会得到一堆噪音，然后被"顺手加白"绕过。
 *
 * 所以两侧都走同一条流水线：`HTML 字符串 → HTML 解析器 → 投影`。
 * **归一化必须对称**（§4）：本文件里没有任何一处只作用于单侧的分支。
 *
 * ── 与 T10 的关系（有意偏离，理由在此）────────────────────────────────────────
 * `TESTING.md` T10 规定契约投影「只保留标签名 + 类名 + data-* + role/aria-*」，
 * 理由是「完整快照会因无关属性变化频繁失败」。
 *
 * 对图标来说这条理由不成立：本组件的**全部产出**就是一个 SVG，
 * `viewBox` / `d` / `fill` / `width` / `height` 不是"无关属性"，它们就是交付物本身。
 * 只投影 class + aria-*，会让「图标画错了」这一类最严重的回归完全测不出来。
 *
 * 因此本文件投影**全部属性**（而不是 T10 的子集），但：
 *   - 属性按名字排序 → 不锁定属性顺序（T9.4 明确允许）
 *   - `style` 归一化为「声明集合」→ 不受序列化格式影响
 *   - 剔除与无前缀项语义等价的厂商前缀项（`COMPATIBILITY.md` D16）
 * 这是**加强**而不是放宽验收标准：它比 T10 的子集更严，且不存在不对称归一化。
 *
 * ── 为什么放在这里而不是 `@apollo-design/test-utils` ─────────────────────────
 * `ARCHITECTURE.md` 的包边界判据是「消费者 ≥ 2 且无视觉语义」才升级为独立包。
 * 目前消费者只有 icons 一个。等第二个包接入 L4 时再提取，避免提前抽象。
 */

/** 归一化后的单个 DOM 节点。 */
export interface DomNode {
  /** 小写标签名。 */
  tag: string;
  /** 类名 token，**已排序**。 */
  class: string[];
  /** 除 `class` / `style` 外的全部属性，**已按属性名排序**。 */
  attrs: [string, string][];
  /** 归一化后的 style 声明，**已排序**；无 style 属性时为 undefined。 */
  style?: string[];
  children: DomNode[];
}

/** 厂商前缀的 transform。与无前缀的 `transform` 语义等价（D16）。 */
const VENDOR_PREFIXED_TRANSFORM = /^-(?:ms|webkit|moz|o)-transform$/;

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
  return Array.from(template.content.children);
}

/** 把一个元素投影成 {@link DomNode}。 */
export function projectNode(el: Element): DomNode {
  const attrs: [string, string][] = [];
  let classTokens: string[] = [];
  let style: string[] | undefined;

  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'class') {
      classTokens = attr.value.split(/\s+/).filter((token) => token !== '');
      continue;
    }
    if (attr.name === 'style') {
      style = normalizeStyle(attr.value);
      continue;
    }
    attrs.push([attr.name, attr.value]);
  }

  attrs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  classTokens.sort();

  const node: DomNode = {
    tag: el.tagName.toLowerCase(),
    class: classTokens,
    attrs,
    children: Array.from(el.children).map(projectNode),
  };
  if (style !== undefined) node.style = style;
  return node;
}

/** `HTML 字符串 → 契约树`。React 基线与 Vue 渲染结果都走这一条路。 */
export function contractOf(html: string): DomNode[] {
  return parseFragment(html).map(projectNode);
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
 * 于是任何**额外**的漂移都会让该用例失败，而不是被"反正有差异"掩盖。
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
export function diffHtml(leftHtml: string, rightHtml: string): string[] {
  return diffContract(contractOf(leftHtml), contractOf(rightHtml));
}
