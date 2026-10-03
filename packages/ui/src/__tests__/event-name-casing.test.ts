/**
 * 「复合词事件名」全仓扫描 —— 防止 `h('<原生标签>', { onXxxYyy: … })` 静默失效。
 *
 * ── 为什么需要这条 ──────────────────────────────────────────────────────────
 *
 * Vue 的 `parseName` 会对 `on` 之后的**整段**做 `hyphenate`：
 *   - `onClick`    → `click`     ✅（单段名，正常）
 *   - `onKeyup`    → `keyup`     ✅
 *   - `onMouseDown` → **`mouse-down`** ❌（永不触发、且**不报错**）
 *   - `onKeyDown`   → **`key-down`**   ❌
 *
 * ⚠️ **编译期无告警、`vue-tsc` 全绿、jsdom 也不报错** —— 事件只是**永远不触发**。
 * 这个坑在本仓真实发生过两次（2026-10-03 修，PITFALLS **323**）：
 *   1. `segmented/Segmented.ts` 的 `onMouseDown` ⇒「mousedown 清除键盘态」**从未生效**；
 *   2. `collapse/Panel.ts` 的 `onKeyDown` ⇒ **Enter 键展开/收起失效**（a11y 键盘操作）。
 *
 * ── 判据：只有「原生元素」才危险 ────────────────────────────────────────────
 *
 * `h(SomeComponent, { onKeyDown: fn })` 是**合法**的 —— Vue 对**声明过的 prop**
 * 按**名字**解析，不经 `hyphenate`。所以扫描只针对：
 *
 *     `h('<小写标签>', <props>)`   // 原生元素
 *
 * 且会**穿透** `spread` / 条件表达式 / `computed(() => ({…}))` / `x.value`
 * —— 第 2 个真实 bug 就藏在 `h('div', { ...(cond ? collapsibleProps.value : {}) })` 里，
 * 只看调用点的直接属性会**漏掉**它（见下面第 1 条自证用例）。
 *
 * ── 开销（实测，2026-10-03）──────────────────────────────────────────────────
 *
 * `import typescript` **354 ms**；全仓 walk + 预筛 + parse **≈ 2.0 s**
 * （3141 个 `.ts`/`.vue`，其中**只有 135 个**通过预筛真正 parse）。
 * ⇒ 这是**收集期**的一次性成本，在 `unit` project 里可忽略（整套 ~195 s / 多 worker 并行）。
 * ⚠️ 若将来想再压：预筛那一步的**文件读取**才是瓶颈（parse 很便宜），
 *    不要为此引入 shell 依赖。
 *
 * ── 豁免清单的用法（与 `style-prefix.test.ts` 同一条纪律）────────────────────
 *
 * `ALLOWED` 里是**反向哨兵**：它们**故意**用错误键名，断言「**不触发**」。
 * 本测试**双向**校验 ——
 *   - 清单里没登记、却扫到 ⇒ **红**（新引入的 bug，或修完忘了删登记）；
 *   - 清单里登记了、却扫不到 ⇒ **红**（哨兵被删/被改名 ⇒ 豁免可自证，不能空转）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/** 仓库根：本文件在 `packages/ui/src/__tests__/` ⇒ 上溯 4 层。 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

/** 原生标签 = 小写开头（`div` / `label` / `button`）。大写开头是组件 ⇒ 不在扫描范围。 */
const NATIVE_TAG = /^[a-z][a-z0-9-]*$/;

/**
 * 复合词事件名：`on` + 大写 + 若干小写 + **又一个大写**。
 *
 * ⚠️ 单段名（`onClick` / `onKeyup` / `onInput`）**不匹配** —— 它们是对的，别误报。
 */
const COMPOUND_EVENT = /^on[A-Z][a-z]*[A-Z]/;

/**
 * Vue 的 `parseName` **先剥掉**尾部的 `Once` / `Passive` / `Capture`（当作 `options`），
 * **再**对剩下的部分 hyphenate ⇒ `onPointerdownCapture` → 剥 `Capture` → `pointerdown` ✅。
 * 所以判定前必须先剥后缀，否则会误报（本仓 `overlay/use-overlay.ts` 就用了它）。
 */
