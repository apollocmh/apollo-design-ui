# Apollo Design 文档站视觉重审与 V3 改造方案

> 日期：2026-10-21；代码基线：`master` @ `8dcaa3d6dfde4ed7edc0dd66d6338bde1a085edb`。  
> 对照：用户此前提供的 Ant Design Button、FloatButton 截图；Ant Design 官方组件文档（2026-10-21 公开页面）；Apollo 仓库源码。  
> **证据限制：**当前环境未能对最新版线上站点重新运行同尺寸浏览器截图。此前截图不保证代表本轮 `master` 刚部署后的外观。下面“已确认”均指当前源码结构事实；尺寸与视觉阈值是**下轮验收建议值**，非已经测得的现网数据。  
> 兼容基线仍为 Ant Design **6.6.4**；官网当前显示的版本可能更新，**外观借鉴不等于同步升级组件 API 兼容目标**。  
> 范围：只做文档站 V3 视觉、交互壳、自举与体验；不重新审计 72 个 UI 组件的功能兼容性，不把已有 MOT 修复重做。

## 1. 核心结论

前次阶段 0–4 主要在功能、动效、Demo 覆盖、部分站点控件和基础布局上起作用，**未触及文档站视觉系统的根部**。主页、顶栏、侧栏、详情页、示例卡片、搜索结果、源码面板、表格等依旧各自管理外观。单纯把原生 `<button>` 替换为 Apollo `<Button>` 不等于站点用 Apollo Design 进行设计。

**V3 目标：**文档站成为使用自身组件与自身主题 Token 的标杆项目，视觉遵循“信息清晰、面积有效、预览优先、行为一致”，对照 Ant Design 的成熟布局，但保留 Apollo 品牌和 Vue 风格。不要直接照搬 ant.design 的 CSS 或 DOM。

## 2. 源码审计：可复核问题矩阵

