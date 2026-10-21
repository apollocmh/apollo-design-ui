# Apollo Design · 文档与交互质量整改 · 最终报告

> 执行日期：2026-10-21
> 分支：`fix/docs-motion-demo-quality`（基线 `master` @ `7eeab161`）
> 输入报告：`docs/audit/Apollo-Design-master-文档与交互质量-综合整改报告-2026-10-21.md`

## 0. 结论

| 阶段 | 状态 | 关键结果 |
|---|---|---|
| 阶段 0 · 复现与基线 | ✅ 完成 | 六类动效真实浏览器矩阵 + 72 组件 Demo 覆盖矩阵 + DOC/I18N 源码证据 |
| 阶段 1 · 动效与交互 | ✅ 完成（`eda548e2`） | Trigger / Notification / Tree / Modal 全部修复；message 同路径；高度过渡补单位 |
| 阶段 2 · 功能 Demo | ✅ 完成 | 758 → 881（本轮补遗后 **989**）demo；可比对覆盖率 71.1% → **92.9%**；场景重合度 67.2% → **83.8%** |
| 阶段 3 · 文档站产品化 | ✅ 完成 | viewport/isolated/inline 三模式；BASE_URL；iframe 安全；SSR 主题；语言同步；布局/卡片/侧栏；内部文字清理 |
| 阶段 4 · 回归与发布 | ✅ 完成 | unit/dom/a11y/theme、L3、L7、docs smoke、功能 probe、文档视觉基线均通过（见 §4） |

## 1. 阶段 0

- `baseline-motion-matrix.md`：MOT-01～06 的期望 / 实际 / 根因 / 证据。
- `demo-coverage-matrix.md`：72 组件 × 上游 1060 demo 文件与场景名对照。
- `stage0-static-findings.md`：DOC-01～12、I18N-01 的源码坐标。
- `tools/stage0-motion-probe.mjs` + `evidence/`：Chromium 采样 JSON、antd 对照、截图。

## 2. 阶段 1（提交 `eda548e2`）

| 问题 | 根因 | 修复 | 回归 |
|---|---|---|---|
| Select / DatePicker / Popconfirm 关闭瞬移 | Trigger 关闭时 `ready=false`，offsetStyle 立刻返回 `-1000vw/-1000vh` | 关闭但已有测量时继续用最后一次 offset（对齐上游 `ready \|\| !open`） | `trigger.test.ts`；浏览器：关闭 `inset:102px/686px` 保持原位 |
| Notification 立即卸载 | MotionList slot 用实时 keys 查不到 removed config；空 placement 立即删组 | 传 `{key, config}` + `motionDeadline:500`；`retainedPlacements` 保留空组到 leave 结束 | `notification/index.test.ts`、`motion-list.test.ts`、s44/s46 |
| Tree 重新展开无 appear | `useMotionStatus.onVisibleChanged` 在 **setup 期**提前回调 `true` | 首帧判断移到 `onMounted`（driver.mount 之后） | `use-motion-status.test.ts`、`tree/index.test.ts`；浏览器 appear + 高度 0→140px |
| 高度过渡只有 opacity | Vue style 对象不补 `px`，标准模式浏览器丢弃无单位长度 | `normalizeMotionStyle()`（React unitless 白名单）在 `useMotionStatus.style` 统一补单位 | 纯函数 + DOM 内联样式用例 |
| Modal zoom 原点固定中心 | 未实现「最近 100ms 点击点」捕获 | document capture click + 100ms 过期 + 挂载/卸载清理 | `modal/index.test.ts`；浏览器 `transform-origin` 等于点击点 |
| message 关闭是异步的 | 复用 notification 内核 | 测试改为等待离场收尾（未放宽断言） | message 全套 |
| locale 固化副本 sha256 在 Windows 误报 | `core.autocrlf=true` 把 LF 改 CRLF | `.gitattributes` 标记 `registry/source/locale-rc/** -text` + 规范化为 LF | `locale/generator.test.ts` |

## 3. 阶段 2（Demo）

**核心组件**

