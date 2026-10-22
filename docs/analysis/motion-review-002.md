# 002 复审：Motion 首帧与 Inline Menu（2026-10-22）

## 事实与范围

用户指定修复 `docs/issues/002-复审.md`；不是领取新的组件任务。
`next-task.mjs` 返回 72/72 completed、foundation 13/13 completed；
`ask component menu/message/notification` 均为 completed。

本地参考：antd 6.6.4 `es/menu/menu.js`、
`@rc-component/menu@1.5.0/es/SubMenu/InlineSubMenuList.js`。
只提取行为契约，不复制实现。

## 公共 Motion 分析

`useMotionStatus` 初始快照把需要阻止渲染的状态写成 boolean false，
`pickRenderMode` 仅识别字符串 NONE，故 slot 在挂载前被调用并产出裸节点。
修复复用 `getStyleReady`，与 driver 的状态计算保持一致。
初始可见且无 appear / 不支持动画时仍必须同步渲染（SSR 契约）。
测试记录 slot 首次调用、prepare/start/active 样式和真实 DOM 帧；
不能只断言出现过 enter class。

## Inline Menu 行为与 Vue API 设计

参考行为：列表由 visible 驱动；普通关闭后保留 hidden 列表；
切出 inline 模式时先 leave、结束后移除；嵌套层禁用 appear，
避免父级高度过渡内再次 appear。高度预设来自已有 initCollapseMotion。

新增内部 InlineSubMenuList（无公共 API 变化）：
props `id: string`、`open: boolean`、`mode: MenuMode`、`depth: number`；
default slot 为子项。组件内 provide 固定 inline context，使模式切换离场期间
后代仍保持 inline 布局。Vue watch 管理模式退出与重新进入，
CSSMotion visible/removeOnLeave/leavedClassName 管理完整生命周期。
进一步核对 rc-menu Menu 的 mounted 契约：整棵菜单初次挂载不播放 appear；
之后再进入 inline 才允许顶层 appear。Menu 提供 mounted ref，静态 DOM 基线保持原样。
首次 prepare 节点必须先提交 DOM，驱动通过 scheduleRender + Vue nextTick 再执行 start；
快速反向和卸载用代际标记取消待提交队列与旧 prepare Promise。
公共 Motion 用 Vue SSR context 区分预渲染，保证存在 window 的 SSR 宿主也同步输出。
客户端浮层测试在读取初始 open 面板前等待 Vue 提交；BackTop 静态 DOM 对比使用
真实 Vue SSR，对应 React SSR 基线，原有断言与基线不变。
不改 click/keyboard/hover 入口，不增加视觉常量，复用现有 Token/CSS。

## 验收设计

单元覆盖首帧、步进、嵌套、快速反向、模式切换和 inlineCollapsed。
真实 Chromium 逐 rAF 记录 transform/opacity/height/rect、CSS 变量和结束事件，
对照 React 通知布局轨迹；检查旧条连续移动、新条从入场初态开始、测量非零。
回归 Select/Tree/Modal 等共享 Motion 消费者，运行 DOM/a11y/types/theme、L6、L7。
按公共 Motion、Inline Menu 分项提交，另记录证据与 Registry。