| 编号 | 优先级 | 已确认源码证据 | 视觉/体验风险 | 必须改什么 |
|---|---|---|---|---|
| V3-01 | P0 | `packages/docs/src/styles/site.css` 独立定义 `--site-brand/bg/text/border/shadow/radius/font` 等；`main.ts` 虽加载 `@apollo-design/theme/tokens.css` | 站点 chrome 与库的主题资产重复，跨亮暗/主题覆盖容易漂移 | 以 `--apollo-*` 为真源；`--site-*` 只保留布局与少数语义别名，令牌通过主题派生，不再手填一套品牌色/面板色 |
| V3-02 | P0 | `.site-main { max-width: calc(var(--site-content-max) + var(--site-sidebar-width) + var(--site-toc-width)) }`，`--site-content-max: clamp(1096px, 68vw, 1320px)` | 即使超宽屏，整体容器也有上限，两边留白偏大；content 限宽策略与 API/Demo 混淆 | 组件页 shell 不用固定总宽上限；正文文本限制行长，Demo/API 分别自适应 |
| V3-03 | P0 | `ComponentPage.vue` 中 `.demos-grid { columns: 2 }`；源码展开导致列重新平衡 | 按列流动，视觉阅读顺序与 DOM/TOC 顺序可能不一致；展开代码后示例位置可跳变 | 替换为稳定布局引擎；保证示例排序、聚焦与锚点在响应式和源码展开时稳定。先以可预测 CSS Grid 兜底，稳定 masonry 需单独验证 |
| V3-04 | P0 | `DemoPreview.vue` 的 DOM 是标题→画布→描述→操作，`.demo-canvas { padding: 28px; border-top: 1px dashed ... }` | 样例不够占主视觉，空白和装饰边界容易形成小卡片拼贴感 | 改为预览优先的统一卡片结构：Canvas→标题/说明→工具栏→源码；按 demo 类型定义尺寸而非统一大 padding |
| V3-05 | P1 | `DemoToolbar.vue` 3 个原生 `<button>`、自制 `.demo-tool-btn`；`DemoSource.vue` tabs 也用原生按钮 | 控件密度、hover/focus/disabled/tooltip 不一致 | 统一使用 Apollo `Button`（text/icon）、`Tooltip` 和已有 `Tabs`/合适 tabs 基元；实现紧凑工具栏 |
| V3-06 | P1 | `ComponentPage.vue` 双列/全宽切换是两个原生按钮，CSS 手工 pill | 与库内 `Segmented` 自成两套视觉 | 使用 Apollo `Segmented`；只提供真正有价值的模式，默认按容器宽度自动布局 |
| V3-07 | P1 | `TopBar.vue` 虽已换 Apollo Button，但继续叠加 `.site-icon-btn`、`.site-search-trigger` 一组“造按钮”CSS；emoji 作为主题图标 | 视觉仍像定制站点，字体与图标在平台间不稳 | 顶栏行动区统一库内按钮与图标（`@apollo-design/icons`），搜索触发保留可见的 `⌘K`；状态与图标规范化 |
| V3-08 | P1 | `SideNav.vue` 结构为普通 nav + RouterLink；`.site-side-link` 左侧边框+背景，中文副标题挤在同一行 | 侧栏信息密度、选中态、二级标签层次不稳定；一行过多信息 | 建立导航语义规范：分组、行高、缩进、名称/翻译层级、计数徽标、active/hover/focus；可使用 `Menu` 但须验证 Vue Router 及 URL 行为，原生链接可保留 |
| V3-09 | P1 | `.site-toc { width:184px }`、普通锚点一列；`TocNav.vue` 依赖 IntersectionObserver | 宽度、层级和当前阅读章节指示弱；长目录密集 | 提升 TOC 层级、边距与 active，确保锚点进场、浏览器返回定位和 scroll spy 稳定 |
| V3-10 | P1 | `markdown.css` 统一文本 14.5px/line-height1.8；API 表格 `display:block; overflow-x:auto` | 正文、API、表格统一套宽度，长 API 行密集且横滚可读性欠佳 | 独立三类宽度策略：prose、demos、api；改善表头/斑马纹/代码字体/类型和默认值，手机横滚有视觉提示 |
| V3-11 | P1 | `HomePage.vue` CTA 是样式自造 `<RouterLink class="home-cta-*">`；`OverviewPage.vue` 是自制 cards/badges | 首页/目录不像同一套设计体系；自举范围小 | CTA 用 Apollo Button 或 Button 风格的 router link；目录卡片使用统一 Token/间距/阴影规则，可保留语义链接和轻量容器 |
| V3-12 | P1 | `SearchModal.vue` 自制 Teleport+对话框+焦点约束；Input/Button 已复用，但 search-item 原生按钮且维护 100+ 行交互/CSS | 一处面板有两套控件样式，键盘/焦点维护成本高 | UI 统一、样式标准化；是否复用 Apollo Modal 要先验证键盘导航、focus trap、SSR，再替换容器，不能牺牲搜索速度与可访问性 |
| V3-13 | P1 | `DemoViewport.vue` 已存在、FloatButton 已用独立 iframe | 功能已修，外观上仍是小型模拟窗口，和普通 Demo 的比例未通盘规范 | 保留真实 viewport 隔离，调整高度、窗口栏/边距与其它 Demo 的视觉统一；禁止用 absolute 偷换 fixed |
| V3-14 | P1 | `docs-visual-diff.mjs` 与自身 9 张 baseline 比；关闭动画；主 CI 的 L6 像素比较非阻塞 | 0% 自比差异可能只是旧页面保持不变，不能证明与 Ant Design 相似 | 建双站同视口视觉基准：导航、Button、FloatButton、Form、DatePicker、Upload、API、暗色、移动端。对照报告与回归报告分开 |
| V3-15 | P2 | `ComponentPage.vue` import、GitHub/antd/README 链接并列，读屏中与正文连成多层 UI | 页面标题下的辅助项争抢注意力 | 结构精简为标题/副标题/用途→引用代码→轻量链接，技术与内部过程从主视觉降级 |
| V3-16 | P2 | `.site-*` 与 `.demo-*` 都大量独立定义 hover/background/font-size | CSS 随版本堆叠，视觉验收缺少规范判据 | 建立文档站 Design Tokens 合约、基元使用清单和静态审计脚本，禁止无理由重复设计库已有交互控件 |