| 组件 | 之前 | 之后 | 覆盖 |
|---|---:|---:|---|
| DatePicker | 2 | 18 | 禁用日期、上下界、时间/12h/步长、presets、受控、format、multiple、cellRender、needConfirm、extraFooter、range time、panelRender、placement、allowEmpty |
| Upload | 3 | 15 | 库 Button 基础、拖拽、照片墙/圆形、maxCount、accept、beforeUpload false/LIST_IGNORE、进度/失败、受控、目录、粘贴、手动上传、列表动作、头像；全部本地 mock / data URL |
| Form | 5 | 15 | Form.List（含嵌套）、useWatch、dependencies、异步校验、initialValues/reset、finishFailed+scroll、set/getFieldsValue、disabled/size、scrollToField、validateTrigger |

**全组件**：另补 23 组组件共 85 个 demo（splitter / cascader / descriptions / skeleton /
input / input-number / button / typography / table / tree-select / tabs / anchor /
list / listy / auto-complete / transfer / float-button / carousel / tree / tooltip 等）。

**同时修复**：`Form.List` 的 scoped slot 改为单对象 `{ fields, operations, meta }`
（位置参数在 Vue 模板里无法拿到 operations）；所有组件 `demo.test.ts` 的 `expectCount`
与实际文件同步；`demo-audit.test.ts` / `manifest.test.ts` 总量更新为 **881**。

**覆盖复算**：`tools/demo-coverage-refresh.mjs` → `evidence/demo-coverage-stage2.json`。

## 4. 阶段 3（文档站）

- **3A 预览模式**：`DemoMeta.preview = { mode: inline | isolated | viewport, viewportHeight, scrollable }`。
  `float-button` / `back-top` 的 fixed 示例使用 **viewport**（320px 独立窗口，视口内滚动），
  不改组件 `position: fixed`。旧 `iframe: true` 兼容为 `isolated`。
- **3B iframe**：`standaloneHref` 用 `BASE_URL`；`DemoFrame` 同时校验 `origin`、`event.source === iframe.contentWindow`、`frameId`、type 白名单、高度范围；iframe `src` 计算不再直接读 `document`（`useResolvedTheme()`）。
- **3C 语言**：`main.ts` 客户端 initSiteLocale；`DemoProvider` 用站点语言驱动
  `ConfigProvider.locale`；`DemoStandalonePage` 消费 `?theme` / `?lang` / `?frameId`。
  实测：`?lang=en-US` 下导航英文、DatePicker 面板 `Oct2026 / Today`。
- **3D 自举**：TopBar / SearchModal / IconPage 的按钮、输入框、下拉改用 `Button` /
  `Input` / `Select`；移动端顶栏隐藏 GitHub 入口，图标数量改为计数标签。
- **3E 布局**：Demo 描述移到画布之后；`.demos-grid` 改为两列独立列流（CSS columns）；
  `--site-content-max: clamp(1096px, 68vw, 1320px)`；侧栏 232 / TOC 184 / gap clamp；
  390px 无横向溢出。
- **3F 文案**：清理公开文档中的 D 编号 / INTENDED / PLATFORM / PITFALLS / Issue 编号；
  Button / FloatButton / Upload 的实现过程文字改为用户语言；component-token 参数说明保留。
- **3G 稳定性**：TOC `withDemoAnchor` 单测、manifest 预览模式断言、iframe 消息单测。

## 5. 阶段 4（验收证据）

| 门禁 | 结果 |
|---|---|
| `pnpm test`（unit + dom-contract + a11y + theme） | **全项目通过**：unit 7147、a11y 1274、theme 890（最终一轮无失败） |
| `pnpm test:types` | **2213 passed / 170 files / no errors** |
| `pnpm lint:types` | 0 errors |
| `node tests/build/run.mjs`（L7） | **151 项 / FAIL 0**（同时修复 Windows `/bin/sh` PATH 门禁缺陷） |
| `pnpm registry:check` | **19 checks passed / 0 warnings** |
| `packages/docs/tests/smoke-browser.mjs` | **36/36**（SSR / demo / 搜索 / 图标 / 移动端） |
| `docs/audit/tools/stage2-demo-probe.mjs` | **全部断言通过**（Upload 库 Button + done、disabledDate、Form.List 增删/提交、异步校验、语言同步、viewport、链接 BASE_URL） |
| `docs/audit/tools/stage0-motion-probe.mjs` | 六类动效时间线：Trigger 原位离场、Notification leave、Tree appear 0→140px、Modal 点击原点 |
| `tools/docs-visual-diff.mjs` | **9 张基线 / 全部 0.000%**（button 明暗、float-button、date-picker、select、modal、upload、form、icon） |

**已知环境限制（非本轮回归）**

