const fs = require('node:fs');

const P = 'tests/build/run.mjs';
let s = fs.readFileSync(P, 'utf8');

// ---- 1) 新表 ----
const anchorTable = `const CONTAINER_QUERY_OPT_IN_VARS = {`;
const newTable = `/**
 * **上游 Component Token 默认 \`undefined\` ⇒ 刻意不声明的变量**（\`var()\` **间接**回退链形态）。
 *
 * 与 \`CONTAINER_QUERY_OPT_IN_VARS\` 的**区别**：那张表的变量被 \`@container style(<var>)\`
 * 当特性开关消费；这里的变量参与的是**两层**的 token 间接层：
 *
 * \`\`\`css
 * .ant-timeline .ant-timeline-item{
 *   --ant-cmp-steps-icon-dot-size-custom: var(--ant-timeline-dot-size);      /* ① 赋值给另一个自定义属性 */
 *   --ant-cmp-steps-icon-size: var(--ant-cmp-steps-icon-dot-size-custom,
 *                                var(--ant-cmp-steps-icon-dot-size-origin));  /* ② 回退链在这里 */
 * }
 * \`\`\`
 *
 * ⇒ 未声明时 ① 的右侧无效 ⇒ ② 回退到 Steps 的 \`-origin\`；用户覆盖后 ① 生效。
 *   **补一条声明会改变行为**（\`-custom\` 恒有效 ⇒ 永远盖掉 origin）。
 *
 * 豁免**可自证**（见下方强制检查）：① 该变量在 ui 的全部 CSS 里都不许被声明；
 * ② 它的**每一次** \`var(<它>)\` 出现都必须位于「\`--某自定义属性:\` 的右侧」
 *   （即只参与 token 间接层，不被直接用于真实 CSS 属性）。
 */
const UPSTREAM_UNDECLARED_TOKEN_VARS = {
  /**
   * timeline 的 \`dotSize\` / \`dotBg\`：\`prepareComponentToken\` **显式返回 \`undefined\`**
   * （上游注释是「should be \`undefined\` to create css var」）⇒ 产物 css-var 块只有 4 条。
   */
  '--apollo-timeline-dot-size': 'timeline/style/token.ts（prepareComponentToken 返回 undefined）',
  '--apollo-timeline-dot-bg': 'timeline/style/token.ts（prepareComponentToken 返回 undefined）',
};

const CONTAINER_QUERY_OPT_IN_VARS = {`;

if (s.split(anchorTable).length - 1 !== 1) throw new Error('表锚点未命中');
s = s.replace(anchorTable, newTable);

// ---- 2) 加进 declared ----
const anchorDeclared = `  for (const v of Object.keys(CONTAINER_QUERY_OPT_IN_VARS)) declared.add(v);`;
const newDeclared = `  for (const v of Object.keys(CONTAINER_QUERY_OPT_IN_VARS)) declared.add(v);

  // 上游 token 默认 undefined ⇒ 刻意不声明（见 UPSTREAM_UNDECLARED_TOKEN_VARS 的说明）
  for (const v of Object.keys(UPSTREAM_UNDECLARED_TOKEN_VARS)) declared.add(v);`;
if (s.split(anchorDeclared).length - 1 !== 1) throw new Error('declared 锚点未命中');
s = s.replace(anchorDeclared, newDeclared);

// ---- 3) 自证 ----
const anchorSelfCheck = `  add(
    name,
    'B7',
    'PASS',
    \`\${referenced} 处 var(--apollo-*) 引用全部在 theme 的 tokens.css 里有声明\`,
  );
  return true;
}`;

const newSelfCheck = `  // 上游 token 默认 undefined 的**自证**：只写进表不构成豁免
  {
    const allCss = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\\n');
    for (const [variable, where] of Object.entries(UPSTREAM_UNDECLARED_TOKEN_VARS)) {
      const esc = variable.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      if (new RegExp(\`\${esc}\\\\s*:\`).test(allCss)) {
        add(
          name,
          'B7',
          'FAIL',
          \`\${variable} 被声明了 —— 上游刻意不声明（补上会改变 var() 回退链的语义）（\${where}）\`,
        );
        return false;
      }
      // 每一次 \\\`var(<它>)\\\` 都必须落在「--某自定义属性: …」的右侧
      const usage = new RegExp(\`([^;{}]*?)\\\\bvar\\\\(\\\\s*\${esc}\\\\s*\\\\)\`, 'g');
      let found = 0;
      for (const m of allCss.matchAll(usage)) {
        found += 1;
        const lhs = m[1];
        const colon = lhs.lastIndexOf(':');
        const prop = colon >= 0 ? lhs.slice(0, colon).trim() : '';
        if (!prop.startsWith('--')) {
          add(
            name,
            'B7',
            'FAIL',
            \`\${variable} 被直接用在真实 CSS 属性上（\\\\\`\${prop || '(无属性)'}\\\\\`）—— 它只应参与 token 间接层（\${where}）\`,
          );
          return false;
        }
      }
      if (found === 0) {
        add(
          name,
          'B7',
          'FAIL',
          \`\${variable} 没有任何 \\\`var()\\\` 引用 —— 陈旧豁免（\${where}）\`,
        );
        return false;
      }
    }
  }

  add(
    name,
    'B7',
    'PASS',
    \`\${referenced} 处 var(--apollo-*) 引用全部在 theme 的 tokens.css 里有声明\`,
  );
  return true;
}`;

if (s.split(anchorSelfCheck).length - 1 !== 1) throw new Error('自证锚点未命中');
s = s.replace(anchorSelfCheck, newSelfCheck);

fs.writeFileSync(P, s);
console.log('OK: B7 已加 UPSTREAM_UNDECLARED_TOKEN_VARS');
