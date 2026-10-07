/**
 * AUDIT-S2：ui-internal（16）+ ui-public-entry（1）置 done，登记 3 条 issue。
 * 幂等；带断言。
 */
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const audit = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// --- 断言 ---
const ui = audit.sharedSurfaces['ui-internal'];
const entry = audit.sharedSurfaces['ui-public-entry'];
if (!ui || !entry) throw new Error('sharedSurfaces 缺少 ui-internal / ui-public-entry');
if (ui.sourceFiles.length !== 16) throw new Error(`ui-internal 应为 16，实为 ${ui.sourceFiles.length}`);
if (entry.sourceFiles.length !== 1) throw new Error(`ui-public-entry 应为 1，实为 ${entry.sourceFiles.length}`);

// --- issues ---
const newIssues = [
  {
    id: 'VNA-TRIGGER-01',
    surface: 'ui-internal / trigger',
    severity: 'P1',
    status: 'fixed',
    category: 'vue-composition-api',
    systemic: false,
    title: 'Trigger 注册的全局 window resize 监听在卸载时未移除（监听泄漏）',
    files: ['packages/ui/src/_internal/trigger.ts:383（修复前：仅 addEventListener，无 removeEventListener / 无 onBeforeUnmount / 无 onScopeDispose）'],
    currentImplementation:
      'setup 顶层 `if (canUseDom()) window.addEventListener(\'resize\', triggerAlign)`；全文件无任何移除路径。',
    semanticDifference:
      'React/rc-trigger 的 useResizeObserver/useEffect 带 cleanup，卸载即解除。Vue 里只有 `watch` 的 onCleanup 会自动跑；**原生 addEventListener 不会被 Vue 自动清理**，必须显式 removeEventListener。',
    recommendation:
      '在 addEventListener 的同一 `if (canUseDom())` 块内注册 `onBeforeUnmount(() => window.removeEventListener(\'resize\', triggerAlign))`（与兄弟件 overflow.ts 同一惯例）。',
    relatedComponents: ['tooltip', 'dropdown', 'select', 'cascader', 'date-picker', 'tour', 'mentions'],
    tests: ['packages/ui/src/_internal/__tests__/trigger.test.ts（新增「卸载时移除 window resize 监听」用例，含反向哨兵）'],
    verification:
      '修复后 unit 4 文件/36 用例全绿（trigger 7→8）；反向哨兵实测：临时删掉 onBeforeUnmount ⇒ 新用例变红（1 failed | 7 passed），恢复 ⇒ 绿。全仓扫描 955 个生产文件，`addEventListener` 缺 `removeEventListener` 的**仅此一处**。',
  },
  {
    id: 'VNA-ALLOWCLEAR-01',
    surface: 'ui-internal / use-allow-clear',
    severity: 'P3',
    status: 'fixed',
    category: 'react-implementation-migration',
    systemic: false,
    title: 'useAllowClear 里残留一条无副作用的 `void getCurrentInstance();` 死代码',
    files: ['packages/ui/src/_internal/use-allow-clear.ts:54（修复前）'],
    currentImplementation:
      '函数体里 `void getCurrentInstance();` —— `getCurrentInstance()` 无副作用，`void` 丢弃返回值 ⇒ 整条语句是空操作；其 import 也仅为此存在。',
    semanticDifference: '无（纯冗余，疑似从早期「确保 setup 上下文」的尝试残留）。',
    recommendation: '删除该语句与 `getCurrentInstance` 的 import。',
    relatedComponents: [],
    tests: ['既有 consumers（input/select 等的 clear 图标）不受影响 —— 该语句本就无行为'],
    verification:
      '全仓 Grep `void getCurrentInstance\\(\\)` 仅此一处；删除后 biome 该文件 0 诊断（若 import 未删会触发 noUnusedImports）。',
  },
  {
    id: 'VNA-DOC-STALE-01',
    surface: 'ui-internal + ui-public-entry',
    severity: 'P3',
    status: 'fixed',
    category: 'architecture',
    systemic: true,
    title: '两处注释引用了已过期的状态（已删的 KNOWN-ISSUES 登记 / 陈旧进度数字）',
    files: [
      'packages/ui/src/_internal/use-merge-semantic.ts:51-55（称「已登记 docs/KNOWN-ISSUES.md」，但该文件 §1 已于 2026-10-07 清零、登记项转入 §2 留痕）',
      'packages/ui/src/index.ts:9-10（「已落地 1 / 72 个组件」，实际 72/72；且同段又写「这个数字不写在这里」，自相矛盾）',
    ],
    currentImplementation: '注释描述的状态与仓库当前事实不符。',
    semanticDifference: '无（文档准确性）。',
    recommendation:
      '更新注释：use-merge-semantic 改为「schema 档已实现并补齐消费者；无 schema 的宽松路径仍在服务既有消费者」；index.ts 删除手写数字、指向 registry。',
    relatedComponents: [],
    tests: [],
    verification: 'Grep `已登记 .docs/KNOWN-ISSUES` 命中 1（已改）；`1 / 72` 命中 0（已改）。',
  },
];

for (const issue of newIssues) {
  const i = audit.issues.findIndex((x) => x.id === issue.id);
  if (i >= 0) audit.issues[i] = issue;
  else audit.issues.push(issue);
}