### 审计结论中的边界

- **不要求所有 DOM 都是 Apollo 组件。** `main/section/nav/a/article/pre/table`、Markdown 排版、页面专用响应式布局应保留语义 HTML。按钮/输入/弹窗/标签/分段切换/tooltip/反馈尽量采用 Apollo 组件。
- `site.css` 可继续存在，但是布局规范和 Apollo Token 映射层，不应独立维护另一套基础色值。
- **不要批量替换 Modal/Search/Drawer 等复杂组件而不复测行为。** 已有焦点管理、键盘、SSR、虚拟列表性能不能回退。
- 已修复的组件底层 MOT、Upload Button、Form.List、Demo 数量不在 V3 直接改动范围。

## 3. Ant Design 文档站值得借鉴的要素（视觉对照）

| 维度 | Ant Design 值得借鉴的表现 | Apollo V3 对应目标 |
|---|---|---|
| 屏幕利用 | 三栏固定职责，主体是优先内容，长表格和 Demo 有大面积区域 | Shell 填满桌面主体区域，避免多层居中限宽；正文适度限宽，组件展示区域放宽 |
| 层级 | 清晰的页面标题、用途、何时使用、示例、API、设计 Token | 统一 H1/H2/H3 规格、节间距、标题下辅助信息；减少内部工程文字 |
| 导航 | 站点导航与组件分组层级稳定，当前项明确 | 左侧一级分类、二级组件、名称+本地化说明形成固定密度；移动端仍可找得到 |
| Demo | 预览是主角，标题与说明为次，工具按钮低干扰 | Canvas 先呈现，卡片低视觉噪声，源码按需展开；不同尺寸的 Demo 特殊处理 |
| FloatButton | 浏览器式独立预览，固定元素在容器内浮动 | 沿用当前 iframe 正确语义，统一窗口头部/视口内滚动/留白和标题位置 |
| API | 接近内容参考手册：参数、说明、类型、默认值结构突出 | 表头紧凑且可读，代码高亮与长类型换行，移动端横滚 |
| 工具区 | 操作集中、图标一致、全站可预测 | 统一 Apollo Button/Tooltip/图标库、焦点圈、尺寸、边框与分组 |
| 配色 | 少量品牌色 + 大面积中性色 + 清晰状态色 | 调用 Apollo 主题主色、文本层级、背景层级、边框与圆角 Token；亮暗一致 |

**重要：**不要做 1:1 copy。Ant Design 是成熟产品与交互参照，不是让 Apollo 网站伪装成 Ant 的站点；保留 Apollo 品牌，避免复制版权素材、视觉图标和文案。

## 4. V3 设计规格（建议的可调整验收目标）

### 4.1 三栏与宽度

- 桌面 `>=1200px`：左导航 216–232px、右 TOC 176–200px、中间主体 `minmax(0,1fr)`，左右间距 20–32px；整个 shell **不设 1320px 的总内容宽度封顶**。超宽内容不应被双重限宽。
- 768–1199px：隐藏/抽屉化左导航和右 TOC，仅正文 + 顶部菜单；Demo 自适应单列或双列，取决于最低有效卡片宽度。
- `<768px`：移动单栏，顶部工具优先级递减；无横向溢出，弹层可见。
- **阅读文本**（引入/何时使用/说明段）`max-width: 880–960px`、且不影响大区域铺开；**Demo**和**API 表**占用中间可用宽度；表格列多时局部横向滚动，不挤压全站。
- 宽度阈值：单张普通卡片尽量 ≥420px 才双列；不足时单列；复杂 Form/Table、组合型 Demo 优先 full-span；超宽 2560px 可评估紧凑 Demo 三列，但必须由真截图判定。

### 4.2 建议尺寸档位（待对照实测后调整）

