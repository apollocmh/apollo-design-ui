# Apollo Design · 文档站与组件交互质量综合审计 / 分阶段整改执行方案

> **交付类型**：供 Claude / DeepSeek / Codex 直接执行的工程整改任务书（不是泛泛建议）  
> **仓库**：https://github.com/apollocmh/apollo-design-ui  
> **审计基线**：`master` @ `7eeab16182f91b76bf0eb3e8ad09aa8688c33f7d`（2026-10-21，连接 GitHub 复核）  
> **组件兼容目标**：Ant Design React **6.6.4**，实现语言 Vue 3.5+，遵循现有 `COMPATIBILITY.md` 及架构裁决  
> **范围**：`packages/docs`、Demo 内容、共享动效层、相关组件/基础设施，以及发布构建与浏览器验收  
> **信息来源**：用户提供的 Ant Design/Apollo Button 和 FloatButton 四张视觉对照；用户对 DatePicker/Upload/Form/Select/Popconfirm/Notification/Tree/Modal 等的现场反馈；master 源码静态检查；上一轮 12 项文档审计。  
> **结论边界**：本报告没有在本轮本地运行网站、Playwright 或 CI。**“源码证实”与“用户观察待复现”严格区分**。不得把脚本存在、历史 CI 全绿等同于这些问题已修复或验证通过。

---

## 0. 一页总览：先做什么、为什么

当前问题不是一处 CSS 可以解决的：

1. **真实交互异常（P0）**：用户反馈 Select、DatePicker/Picker 的弹层、Popconfirm、Notification 以及 Tree 节点收起等大量离场动画不符合预期，Modal 入场也有明显差距。源码上这些组件共享 `@apollo-design/motion` 或 Trigger / MotionList 等路径，首先需要真实浏览器复现、判定共性根因；**不能只在官网演示区补过渡样式**。
2. **Demo 覆盖严重缺失（P1）**：master 中 DatePicker 只有 **2** 个 `.vue` Demo、Upload **3** 个、Form **5** 个，和组件实际 API 范围明显不匹配；需要按上游实际公开场景建立映射并实现功能性示例。**不允许做静态假演示。**
3. **已有 Demo 质量问题（P1）**：Upload `basic.vue` 使用原生 `<button class="demo-upload-btn">`，没有组件库 `Button`，而且对该类名未见组件内样式，直接导致基础上传按钮缺少预期视觉样式的合理解释。验证后把示例改为库内 Button，而非向全局补临时选择器。
4. **文档演示基础设施（P1）**：FloatButton 固定定位脱离卡片；现有 `DemoFrame` 仅验证 message `origin` 而没有验证窗口来源；“新窗口打开” URL 忽略 GitHub Pages base；iframe 主题参数没有完成消费；普通 Demo、视口 Demo、弹层 Demo 缺少明确约束。
5. **文档站体验（P1/P2）**：页面有效内容宽度、卡片顺序和信息密度与 Ant Design 差异大；站点顶栏/搜索/图标页等交互大量自行写原生元素，未系统使用自己的 UI 库；文档语言切换只更换文字/页面文档，不会自动给 Demo 的写死文案、组件内置语言提供一致的语言状态；公开文档掺入“Dxx / 内部实现裁决”。

### 推荐的唯一执行顺序

**阶段 0：复现与基线锁定 → 阶段 1：共享动效与交互修复 → 阶段 2：功能性 Demo 补齐 → 阶段 3：文档框架、国际化、自举统一 → 阶段 4：全站回归、视觉门禁、发布验收。**

可并行：不触及共享 motion 的 Demo 内容清单/文案盘点，可与阶段 1 并行调研；**代码合并遵循依赖顺序**。每阶段有单独的可关闭条件。

---

## 1. 事实分级与 P0/P1/P2 台账

证据级别：`S` = master 源码可直接确认；`U` = 用户真实观察，需要浏览器复现及视频证据；`H` = 假说，仅用于安排排查，不能直接视为根因。

| ID | 级别 | 优先级 | 问题 | 关键证据与结论 |
|---|---|---|---|---|
| MOT-01 | U / S | **P0** | Select 下拉选单离场动画异常 | 用户观察；`Select.ts` 使用 `${rootPrefixCls}-slide-up` 与弹层引擎，追踪 Trigger → CSSMotion → CSS |
| MOT-02 | U / S | **P0** | DatePicker / RangePicker 浮层离场动画异常 | 用户观察；`DatePicker.vue` 向 Trigger 传 `popupMotion`，`motionDeadline:1000` |
| MOT-03 | U | **P0** | Popconfirm/Popover/Tooltip 类浮层离场异常 | 用户观察；需确认共享 Trigger 链路，分别验证 hover/click/outside/Esc |
| MOT-04 | U / S | **P0** | Notification 关闭/超时离场异常 | 用户观察；`NoticeList.ts` 基于 `MotionList`，不同于 Trigger，需单独核对 |
| MOT-05 | U / S | **P0** | Tree 节点收起动效异常 | 用户观察；`MotionTreeNode.ts` 已有历史收起修复说明，不能盲目重做；验证是否回归 |
| MOT-06 | U / S | **P0** | Modal 入场动画和 antd 有明显差距 | 用户观察；`Modal.ts` / `Dialog.ts` / `Content.ts` / `Mask.ts`，含 `apollo-zoom` / `apollo-fade` 与 transform-origin |
| DOC-01 | S | P1 | FloatButton 没有独立视口 | 原生 fixed 定位；通用 Demo 内联渲染 |
| DOC-02 | S | P1 | “新窗口打开”链接忽略 `BASE_URL` | `DemoPreview.vue` 生成 `/components/.../demo/...` |
| DOC-03 | S | P1 | 多 iframe 消息混收风险 | `DemoFrame.vue` 只比对 `e.origin`，没校验 `e.source` |
| DOC-04 | S | P1 | iframe SSR/主题/语言同步不完整 | `DemoFrame.vue` 在计算 `src` 时读取 `document`；`DemoStandalonePage.vue` 未消费 `theme` query |
| DOC-05 | S | P1 | 官网交互控件没有系统性复用 `@apollo-design/ui` | `TopBar.vue`、`SearchModal.vue`、`IconPage.vue` 等仍使用原生按钮、input、select |
| DOC-06 | S | P1 | 公开文档混入工程过程与决策文字 | `button/index.zh-CN.md`、`float-button/index.zh-CN.md` 中存在内部差异编号/裁决等 |
| DOC-07 | S / U | P2 | Demo 卡片层级、顺序不符合参考体验 | `DemoPreview.vue` 当前“标题、描述 → 画布 → 工具栏” |
| DOC-08 | S / U | P2 | 双列布局空白较多，缺少独立列流 | `ComponentPage.vue` 普通二维 CSS Grid 按行形成高低差 |
| DOC-09 | S | P2 | 侧栏副标题语义不统一 | SideNav 组件项是 subtitle，Icon 资源项同位置是数量 |
| DOC-10 | S | P1 | 截图留档但缺少视觉回归门禁 | `smoke-browser.mjs` 仅 `screenshot`，没截图 diff/阈值 |
| DOC-11 | S | P1 | 演示场景没有对 fixed/portal 建模 | 通用 `.demo-preview { overflow:hidden }`，不等价于模拟窗口 |
| DOC-12 | S / U | P2 | 页面有效空间利用率低、公开信息密度不合理 | `site.css` 的三栏 max 约束、组件头多种开发链接；须在真实宽度下测量 |
| DEMO-01 | S | **P1** | DatePicker Demo 不足 | `packages/ui/src/date-picker/demo/` 仅 `basic.vue`、`range-picker.vue` |
| DEMO-02 | S | **P1** | Upload Demo 不足且基础按钮样式丢失 | `upload/demo/` 3 例；`basic.vue` 自定义裸 button；文档写明样式由使用方 reset 决定 |
| DEMO-03 | S | **P1** | Form Demo 缺失严重 | `form/demo/` 5 例，动态列表/异步校验/字段联动等没有成套公开 Demo |
| DEMO-04 | U / S | P1 | 更多组件覆盖/质量需按能力矩阵审计 | `demo-audit.test.ts` 固定断言总数 758，只验证文件等，不代表功能覆盖或动效质量 |
| I18N-01 | U / S | **P1** | 切换中文/英文后 Demo 文案及组件语言不同步 | 文档 `useSiteLocale` 仅供站点使用；`DemoProvider` 不接收当前语言；示例大量静态英文字符串 |

