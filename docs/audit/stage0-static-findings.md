# 阶段 0 · 静态问题确认（DOC / I18N / DEMO）

> 基线：`master` @ `7eeab16182f91b76bf0eb3e8ad09aa8688c33f7d`
> 证据级别：**S = 源码可直接确认**；本文件不做浏览器视觉裁决（阶段 3 再做宽度/布局实测）。
> 对应审计报告：DOC-01～DOC-12、I18N-01、DEMO-01～04。

## 1. 文档演示基础设施

| ID | 结论 | 源码证据 |
|---|---|---|
| DOC-01 / DOC-11 | 没有 `viewport` 演示模式；普通卡片 `.demo-preview { overflow:hidden }`，不能为 FloatButton 的 `position:fixed` 提供独立视口 | `packages/docs/src/components/demo/DemoPreview.vue:87-93`；`packages/docs/src/types/manifest.ts` 的 `DemoMeta` 只有 `iframe:boolean` |
| DOC-02 | 「新窗口打开」硬编码 `/components/...`，未拼 `BASE_URL` | `DemoPreview.vue:29`：`const standaloneHref = '/components/${...}'` |
| DOC-03 | iframe 消息只校验 `e.origin`，未校验 `event.source === iframe.contentWindow` | `DemoFrame.vue:30-36` |
| DOC-04 | `src` 的 computed 在 setup/SSR 路径直接读 `document.documentElement.dataset`；独立页未消费 `theme` query | `DemoFrame.vue:21-28`；`DemoStandalonePage.vue:33` 只读 `embed`，`onMounted` 只 `initSiteLocale()`，没有 theme 应用 |
| DOC-05 | 站点 chrome 大量手写原生控件，未系统复用 `@apollo-design/ui` | `TopBar.vue:92,120,126,136`；`SearchModal.vue:116,131,140`；`IconPage.vue:146,155,170,196`；`DemoToolbar.vue:61,70,73`；`DemoSource.vue:24` |
| DOC-07 | Demo 卡片 DOM 顺序是「标题/描述 → 画布 → 工具栏」，不是画布优先 | `DemoPreview.vue:47-80` |
| DOC-08 | 双列是普通二维 Grid（`1fr 1fr`），按行由最高卡片撑高，不是独立列流 | `ComponentPage.vue:246-258` |
| DOC-09 | Icon 资源项用与组件 subtitle 相同的 `.site-side-link-desc` 展示数量 | `SideNav.vue:32-33`（组件 subtitle）与 `42-47`（图标数量） |
| DOC-10 | `smoke-browser.mjs` 只 `page.screenshot()` 留档，没有截图 diff / 阈值 | `packages/docs/tests/smoke-browser.mjs` 的 6 处 `screenshot`，无 pixelmatch/diff 引用 |
| DOC-12 | 三栏宽度上限：侧栏 248、TOC 208、内容 1096；`.site-main` 再叠加 max-width | `packages/docs/src/styles/site.css:23-25,105-133` |

## 2. 公开文档混入内部说明（DOC-06）

已确认的用户可见内部文字（不是 API 说明）：

- `packages/ui/src/button/index.zh-CN.md:81`：**关于 `icon` 传组件（平台差异，与 Empty 的 image 同一裁决）** —— “裁决”属于内部工程语言。
- `packages/ui/src/button/index.zh-CN.md:175`：**实现形态与 antd 不同** + `::first-letter` 实现细节 —— 属于实现选择说明，不是使用说明。
- `packages/ui/src/float-button/index.zh-CN.md:71`：**antd 的 icon-only 类在 Button 根不落（React 空子节点计数怪癖，D113）** —— D 编号与 React 内部计数不应出现在公开文档。
- `packages/ui/src/upload/index.zh-CN.md:105-114`：**上传引擎自建 / 5 个模块 / D76 / D75 / 待换回临时实现** —— 实现与差异台账文字。

**阶段 3 处理**：保留「用户如何用、有什么限制、与 antd 的可见差异」；把 D 编号、
内部源码路径、逐行裁决、待换回说明移到组件 `README.md` / `COMPATIBILITY.md`。

## 3. Demo 内容问题（与覆盖矩阵交叉引用）

- **DEMO-01 DatePicker**：`packages/ui/src/date-picker/index.zh-CN.md:31-33` 仍写
  「本仓当前只有 `basic`」，但 `demo/range-picker.vue` 已存在且未在文档中引用；
  实际 2 个 demo，上游 32 个。阶段 2 先修文档引用，再补 D1–D4 场景。
- **DEMO-02 Upload**：`upload/demo/basic.vue:25-33` 使用裸 `<button class="demo-upload-btn">` +
  `font-family:sans-serif`；`demo-upload-btn` 在组件样式中没有定义。阶段 2 改用库内 `Button`。
- **DEMO-03 Form**：5 个 demo（basic/customized-form-controls/label/layout/validate-status），
  没有 `Form.List` / `useWatch` / `dependencies` / 异步校验 / 动态字段示例；但
  `form/index.ts` 已导出 `Form.List`、`Form.useWatch`、`useForm`。
- **DEMO-04**：`demo-audit.test.ts` 的 758 总量断言只证明文件存在/配对，不证明可交互；
  覆盖矩阵见 `docs/audit/demo-coverage-matrix.md`。

## 4. I18N-01（源码确认）

- `DemoProvider` 只提供 `instanceId` / `direction` / `resetToken`，**没有 locale**：
  `packages/docs/src/components/demo/DemoProvider.vue:14-23`。
- `DemoRenderer` 只负责懒加载 demo 组件，不注入 `ConfigProvider locale`：
  `DemoRenderer.vue:57-67`。
- 现有 demo 大量硬编码英文（如 `upload/demo/basic.vue` 的 `Click to Upload`，
  `modal/demo/basic.vue` 的 `Open Modal`），站点语言切换不会改变它们。
- 组件内置语言（DatePicker/Upload 等）也不会因 docs 语言变化：demo 根没有局部
  `ConfigProvider`。

**阶段 3 验收**：docs 语言切换后，demo 标题/说明/按钮/占位/表单 label/内置
picker 文案同步；内联与独立/iframe 一致；切换语言不清空可保留的交互状态。

## 5. 本阶段未做的事

- 没有修改 `packages/docs` 或 `packages/ui` 的任何源码。
- 没有测 1440/1920/1366/390 的真实宽度与双列空白（阶段 3 的 DOC-12 量化）。
- 没有给 docs 加视觉回归基线（阶段 4 的 DOC-10）。