// --- surfaces ---
ui.auditStatus = 'done';
ui.reviewedFiles = [...ui.sourceFiles];
ui.batch = 'AUDIT-S2';
ui.issueIds = ['VNA-TRIGGER-01', 'VNA-ALLOWCLEAR-01', 'VNA-DOC-STALE-01'];
ui.notes = [
  '2026-10-07 全量审阅 16/16 生产源文件。3 条 issue（1 P1 + 2 P3），全部 fixed。',
  '已核实为「刻意保真 / 非缺陷」的候选（不计入 issues）：',
  '  - node-renderer 的 VNode 克隆是 Vue 可变 vnode 的必然要求（PLATFORM），非 React 残留。',
  '  - action-button 用 `actionFn.length` 判「是否接受 close 参数」= 上游判据，保留。',
  '  - overflow 根 `{...attrs, class}` 的显式 class 会顶掉 attrs.class 的 spread 副本，但 Vue 的自动 fallthrough 会再并入一次 ⇒ 净效果恰好一次（无缺陷）。',
  '  - responsive-observer / focus / observers 的模块级单例均为上游真实设计。',
  '  - use-merge-semantic 的「无 schema 宽松路径」是有意保留（7 个既有消费者钉住），仅注释过期。',
];

entry.auditStatus = 'done';
entry.reviewedFiles = [...entry.sourceFiles];
entry.batch = 'AUDIT-S2';
entry.issueIds = ['VNA-DOC-STALE-01'];
entry.notes = [
  '2026-10-07 审阅 1/1（1934 行 barrel）。0 条实质缺陷 —— 纯 re-export，React 形状模式扫描 0 命中。',
  '仅修 1 处过期注释（进度数字 1/72）。',
];

// --- summary ---
let compReviewed = 0;
for (const x of Object.values(audit.components)) compReviewed += (x.reviewedFiles || []).length;
let ssReviewed = 0;
for (const x of Object.values(audit.sharedSurfaces)) ssReviewed += (x.reviewedFiles || []).length;
audit.summary.reviewedProductionSourceFiles = compReviewed + ssReviewed;
if (audit.summary.reviewedProductionSourceFiles !== 842) {
  throw new Error(`reviewedProductionSourceFiles 应为 842，实为 ${audit.summary.reviewedProductionSourceFiles}`);
}
const ssStatus = {};
for (const v of Object.values(audit.sharedSurfaces)) ssStatus[v.auditStatus] = (ssStatus[v.auditStatus] || 0) + 1;
audit.summary.sharedSurfaces = { total: Object.keys(audit.sharedSurfaces).length, ...ssStatus };

// --- batch ---
const S2 = {
  id: 'AUDIT-S2',
  title: 'Shared surface audit — ui-internal + ui-public-entry',
  status: 'completed',
  scope: 'packages/ui/src/_internal (16 files) + packages/ui/src/index.ts (1 barrel)',
  issueIds: ['VNA-TRIGGER-01', 'VNA-ALLOWCLEAR-01', 'VNA-DOC-STALE-01'],
  verification: [
    '逐文件读完 16 个 _internal 生产源文件（action-button/app-context/color-composite/node-renderer/overflow/picker-host-context/preset-color/responsive-observer/scroll-to/to-css-size/trigger/use-allow-clear/use-closable/use-merge-semantic/use-merged-mask/use-orientation/with-install）+ 1934 行公开入口',
    'VNA-TRIGGER-01 修复：trigger.ts 增加 onBeforeUnmount 移除 window resize 监听；全仓 955 文件扫描确认这是唯一缺移除处；反向哨兵实测（删修复⇒红，恢复⇒绿）',
    'VNA-ALLOWCLEAR-01 / VNA-DOC-STALE-01 为死代码与过期注释，删除/更正',
    'unit _internal 4 文件/36 用例全绿（trigger 7→8）；改动文件 biome 0 诊断',
  ],
};

const i2 = audit.batches.findIndex((b) => b.id === 'AUDIT-S2');
if (i2 >= 0) audit.batches[i2] = S2;
else audit.batches.push(S2);

audit.sessionLog = audit.sessionLog || [];
audit.sessionLog.push({
  date: '2026-10-07',
  status: 'completed',
  note: 'AUDIT-S2 (shared surfaces) COMPLETE: ui-internal 16/16 + ui-public-entry 1/1 reviewed. 3 issues (1 P1 + 2 P3), all fixed. P1 = VNA-TRIGGER-01: Trigger leaked a global window resize listener (no removeEventListener anywhere; Vue does not auto-clean raw listeners) — fixed with onBeforeUnmount, reverse-sentinel verified, and a 955-file sweep confirmed it was the ONLY file missing a removeEventListener. P3 = dead `void getCurrentInstance()` in use-allow-clear; stale doc comments (removed KNOWN-ISSUES pointer + wrong 1/72 progress in the barrel).',
});

audit.updatedAt = new Date().toISOString();

fs.writeFileSync(JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
console.log('OK: ui-internal + ui-public-entry -> done');
console.log('reviewedProductionSourceFiles =', audit.summary.reviewedProductionSourceFiles);
console.log('sharedSurfaces =', JSON.stringify(audit.summary.sharedSurfaces));
console.log('issues total =', audit.issues.length);