> **禁止误诊**：离场动画“看起来没有”，可能是 motion 状态机/事件、CSS 缺失、组件提前 unmount、Overlay/Portal 生命周期、DOM 引用或示例挂载容器干扰。查明之前不要改一堆 duration/opacity 假装修好了。

---

## 2. 阶段 0：锁定基线，建立问题复现矩阵（必须先执行）

**目的**：把用户观察转换成可复现证据，定位**共享层 / 组件层 / 文档容器层**，避免错误修复方向。

### 0.1 分支、规则与环境

1. 从 `master` 最新 commit 新建开发分支，例如 `fix/docs-motion-demo-quality`。**不要直接修改 master；不要从历史 feature 分支开始。**在产物第一段输出 `git rev-parse HEAD`，确认基线；若当前 master 已变化，先重新核对差异。
2. 阅读 `AGENTS.md`、`CLAUDE.md`、`ARCHITECTURE.md`、`COMPATIBILITY.md`、`COMPONENT-RULES.md`、`TESTING.md`、`WORKFLOW.md`、`registry/`，以及相关组件 `README.md` / `PLAN.md`。对已裁决的平台差异不“纠错式”推翻；遇到真实行为差异，优先写复现测试。
3. 环境按仓库实际 scripts 使用 `pnpm`。先检查 `package.json` / `packages/docs/package.json` 的 scripts，安装、构建组件发布 CSS 并启动 docs。禁止未经检查直接抄写过时脚本名。保证 `packages/ui/dist/index.css` 已存在且与当前源码一致（docs Vite alias 指向 dist CSS、源码 TS）。
4. 准备 **Ant Design 6.6.4 对照环境**（不是简单相信当前 ant.design 网站永远与此版本相同），对同一功能、相同浏览器尺寸和动效设置比较。不要混用 antd v5/v6 文档结果。

### 0.2 录制动画对比证据

每个组件至少测 4 个状态：**初始隐藏、展开/入场、关闭/离场、再次展开**。浏览器录屏同时留组件节点存在性、class、computedStyle（`animationName`、`transitionDuration`、`opacity`、`transform`、`display`）、事件时间线。

| 组件 | 操作与需要观察的结果 | 特别分支 |
|---|---|---|
| Select | 打开 → 单选 → 关闭；打开 → 点外部；开闭快速交替 | 多选、键盘 Esc、dropdown 的 Portal 是否还在直到动画结束 |
| DatePicker | 打开 → 选日期 → 面板关闭；点外部关闭 | RangePicker、带时间选择、禁用日期、面板换月、placement |
| Popconfirm | 点击触发 → 取消/确认关闭 | hover/click、异步确认、触发目标卸载、外部点击 |
| Notification | 出现 → 点击关闭；出现 → 自动超时 | 多条叠放、快速追加移除、不同 placement、关闭后回调 |
| Tree | 连续展开收起同一父节点 | 虚拟列表开/关、动画期间再次点击、收起后还能再次展开 |
| Modal | 打开 → 关闭 → 再打开 | mask 与 panel 同步、transform-origin、鼠标点击位置、destroyOnHidden、afterClose |

**判定关键**：在相同组件的**最小 Playground 页面**与**docs Demo**各测一次。如果 Playground 正常而 docs 不正常，优先排查 Demo 容器与样式；若两者都失败，优先修 runtime / motion。

### 0.3 阶段交付

输出 `baseline-motion-matrix.md`（可以放入仓库审计目录）：每条记录复现步骤、期望、实际、截图/视频位置、初步归因、状态（已复现/未复现/环境特有）；**不允许直接全部标记为“组件 bug”**。明确能复现的 P0 项，随后进入阶段 1。

**阶段通过条件**：6 类动效各有真实浏览器结果；可回答“共享 motion 或具体组件/文档容器哪一层有问题”。

---

## 3. 阶段 1：修复共享动效、Modal 与关键交互（最高优先级）

**原则**：从共性路径下手，每修一个共性点立刻复测全部下游；**不更改组件公开 API，不通过文档 CSS 覆写组件状态，不用 setTimeout 硬删节点**。

### 1A. 先检查共享 Motion 驱动，而不是逐个组件补 keyframes

**代码入口**：

- `packages/motion/src/css-motion.ts`：DOM ref 注入、motion slot vnode、`visible`、`removeOnLeave`、`onVisibleChanged`。
- `packages/motion/src/use-motion-status.ts`：ENTER / LEAVE 状态迁移、有效 `motionName` 判定、回调时机。
- `packages/motion/src/driver.ts`：双 rAF、DOM `transitionend`/`animationend`、deadline 与事件解除监听。
- `packages/motion/src/motion-list.ts`：动态列表项移除与保留时间窗（Notification 等）。
- `packages/motion/src/presets.ts`：预设名/类名与动画对应关系。
- `packages/ui/src/_internal/trigger.ts`：浮层 `open`、`inMotion`、`Portal` 保活、onVisibleChanged 与 `afterOpenChange`。
- `packages/ui/dist/index.css` + 对应组件 style：检查真实加载后是否含正确的 `apollo-slide-up` / `apollo-zoom` / `apollo-fade` 和通知相关 CSS。