| 对象 | 建议规格 |
|---|---|
| 顶栏 | 高 56–64px，左右内边距 20–28px；导航、搜索、图标垂直居中 |
| 左导航 | 行高 34–38px，分组间隔 16–20px；active 高度与 hover 边界一致 |
| TOC | 标题与项至少 13px；层级清晰，当前项有品牌色和侧边标记 |
| H1 / H2 / H3 | 28–32 / 20–24 / 16–18px；节间距成体系而不是独立写死 |
| Demo gap | 横向 16–24px、纵向 16–24px |
| Demo canvas | 普通 18–24px padding；只有内容需要时才提高到 28px；复杂示例按模板调 |
| Demo title / desc | 14–15px / 12.5–13.5px；描述不抢 Canvas 注意力 |
| Demo action | 统一 24–28px 点击目标视觉大小，实际热区满足无障碍要求，按组间隔 |
| 圆角/边框/状态 | 来源于 Apollo Token；演示区边界比页面 chrome 更轻，暗色同步 |

### 4.3 三类 Demo 预览

- `compact`：Button、Tag、Badge、Avatar 等，普通双列、按内容高度，**禁止统一硬塞 320px 高空白**。
- `interactive`：Select、DatePicker、Tree、Form、Upload 等：必须预留弹层容器空间，按需要更大的 canvas，避免被卡片边界裁剪；长表单支持整行。
- `viewport`：FloatButton/BackTop 等位置依赖视口：使用已存在的 `DemoViewport`、真实 fixed 语义、独立滚动和窗口栏。
- `full`：Table、复杂 Form、布局类组件，跨两列或主动单列，禁止强行缩到 420px。

在 `demo/*.md` frontmatter 或现有 `DemoMeta.preview` 中按现有兼容机制扩充 `size / span / minHeight` 等字段。字段是**展示元数据**而不是在组件内部写特殊样式，给合理默认值，只有特殊 Demo 显式声明。

### 4.4 统一视觉合约

站点色彩、字体、控件高度、焦点、圆角，尽可能直接消费 `@apollo-design/theme` 导出的 Token。推荐只保留：

```css
:root {
  /* 来自真实 Apollo token 产物；改前请核实变量名 */
  --site-fg: var(--apollo-color-text);
  --site-fg-muted: var(--apollo-color-text-secondary);
  --site-accent: var(--apollo-color-primary);
  --site-surface: var(--apollo-color-bg-container);
  /* --site-sidebar-width / --site-toc-width / --site-header-height 等纯布局变量保留 */
}
```

不要使用上面的示例片段代替真实 Token 构建验证；要确保 build 后每个 `var(--apollo-*)` 均存在，并支持 dark、ConfigProvider/主题覆盖。

## 5. 重构建议：文件级任务与先后顺序

### Phase 0 · 真正的视觉基准（不改生产 UI）

**范围：**`docs/audit/visual-v3/`、新的 Playwright 采样脚本与对照报告。  
**执行：**用 1440×900、1920×1080、2560×1440、390×844 在同 DPI、同语言、同主题、同缩放比例下拍 Ant/Apollo 对照；页面 Button、FloatButton、Form、DatePicker、Upload、Table、组件总览、首页、暗色。完整页 + 首屏 + 具体卡片 + API 表格；记录 DOM 宽度、sidebar/content/TOC 占比、卡片边距/行高/卡片数；保留色差、位置差、功能差三类标签。禁止将之前不同尺寸的长图直接做像素评分。

**验收产物：**`V3-BASELINE.md`，有逐页差异注释、指标表与可追溯 screenshot 文件；注明 antd 网站实际版本，API 比较仍按 6.6.4。

### Phase 1 · 统一 Design Tokens + 页面骨架（影响最大的首批）

**修改：**`site.css`、`SiteLayout.vue`、`TopBar.vue`、`SideNav.vue`、`TocNav.vue`、`ComponentPage.vue`。  
**顺序：**先确定 Token 映射与深浅色，再改 full-width shell 和 responsive 三栏，再统一导航尺寸、搜索宽度、辅助控件、内容顶部与标题区域。  
**禁止：**只修改 `--site-content-max` 一个值、继续维护两份硬编码色板、引入新的 CSS 框架。  
**验收：**在四个宽度拍同点截图、布局没有重叠/无横向页面滚动、导航/TOC sticky 跟随、三类内容最大宽度独立；与上一版首屏有清楚可见的整体变化。

### Phase 2 · Demo 系统重做视觉结构（核心）