const MODIFIER_SUFFIX = /(Once|Passive|Capture)$/;

/** 剥掉尾部修饰后缀后，是否仍是「复合词」⇒ 会被 hyphenate 成 `xxx-yyy` 而永不触发。 */
function isDangerousEventKey(name: string): boolean {
  let n = name;
  let m = n.match(MODIFIER_SUFFIX);
  while (m !== null) {
    n = n.slice(0, n.length - m[0].length);
    m = n.match(MODIFIER_SUFFIX);
  }
  return COMPOUND_EVENT.test(n);
}

/**
 * 「透明包装」：这些函数的**实参**就是返回的对象本体 ⇒ 可以穿透。
 *
 * ⚠️ 白名单而非黑名单 —— 否则 `overlay.popupProps.value` 会被回溯到
 * `const overlay = useOverlay({…})` 的**配置实参**上，把配置对象误报成 DOM props
 * （2026-10-03 实测踩到：`trigger.ts:192` 的 `onOpenChange` 是 `useOverlay` 的**配置**，
 * 不是落到 `<div>` 上的 prop）。
 */
const TRANSPARENT_WRAPPERS = new Set([
  'computed',
  'ref',
  'shallowRef',
  'reactive',
  'readonly',
  'toRef',
]);

/** 预筛：文本里没有「复合词形态的对象键」就不必解析（省掉数千次 parse）。 */
const PRE_FILTER = /(^|\s)on[A-Z][a-z]*[A-Z]\w*\s*:/m;

/**
 * 反向哨兵白名单（**故意**用错误键名断言「不触发」）。
 *
 * ⚠️ 删掉某条哨兵时**必须**同步删这里，否则本测试的第二条断言会红。
 */
const ALLOWED: ReadonlyArray<{ file: string; name: string; reason: string }> = [
  {
    file: 'packages/ui/src/color-picker/__tests__/engine.test.ts',
    name: 'onMouseDown',
    reason:
      '反向哨兵：断言错误键名**收不到**事件（`expect(onWrong).toHaveBeenCalledTimes(0)`），对照 `onMousedown` 收到 1 次。',
  },
  {
    file: 'packages/utils/src/__tests__/semantic.test.ts',
    name: 'onKeyDown',
    reason:
      '反向哨兵：断言 `onKeyDown` 在 `keydown` 时**不触发**，只在 `key-down`（hyphenate 后）触发。',
  },
  {
    file: 'packages/utils/src/__tests__/semantic.test.ts',
    name: 'onDoubleClick',
    reason: '反向哨兵：断言 `onDoubleClick` 在 `dblclick` 时**不触发**，只在 `double-click` 触发。',
  },
];

type Hit = { file: string; line: number; name: string; via: string };

/** 递归收集待扫描的源文件（排除产物目录与 `.d.ts`）。 */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'es', 'lib', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|vue)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** `.vue` 只扫 `<script>` 块，并把行号映射回原文件。 */
function scriptBlocks(code: string, file: string): Array<{ text: string; lineOffset: number }> {
  if (!file.endsWith('.vue')) return [{ text: code, lineOffset: 0 }];
  const blocks: Array<{ text: string; lineOffset: number }> = [];
  const re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null = re.exec(code);
  while (m !== null) {
    const bodyStart = m.index + m[0].indexOf('>') + 1;
    blocks.push({ text: m[1] ?? '', lineOffset: code.slice(0, bodyStart).split('\n').length - 1 });
    m = re.exec(code);
  }
  return blocks;
}

/** 剥掉对类型无影响的包裹（`(x)` / `x as T` / `x!` / `x satisfies T`）。 */
function unwrap(node: ts.Expression): ts.Expression {
  let n = node;
  while (
    ts.isParenthesizedExpression(n) ||
    ts.isAsExpression(n) ||
    ts.isNonNullExpression(n) ||
    ts.isSatisfiesExpression(n)
  ) {
    n = n.expression;
  }
  return n;
}

/**
 * 把「可能是对象」的表达式解析成一组对象字面量 —— 穿透
 * `标识符` / `条件表达式` / `x.value` / `computed(() => ({…}))` / 对象内的 `...spread`。
 */