逐项排查：

1. **状态**：`visible:false` 时组件是否还保留在 DOM 足够长、是否进入 LEAVE ACTIVE、是否具有目标 motion class；`removeOnLeave` 是否仅在离场完成后触发。
2. **CSS**：事件发生时 CSS 类名是否能匹配样式文件。`animation-duration`/`transition-duration` 是否为 0，是否被 `display:none` 或父级卸载抢先清除。
3. **事件**：结束事件监听绑定的是实际 motion 根节点，且只接受自身/预期 target；没有被浮层子节点冒泡误判；deadline 只是异常兜底，不作为正常每次结束的固定等待。
4. **复入**：leave 未完成又 open 时能够取消旧定时器/旧过渡状态，节点不闪烁、不发生旧 leave 清理新 open。
5. **回调**：`onVisibleChanged(false)` 与组件 `afterOpenChange(false)`/`afterClose` 在**关闭真正完成**之后、且只触发一次。
6. **Portal**：父层关闭后依旧保留弹层直到离场结束；关完无游离元素、空白覆盖层、残留 scroll-lock/focus trap。

**不要**照着 `CSSMotion.ts` 注释去重新实现一遍。仓库此前已经修过“MotionTreeNode 的 onVisibleChanged 被丢弃”和“Tree 收起哨兵不能结束”等 bug，先找到精确回归点。

### 1B. 分别验证消费链

**Select / Picker / Popconfirm**：先查 `Select.ts` → Select 内部 BaseSelect/Trigger 关系、`DatePicker.vue` → Trigger、Popover/Tooltip/Popconfirm 的 Trigger 复用路径。检查 `motionName` 和实际 CSS 名、`popupVisible`、外部点击关闭、`Portal open` 与 `inMotion` 的同一生命期。

**Notification**：看 `packages/ui/src/notification/engine/NoticeList.ts` 以及 `MotionList` 的 keys 变化。注意 Notification **不完全复用 Trigger**，不要因为修好 Select 就假定 Notification 也好了。需要测试点击关闭和超时移除的离场节点，不允许瞬间卸载或幽灵通知。

**Tree**：排查 `MotionTreeNode.ts`、`NodeList.ts` 的 MOTION_KEY 哨兵、`motionType:'hide'`、高度过渡、`onMotionEnd`、列表 changing 标志。树节点收起后立刻重新展开，仍可操作；虚拟列表边界不能卡住状态。

**Modal**：排查 `modal/Modal.ts`、`modal/engine/{Dialog,Content,Mask}.ts`、`modal/style/` 与 motion zoom/fade 的顺序。

- 不能只比“开了没有”：要比遮罩透明度曲线、面板缩放轨迹、transform-origin、duration、easing、出现/消失的首帧，以及触发点。
- 检查关闭时内容/遮罩同步，`afterOpenChange/afterClose`、焦点归还与 `destroyOnHidden` 时序；不能为了更像 antd 牺牲可访问性。
- React 与 Vue 的生命周期顺序不一样是已有明确裁决；保留必要桥接机制，不照抄 React `useLayoutEffect`。

### 1C. 建立真实浏览器动画回归（不是只测 jsdom）

给 Playwright 增加独立 `motion.spec` 或等效用例，至少断言：

- 打开有真实过渡（当系统未设置 reduced-motion）；离场触发后先进入离场状态，再在合理时间内移除/隐藏。
- 关闭过程中 `getComputedStyle` 及动画 class 符合预期（区分过渡开始、进行中、完成）。
- 连续开关 3 次无残留 DOM/Portal、无重复回调、无交互死锁；以 Chromium 实测，不使用 `page.waitForTimeout(固定秒数)` 作为唯一同步判据。
- reduced-motion 下允许无动画，但**关闭完成、回调、清理必须正确**。
- 比较 Ant Design 6.6.4 视频帧或者明确的可重现样式指标，不主观写“已完美一致”。

**阶段通过条件**：MOT-01～06 每条有复现结论、修复提交、针对性单测、浏览器自动化证据；未复现项必须注明环境，不允许虚假关闭；基础动效测试通过后再全面补 Demo。

---

## 4. 阶段 2：补齐功能 Demo（DatePicker / Upload / Form 优先）

目标不是无脑增加数量。**必须建立“上游场景 → 当前支持的 Vue API → 示例/测试/差异说明”矩阵**，每个示例可真实交互，复制代码能使用，语言与控制方式符合 Vue。

### 2A. 通用 Demo 规范（全组件适用）

- Demo 只写在 `packages/ui/src/<component>/demo/<name>.vue`，配对 `name.md`（按 manifest 规则提供 title/order/说明）；构建时检查自动收录。
- 示例一律从 `@apollo-design/ui` / `@apollo-design/icons` 导入公开 API；不能深导入内部 engine/测试组件，也不能使用 antd/React 产物。
- UI 内组件使用库自身的 Button/Input/Select 等，不用裸 HTML 模拟相同控件；语义容器、表单原生元素确有必要时可以保留。
- 示例要可操作、有真实反馈；不能只给 `console.log` 让用户猜事件，也不能出现没有数据的空白演示（按具体场景允许日志作为辅助）。
- 不使用真实外网 mock 上传接口、固定死链或环境敏感的远程图片作为功能证明；Demo 请求使用可控 mock/customRequest，清楚说明真实接入方法。
- 对“尚未支持”的 antd 场景，登记组件能力缺口并开实现任务；不能造假的 Vue API 或在文档里摆静态占位。
- 每个 `.md` 分别维护中英文真实语义与标题；新增自动用例保证 `.md`/`.vue` 配对、可 import、浏览器能渲染。

### 2B. DatePicker（现 2 个 Demo）

**来源**：`packages/ui/src/date-picker/demo/` 只有 `basic`、`range-picker`；`index.zh-CN.md` 列出了大量已经公开的 API，并存在旧 TODO 说“只有 basic”，此处与实际 2 个不一致，需纠正。 

**第一批必须补的场景**（按能力查证后逐项落地，而不是照搬 React props）：

