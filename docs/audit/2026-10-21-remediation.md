# 2026-10-21 审计整改台账

> 输入：`docs/audit/apollo_ui_audit_feature_docs_site_v2_2026-10-21.md`
> 分支：`feature/docs-site-v2`
> 本台账只记录**改了什么 / 怎么验证 / 还剩什么**；规范本体仍以
> `AGENTS.md` / `ARCHITECTURE.md` / `COMPATIBILITY.md` / `COMPONENT-RULES.md` 为准。

## 状态总表

| ID | 状态 | 落点 | 验证 |
|---|---|---|---|
| A01 Menu popup 可见性 | ✅ 已在 `7b00b40c` 修复（审计快照早于该提交） | `packages/ui/src/menu/SubMenu.ts` | 现网/单测；审计中的「硬编码 hidden」已不成立 |
| A02 侧栏主副标题 | ✅ 已修 | 15 个 `index.zh-CN.md` / `index.en-US.md`；`SideNav.vue` / `OverviewPage.vue` / `site.css`；`build-manifest.mjs` 新增校验 | `manifest.test.ts` 142 用例全绿 |
| A03 Input.Search / OTP | ✅ 已实现 | `input/Search.ts` / `input/OTP.ts` + style/tests/demos；`COMPATIBILITY.md` §9.5 清零 | Input 家族 116 tests + 类型 6 tests；L4 40 用例；L6 `--mode both` 15/15 exact；docs build |
| A04 Docs CI | ✅ 已修 | 新增 `.github/workflows/docs-ci.yml`；`deploy-docs.yml` 增加内容/类型/单测步骤；两者都先跑 `test:build` 生成 foundation dist；`docs-ci.yml` 增加 Playwright + preview 冒烟 | 本地按同序跑通；浏览器冒烟 36/36 |
| A05 页面并发竞态 | ✅ 已修 | `request-guard.ts` + `ComponentPage` / `GuidePage` / `DemoRenderer` | `request-guard.test.ts` |
| A06 移动抽屉 / 搜索焦点 | ✅ 已修 | `SiteLayout.vue` / `TopBar.vue` / `SearchModal.vue` | `site-chrome.test.ts` / `search.test.ts` |
| A07 Collapse 非法 CSS | ✅ 已修 | `collapse/style/index.ts`；恢复 lightningcss；`theme.test.ts` 加反向断言 | `theme` project 12/12；docs build 通过 |
| A08 Transfer 孤儿 demo | ✅ 已修 | `table-transfer.md` / `tree-transfer.md` | demo 754 → 756；docs tests 全绿 |
| A09 英文站 i18n | ✅ 已修 | `locale.ts` / `SideNav` / `TopBar` / `TocNav` / `HomePage` / `OverviewPage`；搜索索引英文分类；logo 走 `BASE_URL` | `site-chrome.test.ts` / `manifest.test.ts` / 真浏览器冒烟 |
| A10 搜索索引重试 | ✅ 已修 | `search.ts` 失败清缓存；`TopBar` 不再提前置 ready；`SearchModal` 错误态 + 重试 | `search-retry.test.ts` |
| A11 sideEffects 与 CSS | ✅ 已修（Vite + Webpack 消费端） | `ui` / `theme` 的 `sideEffects` 改为 `["**/*.css"]`；新增 `tests/consumer/run.mjs` + `pnpm run verify:consumer` | tarball + Vite/Webpack build：CSS 含 `.apollo-btn` / `.apollo-input-search` / `.apollo-otp`，无 `@ant-design/*` / `@rc-component/*` / react 引用 |
| A12 单一阶段台账 | ✅ 本文件 | `docs/audit/2026-10-21-remediation.md` | — |
| A13 独立 Icon 目录页 | ✅ 已实现 | `IconPage.vue` / `IconTile.vue` / `icon-catalog.ts`；`/components/icon` 固定路由；侧栏/总览入口；`guide/icons.md` | `icon-catalog.test.ts`；SSG `components/icon.html` 已产出；不计入 72 组件 |

## 关键实现说明

### A02 主副标题契约

