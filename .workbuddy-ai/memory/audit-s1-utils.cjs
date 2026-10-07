/**
 * AUDIT-S1：把共享面 utils 置 done，并同步 summary / batches / sessionLog / observations。
 * 幂等：重复运行结果一致。带断言，命中数不符即抛错。
 */
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const audit = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

// --- 1. 断言目标状态 ---------------------------------------------------------
const surface = audit.sharedSurfaces.utils;
if (!surface) throw new Error('sharedSurfaces.utils 不存在');
const srcFiles = surface.sourceFiles;
if (srcFiles.length !== 43) {
  throw new Error(`utils 源文件数应为 43，实为 ${srcFiles.length}`);
}

// --- 2. 置 done -------------------------------------------------------------
surface.auditStatus = 'done';
surface.reviewedFiles = [...srcFiles];
surface.batch = 'AUDIT-S1';
surface.notes = [
  '2026-10-07 全量审阅 43/43 生产源文件。0 条实质缺陷。',
  '本包是 L0 地基，质量极高：每个 React 形状的残留都带「契约来源 + 有意差异 + 登记项」注释，',
  '并由针对性测试锁定（rc-util-contract.md 逐符号记录取舍）。',
  '已核实为「刻意保真 / 非缺陷」的候选（不计入 issues）：',
  '  1) pickAttrs 白名单是 React 属性名（className/style/htmlFor/tabIndex…），只改写事件名、不改写属性名。',
  '     ⇒ 被 pick-attrs.test.ts:121-124 显式锁定；所有消费点（ColorTrigger/Rate/Tree…）都另行显式合并 attrs.class/style，无实际丢失。',
  '  2) useId 不复刻 rc-util 的 test-id 固定值（对应开放决策 use-id-test-env 的选项 A）。',
  '  3) env.ts 的 isDev 为模块级常量 ⇒ 打包器无法 DCE（换取跨打包器正确性，已在注释登记）。',
  '  4) raf / focus / observers / update-css 用模块级单例，均为上游真实设计，非可优化项。',
  '  5) is-equal 的共享引用判不等、object.set 的 removeIfUndefined 浅拷贝 quirk —— 均与上游一致且有测试。',
];

// --- 3. 重算 summary --------------------------------------------------------
let compReviewed = 0;
for (const x of Object.values(audit.components)) compReviewed += (x.reviewedFiles || []).length;
let ssReviewed = 0;
for (const x of Object.values(audit.sharedSurfaces)) ssReviewed += (x.reviewedFiles || []).length;
audit.summary.reviewedProductionSourceFiles = compReviewed + ssReviewed;
if (audit.summary.reviewedProductionSourceFiles !== 825) {
  throw new Error(`reviewedProductionSourceFiles 应为 825，实为 ${audit.summary.reviewedProductionSourceFiles}`);
}

// --- 4. sharedSurfaces 进度摘要（若有） -------------------------------------
const ssStatus = {};
for (const [k, v] of Object.entries(audit.sharedSurfaces)) {
  ssStatus[v.auditStatus] = (ssStatus[v.auditStatus] || 0) + 1;
}
audit.summary.sharedSurfaces = {
  total: Object.keys(audit.sharedSurfaces).length,
  ...ssStatus,
};

// --- 5. batches -------------------------------------------------------------
const S1 = {
  id: 'AUDIT-S1',
  title: 'Shared surface audit — utils (L0)',
  status: 'completed',
  scope: 'packages/utils/src (43 production source files)',
  issueIds: [],
  verification: [
    '逐文件读完全部 43 个生产源文件（brand/children/color/dev-warning/dom/env/event-name/hooks/index/is/is-equal/key-code/merge-props/object/observers/omit/pick-attrs/pick-attrs-allowlist/raf/ref/throttle/throttle-by-animation-frame/to-list/warning）',
    '两轮机械候选扫描（React 类型/生命周期/any/children-prop/onXxx/class-alias/style-prop；vue-runtime/watch-computed/vnode-factory/slot/emit/renderfn/prop-access/$attrs）：除色相变量 h 与 vnode 判定工具外零命中',
    'pickAttrs 的 React 属性名白名单经 pick-attrs.test.ts:121-124 确认是锁定行为，消费点全部另行合并 attrs.class/style ⇒ 非缺陷',
    '结论：0 条新增 issue（本包无需改动）',
  ],
};
const existingS1 = audit.batches.findIndex((b) => b.id === 'AUDIT-S1');
if (existingS1 >= 0) audit.batches[existingS1] = S1;
else audit.batches.push(S1);

// --- 6. sessionLog / observations ------------------------------------------
audit.sessionLog = audit.sessionLog || [];
audit.sessionLog.push({
  date: '2026-10-07',
  status: 'completed',
  note: 'AUDIT-S1 (shared surfaces) COMPLETE: packages/utils/src 43/43 reviewed, 0 issues. Every React-shaped carryover is documented with contract source + intentional-deviation + registry pointer and locked by focused tests. Rejected candidates (not counted as issues): pickAttrs React attribute-name whitelist (test-locked, all consumers merge attrs.class/style separately); useId not pinning a test id; isDev module-const (no DCE by design); module-level singletons in raf/focus/observers/update-css; is-equal shared-ref and object.set shallow-copy quirks.',
});

audit.observations = audit.observations || [];
if (!audit.observations.some((o) => o.id === 'OBS-PICKATTRS-01')) {
  audit.observations.push({
    id: 'OBS-PICKATTRS-01',
    surface: 'utils / pickAttrs',
    decision: 'keep-react-attribute-names-rewrite-events-only',
    note: 'pickAttrs 的输出把事件键改写成 Vue 规范事件名（onKeyDown→onKeydown），但**不改写属性名**（className 仍输出 className）。在 Vue 里 className 恰好经 el.className 生效，所以功能正常，但这是「依赖 DOM prop 名巧合」而非 Vue-native。属刻意保真（与 rc-util 的 DOM 契约一致），且被 pick-attrs.test.ts 锁定；所有消费点均显式合并 attrs.class/style。若未来 Phase 2 要彻底 Vue 化，可评估同时归一 class/style，但需同步 DOM 契约基线。',
    evidence: [
      'packages/utils/src/pick-attrs.ts:82-102（仅事件名走 toVueEventName）',
      'packages/utils/src/__tests__/pick-attrs.test.ts:121-124（className/tabIndex/style 原样输出，测试锁定）',
      '消费点：color-picker/components/ColorTrigger.vue:146+162+164、rate/Rate.ts:311-314+357、tree/Tree.ts:1347（均另行处理 class）',
    ],
  });
}

// --- 7. updatedAt / phase ---------------------------------------------------
audit.updatedAt = new Date().toISOString();
audit.phase = 'audit-shared-surfaces';

fs.writeFileSync(JSON_PATH, `${JSON.stringify(audit, null, 2)}\n`);
console.log('OK: utils -> done; reviewedProductionSourceFiles =', audit.summary.reviewedProductionSourceFiles);
console.log('sharedSurfaces summary =', JSON.stringify(audit.summary.sharedSurfaces));
