# COMPONENT-CHECKLIST.md — 组件开工/收口快速清单

> 目的：**提速**。2026-09-21 的数据：一个组件平均一天，其中大量时间耗在
> 「重新踩一个已经踩过的坑」和「手搓样板文件」上。本清单把已付过学费的坑
> 压缩成开工前 3 分钟可过完的形式；完整条目见 `.workbuddy-ai/memory/PITFALLS.md`。
>
> 配套工具（本次新增）：
> - `pnpm gen:component <name>` —— 一键生成 17 个交付物骨架（含逐 Gate 的 PLAN.md）
> - `pnpm verify:component <name>` —— 单组件 scoped 取证（开发期；收口仍以 verify:full 为准）

---

## 一、开工前（G0–G1）

- [ ] 任务来自 `node registry/tools/next-task.mjs`，**不自选**组件
- [ ] 依赖 DAG 全部 completed（`ask.mjs progress` 核对）
- [ ] 凡是要断言「某决策/约定/优先级是这样」→ **先跑 `ask`**，不凭记忆
      （2026-09-21 一天三次凭记忆翻车，三次都写进了仓库文档）
- [ ] 读 PLAN.md 的「开工避坑清单」（脚手架已生成）
- [ ] antd 产物在位：`/tmp/antd-src/package/es/<name>/`；缺则 `pnpm antd:extract`

## 二、实现中（G2–G4）—— 每条都真实翻过车

| # | 坑 | 后果 | 对策 |
|---|---|---|---|
| 1 | **内联 style 的数字必须转 px 字符串** —— Vue `patchStyle` 不做数字→px 转换（React 的 `dangerousStyleValue` 才有） | 值被 jsdom/浏览器**静默丢弃**，L6 全红且极难定位（affix L6 耗时一天的主因） | 样式输出统一走 `px()` / Token 的 `var()`，绝不裸数字 |
| 2 | **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 | 样式作用到所有形态（divider 的 dashed 教训） | 选择器结构从 antd `extractStyle` 真实产物提取，不推演 |
| 3 | **Boolean prop 未传 ≠ false** | 布尔语义静默失效（divider 的 `vertical`） | `withDefaults` 中显式给 `undefined`，判据用 `typeof x === 'boolean'` |
| 4 | **`var(--apollo-*)` 必须在 theme tokens.css 有声明** | 写错不报错、静默失效 | 靠 `test:build` 的 B7 兜底；变量名用 `token2CSSVar()` 生成，不手写 |
| 5 | 字面量 Component Token 与别名派生 Token 的双轨 | 用户主题覆盖失效 | 范本照抄 `divider/style/token.ts` 的注释块 |
| 6 | 漏声明依赖 → `unbuild` 报 `Potential implicit dependencies` | L7 红 | 新 import 即同步 package.json |

## 三、测试中（G5–G8）

- [ ] **vitest 必须从仓库根跑**（`node_modules/.bin/vitest run --project <p>`）；
      在 `packages/<x>/` 下跑不应用根 config，会大面积假失败
- [ ] `*.test-d.ts` 会被 vitest **真执行**：L3 负例必须包在永不调用的闭包里
- [ ] `--coverage` 在沙箱要先 `CODEBUDDY_SAFE_DELETE_ENABLED=0`，否则 9 秒静默失败假成功
- [ ] L5 a11y：axe 扫**全部** demo + 显式 role/键盘断言；
      「架构上不适用」必须写进 layerNotes——**警惕降级运行给的假绿灯**（2026-09-21 实锤过）
- [ ] 单组件快速取证用 `pnpm verify:component <name>`，别为每层跑全仓

## 四、视觉（G9）—— 最贵的环节，先看清单再动手

- [ ] **先建基线，再 compare**；基线建立失败时 compare 的红灯不可信（affix 曾被 3/15 假 compare 误导）
- [ ] demo **显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红（affix 教训）
- [ ] 差异率异常时，排查顺序：实现（尤其坑 #1）→ Token → 平台差异 → 工具；
      不要在实现侧做「碰运气」的实验性修改（affix 曾回退「改量占位层」实验：0.013% → 3.68%）
- [ ] React 参考页的继承字体来自 antd cssinjs 注入的 token 栈——不要在 Vue 侧复刻

## 五、收口（G12–G14）

- [ ] 11 个维度逐个置 done + `layerNotes`（n/a 也要写依据）；**registry 是唯一被承认的进度**
- [ ] 收口跑全仓：`pnpm verify:full`；跑重型门禁前**关 IDE**（实测 16 分钟 → 7'49"）
- [ ] 开发期 typecheck 用 `pnpm typecheck:build`（改 ui：7'49" → 5'10"；无改动 20s）
- [ ] `pnpm build` 会挂起的话，用 `node_modules/.bin/unbuild` 逐包构建（PITFALLS #7）
- [ ] commit message 带 `[COMP:<name>]`，一次提交只做一件事
- [ ] 收口后跑 `node registry/tools/next-task.mjs` 看解锁了谁，**立即生成下一个骨架**：
      `pnpm gen:component <next>`

---

## 提速的真正杠杆（按收益排序）

1. **并行泳道**：`next-task.mjs --parallel` 已能给出当前全部可开工批次（15 条泳道、
   每条 2–3 并发、41 个组件可执行），但实际一直是单人串行。串行时一天 1 个组件；
   每多一条并行泳道，吞吐近似线性增加。小复杂度（S）组件适合填满并行空隙。
2. **脚手架**：省掉每组件 25–30 个样板文件的手搓与改名（估 0.5–1h/组件）。
3. **本清单 + scoped 取证**：省掉「重新踩坑」的数小时级调试与全仓门禁等待。
4. **open decisions 尽快裁决**：7 条开放决策中任何一条被 hardBlock 的组件，
   都会做到最后一步才发现「收不了口」——开工前用 `ask.mjs decisions --open` 过一遍。
