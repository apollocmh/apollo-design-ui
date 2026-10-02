/**
 * classify-date-picker-rules.mjs — 把 `DATE_PICKER_RULES`（254 条）机械拆成
 * `TRIGGER_RULES` + `PANEL_RULES`，判据来自**两侧上游产物的交集**。
 *
 * 用法：
 *   node tests/visual/debug/classify-date-picker-rules.mjs --report    # 分类报告
 *   node tests/visual/debug/classify-date-picker-rules.mjs --emit      # 产出拆好的两个常量
 *
 * ── 为什么不是「手写前缀表」──────────────────────────────────────────────────
 *
 * 上游 `date-picker/style/index.ts` 的 `'&-dropdown': { ...genPanelStyle(token) }` 与
 * `calendar/style/index.ts` 的 `[calendarCls]: { ...genPanelStyle(token) }` 用的是
 * **同一个 `genPanelStyle`**。于是：
 *
 *   date-picker 产物里 → `.ant-picker-dropdown <X>`
 *   calendar    产物里 → `.ant-picker-calendar <X>`
 *
 * ⇒ **`<X>` 的交集就是 `genPanelStyle` 的产物**，这是可复现的双向 oracle，
 *   比「凭前缀猜哪些是面板规则」可靠（仓库纪律：先怀疑自己的判据）。
 *
 * ⚠️ 前置：先跑两个提取脚本落盘
 *   node tests/visual/debug/extract-date-picker-css.mjs > /tmp/dp-antd.css
 *   node tests/visual/debug/extract-calendar-css.mjs   > /tmp/calendar-antd.css
 */
import { readFileSync } from 'node:fs';

const DP = '/tmp/dp-antd.css';
const CAL = '/tmp/calendar-antd.css';

/** 剥掉 `:where(.css-dev-only-do-not-override-XXXX)` 与 `:where(.css-XXXX)` 包装。 */
function stripWhere(sel) {
  return sel.replace(/:where\([^)]*\)/g, '').trim();
}

/**
 * 把一份 cssinjs 产物拆成「选择器（逐个展开逗号）→ 主体」。
 *
 * ⚠️ 只处理**单层**规则：cssinjs 产物里 `@media` / `@supports` 内的规则会被漏掉。
 * 本脚本的用途只针对 `.ant-picker-dropdown <X>` / `.ant-picker-calendar <X>`，
 * 这两批规则都不在 at-rule 里，所以够用；**不做通用 CSS 解析器**。
 */
function parseRules(css) {
  const out = [];
  for (const m of css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
    const sels = m[1]
      .split(',')
      .map((s) => stripWhere(s))
      .filter(Boolean);
    if (!sels.length) continue;
    out.push({ sels, body: m[2].trim() });
  }
  return out;
}

/** 取「作用域类」之后的余下选择器；不匹配则返回 null。 */
function remainder(sel, scope) {
  if (sel === scope) return '';
  if (sel.startsWith(`${scope} `)) return sel.slice(scope.length + 1).trim();
  return null;
}

function collect(cssPath, scope) {
  const set = new Set();
  for (const { sels } of parseRules(readFileSync(cssPath, 'utf8'))) {
    for (const sel of sels) {
      const r = remainder(sel, scope);
      if (r !== null && r !== '') set.add(r);
    }
  }
  return set;
}

const dpSet = collect(DP, '.ant-picker-dropdown');
const calSet = collect(CAL, '.ant-picker-calendar');

// 交集 = genPanelStyle 的产物（换作用域后仍逐字相同的那些）
const panelSet = new Set([...dpSet].filter((x) => calSet.has(x)));

