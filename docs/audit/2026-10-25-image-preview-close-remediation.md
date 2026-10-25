# Image 当前关闭控件与原生图标槽（2026-10-25）

本报告记录完整盘点规则生效前已在实施的独立变更，不代表 Image 整改单元验收完成。后续按当前源码汇总完整契约、必修项和统一验收证据，不再以单个字段修复作为组件收口。

PreviewConfig 已声明且双语 API 已承诺 closable 和 closeIcon，但 Image/Group 未传给 Preview，按钮总是显示且只读取 icons.close。正式双入口 14 条修前 10 失败/4 已有通过；原本通过的是现有 icons.close 回退和闭合/SSR 惰性守卫。日志 `/tmp/apollo-image-preview-close-red.log`。

两个公开入口现在读取当前 closable/closeIcon，并在 render 中按当前函数转发无参数原生 `#previewCloseIcon`。优先级为槽（含空）→ 显式 closeIcon（含 null/false/0）→ icons.close → 默认图标。已有 VNode 配置是数据，保留；未新增函数 prop、兼容层或弃用期。closable=false 只隐藏按钮、不求值图标槽，Esc、遮罩和工具栏关闭请求保持自身契约。

扩展 18 条通过，覆盖晚加载、当前替换、空/移除、数据/图标回退、稳定预览/图像/草稿/焦点/选区与 90deg 变换、隐藏已聚焦按钮后的焦点修复、Esc、单次关闭、Progress CSR/SSR 和 Group 所有权。Vue 空槽可以包含注释锚点，空内容按无可见文本/图标断言，不为 DOM 逐字形态干预 Vue 归一化。严格类型检查指出可空 VNodeChild 不能直接作 h 的 RawChildren，按 Vue 原生数组 children 表达修正，未断言或忽略诊断；最终局部日志 `/tmp/apollo-image-preview-close-typed-green.log`。

新增 preview-close 原生 Demo，实际循环槽/空槽/数据/隐藏/默认状态，Image 示例增至 18 个，文档总数增至 1002，两个数量守卫同时增加新 Demo ID 正断言。双语 API、类型与 Registry 同步；不以新增 Demo 数量替代验收。

## 检查

- Image/ConfigProvider 四层运行回归：27 文件、405 条通过，日志 `/tmp/apollo-image-preview-close-runtime.log`；RawChildren 类型补正后，18 条关闭专项再次通过。
- 根严格 `vue-tsc --noEmit -p tsconfig.json` 与同目录 `vitest --project types`：14 文件、64 条通过，无类型错误，日志 `/tmp/apollo-image-preview-close-strict-types-final.log`。
- UI 生产构建、SFC 声明及 69 份组件 CSS 生成成功，日志 `/tmp/apollo-image-preview-close-build-final.log`。
- `node tests/browser/image-preview-close.mjs`：Chrome 150.0.7871.125 通过两个真实 Demo 预览的六次循环、空按钮关闭、已聚焦按钮移除、Esc/焦点归还及完整 axe，无排除规则、零 Vue/控制台/页面错误。首轮误点击被真实 mask 遮挡的页面按钮，修为实际可操作的预览内工具栏；通过原生 mousedown.prevent 保留配置切换时的编辑焦点，没有强制点击或排除遮罩。日志 `/tmp/apollo-image-preview-close-browser-final.log`。
- 实际发布包消费端（包含真实 preview-close 模板）通过；UI L7 复用本次产物，11 项、0 FAIL、0 PENDING。日志 `/tmp/apollo-image-preview-close-consumer-l7.log`。
- 文档 test/typecheck/content:check 通过，14 文件、157 条测试，72 组件、1002 Demo；最终工具栏版本另重新生产构建通过，日志 `/tmp/apollo-image-preview-close-docs-build-final.log`。最终真实 Demo 消费端复验通过，日志 `/tmp/apollo-image-preview-close-consumer-final.log`。
- Registry 19 项及内容清单生成/一致性检查通过；当前 520 行（新增两个槽声明的内部字段）、202 条待评估、19 条已验证。closeIcon 数据字段保持 keep-data，未按新槽名称机械改变分类。
- 修改的 TS/JS 文件 Biome（退出 0；两个文档测试文件有 5 处原有非空断言警告，未新增）和 `git diff --check` 通过。`node tests/visual/apollo.mjs --check --component image` 退出 1，仍缺 9 张批准基线，未当作通过或提升验收状态。

mask/容器配置、局部主题跨 Teleport、手势生命周期和 Apollo 批准图缺口独立开放。
