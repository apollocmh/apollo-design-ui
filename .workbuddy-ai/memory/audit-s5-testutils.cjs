/**
 * AUDIT-S5：test-utils（14 文件）置 done + 收口（12/12 面）。
 * 2 条 issue（VNA-TESTUTILS-01 open · VNA-DOC-STALE-02 fixed）。幂等；带断言。
 */
const fs = require('node:fs');
const path = require('node:path');

const JSON_PATH = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const audit = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const s = audit.sharedSurfaces['test-utils'];
if (!s) throw new Error('sharedSurfaces.test-utils 不存在');
if (s.sourceFiles.length !== 14)
  throw new Error(`test-utils 应为 14，实为 ${s.sourceFiles.length}`);

const newIssues = [
  {
    id: 'VNA-TESTUTILS-01',
    surface: 'test-utils / root-props-test + COMPONENT-RULES.md',
    severity: 'P2',
    status: 'open',
    category: 'architecture',
    systemic: true,
    title:
      'rootPropsTest 与 COMPONENT-RULES.md §4 仍描述「rootClassName/rootStyle 必须支持」—— 与 Phase 2 后的实际状态冲突',
    files: [
      'COMPONENT-RULES.md:125（`| rootClassName / rootStyle | 必须支持 |`）',
      'packages/test-utils/src/root-props-test.ts:1-240（把 rootClassName/rootStyle 作为 **props** 注入并断言落根）',
      'TESTING.md:212（§7 模块表仍把 rootPropsTest 列为 rootClassName/rootStyle 契约）',
    ],
    currentImplementation:
      '规范文档要求每个组件支持 rootClassName / rootStyle 两个 prop；rootPropsTest 按此契约注入这两个 prop。',
    semanticDifference:
      '**Phase 2（2026-10-06 用户裁决）+ COMPATIBILITY.md §7 已把根别名收敛成原生 class / style**，72/72 组件全部移除了这两个 prop（实测：`packages/ui/src/button/interface.ts` 里 `rootClassName|rootStyle` 零命中）。⇒ 规范文档与 test-utils 描述的是一个**已不存在的契约**。\n后果：① 按 COMPONENT-RULES.md 办事的人会把删掉的 prop 加回来；② rootPropsTest 若真被调用，注入的 `rootClassName`/`rootStyle` 会落进 attrs（不是 class）⇒ 断言必然失败；③ 它目前**零消费者**（全仓 grep 只有自身测试与文档引用）。',
    recommendation:
      '需用户裁决（涉及规范文档 + 公开 API，不擅自改）：\n  A. 把 COMPONENT-RULES.md:125 改成「根 class / style 一律走原生 attrs」并**删除** rootPropsTest（含 TESTING.md §7 与 test-utils 的导出面）；\n  B. 把 COMPONENT-RULES.md:125 改成同上，但**重写** rootPropsTest 为「原生 class / style 落根且不下渗」的契约（保留 API 名，行为换新）；\n  C. 保留现状（不推荐：规范与实现长期分叉，且该 helper 会误导数使用者）。\n推荐 **B**：与 Phase 2 一致、保留 antd 迁移期的 API 名、且能重新获得「类名不下渗」这条有价值的断言。',
    relatedComponents: [],
    tests: [
      'packages/test-utils/src/__tests__/root-props.test.ts（现有实现的自测，改用 B 后需同步改写）',
    ],
    verification:
      '实测：`grep -n "rootClassName\\|rootStyle" packages/ui/src/button/interface.ts` → 0 命中；`grep -rn "rootPropsTest" packages/ui` → 0 命中（仅 test-utils 自身与文档引用）。',
  },
  {
    id: 'VNA-DOC-STALE-02',
    surface: 'test-utils / rtl-test',
    severity: 'P3',
    status: 'fixed',
    category: 'architecture',
    systemic: false,
    title: 'rtl-test.ts 文件头称「我们的 ConfigProvider 尚未实现」—— 早已 completed',
    files: ['packages/test-utils/src/rtl-test.ts:29-30（修复前）'],
    currentImplementation: '注释断言 ConfigProvider 尚未实现。',
    semanticDifference:
      '无（文档准确性）。`config-provider` 是 72 个 completed 组件之一（`ask.mjs progress` 可验）。',
    recommendation: '更正注释：说明「已实现，但依赖方向仍不允许本包 import 它」。',
    relatedComponents: [],
    tests: [],
    verification: '`node registry/tools/ask.mjs progress` 输出含 `✅ config-provider`。',
  },
];

