# MEMORY.md — 项目长期约定
> 只放仓库文档里没有的。规则本体见 `AGENTS.md` 等 5 份文档。坑全文+索引：`PITFALLS.md`（先看 §0）；**环境与命令**：`environment.md`（跑测试/构建前必读）。

## 事实来源 / 任务 / registry
Vue3+TS 重写 antd（**兼容规格，非代码来源**），目标 **6.6.4**。优先级：用户指令>仓库规范>`registry/*.json`>antd 产物/源码>文档>先验。
- 取任务唯一权威 `node registry/tools/next-task.mjs`（一轮一包）。🚨 禁止凭记忆描述 antd：读 `/tmp/antd-src/package/`（缺了按 PITFALLS 42 恢复）；说「某决策是这样」前先 `ask.mjs decision <id>`（出原文）。
- 派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json←`scaffold-packages.mjs`；`foundation.json`←`foundation-status.mjs`；components/dependencies/tokens/workstreams←`gen-*.mjs`。
- 🚨 跨运行**只保留** `status`+11 维度+`blockers`+`layerNotes` ⇒ 收口直接改 `components.json` 这 13 项再重跑生成器。⚠️ `notes` 不保留 ⇒ 注记写 `registry/source/components.meta.mjs`(220)。

## 架构
`L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list ｜ L0 utils/theme/icons ｜ 测试 test-utils`
- 包边界：消费者≥2 且无视觉语义才独立成包(13 包)；共享代码放 `packages/ui/src/_internal/`。
- ⚠️ **`picker`=引擎+面板**（裁决 `picker-panel-ownership`=B）：面板在本包，`ui` 的 DatePicker/TimePicker/Calendar 只做输入框+浮层+样式⇒它的 L2/L4/L5 是硬门禁；但它**不产 CSS**。
- `prefixCls` 默认 `apollo`；动手前先 grep `packages/utils/src`。🚨 R7(ADR 0004)：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描。Oracle：上游零框架耦合⇒可对拍，否则只读源码。

## 主分支 / 合并 / 共享文件
- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前有 WIP 先 `git stash push -u`。`registry/*.json` 冲突**按冲突块解析**，别 `checkout --ours`；之后重跑生成器。**收口后立刻合 master**。⚠️「绿在本地」≠「绿在仓库」：依赖磁盘产物先 `git ls-files` 确认已入库。
- 多流必碰（按字母序追加）：`packages/ui/src/index.ts`、`style/index.ts`、`tests/visual/matrix.mjs`、`cases/shared.mjs`、`tests/compat/baseline/*.mjs`、`registry/source/open-decisions.mjs`、root `package.json`。新组件另需 compat baseline + `render/cases/{react,vue}/<n>.{jsx,js}` + matrix 一行 + `fixtures/<n>/`(E9)。
- ⚠️ 改 foundation 包（utils/portal/motion/**picker**）后**必须单独重建**(176/249)。视觉层只链接 theme+ui⇒**用例文件**里 import `@apollo-design/icons` 解析不到，用「两侧同构」替身。⚠️ **`test:visual`/`test:types` 都不在 `verify:full`**⇒都要显式跑。

## 收口期判据
- **视觉变体避开静态帧测不到的面**：`:hover`/`cursor`/`transition`/纯属性(`href`/`id`)截图不可见⇒必然空转（归 L1/L4）。🚨 写/改变体后 `md5 tests/visual/baselines/react/<c>/*.png | sort` 查同哈希。
- **L4 的 `it.each` 别用「长度不一致的元组数组」**(TS2345)⇒同形对象数组+`$name`。**`*.test.ts` 也在 `vue-tsc` 内**⇒加完测试重跑 `lint:types`；`arr[0]` 用 `?.`。
- 🚨 **`.vue` 里出现 `typeof SomeComponent` 就查那条 import 有没有被 biome 改成 `import type`**(299)。**语义化槽(`classNames`/`styles`)支持函数形态**⇒prop 类型必须 `[Object, Function]`。
- 📌 **置 `completed` 前三件套**：① `COMPONENT_STYLES` 注册；② `index.ts` 导出(B8)；③ `tests/compat/fixtures/<c>/` 有 fixture(E9)。

## 进度（2026-10-02）
foundation **13/13**；组件 **68/72 completed**。下一条用 `next-task.mjs` 取。
- **timeline**=`Steps` 薄壳（无自有 DOM；`.ts` 渲染函数；样式覆盖 Steps 内部变量）；6 Token 只声明 4 条(B7)。⚠️ 扩展 `steps` 新增两个 context key，🚨 必须由 `Steps` **接住并转发**（同族键「最近的赢」遮蔽外层，256）；`Steps` **主动剥 `attrs.class`**⇒类名用 `className`(309)。
- 🚧 **color-picker 开工中（G0–G3 已落，G4 未开始）**：`interface.ts` / `style/{token,index}.ts` /
  `engine/{interface,color,util}.ts` / `color.ts` / `util.ts` 已入库（commit 1bd30e7），
  L1 25 + L7 21 绿、`lint:types` 0 错、`registry:validate` 19/19。**registry status 仍是 `todo`**。
  🚨 **G4 的硬约束**：本仓 `Slider` **不消费** `sliderInternalContextKey`（`handleRender` 通道
  不存在，改走 `#handle` scoped slot）⇒ 上游 `ColorSlider` 的把手定制照抄会**静默失效**；
  ⚠️ 同族的 `unstableSliderContextKey` **行为相反**（真的被 inject）。详见 PITFALLS 319 与
  `packages/ui/src/color-picker/PLAN.md`。
- ⚠️ 9 组件「completed+`visualStatus: done` 但零入库 L6 基线」（含 select/auto-complete/cascader/popconfirm/float-button/rate/segmented/**steps**/progress）⇒L6 只能 `--mode both`。根因=未决开放决策 **`visual-baseline-in-git`**。
