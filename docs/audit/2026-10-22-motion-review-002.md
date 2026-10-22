# 002 复审整改与验证（2026-10-22）

输入：`docs/issues/002-复审.md`。分析先于实现：
`docs/analysis/motion-review-002.md`。
参考：本地 antd 6.6.4、@rc-component/menu 1.5.0 产物；只提取行为契约。

## 修复

1. `useMotionStatus` 初始快照使用 `getStyleReady()`，需要拦截首次渲染时返回
   字符串 `NONE`。无 appear / 无动画支持的同步渲染契约保留。
2. 首帧拦截后，start 必须等待带 prepare class 的节点提交。驱动增加
   `scheduleRender` 适配点，Vue 使用 `nextTick`，start/active 均拿到真实 DOM。
   每次可见性变更取消旧帧与 deadline；代际标记阻止旧 prepare Promise 和
   已销毁实例的待提交回调推进新状态。
   使用 Vue SSR context 识别预渲染，即便存在 window 也同步输出内容。
3. Inline Menu 新增内部 `InlineSubMenuList`：复用 collapse 高度预设与
   CSSMotion，普通收起保留 hidden 列表；退出 inline / inlineCollapsed 时
   leave 完成后销毁。已经 hidden 的列表切出模式时直接释放。
4. 离场期间后代 context 固定 inline；context 继承保留 getter，运行期配置不会
   因对象展开被冻结。嵌套首次呈现不重复 appear。Menu 初次整体挂载不播 appear，
   对齐 rc-menu 的 mounted 契约，原 DOM 基线不变。
5. 点击、键盘与 inline hover 入口保持原有规则；没有修改 Demo CSS、视觉 Token、
   动效时长或 z-index。

## 浏览器证据

命令（先有 `theme/dist/tokens.css` 和 `ui/dist/index.css`）：

```bash
node packages/docs/tests/motion-review-browser.mjs
```

真实输出：`[motion-review-browser] 60/60 passed`。
脚本自带 Vite 与 Playwright Chromium，在同一浏览器分别挂载 React / Vue；
每 rAF 记录 transform、opacity、height、rect、`--notification-y`，另记录
MutationObserver 插入状态及原生 transitionend / animationend。
完整原始数据：`docs/audit/evidence/review-002-motion.json`。

| 场景 | React | Vue |
|---|---|---|
| Message 新条 y | -56 → 8 | -56 → 8 |
| Message 旧条 y | 8 → 64 | 8 → 64 |
| Notification 旧条 y | 24 → 134 | 24 → 134 |
| Notification 新条 x | 1096 → 1032 | 1096 → 1032 |
| Message 实测高度 | 40 | 40 |
| Notification 实测高度 | 94 | 94 |

旧条存在至少 4 个不同的中间位置，单帧位移小于总位移一半，沿目标方向单调移动；
新条插入时已有 motion class、先透明后显示；结束来自真实 CSS 事件。
这些场景未发现需要进一步修改 NoticeList 的布局根因。

Menu 动态断言覆盖高度 0 → 实测高度 → 自然高度、收起中间帧、hidden 终态、
嵌套、mode / inlineCollapsed 切换后卸载、快速反向及 hover 不改变展开。
该门禁已接入 `.github/workflows/docs-ci.yml`。

## 静态视觉

```bash
node tests/visual/run.mjs --component menu --mode both
node tests/visual/run.mjs --component notification --mode both --no-build
node tests/visual/run.mjs --component message --mode both --no-build
```

Menu / Notification / Message 真实输出各为 `通过 9 / 9`，共 27 项，
每项 `0.000% exact`（同机 React / Vue）。

## 其余验收

环境：Node 22.22.2。以支持的 Node 运行下列命令。

```bash
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme --maxWorkers=2
```

全量实际输出：`Test Files 13 failed | 565 passed (578)`；
`Tests 67 failed | 11215 passed | 3 skipped (11285)`。
该次扫描在修复旧测试的过程中进行，因此记录了修正前的首帧时序断言。
新增 SSR 用例也在本轮把空 data 属性改为显式非空标记，避免把等价的空属性
HTML 序列化形式当成不同内容；仍精确断言完整 SSR HTML。
13 个失败文件全部在后续复验范围内，没有忽略失败或调整阈值：

