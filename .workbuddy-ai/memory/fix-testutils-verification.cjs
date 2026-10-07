/** 修复 VNA-TESTUTILS-01 的 verification（上一步被 zsh 的反引号命令替换吃掉了）。 */
const fs = require('node:fs');
const path = require('node:path');

const p = path.resolve(__dirname, '../../registry/vue-native-audit.json');
const a = JSON.parse(fs.readFileSync(p, 'utf8'));
const it = a.issues.find((x) => x.id === 'VNA-TESTUTILS-01');
if (!it) throw new Error('issue 缺失');

it.verification = [
  '实测（2026-10-07）：',
  '① 新契约对**真实已迁移组件** Button 调用 rootPropsTest ⇒ 通过；',
  '② 反向哨兵：把注入临时改回旧的 prop 形式 ⇒ 失败，报',
  '   「根[0] 缺少 rootClassName="TEST_ROOT_CLS"，实际 [apollo-btn apollo-btn-default apollo-btn-color-default apollo-btn-variant-outlined]」',
  '   —— 正是「prop 落进 attrs 而不是类名」的预期症状；',
  '③ packages/test-utils/src/__tests__/root-props.test.ts 19/19 通过。',
  '⚠️ 仍未做：让组件**实际采用**该 helper（72 个组件的采用面是另一个决定，本次未改任何组件测试）。',
].join('\n');

if (!it.verification.includes('apollo-btn')) throw new Error('写入校验失败');
fs.writeFileSync(p, `${JSON.stringify(a, null, 2)}\n`);
console.log('verification 已修复，长度:', it.verification.length);
