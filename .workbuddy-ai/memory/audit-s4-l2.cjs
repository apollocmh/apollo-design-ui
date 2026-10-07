/**
 * AUDIT-S4：L2 三个包（overlay 5 / form-core 26 / picker 25 = 56 文件）置 done。
 * 1 条 issue（VNA-FORMCORE-01）。幂等；带断言。
 */
const fs = require('node:fs');
const path = require('node:path');

const JSON_PATH = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const audit = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const EXPECT = { overlay: 5, 'form-core': 26, picker: 25 };
let total = 0;
for (const [id, n] of Object.entries(EXPECT)) {
  const s = audit.sharedSurfaces[id];
  if (!s) throw new Error(`sharedSurfaces.${id} 不存在`);
  if (s.sourceFiles.length !== n)
    throw new Error(`${id} 源文件数应为 ${n}，实为 ${s.sourceFiles.length}`);
  total += s.sourceFiles.length;
}
if (total !== 56) throw new Error(`S4 文件总数应为 56，实为 ${total}`);

// --- issue ---
const issue = {
  id: 'VNA-FORMCORE-01',
  surface: 'form-core / validate-util',
  severity: 'P3',
  status: 'fixed',
  category: 'type-design',
  systemic: false,
  title: 'toSchemaRule 用 `as any` 并声称「无法用更窄的断言表达」—— 实测那条判断是错的',
  files: [
    'packages/form-core/src/validate-util.ts:58-61（修复前：`return rule as any;` + 一条 biome-ignore）',
  ],
  currentImplementation:
    '`RuleObject` → `RuleItem` 的桥接用 `as any`，并配 `biome-ignore lint/suspicious/noExplicitAny`，注释断言「两层规则类型的声明差异无法用更窄的断言表达」。',
  semanticDifference:
    '无（纯类型层）。但 `as any` 违反 AGENTS.md H10 的「禁止 as any」；且它是**全仓生产源码里唯一的一处 `as any`**。',
  recommendation: '改成 `as RuleItem`（实测通过），删除已无必要的 biome-ignore，并更正注释。',
  relatedComponents: [],
  tests: ['既有 form-core 单测（validateRules / schema oracle）覆盖该函数的行为，纯类型改动不影响'],
  verification:
    '实测（2026-10-07）：基线 `vue-tsc --noEmit -p tsconfig.json` exit 0 / 0 输出；把 `as any` 换成 `as RuleItem` 后**仍是 exit 0 / 0 输出** ⇒ 两侧类型在这条路径上确实重叠，TS 允许该断言。反向验证过：删掉 biome-ignore 保留 `as any` 会报 noExplicitAny（说明该 ignore 原本是被使用的）。全仓 `as any` 扫描：修复后为 0。',
};
const ii = audit.issues.findIndex((x) => x.id === issue.id);
if (ii >= 0) audit.issues[ii] = issue;
else audit.issues.push(issue);

// --- surfaces ---
const NOTES = {
  overlay:
    '2026-10-07 审阅 5/5。0 条缺陷。esc-stack 与 use-overlay 的全局监听（keydown/compositionend/pointerdown/mousedown/contextmenu）**全部有配对移除**（全仓 addEventListener 缺移除扫描在 L2 也 0 命中）；onScopeDispose 收尾；`delay` 的「0 同步 vs undefined 下一宏任务」是两个 kind 不合并（上游语义）。',
  'form-core':
    '2026-10-07 审阅 26/26。1 条 issue（VNA-FORMCORE-01，P3，已修）。\n刻意保真/非缺陷：FormStore 保留**显式订阅模型**（store 是普通对象、不是 reactive）—— 这是 H3 要求的 Vue 心智模型重写，非 React 残留；`Values = any` 的泛型默认是**上游公开签名**（收紧会破坏 `useForm()` 的可用性），biome 的 noExplicitAny 确会报它 ⇒ 那些 biome-ignore 都必要（实测去掉 form-types 的文件级 ignore 会报 24 个 error）；`containsNamePath` 的三态返回（null/undefined/false）由 oracle 抓出，不能改成 `!!`。',
  picker:
    '2026-10-07 审阅 25/25。0 条缺陷。picker-panel 的 `triggerChange` 有「先取快照再写」的真 bug 修复记录（L2 抓到）；time-column 用 onBeforeUnmount 清理 rAF 与定时器；纯函数层（date-util / panel / range / time-util / time-units / time-tmpl / keyboard / misc-util / locale-fill / toggle-dates）与上游逐位对拍；组件层落 Dayjs 而非泛型有完整推导（InjectionKey 无法参数化）。',
};

