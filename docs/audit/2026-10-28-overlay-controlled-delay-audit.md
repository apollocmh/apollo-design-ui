# Overlay 当前受控显隐与延迟失效

范围是 Breadcrumb 菜单选择复现出的共享延迟链路，不重开整个 Overlay 的全部能力。当前源码核对：`UseOverlayOptions.open` → `useControlledValue` → `rawOpenRef` → 渲染 `open`；触发器/浮层 hover、focus、blur → `triggerOpen` → 实例所属 `DelayInvoker`；显式 `setOpen` 已取消旧任务，外部受控状态变化没有取消路径。作用域销毁已有 clear；接受关闭后的焦点归还、拒绝关闭保持焦点是独立链路。

| 检查面 | 分类 / 验收 |
| --- | --- |
| 已打开浮层移入后快速选择菜单 | 本轮必修：受控关闭后旧 hover-open 不得重新打开；真实 Breadcrumb 脚本已复现 false(menu) → true(trigger) |
| 当前受控值与旧延迟的所有权 | 本轮必修：实际状态变化使该实例旧延迟失效；同一 tick 关闭再打开也不能被旧 hide 关闭 |
| 未受控延迟、显式 setOpen | 已有正常链路继续回归，不改变秒单位、0同步及undefined下一任务语义 |
| 动态监听器 / 触发选项 / disabled | 保留当前契约；disabled 仍只压制渲染，显式setOpen行为不改，不扩大为新的触发策略重构 |
| 焦点、Esc、Portal子浮层 | 原回归保留；当前补丁不改变实际接受关闭才归还所属焦点的条件 |
| 多实例、卸载 | 必验：取消只属于当前实例；卸载不残留回调 |
| 类型、导出、Slots / v-model | 无公开API变化；这里只修复现有受控值的消费链，无新增槽或模型 |

先运行成组失败复现，再在原状态链集中取消过期任务。验收需要Overlay原测试及Dropdown/Tooltip/Popover/Popconfirm/Trigger相关回归、源码真实Breadcrumb菜单选中后超过原延迟仍保持关闭。发布产物重建/L7及全量消费者属于后续集成阶段，未执行前不宣称通过。

## 当前结果

4条复现修前1通过/3失败；增加实例作用域内的同步rawOpen观察后，Overlay及Dropdown/Tooltip/Popover/Popconfirm/内部消费者相关42文件482条全部通过。真实Breadcrumb菜单选择超过原hover延迟仍保持关闭。没有改变disabled、秒单位、显式setOpen、受控拒绝或焦点归还条件；多实例/同tick关闭再打开/卸载覆盖保留。发布产物与全库门禁尚未执行，不能把本次窄修视作整个基础包重新完整验收。结构化证据见overlay-controlled-delay.json。