- L6 组件视觉基线由 **macOS** 生成（入库 PNG）；Windows 经典滚动条使 `#stage` 从 1440→1425 / 375→360，
  触发 `size-mismatch`。仓库 `PITFALLS` 377 已登记「不要用 Windows 覆盖 mac 基线」。
  本轮以文档站自建视觉基线（同机生成）作为像素门禁，组件 L6 由 CI 的 macOS/Linux 基线环境执行。
- Windows 全仓 `pnpm lint:format` 会把检出 CRLF 报成 3000+ 格式错误；收口使用
  `biome check <改动文件>`（0 error）。CI Linux 跑全量。
- 英文 demo 说明仍有 `## en-US` 缺失时回退中文并显示提示；组件内置文案已随
  `ConfigProvider.locale` 切换。剩余英文正文翻译属于内容翻译批次。
- Demo 仍未追平的高价值缺口（本轮补遗后）：Form 35/44、Table 43/53、
  DatePicker 28/32、Upload 23/24、Input 24/27、Button 20/22（依赖裁剪、拖拽、
  外部 OSS、debug-only 等能力）；逐组件见 `demo-coverage-stage2.json`。

## 6. 提交与发布

| 提交 | 内容 |
|---|---|
| `eda548e2` | 阶段 1：动效与浮层离场修复（MOT-01..06） |
| `d352984f` | 阶段 2：Demo 758→881、覆盖矩阵、a11y 可访问名与计数同步 |
| `ca5859ba` | 阶段 3/4：预览模式、语言同步、布局、视觉基线、L7 门禁修复 |
| `813d1bfe` | Form.List 单对象插槽运行时与类型导出 |
| `9691d36c` | 补遗：Demo 881→989；Menu measure/折叠/嵌套弹层/Tooltip、Overflow `$el`、BaseSelect hover 泄漏修复；文档视觉基线重生成 |
| `chore(memory)` | 记忆交接（根提交，可用 `git log --grep 'chore(memory)'` 定位） |

- 分支：`fix/docs-motion-demo-quality` → `master`（`cc8af285`）。
- 标签：`v0.1.1`（annotated tag `a46ef1c9` → `cc8af285`），触发 CI 与 Deploy Docs。
- **CI `39610059996` 全绿**：lint / types / coverage / registry / L7 / L6 四 shard 均 success。
- **Deploy Docs `39610060088` 全绿**：构建 + 发布 `gh-pages`（`60b26152`）。
- 线上入口：`https://apollocmh.github.io/apollo-design-ui/`（GitHub Pages）。

### 7.4 第二轮发布（`v0.1.2`）

- master `c081508c`（代码 `9691d36c` + 记忆 `c081508c`）；annotated tag `v0.1.2`（`819cd0d2`）。
- **CI `39628929380` 全绿**：lint / L7 / types / coverage / registry 全 success，L6 四 shard 全 success。
- **Deploy Docs `39628929319` 全绿**：gh-pages `a0a4ded3`。
- 线上入口：`https://apollocmh.github.io/apollo-design-ui/`。

## 7. 补遗（2026-10-21 第二轮：Demo 余量 + Menu/选择器交互缺陷）

### 7.1 Demo 补齐

- 总 demo：**881 → 989**（+108），`demo.test.ts` / `a11y.test.ts` / `theme.test.ts`
  的 `expectCount` 全部按实际 glob 结果核对；文档管线总量
  （`demo-audit.test.ts` / `manifest.test.ts`）同步为 **989**。
- 主要增量：Form 15→35、Table 30→43、DatePicker 18→28、Upload 15→23、
  Cascader 14→23、Input 18→24、InputNumber 16→20、Button 17→20、Tabs 15→19、
  Upload/Descriptions/Menu/Pagination 等组件 token / style-class demo。
- 覆盖复算（`demo-coverage-refresh.mjs`）：可比对覆盖率 **92.9%**（985/1060，
  基线组件集口径），场景重合度 **83.8%**；`componentsBelowUpstream` 31。

### 7.2 交互缺陷普查（均为真实浏览器复现后修复，附回归）

