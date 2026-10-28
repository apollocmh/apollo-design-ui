# Breadcrumb 实现说明

Breadcrumb 是 Vue 原生导航组件。数据 items 与默认 Item/Separator 子组件组合共享所属上下文，内容通过稳定的 span 宿主承载；增加/移除菜单仅改变兄弟按钮，不重挂已有链接/控件。使用渲染函数是为了直接处理异构数据项、完整 VNode 内容和 cloneVNode 的调用方 key，无动态临时组件类型。

根 attrs 归 nav；原生 Item attrs 归 li；数据项 className/style/ARIA/data/onClick 归默认内容。导航链接与菜单按钮互为兄弟，按钮具有独立名称和键盘入口；开合沿既有 Dropdown 接口，焦点返回由 Overlay 的实际接受关闭规则处理。Separator 是 aria-hidden 的装饰 li，并从所属 Breadcrumb 读取当前前缀。

useMergeSemantic 通过 getter 消费当前解析 props；provide/inject 同样使用当前 getter 与惰性槽函数。use-breadcrumb-theme.ts 在当前 ThemeContext 内推导 7 Token 和所消费的别名，通过静态 CSS 变量应用，避免旧构建值覆盖暗色/紧凑/嵌套主题。默认正文与链接使用 colorTextSecondary，以满足实际浏览器的普通文字对比度。

完整 API 见中英文文档；迁移见 [Breadcrumb 契约迁移](../../../../docs/migrations/breadcrumb-contracts.md)，当前清单/证据见 [2026-10-28 审计](../../../../docs/audit/2026-10-28-breadcrumb-contract-audit.md)。PLAN.md 与旧 analysis/report 是带日期的历史证据。原 React DOM 30 场景和参考 PNG 不改写；当前有限差异存于 `__tests__/contract-differences.json`，额外差异仍失败。Apollo 基线与发布产物以集成验证为准。

已知边界：任意 prefixCls 的静态 CSS 由调用者提供（全库 D04）；完整 Dropdown/Menu 审计另案。真实 Dropdown 链路的共享问题不能用修改 Breadcrumb 断言或删除交互规避。