// 只看 `.apollo-picker-dropdown <X>` 形态的规则（余下的天然是 TRIGGER）
//
// ⚠️ 2026-10-02：`DATE_PICKER_RULES` 已拆成**三段**（前段 42 + 面板 83 + 后段 132），
// 本体是一个一行拼接的模板字面量 ⇒ 直接抽 `DATE_PICKER_RULES` 会只拿到那一行。
// 这里按三段取，拼回原文（与 `split-dp-rules.mjs` 的断言同一口径）。
const src = readFileSync(
  '/Users/nanren/Code/apollo-design-ui/packages/ui/src/date-picker/style/index.ts',
  'utf8',
);
// ⚠️ 用**单引号字符串拼接**构造正则，不用模板字面量 —— 模板字面量里写反引号
//    需要 `\\\``，很容易被转义层次绕晕（本轮实测把 `[\\s\\S]` 写坏成 `[sS]`）。
const partOf = (name) => {
  // biome-ignore lint/style/useTemplate: 这里的「拼接」是**刻意**的 —— 用模板字面量就得写
  //   `\\\`` 转义反引号，转义层次极易写错（本轮实测把 `[\\s\\S]` 写坏成 `[sS]` 直接 SyntaxError）。
  const m = src.match(new RegExp('(?:export )?const ' + name + ' = `([\\s\\S]*?)`;'));
  if (!m) throw new Error('找不到常量 ' + name);
  return m[1];
};
const raw = partOf('RULES_BEFORE_PANEL') + partOf('PANEL_RULES') + partOf('RULES_AFTER_PANEL');

const lines = raw
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const panel = [];
const trigger = [];
const unmatched = [];

for (const line of lines) {
  const selPart = line.slice(0, line.indexOf('{'));
  const sels = selPart
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const toAnt = (s) => s.replace(/\.apollo-picker/g, '.ant-picker');
  const rems = sels.map((s) => remainder(toAnt(s), '.ant-picker-dropdown'));

  // 一条规则归 PANEL ⇔ **它引用的每个选择器**都在交集里（整条规则同属一个作用域）
  const isPanel = rems.every((r) => r !== null && r !== '') && rems.every((r) => panelSet.has(r));

  if (isPanel) panel.push(line);
  else if (rems.every((r) => r === null)) trigger.push(line);
  else unmatched.push({ line, rems });
}

const mode = process.argv.includes('--emit') ? 'emit' : 'report';

if (mode === 'report') {
  console.log(`DATE_PICKER_RULES 行数（非空）  = ${lines.length}`);
  console.log(`  PANEL_RULES   = ${panel.length}`);
  console.log(`  TRIGGER_RULES = ${trigger.length}`);
  console.log(`  ⚠️ 未归类      = ${unmatched.length}`);
  console.log(`\ndate-picker 产物 .ant-picker-dropdown <X> 余下选择器 = ${dpSet.size}`);
  console.log(`calendar    产物 .ant-picker-calendar <X> 余下选择器 = ${calSet.size}`);
  console.log(`交集（genPanelStyle 判据）                          = ${panelSet.size}`);

  if (unmatched.length) {
    console.log('\n### 未归类（跨作用域 / 不匹配）');
    for (const u of unmatched.slice(0, 30)) {
      console.log(`  ${u.rems.map((r) => (r === null ? '<非 dropdown>' : r)).join(' | ')}`);
      console.log(`     ${u.line.slice(0, 160)}`);
    }
  }

  // 反向检查：交集里有、但 DATE_PICKER_RULES 里没被算作 panel 的
  const usedRem = new Set(
    panel.flatMap((l) => {
      const selPart = l.slice(0, l.indexOf('{'));
      return selPart
        .split(',')
        .map((s) =>
          remainder(s.trim().replace(/\.apollo-picker/g, '.ant-picker'), '.ant-picker-dropdown'),
        )
        .filter(Boolean);
    }),
  );
  const missing = [...panelSet].filter((x) => !usedRem.has(x));
  console.log(`\n### 交集里但未被任何 PANEL 规则覆盖的（应为 0）: ${missing.length}`);
  for (const x of missing.slice(0, 30)) console.log(`  ${x}`);
} else {
  const fmt = (arr) => arr.map((l) => `  ${l}`).join('\n');
  console.log('/* ==== PANEL_RULES ==== */');
  console.log(fmt(panel));
  console.log('/* ==== TRIGGER_RULES ==== */');
  console.log(fmt(trigger));
}