1. 基本日期 / 周 / 月 / 季度 / 年选择，与 RangePicker 的起止范围。
2. 禁用态、`disabledDate`、`minDate` / `maxDate`；范围不可选边界。
3. `showTime`、`needConfirm`、时间步长、12 小时制。
4. `presets` 常用快捷范围；选择范围后显示回填数据。
5. 受控 `v-model:value` / `v-model:open`、默认值、清空行为。
6. `format`、本地化格式、placeholder、不同尺寸与状态、variant。
7. 多选（`multiple`）、`cellRender` / footer/面板自定义等已支持能力。
8. 弹层定位、容器与开合动效的独立 Demo，作为 MOT-02 的浏览器回归入口。

**实施方法**：先生成“能力矩阵”，从高频到复杂分批补（建议初期形成约 12～18 个有效示例作为阶段目标，最终按支持的功能覆盖与 antd 6.6.4 对照，不以这个数字代替需求）。时间面板与 RangePicker 优先。不要借 Demo 偷偷修改 DatePicker API。

**验收**：至少上述 8 组场景有交互证明；没有白屏、错误提示/值变化异常；弹层打开和关闭动效有效；中文英文切换不出现语言混乱。

### 2C. Upload（现 3 个 Demo，基础按钮失样）

**优先立即修复**：`packages/ui/src/upload/demo/basic.vue` 用的是：

```vue
<button class="demo-upload-btn" type="button">
  <UploadOutlined /> Click to Upload
</button>
```

这不是 `@apollo-design/ui` 的 Button。应把基础 Demo 的触发控件改为库自身 **`Button` + `UploadOutlined`**（图标用已经支持的 `#icon` 插槽或 prop）。删除为掩盖问题而写的 `font-family:sans-serif` 临时样式；检查 Upload 内点击委托是否正常、`hasControlInside` 的语义是否一致。**先排除 Upload 根本身的样式丢失，再做修改，不能误判库 UI 的 CSS 错误。**

**再补覆盖**：

1. 基本上传（成功/失败/上传中进度）、列表的移除/预览/下载。
2. 多文件、文件数量限制 `maxCount`、文件类型 `accept`、大小校验（在 `beforeUpload` 里明确做）。
3. `beforeUpload` 的 `false`、`LIST_IGNORE`、异步返回、文件变换。
4. 拖拽上传/悬浮拖放态、文件夹、粘贴上传（浏览器许可场景）。
5. 照片墙：picture、picture-card、picture-circle，真实缩略图及错误图状态。
6. `customRequest` 完整生命周期：进度、成功、失败、取消；包含单个受控列表、手动上传和自定义按钮。
7. 禁用态、图标/列表项自定义等；不支持的上游场景要写清覆盖缺口。

**验收**：基础按钮与库 Button 视觉一致；默认 CSS 不再退化为浏览器原生按钮；示例上传无需依赖外网第三方接口仍能重现成功、失败和取消；状态变化与事件一致。

### 2D. Form（现 5 个 Demo，严重不足）

**当前**：`basic` / `customized-form-controls` / `label` / `layout` / `validate-status`。`index.zh-CN.md` 暴露的 `Form.List`、`useWatch`、`validateFields`、`dependencies`、`shouldUpdate`、`scrollToField` 等缺少成套示例。

**分两批落地**：

- **基础集**：不同 layout / label 配置、必填/邮箱/自定义同步与异步校验、`validateTrigger`、`initialValues`、`resetFields`、`finishFailed` 与错误展示、禁用/尺寸、跨表单控件组合。
- **高级集**：`Form.List` 动态增删/移动字段及嵌套 namePath、`useWatch` 实时监听、dependencies 字段联动、`shouldUpdate` 条件渲染、`setFieldsValue` / `getFieldsValue` / `validateFields`、`scrollToFirstError`、`Form.Item` 的 custom wrapper/nested/noStyle、跨表单协同（**确认实现支持后才列为示例**）。

**不能**把 15 个空白示例卡片当作完成；至少完成有效的动态表单、校验失败、高级监听三大难点的交互测试。建议先达到 12～16 个真正有效的示例，再继续按能力矩阵逐一补齐；数字是推进用的参考，不是合格标准。

### 2E. 其他 72 组件的 Demo 普查与优先级

前端已有 `packages/docs/tests/demo-audit.test.ts`，其 `758` 断言主要证明示例文件存在/配对/标题等，**不能证明示例功能覆盖**。需要生成 `demo-coverage-matrix.csv` 或 `.md`：按组件列出已有 Demo、antd 6.6.4 对应案例、是否可以在 Vue 实现、是否有动效、是否有交互验证、是否含中英文文案、缺口/阻塞。

普查批次：

- 第 1 批：Select / DatePicker / Form / Upload / Modal / Tree / Popconfirm / Notification / FloatButton。
- 第 2 批：Dropdown / Tooltip / Popover / Drawer / Cascader / TimePicker / TreeSelect / AutoComplete / Table / Tabs / Collapse 等弹层、复杂数据录入组件。
- 第 3 批：其余组件按低覆盖率和用户价值排序。

不要因为 Select 当前源目录约 35 个 `.md` 就判定它“完整”：数量 != 案例可用性、用例完整性和动画质量。对每批的功能性 Demo 建立 1~2 条 Playwright 实测用例；优先“当前网页空白/交互失效”的例子。

**阶段通过条件**：DatePicker、Upload、Form 关键功能清单被真实 Demo 覆盖；上传基础按钮样式通过；已有 Demo 没有因新增而退化；全组件缺口矩阵可查且有下一批计划。

---

## 5. 阶段 3：文档站产品化——布局、独立预览、语言同步、自用组件

这一阶段整合上一轮 **DOC-01～DOC-12**，不另造第二套文档站框架；复用现有 Vue/Vite/vite-ssg/manifest 管线。

### 3A. Demo 预览引擎：引入明确的显示模式

**现状**：`DemoMeta` 只有 `iframe:boolean`；`DemoPreview.vue` 仅“普通 inline 或 iframe”。`FloatButton` 真正的 CSS `position:fixed`，无法靠给卡片加 `position:relative` 改变参照视口。

**目标数据模型（示例方向，不要求逐字）**：

```ts
export type DemoPreviewMode = 'inline' | 'isolated' | 'viewport';
export interface DemoPreviewConfig {
  mode?: DemoPreviewMode;
  minHeight?: number;
  viewportHeight?: number;
  scrollable?: boolean;
}
```

给 `demo/*.md` 的 frontmatter 扩展 `preview.mode: viewport` 或项目统一认可的等价字段；修改 `tooling/content/build-manifest.mjs`、`src/types/manifest.ts`、`DemoPreview.vue`、`DemoFrame.vue`、独立示例页及测试，统一可配置而非判断 `component === 'float-button'` 硬编码。