| 问题 | 根因（引入点） | 修复 | 回归 |
|---|---|---|---|
| Menu `inline-collapsed`：hover 打开后无法选中、鼠标移开即收起、折叠项弹层不可见 | ① measure 子树的 `SubMenu` / `MenuItemGroup` 直接 `return null`，嵌套子项从未登记 keyPath ⇒ `isSubPathKey` 恒 false、父级 selected 不出现（`b8770f5f` 初版）② 折叠切换时 openKeys 未按 rc 清空/回放（`Menu.js` inlineCacheOpenKeys）③ popup 定位只 `watch(open)`，mode 切换不重算 | ① measure 分支继续渲染 children 并 provide PathTracker（对齐 rc `SubMenu/index.js:273-287`、`MenuItemGroup.js`）② 补 inlineCacheOpenKeys：折叠清空、展开回放 ③ watch `[open, mode]` | `menu/__tests__/index.test.ts`：measure 路径选中、group 选中、折叠/回放、popup 可见、嵌套弹层不误关 |
| 嵌套子菜单（horizontal 三级）：移入三级弹层后父级 100ms 关闭，整条链消失 | 嵌套弹层 Teleport 到 body，父弹层先收到 mouseleave；rc-trigger 的 hover 判定未移植 | Menu context 登记各层 closeTimer；进入后代弹层时取消所有**祖先**计时器（兄弟不互消） | 同上「嵌套弹层」用例 |
| horizontal 菜单整体不可见（高度 1px，所有项 `height:0;position:absolute`） | `Overflow.renderRawItem` 返回的是**组件 VNode**；ref 拿到组件实例后 `instanceof HTMLElement` 恒 false ⇒ 宽度全缺失 ⇒ `calcDisplayCount = -1` 全部判溢出（`b3512d08` 初版） | Overflow 统一 `resolveElement($el)` 后测量（item 与 rest） | `_internal/__tests__/overflow.test.ts` 组件 VNode 回归 |
| 折叠态 Tooltip demo 无 Tooltip | `Menu.tooltip` 只在 interface 声明，Menu props/context/MenuItem 均未实现（README 标注 PENDING） | 实现 antd MenuItem 同款：折叠态包裹 Tooltip（`false` 关闭、title/placement 规则一致） | `menu` demo 浏览器验证 + `tooltip` demo |
| **全站选择器 hover 即弹层**（用户报 Pagination 页大小 Select；同族 Cascader/TreeSelect/AutoComplete） | Trigger 的默认 `action='hover'`（`348b0e37` Tooltip 基建）被 BaseSelect 继承；BaseSelect 的点击开合是 `openOnTriggerClick` 实验开关（`1e600de3`），与 Selector mousedown **双重切换互相抵消** ⇒ TreeSelect/Cascader 点击反而不开 | BaseSelect 两处 Trigger 显式 `action: []`；开合收敛为单一通道（Selector mousedown / raw 触发器 onClick）；删除 `openOnTriggerClick` | `select`/`tree-select`/`cascader` 用例改为真实 mousedown；浏览器复验 hover=0 / click 开 / 再点关 / 外部点击关 |

**普查结论**：弹层按键位的判据按 antd 逐组件核对——`Tooltip`/`Popover` 默认 hover、
`Popconfirm`/`ColorPicker` 默认 click、`Dropdown` 默认 hover（trigger 可配）、
`DatePicker`/`TimePicker` 受控 `showAction=[]` + `hideAction=['click']`、
`Table` 筛选 click、`Menu` 子菜单 hover。受本轮 BaseSelect 缺陷影响的是
**Select / AutoComplete（Select 薄包装）/ TreeSelect / Cascader /
Pagination sizeChanger**；其余组件无此问题。

### 7.3 门禁（本轮实测）

| 门禁 | 结果 |
|---|---|
| `pnpm test` | unit **7261 passed / 3 skipped**；dom-contract **1743**；a11y **1357**；theme **890**（0 failed） |
| `pnpm test:types` | **2213 passed / 170 files / no type errors** |
| `pnpm lint:types` | 0 errors |
| `node tests/build/run.mjs` | **151 项 / FAIL 0**（menu 预算按 Tooltip 依赖重定为 145KB，见 `budget.json` `_note`） |
| `pnpm registry:check` | **19 checks passed / 0 warnings** |
| `packages/docs/tests/smoke-browser.mjs` | **36/36** |
| `docs/audit/tools/stage2-demo-probe.mjs` | 全部断言通过 |
| `tools/docs-visual-diff.mjs` | **9 张基线 / 全部 0.000%**（新增 demo 导致 CSS columns 重排，已肉眼核对后重生成） |
| biome（LF 归一后检查 179 个改动文件） | **0 error / 5 warning**（均为 `noNonNullAssertion` 既有 warn 级） |
