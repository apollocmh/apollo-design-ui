# Apollo Design UI 全仓增量审计

> 审计日期：2026-10-21（UTC+8）  
> 仓库：[`apollocmh/apollo-design-ui`](https://github.com/apollocmh/apollo-design-ui)  
> 分支：`feature/docs-site-v2`  
> 固定快照 SHA：`c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16`（2026-10-21 00:19 UTC+8）  
> 审计范围：72 个顶层 UI 组件、13 个 foundation 包、文档站、内容构建、demo、CI/视觉/构建/发布。  
> 审计方法：读取 GitHub 当前分支源码、registry、issues、workflows 及文件树；**未在本会话执行本地构建、Vitest、Playwright、L6 真浏览器视觉对拍，亦未修改仓库**。本报告把「源码确定」和「需要动态复核」分开标示。

## 0. 结论摘要

Registry 记录 72/72 顶层组件 completed、13/13 foundation completed。92 个 work item 中 91 done、1 ready（`X:docs-site`），但**登记完成不等于所有公开 API、子组件和运行时交互都完整**。此分支相对 master 领先 24 提交，主要是文档站 Vite + vite-ssg 重构。仓库共有约 7,122 条文件树记录（含大量测试基线和图标生成源）。

本次发现至少 5 类确定性缺口：**文档站缺独立的 Icon 图标目录页；15/72 文档导航主副标题数据不规范；Input.Search/Input.OTP 未实现；Menu popup 始终不可见；Transfer 的 2 个 Vue demo 因缺说明元数据被内容管线排除**。此外，文档 CI 门禁、并发加载、移动端可访问性、CSS 合法性、打包消费侧验证等存在需要及时处理的质量债。

GitHub Issues：当前 56 条 Issues 中 55 closed、1 open，唯一仍开的是 [#22 Menu](https://github.com/apollocmh/apollo-design-ui/issues/22)。不要把 #22 中已修复的子问题（如 RTL、键盘候选、overflow 数据接线）一概算成未修问题。

## 1. 按优先级的证据清单

| ID | 优先级 | 范围 | 证据性质 | 发现与建议 |
|---|---|---|---|---|
| A01 | P0（交付阻断） | UI/Menu | 源码确认 | 非 inline 子菜单打开时，实际 popup 仍硬编码 `visibility:'hidden'`；精确定位未实现。必须连同定位、portal、hover/click/motion 一起修，不能仅改成 visible。|
| A02 | P1 | Docs 内容契约 | 全量 72 项 frontmatter 核对 | 15 个组件将中文名混在 `title`，缺 `subtitle`，使侧栏和总览的文字层级不一致。先改数据，再统一样式，并加自动校验。|
| A03 | P1（范围决策） | UI/Input | 公开导出与文档确认 | `Input.Search`、`Input.OTP` 明确标注 deferred，且未导出。需要决定下一版补齐，或显式发布为部分 AntD 兼容。|
| A04 | P1 | CI/Docs | 流程文件确认 | docs 有单测和 Playwright 冒烟脚本，但当前主 CI 和 Docs Deploy 不运行这些检查；只有文档产物文件存在检查，缺真实交互门禁。|
| A05 | P1 | Docs 路由与 demo | 静态竞争风险，需延迟 Promise 复现 | `ComponentPage`、`GuidePage`、`DemoRenderer` 旧请求可在新请求后 resolve 并覆盖页面状态；需要 request id / generation token 守卫。|
| A06 | P1 | Docs a11y/移动端 | DOM/事件实现确认，行为需浏览器验证 | 移动抽屉无 Escape、焦点圈定/返回和 aria-expanded 等完整契约；搜索弹层亦缺可靠的焦点闭环。|
| A07 | P1/P2 | UI 样式构建 | 源码确认 | Collapse 两处 `transition` 声明中间插入 `!important`，违反 CSS 语法；docs 侧改 `cssMinify:'esbuild'` 绕开 lightningcss 的校验。应修组件 CSS 而非长期绕过。|
| A08 | P2 | Docs/Demo | 文件树+生成器逻辑确认 | 756 个 `.vue` demo，754 个 `.md`；`transfer/table-transfer.vue` 和 `transfer/tree-transfer.vue` 没有配对 `.md`，因而不进组件页。应配元数据或明确归档。|
| A09 | P2 | Docs/i18n | 模板源码确认 | 中文分类名在英文站仍原样展示；部分 aria-label、主题按钮标签写死中文。将类目与界面词条分离。|
| A10 | P2 | Docs/搜索 | 静态失败重试风险 | 搜索索引 Promise 失败后被缓存，`TopBar` `searchIndexReady` 也提前永久置 true；失败后的恢复/重试链路不完整。|
| A11 | P2（发布前验证） | 包消费链路 | 配置风险，尚未证明消费者失败 | 多个包的 `sideEffects:false` 与独立 CSS exports 共存；需要用 Vite/Webpack 生产消费工程验证 CSS 是否被摇树移除，再确定是否标记 CSS sideEffects。|
| A12 | P2（治理） | Registry/Issues | Registry/Issues 查询确认 | 旧 ROADMAP 快照与现状有历史不一致；已关闭大量 Issues，但项目剩余欠账在 `KNOWN-ISSUES` 未一一映射到门禁。建议形成单一新阶段工作台账。|
| A13 | **P1** | **Docs/Icons** | **源码与路由确认** | `@apollo-design/icons` 已生成 **848** 个 Vue 图标（447 Outlined、251 Filled、150 TwoTone），但新版文档站缺独立 Icon 图标展示页、筛选/搜索/点击复制交互及菜单入口。参照 Ant Design 官方 Icon 文档，实现独立资源文档，不计入 72 个顶层 UI 组件。|

### A13：独立 Icon 图标文档页缺失（2026-10-21 补充，P1）

**核实结果：库已实现，文档展示层未实现。**

- [`packages/icons/src/index.ts`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/icons/src/index.ts) 注释确认共 **848** 个 Vue 图标：**447 Outlined、251 Filled、150 TwoTone**，导出 `Icon`、`IconProvider`、`createIcon`、`createFromIconfontCN`、TwoTone 颜色工具及生成图标组件。
- [`packages/icons/README.md`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/icons/README.md) 现有内容是**包的架构/契约说明**，不是供用户发现、搜索、查看、复制图标的可视化文档页。
- [`packages/docs/src/router.ts`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/router.ts) 未定义 Icon 专页；`/components/:name` 是 72 个 UI 组件页的通用动态路由；[`SideNav.vue`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/site/SideNav.vue) 仅遍历 UI 组件分类和指南清单，没有 Icon 入口；文件树中 `packages/docs/src/pages/` 无 Icon 页。
- 参考：[Ant Design Icon 官方中文文档](https://ant.design/components/icon-cn/)：完整图标目录、Outlined/Filled/TwoTone 分类、名称搜索、点击复制代码、使用示例、API 及扩展用法。**参考交互，不复制 React 用法或替换本项目 API。**

**设计方案：**

1. 增加独立 `/components/icon` 固定路由，**必须排在** `/components/:name` 之前；侧边栏“通用”或独立资源区加入 `Icon 图标`，首页/总览提供入口。**这是基础包的独立文档，不将 Registry 的 72/72 改成 73/73**，不为 `packages/ui/src/icon` 伪造组件目录。
2. 做可视化浏览区：全部/Outlined/Filled/TwoTone 切换、大小写不敏感搜索、分组列表（分组元数据需来自真实图标列表/显式维护的分类映射，不能臆造上游分组）、结果数、空结果、响应式网格、鼠标和键盘可操作。
3. 点击图标即复制**可直接运行的 Vue SFC 用法**，例如 `import { SearchOutlined } from '@apollo-design/icons';`，且允许切换“复制名称 / import / 组件标签”。提供可访问的复制成功/失败反馈；注意异步 clipboard 失败可重试或明确提示。
4. 文档说明安装、独立包导入、Outlined/Filled/TwoTone、大小/颜色/旋转、`spin`、TwoTone 调色、`Icon`/`IconProvider`/`createIcon`/`createFromIconfontCN`，代码全部遵循**Vue 3**、项目公开类型和零运行时 AntD 依赖原则。
5. **性能约束**：目录名和分组由构建期轻量 manifest 生成；不得首屏同步实例化或加载 848 个生成组件。使用懒加载与视口增量渲染/虚拟化（实际数据量与性能压测决定策略），搜索与交互不得卡顿；进入首页、普通组件页不应牵引图标目录全量 JS。
6. Docs CI 增加固定路由、图标总数与风格统计、筛选与搜索、复制代码、三态主题、移动端、键盘/a11y、真实浏览器截图、入口不进入 72 UI Registry 的检查；SSG 要产出 `/components/icon.html` 深链接，并检验子路径部署。

**DoD：** 848 个真实图标可找到、可预览、可复制；筛选与搜索结果准确；亮暗主题/移动端/键盘通过；示例 Vue 代码可实际导入，构建没有引入运行时 `@ant-design/*`，文档站导航和深链接可达。

### A01：Menu 的真实运行时缺口

- [`packages/ui/src/menu/SubMenu.ts#L231-L258`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/menu/SubMenu.ts#L231-L258)：open 为 true 时 Teleport 的 popup 是 `position:absolute; visibility:hidden`。
- [`docs/KNOWN-ISSUES.md#L216-L230`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/docs/KNOWN-ISSUES.md#L216-L230)：明确记录精确对齐缺失及历史视觉基线的盲区。
- 对照源码，`Menu.ts` 已对 RTL 使用 `direction.value`，overflow 残项已经传给子菜单；键盘可聚焦计算已处理 `tabindex=-1`。**不要再照旧 Issue 描述重复修这几项。**
- 验收：vertical/horizontal/inline；hover/click；子菜单边缘定位；滚动/容器定位；RTL、键盘箭头/ESC、层级遮挡、禁用项、动态移除/重建及 Tabs/Dropdown 组合。必须在真实浏览器打开 popup 截图验证。

### A02：侧栏主副标题不一致（15 项）

**须整改的 15 个顶层组件：**

`input`、`input-number`、`cascader`、`tree`、`tree-select`、`popconfirm`、`tour`、`form`、`slider`、`segmented`、`pagination`、`tabs`、`table`、`transfer`、`date-picker`。

- [`button/index.zh-CN.md#L1-L5`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/button/index.zh-CN.md#L1-L5)：`title: Button` + `subtitle: 按钮`。
- [`table/index.zh-CN.md#L1-L6`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/table/index.zh-CN.md#L1-L6)：`title: Table 表格`，无 `subtitle`。
- [`SideNav.vue#L20-L33`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/site/SideNav.vue#L20-L33)：直接将 `title`、`subtitle` 映射为 `.zh`、`.en`。此类名命名也不正确：实际 title 是英文技术名，subtitle 是中文名，不应与 `zh/en` 直接绑定。
- [`site.css#L273-L312`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/styles/site.css#L273-L312)：`.site-side-link` 默认 `13.5px`，`.en` 为 `12px` + 次级色；混写 title 的组件无法获得 12px 次级视觉层级。
- [`OverviewPage.vue#L25-L42`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/pages/OverviewPage.vue#L25-L42) 也复用错误元数据。

**建议统一契约：** `title` = 技术组件名（如 `Table`），`subtitle` = 简体中文说明（如 `表格`）；两语种文档可以独立 description，导航默认「技术名 + 中文副标题」或随语言切换一致展示。UI 改为 `.name/.description` 等语义类名，副标题为空时不渲染空 span；active/hover 态主副标题对比度一致。校验器 `content:check` 对 72/72 强制主标题/副标题规范（或显式豁免）。

### A03：没有实现的公开能力

- [`packages/ui/src/input/index.ts#L3-L35`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/input/index.ts#L3-L35) 明确写「Search / OTP 顺延」，输出的子组件是 Input、Group、TextArea、Password。
- [`packages/ui/src/input/index.zh-CN.md#L1-L12`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/input/index.zh-CN.md#L1-L12) 对用户明确告知这个边界。故“72/72 completed”只意味着**72 个顶层目录就位**，并非 Ant Design 所有嵌套 API 完整。
- 建议新阶段补 `Search` 与 `OTP`：先对照 antd 6.6.4 的公开 API、DOM、slots/emits、受控/非受控、搜索回车、loading、分组输入/粘贴、IME、a11y，再加类型/示例/视觉对拍。若非本版承诺，请在兼容性矩阵里一项一项标记 **unsupported**。

### A04：文档站“有测试文件”不等于“有测试门禁”

- [`packages/docs/package.json#L7-L15`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/package.json#L7-L15) 存在 `test`、`typecheck`、`content:check`。
- [`packages/docs/tests/smoke-browser.mjs`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/tests/smoke-browser.mjs) 有 Playwright 首页/组件/搜索/主题/移动端的冒烟验证。
- [主 CI](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/.github/workflows/ci.yml) 不执行 docs 的独立 `test`/`content:check`/Playwright 冒烟；[文档部署](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/.github/workflows/deploy-docs.yml#L42-L75) 主要检查静态产物文件存在。
- 当前该 feature 分支查询不到 Actions runs；不能把未运行的检查说成“已经通过”。合入前补 docs CI，或者至少添加 PR 可触发的 docs job：内容校验、TS、Vitest、SSG build、启动 preview、Playwright 深链接/示例交互/双语/暗色/移动端、异常 console、焦点流程。

### A05/A06：页面并发与可访问性

- [`ComponentPage.vue#L25-L42`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/pages/ComponentPage.vue#L25-L42)、[`GuidePage.vue#L17-L34`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/pages/GuidePage.vue#L17-L34)、[`DemoRenderer.vue#L34-L61`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/demo/DemoRenderer.vue#L34-L61) 全是异步后无 request-id 校验。需用延迟 mock 最小复现“快速切换后仍显示旧页”，测试先红后修。
- [`SiteLayout.vue#L39-L45`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/layouts/SiteLayout.vue#L39-L45) 自绘移动抽屉只有遮罩点击关闭；`TopBar.vue` 第 69 行按钮未体现展开态，`SearchModal.vue` 第 67–115 行搜索 dialog 没有完整焦点捕获/恢复；建议按 WAI-ARIA 可测契约执行键盘浏览器验证。
- [`TopBar.vue#L32-L44`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/site/TopBar.vue#L32-L44) `onMounted` 注册 `window.keydown`，无 `onBeforeUnmount` 对称解绑；可补资源清理测试。

### A07–A11：其他横切质量债

- `transfer` 2 个 orphan demos：[`build-manifest.mjs#L148-L162`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/tooling/content/build-manifest.mjs#L148-L162) 把它们当非阻塞 note；[`demo-audit.test.ts`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/tests/demo-audit.test.ts) 只反向验证显式登记 demo，不验证 `.vue` 全覆盖。为可执行 demo 强制成对，特殊 debug/demo 有显式 ignore manifest。
- [`TopBar.vue#L51-L55`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/site/TopBar.vue#L51-L55)、[`SideNav.vue#L20-L22`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/components/site/SideNav.vue#L20-L22)：站点英文语言模式仍可出现中文分组名/控件 aria 标签。对中英文各跑 DOM 快照，验证 `<html lang>`、导航和按钮名。
- [`search.ts#L26-L45`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/docs/src/composables/search.ts#L26-L45) 缓存一次性 Promise，失败未清空；建议在 `catch/finally` 中恢复可重试状态、保证并发请求复用，模拟动态 chunk 失败。
- [`collapse/style/index.ts#L290-L302`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/src/collapse/style/index.ts#L290-L302)：需修非法 transition important 写法。恢复正常构建 CSS minifier、加 CSS parser 的强校验。
- [`packages/ui/package.json#L1-L17`](https://github.com/apollocmh/apollo-design-ui/blob/c931a8a537a51d9c6a1a0e66c6ee802ddc2f1b16/packages/ui/package.json#L1-L17) `sideEffects:false` 与 `./style.css` 并存。用真实消费者测试 Vite/Webpack 的 bare + deep entry/样式手工导入场景，判断需否 `sideEffects:["**/*.css"]`；现阶段只标风险，不宣称已出错。

## 2. 13 个基础包专项验收

Registry 中 13 包状态均 `completed`：`utils`、`theme`、`icons`、`locale`、`test-utils`、`motion`、`portal`、`position`、`a11y`、`virtual-list`、`form-core`、`picker`、`overlay`。源码包 manifest 中 Ant Design 的 icons-svg/colors/fast-color 已作为 devDependencies，而非普通运行时依赖，这是好的依赖边界。下一轮不能仅凭 Registry 状态说包已经从生产消费者视角完成验收。

按依赖和风险分为四组做专项真实验证：

1. **运行时地基**（utils/theme/icons/locale）：构建产物发布后跨前缀 `apollo/ant`、深浅色 token、主题切换、按需 CSS、图标零运行时 AntD 依赖、tree-shaking。
2. **浮层与行为引擎**（portal/position/overlay/motion/a11y）：定位、滚动容器/viewport overflow、RTL、stack z-index、transition cleanup、焦点/键盘、hydration、unmount 清理；优先支持 Menu 修复。
3. **表单与大数据**（form-core/picker/virtual-list）：原生 Vue 受控、动态 props、异步更新、组合式消费、10k+ 数据性能与无障碍。既有 `KNOWN-ISSUES` 的 Select 动态 slot、Form prefixCls、DatePicker 输入 id 等，应逐条复查，不直接当作已证明当前代码仍未修。
4. **包测试工具**（test-utils）：React/Vue DOM 差异归一化和 L4/L6 判据一致，避免测试把缺陷编入基线。不得只复用旧 pass。

## 3. CI、发布和工程治理

**目前具备的基础**：`test:build` 已有 73 个组件按需体积预算、`preserveModules` 深入口；CI 有 unit/DOM/a11y/类型/coverage/build 与非阻塞视觉流水线；Docs 使用 vite-ssg 预渲染和子路径 base。方向正确，不需要推倒重写。

**下一阶段应补齐的门禁**：

- 文档内容双语结构校验：72 个 title/subtitle、公开 API（含 Input.Search/OTP）状态显式、双语类目、全部 demo 成对、无空演示；另外对独立 Icon 页的目录数量、三风格筛选、文档示例作单独门禁。
- docs app 真浏览器 smoke：70+ 组件路由并非逐个渲染全部 demo；建议至少全量导航路由断言 + 全量首示例加载断言 + 重点复杂组件交互/焦点回归；补 Icon 搜索/过滤/复制、直接访问 `/components/icon` 的深链接与首屏性能验证。
- npm 消费端矩阵：根入口、73 个深入口、CSS per-component，Vite 与 Webpack，精确 bundle size、runtime `@ant-design` 引用、Vue peer 版本。
- Publish preflight：全部包暂为 `0.0.0`；确定版本策略、changeset/版本生成、发布验证、tag、回滚方案。仅 `completed` 不等于 ready-to-publish。
- 视觉 baseline 应当先复审是否编码旧错误（Menu 子菜单即例），关键视觉回归纳入合入阻断，避免“允许失败”。

## 4. 下一阶段的推荐排序与 DoD

| 波次 | 工作主题 | 验收标准（DoD） |
|---|---|---|
| S0：范围冻结/高优先级 | 标记 72 顶层 vs 子 API；复核仅开着的 Issue #22；将本审计项归入任务台账 | 每项有 owner、范围、代码定位、最小失败测试、清楚的优先级与状态；没有把旧问题误报成新问题 |
| S1：用户可见缺陷 | Menu 浮层真正可见与定位；**补 Icon 图标独立文档页**；规范 15 项侧栏主副标题；处理 2 个 orphan demo；确认 Search/OTP 版本计划 | 桌面+移动、亮/暗、中文/英文核心页面通过；Menu popup 真浏览器交互可用；Icon 848 图标可搜索/筛选/复制；72/72 文档字段通过规范检查 |
| S2：架构与体验 | 路由/demo 竞态修复；移动抽屉/搜索 a11y；完整 i18n；补 docs CI；修非法 CSS | 模拟慢网切页不串内容；Tab/Esc 正确，焦点恢复；docs job 通过；无 CSS 解析逃逸配置 |
| S3：包交付与生态 | 13 个 foundation consumer test；UI 深入口、CSS sideEffects 确认；版本发布流程；perf/size 预算 | Vite+Webpack 下真实 npm-style 安装与导入通过，体积/类型/样式/a11y 可验；正式发布可回滚 |

**必须坚持的原则**：对齐 Ant Design 6.6.4 ≠ 将其缺陷照抄；Vue 3 原生 Slots/Emits/$attrs 优先，允许文档化的差异；默认 `apollo`、可切 `ant` 的 prefix/token 规则；runtime 零 Ant Design 依赖；先失败测试、再修复、再视觉与发布产物校验；每个 issue 对应明确源码判据，不能只靠“72/72 绿”关闭。

## 5. 本报告边界

1. 审计依据是上述固定 SHA 的静态仓库快照，不是已部署站点的实际截图。本文明确的「源码确认」意味着缺陷在源码路径中可见；表现仍应结合真正渲染环境复现。
2. 未运行 `pnpm --filter @apollo-design/docs test`、`pnpm verify:full`、Playwright 浏览器或 L6 截图，因此**未声称这些检查通过或失败**。
3. 本报告没有写入 GitHub、创建 Issues、修改代码、关闭旧 issue 或合并分支；可以作为下一阶段专项 Issue 的输入材料。