**修改：**`ComponentPage.vue`、`DemoPreview.vue`、`DemoToolbar.vue`、`DemoSource.vue`、`DemoViewport.vue`、`build-manifest.mjs`、`types/manifest.ts`。  
**顺序：**定义 compact/interactive/viewport/full 画布分类 → 改 Preview 的 DOM 层级 → 工具栏 UI 统一 → 预览高度/留白规则 → 处理浮层 `Teleport`/裁剪/iframe 语义 → 解决 `columns:2` 带来的顺序和位置跳变。  
**布局裁决：**先实现**视觉顺序稳定**的 CSS Grid 版本作为默认；如果确实要求不等高的紧凑 Masonry，可增加有浏览器测试的增强模式，不能因密度牺牲锚点、滚动和键盘顺序。展开单卡源码不得导致已聚焦的其它卡片换列。  
**验收：**Button、Form、DatePicker、FloatButton、Table 5 种典型卡片都能合理展示；Toggle code/reset 不导致跳列；懒加载与 SSR 不退化。

### Phase 3 · 文档站真正自举（不只是替换标签）

**优先文件：**`DemoToolbar.vue`、`ComponentPage.vue`、`DemoSource.vue`、`TopBar.vue`、`SearchModal.vue`、`HomePage.vue`、`OverviewPage.vue`、`IconPage.vue`。  
**库组件使用：**操作按钮→`Button`，图标→`@apollo-design/icons`，搜索输入→`Input`，全宽开关→`Segmented`，帮助/复制提示→`Tooltip`/消息反馈，筛选→`Select`，标签→`Tag`，复杂 Modal/Drawer **复核行为后**再迁移。  
**保留语义 HTML：**导航链接、文档目录、Markdown、原生代码块、响应式布局网格。页面容器不是必须使用 Card；不要为追求自举把设计退化成“到处大卡片”。  
**验收：**统计站点自建交互控件，例外逐项登记理由；所有自举控件 hover/focus/active/disabled/dark 与 Apollo Token 一致，Playwright 跑焦点、键盘、语义 ARIA、SSR。

### Phase 4 · 视觉打磨 + 真实质量门禁

**修改：**`markdown.css`、主页与组件总览局部样式、侧栏 TOC、自动化测试。  
**核验：**同分辨率同滚动位置的 Ant/Apollo 双站对拍；V3 自己的截图回归另行存档；先审 9 个关键页面，扩到代表全部组件类别的 20+ 个页。至少完整覆盖亮暗、移动端、长文字、代码展开、弹层、Form/Table 溢出。将独立 V3 snapshot 检查加入 PR 阻塞；发布前需运行浏览器功能测试，不允许只看 L6 绿色（当前 L6 像素比较非阻塞）。

## 6. 如何量化“这次真的重构了视觉”

下列是**验收阈值建议**，要在 Phase 0 实测后确认；不可事后调宽阈值制造通过。

| 维度 | 建议门槛 |
|---|---|
| 1920/2560 可用宽度 | `.site-main` 占视口绝大部分；Hero/正文除外，不存在早早达到 1320px 的 shell 封顶；布局填充率与 Ant 对照可见接近 |
| 组件示例主内容 | 画布高于说明与按钮的视觉优先级，普通 Demo 不出现无意义大面积固定高度 |
| UI 自举 | 文档 chrome 的常规可点击控件用 Apollo primitives；例外以清单解释，禁止“换 Button 但自写所有 Button 视觉” |
| Token 一致 | 浅色/暗色主要颜色与圆角来源于 Apollo Token；静态扫描与 CSS var 存在性测试通过 |
| 顺序稳定 | 任何 viewport 下，Tab 顺序/阅读顺序与示例源顺序一致；源码展开不换列、不丢焦点、不跳到别的示例 |
| 可读性 | 文字段不超长行、API 表可横滚且清晰、无横向页面溢出 |
| 对照素材 | 有同尺寸 Ant/Apollo 参考图；**禁止**用 Apollo 自身 0% diff 当作与 Ant 等价的证据 |
| 回归 | 关键组件交互与旧 CI 全绿，新增 V3 Playwright 视觉/焦点/响应式测试通过 |