```bash
pnpm exec vitest run --project unit --project dom-contract --maxWorkers=4 \
  packages/motion packages/ui/src/back-top packages/ui/src/date-picker \
  packages/ui/src/dropdown packages/ui/src/color-picker
```

复验实际输出：`Test Files 37 passed (37)`、`Tests 634 passed (634)`。
按全量日志与 JSON 复验报告逐文件核对，实际输出：
`Recovery audit: 13/13 failed files passed; 0 unresolved; 634/634 tests passed`。
全量运行的 3 条 skipped 均为既有用例，本次没有新增 skip。

`pnpm run lint:types` 实际 exit 0，无 TypeScript 错误。
`pnpm run lint:format` / `pnpm exec biome check .` 实际 exit 0，
0 errors（37 warnings、4 infos）。

`pnpm run test:types` 实际输出：`Test Files 170 passed (170)`、
`Tests 2213 passed (2213)`、`Type Errors no errors`，exit 0。
`node registry/tools/validate-registry.mjs`：`OK (19 checks passed, 0 warnings)`。

`pnpm run test:build` 实际输出：`检查项 151 | FAIL 0 | PENDING 0 | n/a 67`，exit 0。
生产 preview（端口 4477）真实浏览器门禁：`menu-browser.mjs` 为 `28/28 通过`，
`notification-motion-browser.mjs` 为 `21/21 通过`。
输出摘录：`docs/audit/evidence/review-002-validation.txt`。
中断前未结束的测试和构建不计为通过。

## 测试修正说明

`menu/index.test.ts` 原先要求切换 inlineCollapsed 后立即卸载子列表，
与 rc-menu 的 leave 完成后销毁契约不符。现断言先存在 leave 列表，
真实 height 结束事件后列表才移除；未删断言或放宽阈值。
Motion 原有 start 必须拿到真实元素的断言保持；class 透传测试新增 prepare
断言并等待 start 的 DOM patch，不把 prepare 当作已经提交的 start。

TimePicker `s6-issue6.test.ts` 的 13 个面板断言原先同步读取 `mount()` 后的 DOM，
依赖了错误首帧泄漏的裸节点。挂载辅助函数现等待一次 Vue 提交；列数、值、禁用、
选中项和事件载荷断言完全保留。单跑实际输出：`1 passed / 22 passed`。

BackTop 的 React DOM 基线来自 SSR，而原 Vue 测试读取浏览器 mount 首帧。
修复后两侧都用服务端渲染；保留四条原始 DOM 断言和空差异要求，未修改基线。
BackTop 的两个客户端结构用例，以及 DatePicker / ColorPicker / Dropdown 中同步
读取初始 open 浮层的测试，同样补 Vue 提交等待。全部原有行为断言保留。
以 TypeScript AST 对比上述 14 个测试文件与修复前 `HEAD`，真实输出：
`Assertion audit: 14 files, 457 original assertions unchanged`。
可复现命令：`node docs/audit/tools/review-002-assertion-audit.mjs`，固定对照修复前提交
`80876821`；脚本同时断言文件数和断言数，避免空跑。

## 交付边界

所有修复按 BUG 处理，不增加 INTENDED / PLATFORM 豁免，不修改 React 基线。
逐帧证据覆盖本报告列出的确定场景，不代表穷举所有 placement、主题、设备帧率。
用户原有暂存的复审文档保留在工作区，不混入修复提交。

## 分项提交与文件

| 提交 | 内容 |
|---|---|
| `7e1b36ce` | 公共 Motion 状态、DOM 提交与 SSR；消费侧测试时序修正与原断言保留 |
| `d2757d53` | InlineSubMenuList、Menu context / mounted / hover 计时器及完整高度回归 |
| 浏览器证据提交 | Playwright 双侧取证、CI、Registry、本报告与原始采样 |

主要生产文件：`packages/motion/src/{driver,use-motion-status}.ts`、
`packages/ui/src/menu/{InlineSubMenuList,SubMenu,Menu,context}.ts`。
完整文件清单可复现：`git show --stat 7e1b36ce`、`git show --stat d2757d53`。
浏览器入口、fixture 与证据路径已在上文列出。