function resolveObjects(
  expr: ts.Expression,
  vars: ReadonlyMap<string, ts.Expression>,
  seen: Set<string> = new Set(),
): ts.ObjectLiteralExpression[] {
  const e = unwrap(expr);

  if (ts.isObjectLiteralExpression(e)) {
    const out = [e];
    for (const prop of e.properties) {
      if (ts.isSpreadAssignment(prop)) out.push(...resolveObjects(prop.expression, vars, seen));
    }
    return out;
  }
  if (ts.isConditionalExpression(e)) {
    return [...resolveObjects(e.whenTrue, vars, seen), ...resolveObjects(e.whenFalse, vars, seen)];
  }
  if (ts.isIdentifier(e)) {
    if (seen.has(e.text)) return [];
    seen.add(e.text);
    const init = vars.get(e.text);
    return init ? resolveObjects(init, vars, seen) : [];
  }
  // `collapsibleProps.value` ⇒ 解析基对象
  if (ts.isPropertyAccessExpression(e)) return resolveObjects(e.expression, vars, seen);
  // `() => ({…})` ⇒ 解析 body（block body 不是对象，直接跳过）
  if (ts.isArrowFunction(e) && !ts.isBlock(e.body)) return resolveObjects(e.body, vars, seen);
  // 只穿透**透明包装**（`computed(() => ({…}))` 等）：实参就是返回的对象本体。
  // ⚠️ 其它调用（`useOverlay({…})` / `.filter(…)`）**必须放弃** —— 否则会把
  //    函数的**配置实参**误当成 DOM props（见 TRANSPARENT_WRAPPERS 的说明）。
  if (ts.isCallExpression(e)) {
    if (!ts.isIdentifier(e.expression) || !TRANSPARENT_WRAPPERS.has(e.expression.text)) return [];
    const out: ts.ObjectLiteralExpression[] = [];
    for (const arg of e.arguments) out.push(...resolveObjects(arg as ts.Expression, vars, seen));
    return out;
  }
  return [];
}