- `title` = 技术名（不得含中文），`subtitle` = 中文说明；英文文档也有独立英文 subtitle。
- 15 个整改组件：`input`、`input-number`、`cascader`、`tree`、`tree-select`、
  `popconfirm`、`tour`、`form`、`slider`、`segmented`、`pagination`、`tabs`、
  `table`、`transfer`、`date-picker`。
- 内容管线新增硬校验：title 含中文或 subtitle 为空 ⇒ `content:check` 失败。

### A03 Input.Search / Input.OTP

- `packages/ui/src/input/Search.ts`：`Space.Compact` + Input + Button；支持
  `enterButton`（false/true/文本/VNode/组件）、`searchIcon`、`loading`、
  `onSearch(value, e, { source })`、IME 组合态闸门、`v-model:value`、语义槽
  `{root,input,prefix,suffix,clear,count,button}`。
- `packages/ui/src/input/OTP.ts`：分格 Input、`patchValue`（补齐/粘贴/裁剪/formatter）、
  `onInput` 数组 + 全填满 `onChange`、方向键/Backspace 焦点移动、mask/separator、
  受控 `value` / `v-model:value`、Form 状态代理、语义槽 `{root,input,separator}`。
- 导出：`Input.Search` / `Input.OTP` 静态别名 + `InputSearch` / `InputOTP` 具名导出。
- 样式：`input/style/index.ts` 追加 Search/OTP 规则（无新增 Component Token）。
- demo：`input/demo/search.vue|md`、`otp.vue|md`（demo 总数 756 → **758**）。
- 测试：`search-otp.test.ts`（L1/L2）+ `search-otp.test-d.ts`（L3 含负例）；
  Input 家族 unit **114**、theme/a11y/dom **116**、types **6** 全绿。
- L4：`tests/compat/baseline/input.mjs` 新增 Search/OTP 6 个用例，基线扩到 **40** 例；
  唯一允许差异 D136（`enterButton=true` 的 `-icon-only` 类）登记在 `COMPATIBILITY.md` §9.2.1。
- L6：视觉矩阵新增 `search` / `otp` 变体；`--mode both`（同机 React/Vue）下 Input
  共 **15/15 exact**（5 变体 × 3 视口）。既有 9 张 macOS 基线未替换；新增 6 张基线在
  Windows 生成（`#stage` 1425 宽 vs canonical macOS 1440），待 macOS 重生成
  （见 `tests/visual/README.md`「基线生成平台」）。

### A11 tarball + Vite/Webpack 消费端

- `tests/consumer/run.mjs`（`pnpm run verify:consumer`）：
  1. 对 13 个 foundation 包 + ui 执行 `pnpm pack`；
  2. 在临时目录建独立 Vite 工程，用 `file:../tarballs/*.tgz` + `pnpm-workspace.yaml`
     的 `overrides` 安装（pnpm 12 不再读 package.json 的 `pnpm` 字段）；
  3. 同一入口分别跑 `vite build` 与 `webpack build`（`css-loader` + `style-loader`，
     `DefinePlugin` 提供 `import.meta.env`），断言 CSS 含 `.apollo-btn` /
     `.apollo-input-search` / `.apollo-otp`，且产物无 `@ant-design/*` /
     `@rc-component/*` / react 运行时引用。
- 实测：Vite 8 build **1812 modules**、Webpack 5 编译成功，两端断言全部 ✅。

### A13 图标资源页

- 构建期只扫描 `packages/icons/src/icons/*.ts` 文件名 → 848 条清单；不 import 图标组件。
- 页面按 120 个/页懒加载，搜索/风格筛选只读清单；点击复制 import / 名称 / Vue 标签。
- 路由 `/components/icon` 必须排在 `/components/:name` 前；SSG 产出 `components/icon.html`。
- **不修改 Registry 的 72/72**：Icon 是 foundation 包的资源文档，不是第 73 个 UI 组件。

## 本轮验证记录（Windows 11）

