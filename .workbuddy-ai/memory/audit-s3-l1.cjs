/**
 * AUDIT-S3：L1 五个包（motion/portal/position/a11y/virtual-list，43 文件）置 done。
 * 0 条新 issue。幂等；带断言。
 */
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const audit = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const IDS = ['motion', 'portal', 'position', 'a11y', 'virtual-list'];
const EXPECT = { motion: 10, portal: 7, position: 8, a11y: 8, 'virtual-list': 10 };

let total = 0;
for (const id of IDS) {
  const s = audit.sharedSurfaces[id];
  if (!s) throw new Error(`sharedSurfaces.${id} 不存在`);
  if (s.sourceFiles.length !== EXPECT[id]) {
    throw new Error(`${id} 源文件数应为 ${EXPECT[id]}，实为 ${s.sourceFiles.length}`);
  }
  total += s.sourceFiles.length;
}
if (total !== 43) throw new Error(`S3 文件总数应为 43，实为 ${total}`);

const NOTES = {
  motion:
    '2026-10-07 审阅 10/10。0 条缺陷。刻意保留/非缺陷：CSSMotion 的槽 payload 键 `className`/`style` 是 rc 的 render-prop 契约（数据字段，非根别名）；`driver.ts` 的 attach/detach 用元素上的 `__motionListener` 正确配对；`next-frame`/`use-motion-status` 均 onUnmounted 清理；status.ts 的 STEP_ACTIVATED 值为 end 等命名照抄上游。',
  portal:
    '2026-10-07 审阅 7/7。0 条缺陷。useEscKeyDown 的全局 keydown/compositionend 在栈空与 onScopeDispose 两处都摘；useScrollLocker 用 onScopeDispose 移除 CSS；usePortalContainer 的「首次必须 onMounted 而非 immediate」有完整推导（子先于父 ⇒ 嵌套顺序）。',
  position:
    '2026-10-07 审阅 8/8。0 条缺陷（纯几何 + 一次 DOM 测量；measureAlign 用 try/finally 保证 inline style 还原 —— 比上游更严且登记为有意差异）。',
  a11y:
    '2026-10-07 审阅 8/8。0 条缺陷。live-region 的 onMounted/onScopeDispose 配对；focus-restore 的门控与 try/catch 照抄上游；roving/combobox/typeahead 是纯函数（上游无 typeahead，本仓自定并写明理由）。',
  'virtual-list':
    '2026-10-07 审阅 10/10。0 条缺陷。虚拟列表的根 `inheritAttrs:false` + `attrs.class` 并入数组 + `attrs.style` 显式首参 —— 无重复/丢失；useHeights 用微任务 + id 合并并在 onScopeDispose 作废；两处「不做自绘滚动条 / 不做 marginLeft 模拟」是登记的有意差异。',
};

for (const id of IDS) {
  const s = audit.sharedSurfaces[id];
  s.auditStatus = 'done';
  s.reviewedFiles = [...s.sourceFiles];
  s.batch = 'AUDIT-S3';
  s.issueIds = [];
  s.notes = [NOTES[id]];
}

// --- summary ---
let compReviewed = 0;
for (const x of Object.values(audit.components)) compReviewed += (x.reviewedFiles || []).length;
let ssReviewed = 0;
for (const x of Object.values(audit.sharedSurfaces)) ssReviewed += (x.reviewedFiles || []).length;
audit.summary.reviewedProductionSourceFiles = compReviewed + ssReviewed;
if (audit.summary.reviewedProductionSourceFiles !== 885) {
  throw new Error(`reviewedProductionSourceFiles 应为 885，实为 ${audit.summary.reviewedProductionSourceFiles}`);
}
const ssStatus = {};
for (const v of Object.values(audit.sharedSurfaces)) ssStatus[v.auditStatus] = (ssStatus[v.auditStatus] || 0) + 1;
audit.summary.sharedSurfaces = { total: Object.keys(audit.sharedSurfaces).length, ...ssStatus };

// --- batch ---
const S3 = {
  id: 'AUDIT-S3',
  title: 'Shared surface audit — L1 packages (motion / portal / position / a11y / virtual-list)',
  status: 'completed',
  scope: 'packages/{motion,portal,position,a11y,virtual-list}/src (43 production source files)',
  issueIds: [],
  verification: [
    '逐文件读完全部 43 个生产源文件（motion 10 · portal 7 · position 8 · a11y 8 · virtual-list 10）',
    '机械扫描（React 类型/生命周期/any/children/class-alias/defaultProps/props 访问/$attrs/emit/watch-computed/lifecycle）：唯一「class-alias」命中是 motion 的槽 payload 键（数据字段，非根别名）',
    '全仓 addEventListener 缺 removeEventListener 扫描（955 文件）在 L1 五包 0 命中',
    '结论：0 条新增 issue（本批无需改动）',
  ],
};

const i3 = audit.batches.findIndex((b) => b.id === 'AUDIT-S3');
if (i3 >= 0) audit.batches[i3] = S3;
else audit.batches.push(S3);

audit.sessionLog = audit.sessionLog || [];
audit.sessionLog.push({
  date: '2026-10-07',
  status: 'completed',
  note: 'AUDIT-S3 (shared surfaces) COMPLETE: L1 packages motion 10/10, portal 7/7, position 8/8, a11y 8/8, virtual-list 10/10 reviewed — 0 issues. Same profile as utils: every React-shaped carryover is documented (contract source + intentional deviation) and locked by focused tests. Notable justified items: CSSMotion slot payload keys className/style are rc render-prop contract data fields (not root aliases); useEscKeyDown detaches global listeners in both the empty-stack path and onScopeDispose; usePortalContainer uses onMounted (not immediate watch) to keep child-before-parent append order; measureAlign wraps the inline-style rewrite in try/finally (stricter than upstream, registered as intentional).',
});

audit.updatedAt = new Date().toISOString();

fs.writeFileSync(JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
console.log('OK: L1 x5 -> done');
console.log('reviewedProductionSourceFiles =', audit.summary.reviewedProductionSourceFiles);
console.log('sharedSurfaces =', JSON.stringify(audit.summary.sharedSurfaces));