- `inline`：常规小组件，当前页面原位渲染。
- `isolated`：需要独立 document / 主题隔离 / css 环境的场景，iframe 自适应高度，但必须限定来源和消息。
- `viewport`：模拟**独立浏览器视口**；明确尺寸（例如较高画布 250～340px，实际按对照截图确定）、边框、窗口顶部提示与**视口内**滚动层。针对 FloatButton/BackTop 的 fixed、scroll，触发位置必须锚在 iframe 窗口内。可复用 isolated iframe 路由，不新做一套渲染器。

**反例**：不要改 `float-button/style/index.ts` 把 `position:fixed` 改成 absolute；不要把 FloatButton 真实代码改为 pure；不要仅在普通卡片用 `overflow:hidden` 截断视觉来“让它不飞出去”。

### 3B. 修复 iframe 的已确认缺陷

1. `DemoPreview.vue` 的 `standaloneHref` 不得硬编码 `/components/` 根路径；使用 router.resolve 与 `BASE_URL` 结合生成正确新窗口 URL，避免二次加 base。既测 `DOCS_BASE=/` 又测 `/apollo-design-ui/`。
2. `DemoFrame.vue` 接收 `postMessage` 时同时核对 `event.origin` 与 `event.source === iframeElement.contentWindow`；建议消息附 `frameId` 与 type 白名单，限定 height 数值范围；**同源不代表同一 iframe**。
3. 计算 iframe URL 时不要在 SSR setup/computed 路径无保护读取 `document`；主题值改为浏览器可用后读取，或使用 SSR 安全的响应式主题值；水合前后 URL 不乱跳。
4. `?theme=dark|light&lang=...` 必须在 iframe 页真正应用，而不只是写在 `src`。父页切主题/语言能同步到 iframe；在无刷新可更新时使用明确协议，必要时只重建该 iframe，不重载整个 docs 页面。
5. 父 iframe 和子 iframe 在 resize 期间不能互相无限触发高度震荡；`ResizeObserver` 限频或差值阈值，不更新相同高度。关闭页面后解除监听。

### 3C. 文档级语言切换必须影响 Demo（I18N-01）

**两个层次的语言必须同时处理**：

- **组件内置语言**（如 DatePicker/Upload/Popconfirm 的系统文案）：Demo 根部通过独立 `ConfigProvider :locale` 设置 `@apollo-design/locale` 提供的 `zh_CN` / `en_US`，来自当前 docs 语言（库实际导出已存在）。`DemoProvider` 维护可响应式的局部上下文，不能把文档站全局业务偏好污染整个 Demo。
- **示例作者写的文案**（如 `Click to Upload`、`Open Modal`、表单 label/提示信息）：必须由 Demo 自己订阅 `demoLocale` 或传入 demo 语言状态，提供中英文字符串，而不是期望 ConfigProvider 自动翻译裸字符串。

建议做法：

1. 在 `DemoProvider` 中提供 reactive 的 demo locale 和按需的局部 `ConfigProvider`。`DemoRenderer` / iframe 独立页传同一个站点语言状态；新增的 Demo 使用统一极小翻译工具，避免每个示例复制一套复杂 i18n。
2. 对现有示例优先批量审计“页面正在显示但文案为写死英文/中文”的条目；先覆盖关键 9 个组件和所有新 Demo，再扩展全站。
3. 切换语言默认只更新语言，不强制重新挂载所有 Demo、清空表单/上传状态；只有不可变语言资源和隔离 iframe 场景才按需重建。
4. `DemoPreview` 本身的标题/说明、工具栏、动态组件 UI 和空状态都跟随语言；缺翻译要在审计表里记录，而非机械回退导致中英混用不标记。

**验收**：`/components/date-picker`、`/components/upload`、`/components/form` 以及 FloatButton/Modal 页面点击全站中英文切换后，**Demo 自身的说明、表单 label、按钮、占位、内置 picker 等语言**同步；切换主题与语言不丢失可保留的交互状态；独立示例与内联示例一致。

### 3D. 文档站复用自己的 UI 库（DOC-05）

**确认事实**：`packages/docs/package.json` 已有 `@apollo-design/ui` workspace dependency；`main.ts` 已引入组件库发布 CSS；但站点 UI 仍大量手工写。此次应该做到“站点作为自家组件使用者”。

**优先替换目标**：

- `TopBar.vue`：搜索入口、菜单入口、主题/语言控件优先用 Button / Tooltip / Dropdown 等已稳定组件；保留原 `RouterLink`、导航语义。
- `SearchModal.vue`：搜索输入用 Input / Input.Search，必要时使用 Modal（但搜索体验的 `combobox/listbox`、快捷键、焦点管理必须保留）。
- `IconPage.vue`：搜索用 Input；风格筛选用 Segmented/Tabs/RadioGroup（根据真实 API）、复制模式用 Select，加载更多用 Button；图标网格自身仍可用语义容器。
- `ComponentPage.vue`：两列/单列切换、工具栏控件统一改为库内 Button 或 Segmented；不再单独打造“仿按钮”。
- `DemoToolbar.vue`、`DemoSource.vue`：复制、重置、代码展开、tab 选项改为已稳定的库内交互组件。

**重要隔离约束**：`SiteLayout` 当前包着 `RouterView`，如果一股脑在祖先挂 `ConfigProvider`，Demo 会继承站点 Provider。要么只在 TopBar/侧栏/搜索等 chrome 的**局部子树**挂站点配置，要么让 DemoProvider 显式复位并通过测试证明隔离；不能牺牲示例的 ConfigProvider / LocaleProvider / Message / Notification 行为。仓库原 `site-chrome.test.ts` 已明确检查此边界。

**不要追求“无原生 DOM”**。布局用 `<div>/<nav>/<aside>`、超链接用 RouterLink、真正有语义的 `button` 底层可能仍合理；原则是**已有功能等价 UI 组件不重复造**。

### 3E. 页面宽度、卡片布局与侧栏（DOC-07、08、09、12）

**源码**：`src/styles/site.css` 当前有 `--site-sidebar-width:248px`、`--site-toc-width:208px`、`--site-content-max:1096px`，`.site-main` 还有最大宽度与两侧 gap；`ComponentPage.vue` 两列 `grid-template-columns:1fr 1fr`，每行由最高卡片撑起。当前在宽屏下整体显得收缩、卡片下方形成空白。

**落地步骤**：