## 7. 必须防范的陷阱

1. 不要为了模仿 antd 全部采用其当前官网样式，而破坏 `6.6.4` 的组件兼容接口。
2. 不要把所有页套同一个 `max-width`、同一种卡片内边距、同一高度：API、Form、Table、FloatButton 需求不同。
3. 不要对 Demo `position: fixed` 做 CSS hack；独立 iframe 是正确基础。
4. 不要让 `columns: 2` 自动平衡造成阅读顺序、锚点或展开后的跳列；不等高布局必须测试。
5. 不要把自定义 hover/背景/字体覆盖到 Apollo Button/Input 上，形成“实际自举但视觉依旧独立”的假改善。
6. 不要把站点的 Font、Theme、搜索/Drawer 交互变成全局样式污染组件示例。
7. 对现有 SearchModal/Drawer 自定义复杂交互，迁移优先级低于视觉系统与预览卡片；迁移之前要跑键盘/focus trap/SSR。
8. 不要为“对齐 Ant”删除组件差异警告、补假的 UI 示例或捏造视觉测试结果。

## 8. DeepSeek / Claude 可直接执行的工作指令

```
任务：Apollo Design 文档站 V3 视觉与架构重构（当前 master）
仓库：apollocmh/apollo-design-ui
分支：从最新 master 拉 feature/docs-site-visual-v3，不直接在 master 大改。

请先阅读：
1. docs/audit/Apollo-Design-master-文档与交互质量-综合整改报告-2026-10-21.md
2. docs/audit/FINAL-REPORT.md
3. 本文件《Apollo Design 文档站视觉重审与 V3 改造方案》
4. packages/docs/src/styles/site.css、markdown.css、layouts/SiteLayout.vue
5. packages/docs/src/pages/ComponentPage.vue、components/demo/{DemoPreview,DemoToolbar,DemoSource,DemoViewport}.vue

核心目标：不是“替换控件标签”，而是让官网基于 @apollo-design/ui + @apollo-design/theme 建立统一视觉体系，布局、导航、卡片、表格与 Ant Design 成熟文档站的密度和秩序接近。
组件 API 目标仍为 Ant Design 6.6.4。不引入新 UI 框架，不改已修好的组件底层动效，不改组件 72/72 边界。

必须严格分五阶段执行，每阶段单独 commit，并给出截图和功能验证：
P0. 同尺寸 Ant/Apollo 基线截图 + 宽度/布局/视觉差异矩阵（不改 UI）
P1. Apollo Token 自举 + full-width shell + 顶/左/右栏统一（先提交让审计看得到大变化）
P2. Demo 画布优先、卡片层级、预览密度、稳定顺序、特殊 Demo 模式
P3. Toolbar/Search/Header/首页等交互控件使用库 primitives，清除重复控件 CSS
P4. Markdown/API 细节与跨分辨率、主题、交互视觉回归、发布门禁

阶段门槛：
- P1 的 1440/1920/2560 首屏及完整页截图，必须与旧站形成明显布局级差异。
- P2 不得继续盲用 CSS columns:2；展开代码不跳列、不丢焦点；FloatButton 依然真实 fixed 隔离。
- P3 交付“站点控件自举清单 + 保留原生元素原因 + Token 引用统计”，不能只说“使用自己的组件库”。
- P4 交付 Ant/Apollo 同尺寸对照，不得拿自己与自己 0% diff 冒充对齐。
- 每阶段跑 typecheck + docs test + docs build + Playwright；最后全量 CI、功能回归、视觉门禁。

本轮先只做 P0 的证据和 P1 的具体改造设计草案，输出待修改文件和可验收的 before/after 指标，不要擅自一次性重写所有组件。
```

## 9. 参考

- 本仓 master：`https://github.com/apollocmh/apollo-design-ui/tree/master/packages/docs`。
- Ant Design 官方 Button：`https://ant.design/components/button/`；FloatButton：`https://ant.design/components/float-button/`；Form：`https://ant.design/components/form/`。
- Ant Design 布局设计参考：`https://github.com/ant-design/ant-design/blob/master/docs/spec/layout.en-US.md`。
