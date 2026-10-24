# F05：Badge 模板内容整改 · 2026-10-24

接续 F07/F09 工作区，未提交、推送或发布。环境为 macOS x64、Node 22.22.2、pnpm 12.4.2、系统 Chrome 150.0.7871.125。

## 实现与契约

公开 Badge.vue 声明并在 render 读取 BadgeSlots 的 default/count/text。插槽存在即覆盖内容 prop，包括空结果；条件插槽移除才恢复 prop。当前内容通过普通 Vue props 传入私有 BadgeIndicator.vue，不用 computed 缓存 slot 身份，不在 render 写响应式 ref。

#count 为静态富内容分支，支持多根节点，不做数值解析、overflow 或数字位滚动。indicator 类、语义 class/style、offset、小尺寸、颜色与 CSSMotion 离场状态保留。数字 count prop 继续走原 livingCount/displayCount/isDot 缓存及 ScrollNumber/SingleNumber；隐藏时保留上一帧可见值。新增 customCountCache 只区分上一帧显示渠道，防止离场时突然切回数字。

空 #count 不产生空角标，独立 text 继续显示；空 #text 不回退 prop。模板文本 0 为静态内容，数字 prop 的 showZero/overflowCount 规则保持。dot 优先于两种计数渠道。未显式传 title 时，不从 VNode 自动生成标题。公共导出与组件 slots 类型同步，私有引擎标记不进入公开 props。

## 复现与验证

- 首批 6 条新回归修前全失败。修后扩展空 count + 独立 text、数字 text=0 与富 count 独立、SSR 水合节点身份、默认插槽动态切换及原生 attrs 更新，9/9 通过。
- 实施中旧回归捕获了公共包装层缺省 count/title 被 Vue Boolean 自动转换的问题，已显式保留原缺省值。未删除旧 title、status、VNode、滚动数字或 DOM 对照断言，未改基线和阈值。
- 单独四层回归 6 文件 / 94 条通过；增加最终水合与动态默认插槽断言后 9 条新回归单独通过。后续 F10 合跑包含当前 Badge，59 文件 / 1168 条通过。
- `node tests/browser/vue-reactivity.mjs`：生产 dist + 真实 content-slots SFC，在 375px 视口验证多根内容、空 slot 的真实 leave-active 阶段保留旧内容并最终移除、动态更新、prop 恢复、数字 0/overflow、dot 与输入节点身份，全部通过，零页面错误。浏览器 innerText 会给 flex 子项插入换行，内容断言改为 textContent；没有据此修改正确的指示器布局。
- L7 UI 11 项通过。严格类型、最终类型测试、Docs 与消费端结果汇总在本批后续 DOM attrs 报告。

示例 `badge/demo/content-slots.vue/.md` 可直接操作；中英文 API 明确两种显示渠道，Demo 数量精确更新为 13，文档总量为 993。

## 验收边界

`node tests/visual/apollo.mjs --component badge --check` 非零失败，缺少 18 张已审阅 Apollo 基线。没有复制 React 基线或自动接受新图，也没有把功能交互写成 L6 通过。未执行全仓 verify:full、覆盖率或完整 72/13 复审矩阵。