1. **先用浏览器量化** 1440×900、1920×1080、1366×768、移动端 390×844 的 `.site-main`、`.site-content`、`.demo-canvas` 的真实宽度，记录左右留白；不要只看一张被缩放的长截图臆断 CSS。
2. 让桌面三栏充分利用宽度，中央内容随屏幕增加而合理变宽，缩窄不发生横向溢出；可以从 `.site-main max-width`、`--site-content-max`、gap、左右 padding 下手，使用适配性 token/clamp，不要简单全站 `width:100vw` 导致超宽行读不清。
3. 内容宽时保持 Demo 双列；卡片高度差较大时采用**独立双列流**（按源顺序平衡分配、每列纵向堆叠），或验证可靠 masonry 方案；必须保留**键盘阅读顺序/源文档顺序、锚点跳转**，不能只为视觉打乱阅读顺序。
4. Demo 以**预览画布优先**，其次标题、精练描述与小型图标工具栏；API/源代码有清晰分界。固定高度仅用于明确的 viewport 模式；普通示例不要造大块空白，也不能挤压弹层。
5. SideNav/TOC 的字号、一级/二级层次、选中态、badge、hover、行高、间距统一。资源 Icon 的数量应表现为计数标签，不冒充“副标题”。
6. 全文标题/副标题的字体层级要可预测（H1、H2、卡片标题、说明正文、代码）；统一 token，不要 `TopBar`、`ComponentPage`、`IconPage` 各自用任意像素。
7. 表格、代码、长选项、浮层在窄屏能滚动或安全换行；高密度不等于拥挤。float-button 的独立窗口允许独立增高，不牺牲演示理解度。

### 3F. 清理公开文档的“内部决策说明”（DOC-06）

扫描所有 `packages/ui/src/*/index.zh-CN.md` 与 `index.en-US.md` 的用户可见部分：

- **公开保留**：用法、真实能力、API/Props、事件、插槽、迁移陷阱（例如 Vue `v-model` 映射）、实际使用限制。
- **迁移内部文档**：Dxx/编号、RCT 内部源码、逐行技术裁决、实现选择讨论、测试采样表、“内部没有做”、“之前某次修复”、仅开发者可用的深导入工具。
- 不能机械删掉影响用户理解的兼容差异；放在清晰的“注意事项/兼容性”中，用用户语言解释。

特别检查 `button/index.zh-CN.md` 的内部差异描述、`float-button/index.zh-CN.md` 的实现设计说明、`upload/index.zh-CN.md` 的进度条及上传引擎内部备注。公开 API 描述不允许与代码导出相矛盾。

### 3G. 导航、TOC 与内容拆分的稳定性

`build-manifest.mjs` 使用 `splitDocBody` 拆 intro、Demo 与 API 段落；扩展 frontmatter / 清理文案时必须避免破坏 demo 位置、TOC 顺序、搜索索引和 SSG 路由。新增测试覆盖中文标题、英文标题、同名锚点、`## 代码演示` 丢失或位置异常、访问 `<component>/demo/<name>`。

**阶段通过条件**：Button、FloatButton 对照布局改进可见；导航/交互统一；核心页面语言切换同步到示例；iframe viewport 与链接没问题；公开页面不出现内部编号与工程草稿；原有组件 API 没被随意改动。

---

## 6. 阶段 4：全站验收与 CI 视觉门禁

### 4A. 测试矩阵

| 类型 | 覆盖范围 | 必须得到的证据 |
|---|---|---|
| Motion 单测 | `packages/motion`、Trigger、MotionTreeNode、MotionList、Modal、Notification | 事件时序/回调次数/完成清理/中途复开 |
| Demo 静态检查 | 全量 docs manifest + demo 文件 | `.vue`/`.md` 配对、合法导入、无重名/重复 order、demo coverage 汇总 |
| Demo 功能浏览器测 | DatePicker、Upload、Form + P0 动效组件 | 真正完成日期选取、上传 mock 生命周期、动态字段/表单验证等 |
| 视觉回归 | Button、FloatButton、DatePicker、Select、Modal、Upload、Form、Icon | 页面截图对基线 diff，而非仅存图；暗色/亮色至少主页面 |
| i18n | zh-CN/en-US，内联/iframe/新窗口 | 文档、Demo 文案、内置组件语言同步；无丢失状态 |
| 响应式 | 390、768/900、1366、1440、1920（按实际断点） | 侧栏收放、演示区无溢出、浮层可见、卡片高度合理 |
| 路由与发布 | `DOCS_BASE=/` 与 `/apollo-design-ui/` | 直达深链接、新窗口、刷新、SSR/SSG、水合不闪烁、不 404 |
| 自举隔离 | site chrome / DemoProvider | 站点 Provider 不污染 demo 的 Config/Locale、弹层、Message |

`packages/docs/tests/smoke-browser.mjs` 已有截图语句和基本路径 smoke，但没有视觉 diff。新增 snapshot 基线并将核心比对纳入 CI。由于动画非确定性，**视觉静态快照应关闭动效或等待稳定；动画另外走时序/视频/帧检测**，不要混做一套不稳定的图片对比。

### 4B. 产物与覆盖率纪律

- 保留/增加有价值的业务交互断言，而不是依赖 `758` 总量断言；若增加 Demo，应更新数量断言或改为有清晰边界的动态约束。
- 视觉基线图片**入 git**（仓库已有相关裁决），CI 比对稳定运行环境（浏览器版本、字体、像素比、视口、主题）。漂移时出真实 diff artifact。
- 采用“每个问题先写针对性测试 → 修复后复测”的节奏；**不要每改一个文件跑 40 分钟全量 CI**。按组件/阶段跑对应单测与 docs 冒烟；最终统一做完整 lint/typecheck/build/test/视觉回归。
- 压缩包/发布产物不应该把调试脚本、node_modules、大型对照截图或本报告当运行时依赖。
- 在 GitHub PR 中写出“已执行、通过、失败、未执行”，附命令与日志/CI 地址；任何未执行的项不可标记为通过。

### 4C. 最终交付清单

1. `baseline-motion-matrix.md` + 修复后逐条对照（含留存视频/截图说明）。
2. `demo-coverage-matrix.md`（全量组件场景缺口；每项状态、来源、限制）。
3. 文档站/组件库修复代码 + 新增真实 Demo + 对应 i18n + 自动化测试。
4. 文档站布局与预览/iframe 机制收敛的说明（怎样新增 viewport demo）。
5. 视觉基线与 diff 检测任务/CI，生产 GitHub Pages 路由验证结果。
6. 一份 `FINAL-REPORT.md`，列明每个 P0/P1 项 `已修 / 验证无问题 / 阻塞待补`、复现环境、PR/commit、验收命令、剩余差距；逐项提交，不得只写“已全部完成”。