for (const id of Object.keys(EXPECT)) {
  const s = audit.sharedSurfaces[id];
  s.auditStatus = 'done';
  s.reviewedFiles = [...s.sourceFiles];
  s.batch = 'AUDIT-S4';
  s.issueIds = id === 'form-core' ? ['VNA-FORMCORE-01'] : [];
  s.notes = [NOTES[id]];
}

// --- summary ---
let compReviewed = 0;
for (const x of Object.values(audit.components)) compReviewed += (x.reviewedFiles || []).length;
let ssReviewed = 0;
for (const x of Object.values(audit.sharedSurfaces)) ssReviewed += (x.reviewedFiles || []).length;
audit.summary.reviewedProductionSourceFiles = compReviewed + ssReviewed;
if (audit.summary.reviewedProductionSourceFiles !== 941) {
  throw new Error(
    `reviewedProductionSourceFiles 应为 941，实为 ${audit.summary.reviewedProductionSourceFiles}`,
  );
}
const ssStatus = {};
for (const v of Object.values(audit.sharedSurfaces))
  ssStatus[v.auditStatus] = (ssStatus[v.auditStatus] || 0) + 1;
audit.summary.sharedSurfaces = { total: Object.keys(audit.sharedSurfaces).length, ...ssStatus };

const S4 = {
  id: 'AUDIT-S4',
  title: 'Shared surface audit — L2 engines (overlay / form-core / picker)',
  status: 'completed',
  scope: 'packages/{overlay,form-core,picker}/src (56 production source files)',
  issueIds: ['VNA-FORMCORE-01'],
  verification: [
    '逐文件读完全部 56 个生产源文件（overlay 5 · form-core 26 · picker 25）',
    'VNA-FORMCORE-01 修复：`as any` → `as RuleItem`；基线 vue-tsc exit 0，改后仍 exit 0 ⇒ 断言收窄可行；删掉原 biome-ignore',
    '全仓 `as any` 扫描：修复后 0 处；全仓 addEventListener 缺移除扫描在 L2 0 命中',
    '结论：1 条 issue（P3，已修），其余 55 个文件无需改动',
  ],
};
const i4 = audit.batches.findIndex((b) => b.id === 'AUDIT-S4');
if (i4 >= 0) audit.batches[i4] = S4;
else audit.batches.push(S4);

audit.sessionLog = audit.sessionLog || [];
audit.sessionLog.push({
  date: '2026-10-07',
  status: 'completed',
  note: "AUDIT-S4 (shared surfaces) COMPLETE: L2 engines overlay 5/5, form-core 26/26, picker 25/25 reviewed. 1 issue (P3) fixed — VNA-FORMCORE-01: toSchemaRule used `as any` with a biome-ignore claiming a narrower assertion was impossible; measured that `as RuleItem` type-checks (baseline vue-tsc exit 0, after change still exit 0) so the claim was wrong. Also learned (and corrected a wrong inference): a file-level `biome-ignore-all` makes a per-file biome run look clean — form-types.ts has 24 `any`s that ARE flagged by noExplicitAny (removing the ignore-all → 24 errors), so those exemptions are all legitimate. Noted: `Values = any` generic defaults are upstream public signatures (tightening breaks `useForm()`), and `containsNamePath`'s three-state return (null/undefined/false) is oracle-verified.",
});

audit.updatedAt = new Date().toISOString();

fs.writeFileSync(JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
console.log('OK: L2 x3 -> done');
console.log('reviewedProductionSourceFiles =', audit.summary.reviewedProductionSourceFiles);
console.log('sharedSurfaces =', JSON.stringify(audit.summary.sharedSurfaces));
console.log('issues total =', audit.issues.length);