| 命令 | 结果 |
|---|---|
| `pnpm --filter @apollo-design/docs run content:check`（等价 `buildManifest`） | ok=true；72 组件 / 758 demo / 7 指南 / 848 图标 |
| `pnpm --filter @apollo-design/docs run typecheck` | 0 错误 |
| `pnpm --filter @apollo-design/docs run test` | 12 files / **142 passed** |
| `pnpm --filter @apollo-design/docs run build` | SSG 成功；`components/icon.html` / `components/button.html` 均存在 |
| `vite preview` + Playwright（`/components/icon`） | 首屏 **120 tiles / 120 SVG**；搜索 `SearchOutlined` → 2 项；Filled → 120 项；点击复制成功；**0 console error / 0 failed request** |
| Input 家族（Search/OTP） | unit **114** / theme+a11y+dom **116** / types **6**；dev server 页面 10 个 demo、0 console error |
| `pnpm run verify:consumer`（tarball + Vite/Webpack） | 13 个 tgz 独立安装；Vite 8 build 1812 modules；Webpack 5 compiled successfully；两端 CSS 含按钮/Search/OTP 类，无 React/antd/rc 运行时引用 |
| `vite preview` + `packages/docs/tests/smoke-browser.mjs` | **36/36 通过**（SSR / 水合 / Search+OTP demo / 语言 / 主题 / 搜索 / 图标目录 / 404 / 移动端抽屉 Esc） |
| `node tests/visual/run.mjs --component input --mode both` | Input **15/15 exact**（同机 React/Vue；既有 9 张 macOS 基线未替换） |
| `node tests/build/run.mjs --no-build` | 151 项 / **FAIL 0** / PENDING 0（B1 为 `--no-build` 跳过） |
| `vitest run --project theme packages/ui/src/collapse/__tests__/theme.test.ts` | 12 passed |
| `vitest run --project unit --project dom-contract packages/ui/src/collapse` | 37 passed |

### 额外修复（真浏览器冒烟发现）

- `TopBar.vue` / `HomePage.vue` 的 `<img src="/logo.svg">` 指向站点根路径，在
  `/apollo-design-ui/` 子路径部署下 404（冒烟脚本的 `failed request` 抓到两次）。
  改为 `${import.meta.env.BASE_URL}logo.svg`；复测 **0 failed request / 0 console error**。

### Windows 兼容性修复（本轮顺带）

审计与仓库原环境以 macOS 为主；本轮在 Windows 上验证时修了三处环境差异：

1. `packages/docs/vitest.config.ts` / `vite.config.ts`：`transformAssetUrls.includeAbsolute: false`
   —— 否则 `/logo.svg` 被编译成 `file:///logo.svg`，`fileURLToPath` 因缺盘符抛错。
2. `packages/ui/build.config.ts`：改用 `node + node_modules/vue-tsc/bin/vue-tsc.js`
   —— 直接执行无扩展名的 `.bin/vue-tsc` 在 Windows 上 ENOENT。
3. `tests/build/run.mjs`：动态 import 用 `pathToFileURL(...).href`
   —— Windows 的 `D:\…` 被 ESM loader 当成 `d:` 协议拒绝。

## 仍未完成 / 需要裁决

| 项 | 说明 |
|---|---|
| L6 input search/otp 基线平台 | 新增 6 张在 Windows 生成（`#stage` 1425 宽）；既有 9 张 macOS 基线未替换。需在 canonical macOS 环境执行 `node tests/visual/run.mjs --mode baseline --component input` 统一重生成（见 `tests/visual/README.md`）。 |
| A12 长期阶段台账 | 本文件是本次审计的整改台账；后续新阶段应继续沿用同一入口 |

> A11 Webpack、Docs Playwright 冒烟、Search/OTP 的 L4/L6 用例均已在 2026-10-21 补齐；
> 仅剩上表的基线平台重生成（非功能缺陷，像素 CI 本就跨平台非阻塞）。

## 回归纪律

- 本次改动全部有测试或构建产物佐证；未放宽任何既有断言。
- Collapse 的旧测试断言的是**非法 CSS**，已改为合法声明并加 `not.toContain('!important,')`
  反向断言（原因写在测试注释里）。
- 未修改 `AGENTS.md`；`registry/components.json` 的 72/72 口径未变。