---

## 7. 给执行 Agent 的工作拆分（可直接按此创建任务）

| 批次 | Issue / 工作包 | 依赖 | 不完成就不能进入的下一步 |
|---|---|---|---|
| 0-A | `AUDIT-01` 基线、六类动效浏览器复现 | 无 | 修复动效之前必须归因 |
| 0-B | `AUDIT-02` Demo 全组件场景差距表（重点 DatePicker/Upload/Form） | 无 | Demo 扩充前知道缺什么 |
| 1-A | `MOT-CORE` `@apollo-design/motion` 与 Trigger/Portal 生命周期 | 0-A | 不能让下游各组件用不一致补丁 |
| 1-B | `MOT-POPUP` Select、Picker、Popconfirm/Popover/Tooltip | 1-A | 每组件应有真实 exit/reopen 自动化 |
| 1-C | `MOT-LIST` Notification、Tree | 1-A | 关闭/收起后状态机清理正确 |
| 1-D | `MOT-MODAL` Modal 入/离场视觉与生命周期 | 1-A | 交互/焦点/遮罩都通过 |
| 2-A | `DEMO-UPLOAD` Button 失样修复 + 上传功能案例 | 0-B | 上传页基本用法能用 |
| 2-B | `DEMO-DATE` 日期/时间/范围/禁用/受控/自定义 | 1-B、0-B | 关键场景能交互 |
| 2-C | `DEMO-FORM` 表单异步校验/动态项/联动等 | 0-B | 高级表单示例真实可运行 |
| 2-D | `DEMO-ALL` 其余组件按覆盖矩阵分批补全 | 2-A～C 策略固化 | 核心无重复空白/假 Demo |
| 3-A | `DOC-VIEWPORT` FloatButton 独立 viewport + iframe / SSR / base 修复 | 1-A | 预览基础设施稳定 |
| 3-B | `DOC-I18N` Demo locale、示例文案和 iframe 同步 | 3-A、2-A～C | 全站双语有真实效果 |
| 3-C | `DOC-SELFUSE` 官网交互使用自身 UI 库 | 1-A、3-A | chrome 和 demo 隔离测试通过 |
| 3-D | `DOC-LAYOUT` 宽度利用率、Demo 卡片/排布、导航一致性 | 3-A | 4 种视口对照完成 |
| 3-E | `DOC-CONTENT` 公共文档去工程草稿、TOC、标题/副标题 | 0-B | 文案稳定，API 无误导 |
| 4-A | `QA-ALL` 完整测试/视觉门禁/发布验证 | 所有前置项 | 未执行的不能宣称完成 |

> **提交纪律**：每个工作包至少一个独立 commit，保持回滚能力。一个工作包里若发现真正属于其他组件的问题，单独记录 Issue 并注明阻塞关系；不要顺路进行不相干大重构。

---

## 8. DeepSeek 执行规则与防偷工减料条款

这部分为防止模型“理解了方向，但实际只改几个 CSS”的硬约束。

**必须**：

1. 不以“已完成 72 个组件 / 758 个 Demo”为质量完成证明；功能、动效、样式与文档必须分别验收。
2. 动效类从真实网页复现入手；保留 DOM、样式与生命周期证据；只改必要层；不能设置 `transition: all .2s` 假装修好。
3. 不新增不必要外部框架、运行时 React/Ant Design 依赖，保持 zero-runtime CSS 的既定裁决。
4. 先读现有代码规范与历史修复，尤其 CSSMotion、Tree 收起的历史修复，避免重复踩坑。
5. 补 Demo 要可交互、能运行、可复制，保证 `.md` 配对与中英文；**不允许只堆示例标题或空卡片**。
6. 官网复用 UI 库时保留 Docs Demo 环境隔离、`BASE_URL`、vite-ssg/SSR、浮层 Portal 行为。
7. 自动化视觉与行为分开：静态截图 diff、动效时序/录屏、功能交互断言三种证据独立。
8. 每完成一个阶段，先汇报：修改文件、改动原因、测试命令与结果、未解决项、下一阶段是否允许启动。**不要未经确认直接贯穿所有阶段进行大规模修改。**
9. 不降低已有测试断言、不粗暴 skip 测试、不通过把不支持场景删除来达成“全绿”。
10. 编译/类型/单测/浏览器回归按阶段执行；最后做一轮完整验证；提交 PR 前必须展示真实输出。

**禁止的典型“伪修复”**：

- 将 FloatButton 的 `fixed` 改成 `absolute`；
- 在 docs 写全局 CSS 覆盖 Select/Picker/Modal 以掩盖组件内部 motion 问题；
- 把 Upload 裸 button 补一条独立 CSS，而不检查是否应该使用组件库 Button；
- 给每个离场组件加固定 `setTimeout` 后强拆 Portal；
- 英文 Demo 没翻译却声称“已经跟着全站切换”；
- 只看 `pnpm test` 全绿就声称动画视觉已经通过；
- 只加 20 个展示相同内容的 Demo 来满足数量指标。

---

## 9. 可以直接复制给 DeepSeek 的总指令（阶段制）

以下内容可复制为新会话的第一条任务，**本报告作为项目文件同时提供**：

```text
你现在接手 apollocmh/apollo-design-ui 仓库 master 分支的“文档站与组件交互质量综合整改”。

首先完整阅读本仓库 AGENTS.md、CLAUDE.md、ARCHITECTURE.md、COMPATIBILITY.md、
COMPONENT-RULES.md、TESTING.md、WORKFLOW.md、Registry，以及我提供的
《Apollo Design · 文档站与组件交互质量综合审计 / 分阶段整改执行方案》。
这些是项目既有裁决，不要重写规则。

本次目标包括：
- Select、DatePicker/RangePicker、Popconfirm 等弹层离场动效；
- Notification 移除动画、Tree 节点收起、Modal 入场与退出动效；
- DatePicker、Upload、Form 示例缺失，Upload 基础上传按钮失样；
- FloatButton 独立视口、iframe 通信/主题/SSR/子路径链接；
- 文档语言切换后组件 Demo 文案/组件自身语言同步；
- 文档站充分利用空间、统一侧栏/TOC/卡片信息层级；
- 文档站交互控件使用 @apollo-design/ui；
- 清理公开文档中的内部决策性文字；
- 完整浏览器功能/动画/视觉/双语回归。

执行纪律：
1. 严格从最新 master 新建工作分支，不在 master 直接改。
2. 严格按报告的阶段 0 → 1 → 2 → 3 → 4 顺序推进。
3. 当前只执行“阶段 0：阅读代码、生成 Demo 覆盖清单、启动可用的对照环境、复现六类动效问题、分析根因”；
   未获得我确认前，不得跨到阶段 1 大规模改源码。
4. 每个问题必须区分已证实/待复现/假说，明确代码路径和根因证据。
5. 后续修复要先测试再改动，逐组件/工作包提交；不能用空 Demo、CSS 糊补、跳过测试宣称完成。
6. 每个阶段输出：修改文件清单、测试命令和真实结果、前后对照、未完成/阻塞项；
   完整 CI 最后集中跑一次，不要每个小 patch 都跑全量。

现在开始阶段 0。先输出当前 master SHA、现有 scripts、六类动效复现矩阵、DatePicker/Upload/Form
与上游示例映射计划、初步根因分类、下一阶段修复优先级。不要以口头计划代替真实检查。
```

