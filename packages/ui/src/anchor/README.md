# Anchor 实现说明

当前规范见仓库 AGENTS.md / WORKFLOW.md / TESTING.md。旧分析、计划与 s28 参考保留历史含义；当前 API 见双语 index 文档。

- Anchor/AnchorLink 使用 Vue owned click，携带原生 MouseEvent 与具名 link 数据；取消发生在选择、滚动和历史操作前。change 保留原始 href，getCurrentAnchor 继续是纯映射服务。
- 默认槽是合法组合，存在（包括空槽）即覆盖 items；Link 的默认槽仍嵌套子链接，title 槽只负责实际链接内容，支持完整 VNodeChild。
- 每个 Link 持有自己的注册与清理，重复 href、同 key 内容/偏移替换不破坏其它实例；原生导航、修饰键、目标浏览上下文与 Enter 保留浏览器职责。
- 根 attrs 真实归属明确：Anchor wrapper；Link 根 class/style/data/id；Link 的 ARIA/tab/focus/keyboard 在 a。没有新增公开 Expose 或高亮模型。
- 当前前缀贯穿 Anchor/Link/ink；原生 dir 消费当前方向，两个 Component Token 和既有别名投影实际 CSS 消费层，Provider 样式实时合并。
- 几何、落点偏移、历史替换和 s28 已交付算法保留；资源随当前容器、偏移和链接更新，动画在失效或卸载取消，尺寸观察更新 ink，SSR 无浏览器副作用。
- DOM 原始参考未改；类名前缀与 dir 的差异独立于实际输出精确投影，其余属性与样式保持严格比较。

不增加路由平台、无信号位置轮询或发布构建。真实 Chrome 覆盖 Affix 组合、滚动落点、取消、尺寸、Token、节点/焦点和卸载释放；统一九维验收另行执行。