/** 扫描一段源码（`rel` 只用于报错定位；`lineOffset` 用于 `.vue` 的 script 块偏移）。 */
function scanSource(text: string, rel: string, lineOffset = 0): Hit[] {
  const hits: Hit[] = [];
  const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true);

  // 先收集 `变量名 → 初始化表达式`（用于解析 `h('div', someObj)` 与 spread）
  const vars = new Map<string, ts.Expression>();
  const collectVars = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      vars.set(node.name.text, node.initializer);
    }
    ts.forEachChild(node, collectVars);
  };
  collectVars(sf);

  const report = (objects: ts.ObjectLiteralExpression[], via: string): void => {
    for (const obj of objects) {
      for (const prop of obj.properties) {
        const name =
          prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))
            ? prop.name.text
            : null;
        if (!name || !isDangerousEventKey(name)) continue;
        const { line } = sf.getLineAndCharacterOfPosition(prop.getStart(sf));
        hits.push({ file: rel, line: line + 1 + lineOffset, name, via });
      }
    }
  };

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'h'
    ) {
      const [tag, props] = node.arguments;
      // 只查**原生标签**：`h('div', …)`；`h(SomeComponent, …)` 合法（声明过的 prop 按名解析）
      if (tag && ts.isStringLiteral(tag) && NATIVE_TAG.test(tag.text) && props) {
        report(resolveObjects(props, vars), `h('${tag.text}')`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/** 扫描单个文件。 */
function scanFile(file: string): Hit[] {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
  const hits: Hit[] = [];
  for (const { text, lineOffset } of scriptBlocks(raw, file)) {
    hits.push(...scanSource(text, rel, lineOffset));
  }
  return hits;
}

/** 全仓扫描（预筛后只解析「可能命中」的文件）。 */
function scanRepo(): Hit[] {
  const hits: Hit[] = [];
  for (const file of walk(path.join(REPO_ROOT, 'packages'))) {
    if (!PRE_FILTER.test(fs.readFileSync(file, 'utf8'))) continue;
    hits.push(...scanFile(file));
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

const key = (h: { file: string; name: string }) => `${h.file}::${h.name}`;

describe("复合词事件名（`h('原生标签')` 上写 `onXxxYyy` 会静默失效）", () => {
  const hits = scanRepo();

  it('🚨 自证：扫描器能穿透 spread / 条件 / computed，且**不误报**三类合法写法', () => {
    // ── A. 穿透能力：`collapse/Panel.ts` 的 bug 藏在
    //    `h('div', { ...(cond ? collapsibleProps.value : {}) })`，而
    //    `collapsibleProps = computed(() => ({ onKeydown: … }))`。
    //    这里用**等价的最小片段**断言「穿透能力」本身（不依赖生产代码的具体写法）。
    const viaSpread = [
      'declare const computed: any;',
      'declare const h: any;',
      'declare const cond: boolean;',
      'const inner = computed(() => ({ onKeyDown: () => {}, role: "button" }));',
      'export const v = h("div", { ...(cond ? inner.value : {}) });',
    ].join('\n');
    expect(scanSource(viaSpread, 'probe.ts').map((p) => p.name)).toContain('onKeyDown');

    // ── B. 不误报 ①：**正确**的单段名
    expect(
      scanSource(
        'declare const h: any; export const v = h("div", { onKeydown: () => {} });',
        'probe.ts',
      ),
    ).toHaveLength(0);

    // ── C. 不误报 ②：Vue 的 `parseName` **先剥** `Once`/`Passive`/`Capture` 再 hyphenate
    //    ⇒ `onPointerdownCapture` → `pointerdown` ✅（本仓 `overlay/use-overlay.ts` 在用）
    expect(
      scanSource(
        'declare const h: any; export const v = h("div", { onPointerdownCapture: () => {}, onPointerdownOnce: () => {} });',
        'probe.ts',
      ),
    ).toHaveLength(0);

    // ── D. 不误报 ③：`x.y.value` 不能回溯到 `useSomeHook({…})` 的**配置实参**
    //    （`trigger.ts` 的 `onOpenChange` 是 `useOverlay` 的配置，不是落到 DOM 的 prop）
    expect(
      scanSource(
        [
          'declare const useOverlay: any;',
          'declare const h: any;',
          'const overlay = useOverlay({ onOpenChange: (n: boolean) => n });',
          'export const v = h("div", { ...overlay.popupProps.value });',
        ].join('\n'),
        'probe.ts',
      ),
    ).toHaveLength(0);

    // ── E. 对照：真正的复合词**必须**被抓住（`onDblClick` → `dbl-click` ✗）
    expect(
      scanSource(
        'declare const h: any; export const v = h("div", { onDblClick: () => {} });',
        'probe.ts',
      ).map((p) => p.name),
    ).toEqual(['onDblClick']);
  });

  it('实际命中集合 == `ALLOWED`（双向）', () => {
    // 方向 A：没登记却扫到 ⇒ 新引入的 bug（或修完忘了删登记）
    const allowedKeys = new Set(ALLOWED.map(key));
    const unregistered = hits.filter((h) => !allowedKeys.has(key(h)));
    expect(
      unregistered.map((h) => `${h.file}:${h.line} ${h.name} [${h.via}]`),
      '未登记的「原生元素 + 复合词事件名」—— 会被 Vue 归一成 `xxx-yyy` 而**永不触发**',
    ).toEqual([]);

    // 方向 B：登记了却扫不到 ⇒ 哨兵被删/改名 ⇒ 豁免空转
    const hitKeys = new Set(hits.map(key));
    const stale = ALLOWED.filter((a) => !hitKeys.has(key(a)));
    expect(
      stale.map((a) => `${a.file} ${a.name}`),
      '已失效的 ALLOWED 登记（哨兵被删或改名了？）',
    ).toEqual([]);
  });

  it('豁免清单规模被钉住（3 条反向哨兵；删一条哨兵就减一条）', () => {
    expect(ALLOWED).toHaveLength(3);
    expect(hits).toHaveLength(3);
  });

  it('生产代码必须**零**命中（本仓的两个真实 bug 已修）', () => {
    const inProduction = hits.filter((h) => !h.file.includes('__tests__'));
    expect(inProduction.map((h) => `${h.file}:${h.line} ${h.name}`)).toEqual([]);
  });
});