**阶段 0 完成后的下一条指令**：

```text
基于已经实际复现的阶段 0 报告，执行阶段 1。
优先共享 motion/Trigger/Portal 状态机，再分开修 Select/Picker/Popconfirm、Notification/Tree、Modal。
每个 P0 必须有 Playwright 真实浏览器证据与组件级回归测试。
不要顺便重构文档样式；阶段 1 完成后停止，给我报告等待确认。
```

**阶段 1 完成后的下一条指令**：

```text
基于阶段 1 的动效基线和 Demo 覆盖矩阵，执行阶段 2。
先修 Upload basic 裸 button，补 Upload/DatePicker/Form 的高价值真实交互示例，
并审计剩余组件 Demo 的场景缺口。禁止伪 API、空白 Demo 和依赖外网 mock 才能展示成功。
完成后跑针对性测试和浏览器冒烟，停止并等待确认。
```

**阶段 2 完成后的下一条指令**：

```text
执行阶段 3：统一 Demo viewport/iframe 元数据，修复 baseURL、postMessage、SSR、主题；
让文档级语言切换同步到 Demo 自身的 locale 和文案；文档 chrome 复用 @apollo-design/ui，
确保 ConfigProvider 与各 demo 隔离；优化宽屏利用率、双列卡片、侧栏、TOC，清理公开文档内部说明。
禁止通过修改组件真实 API/定位规则迎合文档截图。先生成视觉前后对照，再报告等待确认。
```

**阶段 3 完成后的下一条指令**：

```text
执行阶段 4：完整 typecheck、lint、unit、build、Playwright 功能与 motion 测试、
宽屏/移动端视觉差异、双语和 GitHub Pages 子路径验证。逐项列明真实执行结果，
生成 FINAL-REPORT.md，未执行/失败必须明确标记，最后提交可审查 PR，不自动合并 master。
```

---

## 10. 审计涉及的最关键源码索引

| 职责 | 源码 |
|---|---|
| 核心动效 | [`packages/motion/src/css-motion.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/motion/src/css-motion.ts)、[`use-motion-status.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/motion/src/use-motion-status.ts)、[`driver.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/motion/src/driver.ts) |
| 共享浮层 | [`packages/ui/src/_internal/trigger.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/_internal/trigger.ts) |
| Select | [`packages/ui/src/select/Select.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/select/Select.ts) |
| DatePicker | [`packages/ui/src/date-picker/DatePicker.vue`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/date-picker/DatePicker.vue)、`date-picker/demo` |
| Notification | [`packages/ui/src/notification/engine/NoticeList.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/notification/engine/NoticeList.ts) |
| Tree | [`packages/ui/src/tree/MotionTreeNode.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/tree/MotionTreeNode.ts)、[`NodeList.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/tree/NodeList.ts) |
| Modal | `packages/ui/src/modal/{Modal.ts,engine/Dialog.ts,engine/Content.ts,engine/Mask.ts}` |
| Upload basic | [`packages/ui/src/upload/demo/basic.vue`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/upload/demo/basic.vue) |
| Form | `packages/ui/src/form/demo`、`packages/ui/src/form/index.zh-CN.md` |
| 内容构建器 | [`packages/docs/tooling/content/build-manifest.mjs`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/docs/tooling/content/build-manifest.mjs) |
| Demo 容器 | `packages/docs/src/components/demo/{DemoPreview,DemoFrame,DemoProvider,DemoRenderer,DemoToolbar,DemoSource}.vue` |
| 独立预览页 | [`packages/docs/src/pages/DemoStandalonePage.vue`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/docs/src/pages/DemoStandalonePage.vue) |
| 组件详情 | [`packages/docs/src/pages/ComponentPage.vue`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/docs/src/pages/ComponentPage.vue) |
| 网站布局 | `packages/docs/src/{styles/site.css,layouts/SiteLayout.vue,components/site/{SideNav,TopBar,TocNav,SearchModal}.vue}` |
| 图标目录 | [`packages/docs/src/pages/IconPage.vue`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/docs/src/pages/IconPage.vue) |
| 站点入口 | `packages/docs/src/{main.ts,router.ts,composables/{locale,theme}.ts}` |
| 类型契约 | [`packages/docs/src/types/manifest.ts`](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/docs/src/types/manifest.ts) |
| 已有测试 | `packages/docs/tests/{demo-audit.test.ts,site-chrome.test.ts,smoke-browser.mjs}` |

## 11. 最终验收判定：什么叫“修好了”

工程交付**不是**“页面看着差不多”或“CI 全绿”，而是以下 6 点全部满足：

1. **交互**：6 类用户观察的动画差异有可复现结论；已经确认的缺陷被修复，关闭、收起、重开、快速操作正常，且有浏览器证据。
2. **功能覆盖**：DatePicker、Upload、Form 的 API 代表性真实场景可操作，可复制运行；其他组件提供透明、可继续执行的缺口矩阵。
3. **视觉**：Button/FloatButton/Modal/Select/DatePicker 与参考页面的布局、层级、动画可直观看到改进；文档空间利用合理，移动端不溢出。
4. **国际化**：文档语言改变时 Demo 本身和组件内部字符串一致切换，iframe 一致，英文页不混合未标明的中文。
5. **架构**：站点 UI 自举，不污染 Demo；zero-runtime CSS 与已裁决 Vue API、base path、SSR 不被破坏。
6. **证据**：保留必要自动化、视觉基线、浏览器视频/截图、git commits 和 `FINAL-REPORT.md`；失败/未执行列清楚，而不是把所有项一键划完成。

> 推荐验收人的最终裁决顺序：**优先审浏览器动画视频和三大组件的真实 Demo → 再看页面宽度及语言切换 → 最后看 CI 与完整变更列表。** 没有前两项，不能仅凭构建成功收工。