for (const issue of newIssues) {
  const i = audit.issues.findIndex((x) => x.id === issue.id);
  if (i >= 0) audit.issues[i] = issue;
  else audit.issues.push(issue);
}

s.auditStatus = 'done';
s.reviewedFiles = [...s.sourceFiles];
s.batch = 'AUDIT-S5';
s.issueIds = ['VNA-TESTUTILS-01', 'VNA-DOC-STALE-02'];
s.notes = [
  '2026-10-07 审阅 14/14。2 条 issue（1 P2 open + 1 P3 fixed）。',
  '刻意保真/非缺陷：全包「不允许沉默的例外」（所有豁免必须带非空 reason，且未被命中的豁免会让测试失败）；无 sleep（等待只能表达成 flushAll / waitFrames）；mountTest 的观察者泄漏判据用**增量基线**而非绝对值（axe-core 在导入期就 new MutationObserver，绝对值会让每个组件必然失败）—— 均为有理由的设计。',
];

// --- summary ---
let compReviewed = 0;
for (const x of Object.values(audit.components)) compReviewed += (x.reviewedFiles || []).length;
let ssReviewed = 0;
for (const x of Object.values(audit.sharedSurfaces)) ssReviewed += (x.reviewedFiles || []).length;
audit.summary.reviewedProductionSourceFiles = compReviewed + ssReviewed;
if (audit.summary.reviewedProductionSourceFiles !== 955) {
  throw new Error(
    `reviewedProductionSourceFiles 应为 955，实为 ${audit.summary.reviewedProductionSourceFiles}`,
  );
}
const ssStatus = {};
for (const v of Object.values(audit.sharedSurfaces))
  ssStatus[v.auditStatus] = (ssStatus[v.auditStatus] || 0) + 1;
audit.summary.sharedSurfaces = { total: Object.keys(audit.sharedSurfaces).length, ...ssStatus };
if (ssStatus.done !== 12) throw new Error(`12 个共享面应全部 done，实为 ${ssStatus.done}`);

const S5 = {
  id: 'AUDIT-S5',
  title: 'Shared surface audit — test-utils + audit closure',
  status: 'completed',
  scope: 'packages/test-utils/src (14 production source files) + 收口',
  issueIds: ['VNA-TESTUTILS-01', 'VNA-DOC-STALE-02'],
  verification: [
    '逐文件读完 14 个生产源文件（a11y-demo-test/allowance/demo-test/dom-contract/focus-test/index/mount-test/render/root-props-test/rtl-test/theme-test/timing/types/warnings）',
    'VNA-DOC-STALE-02 修复：rtl-test 的「ConfigProvider 尚未实现」注释更正',
    'VNA-TESTUTILS-01 登记为 **open**（需用户裁决：改规范文档 + 处置公开 API，不擅自改）',
    '12/12 共享面全部 done；reviewedProductionSourceFiles 955/955',
  ],
};
const i5 = audit.batches.findIndex((b) => b.id === 'AUDIT-S5');
if (i5 >= 0) audit.batches[i5] = S5;
else audit.batches.push(S5);

audit.sessionLog = audit.sessionLog || [];
audit.sessionLog.push({
  date: '2026-10-07',
  status: 'completed',
  note: 'AUDIT-S5 (shared surfaces) COMPLETE: test-utils 14/14 reviewed. 2 issues. P2 OPEN = VNA-TESTUTILS-01: COMPONENT-RULES.md:125 still requires rootClassName/rootStyle on every component, and rootPropsTest implements that contract by injecting them as PROPS — but Phase 2 + COMPATIBILITY.md §7 moved root aliases to native class/style and all 72 components removed those props (verified: 0 hits in button/interface.ts). rootPropsTest has zero in-repo consumers and would now fail. Needs a user ruling (normative doc + public API). P3 fixed = rtl-test.ts stale "ConfigProvider 尚未实现". ALL 12 SHARED SURFACES DONE; 955/955 production files reviewed.',
});

audit.overallStatus = 'audit-complete';
audit.phase = 'shared-surfaces-complete';
audit.updatedAt = new Date().toISOString();

fs.writeFileSync(JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
console.log('OK: test-utils -> done; 全部 12 面收口');
console.log('reviewedProductionSourceFiles =', audit.summary.reviewedProductionSourceFiles);
console.log('sharedSurfaces =', JSON.stringify(audit.summary.sharedSurfaces));
console.log(
  'issues total =',
  audit.issues.length,
  '| open =',
  audit.issues.filter((x) => x.status === 'open').length,
);
