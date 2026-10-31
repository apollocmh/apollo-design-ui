# Affix 实现说明

当前规范见仓库 AGENTS.md / WORKFLOW.md / TESTING.md。历史分析与 s54 证据保留，不能作为当前重新验收。

- 根 attrs 使用 Vue 合并，默认槽保持内容与节点；公开 ref 仅 updatePosition，change 只在固钉翻转时发。
- 顶部/底部和亚像素几何判据保留；同条件顶部优先，不再把旧“互斥”推论冒充真实算法。
- 当前 ref/Provider 目标绑定在 mounted 后建立，目标为空时清监听和固定状态；同 target 不重绑，手动测量保留 s54 的延迟目标补挂。
- 固定内容不再被旧 height 锁住，真实内容盒通过已有 RO 驱动占位增长/缩小；位置不变的 scroll 快路径与尺寸强制测量分开。
- 唯一 zIndexPopup Token 和当前前缀读取真实 Provider，0、替换和撤除均生效；默认静态 CSS 保留。
- 卸载释放原生监听、观察和 RAF；SSR 不调度浏览器副作用。没有新增无信号位置观察或轮询。

完整当前契约、迁移和 Demo 见 index.zh-CN.md / index.en-US.md。针对性 Chrome 使用源码与实际生成 CSS，不代表最终九维或发布消费者验收。
