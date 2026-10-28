# Layout 实现说明

当前单元包含 Layout、Header、Footer、Content、Sider。公开契约见 index.zh-CN.md / index.en-US.md，整改范围与验证见 docs/audit/2026-10-29-layout-contract-audit.md。

- 原生结构为 div/header/footer/main/aside。根 class/style 支持 Vue 对象、字符串、数组；保留五个 nativeElement ref、安装名和静态别名。
- Layout 在 render 中读取内容，展平数组/Fragment 检测直接 Sider；运行时注册补充组件包装场景。嵌套 Layout 的登记独立。
- Sider 将当前 collapsed 的 ComputedRef 提供给真实 Menu。受控请求、非受控初值与最后接受值明确分离；typed update:collapsed/collapse/breakpoint 支持 Vue 模板和监听器替换。
- 普通与零宽触发器使用原生 button、ARIA、可见焦点。trigger slot 存在即优先且在 render 读取；内容保留 0/数组/Fragment。零宽 body inert/aria-hidden，正文状态保留。
- media 订阅从 mounted 开始，切换/移除/卸载对称清理，SSR 不执行浏览器订阅或业务通知。方向与 Provider 从当前上下文读取。
- 公开 ComponentToken 仍为原 19 个。use-layout-theme 只投影 Alias 和既有字段数据；CSS property fallback 保留 stylesheet/原生变量覆盖，独立节点与嵌套主题也有效。内部 source 通道用于隔离主题数据，不新增公共 Token。
- 同主题家族节点继承父级原生 Alias；共享 sourceActive 区分 CSS-only 和显式主题，空 ThemeProvider 隔离远层主题。CSS 表达式宽度通过实际测量识别零宽，触发器逻辑几何覆盖 RTL/reverseArrow。
- layout/style.css 与 layout-sider/style.css 独立；Sider 的按钮 reset/focus/motion 样式自足。业务 Menu/Breadcrumb 等内容由使用方导入对应 CSS。
- 11 个 Demo 使用真实 Apollo Menu/Breadcrumb/Button 和当前主题。原未落地替身、onCollapse attrs 模拟、固定变量冒充主题配置等说明已被当前契约取代。
- 原始 32 DOM 参考保留，8 个 Sider 用例的原生按钮/ARIA/隐藏差异精确登记在 __tests__/contract-differences.json；额外漂移仍失败。原上游版本与 PLAN 仅作历史证据，不定义当前规格。

迁移说明见 docs/migrations/layout-contracts.md。正式发布、视觉基线、Docs 与最终同提交全量门禁由主线程统一验收；本目录的局部回归不代表这些检查已经完成。
