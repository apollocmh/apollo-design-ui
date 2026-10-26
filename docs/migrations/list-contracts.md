# List 配置与内容契约修正（2026-10-26）

当前 `0.0.0` 开发版按 Vue 原生语义直接修正 List / Item / Meta；没有旧 DOM 兼容层或弃用期。此前的 `renderItem` 迁移仍见 [List 插槽迁移](./list-slots.md)，本记录集中说明本轮变化。

## 内容、DOM 与样式

- List 的既有 `extra` 已接通，并提供 `#extra`；位于整张列表右侧，窄屏移至下方。插槽存在即优先，空插槽不回退 prop。
- Item 正文始终位于 `-item-main`，额外内容始终位于 `-item-extra`，横向 main 使用 `display: contents`。若使用 `.apollo-list-item > 自定义元素`，请改用自有 class 或经过 main/extra 容器的选择器。语义化 `classNames.extra` / `styles.extra` 两种布局都生效；切换布局/extra 保留正文原生编辑状态。
- Item / Meta 私有状态类来自最近的 List context，代替祖先样式推断。分页增加 top/bottom 位置类，loadMore 使用稳定容器，Spin 增加 List 管理类。私有类不是新公共 API。
- `theme.components.List` 的 11 个既有 Token 现在直接生效，数据容器继承根变量；原生根 style 优先。默认值不变。嵌套 List 的尺寸、布局、边框和 split 独立。
- 修正不命中真实 DOM 的 loading / 窄屏 actions 样式，保留原生键盘焦点轮廓。Provider direction 设置根 `dir`，原生 `dir` 可覆盖；浮动使用逻辑方向。
- 操作项、描述和空态的正常文字使用 `colorTextSecondary`，修复默认文字对比度不足；List 默认 Empty 描述也在本层修正，用户显式语义样式仍优先。这不代表共享 Empty 其他入口已完成验收。
- List 局部 `prefixCls` 由 Item / Meta 继承，显式子级前缀优先。自定义前缀 CSS 预生成策略不变。`colStyle` 是用户给 grid Col 根的样式，不是 List 自动传入的列宽。
- 数字 `0` 保留；布尔值、空字符串和空节点不创建空包装。`locale.emptyText`、Provider `renderEmpty` 的显式空值不再被默认文案覆盖。actions 数组与插槽都过滤空项，保留 VNode key。

## 分页状态

`current` / `pageSize` 独立受控；外部赋值只同步状态、不发业务事件。移除控制沿用最后收到的值，拒绝过的请求不会成为内部状态。默认值在第一次启用分页时读取，关闭再开启保留状态。非受控页码随数据缩短收敛，恢复数据不跳回旧页；服务端显式 total 的结果页保留。`align` 原样传递，默认 end；`position` 仅由 List 消费。

## 关联共享修正

后续视觉验收补修：带边框默认行的 `itemPadding` 现在完整覆盖横向与纵向；未覆盖时保留当前主题的标准缩进，仍为11个公开Token。

全屏加载不再把正文变成fixed子树。Spin的root、原生attrs与nativeElement保持正文外壳；实际覆盖层由`classNames.mask` / `styles.mask`配置，mask不再标废弃。以前用root/class/style配置全屏遮罩外观的写法，应改到mask语义；不复制root样式到遮罩作兼容。旧mask键直接落到真实覆盖层，遮罩关闭后隐藏/inert，不消费关闭态描述槽；正文编辑器与ref在反复开关中保留。样式工厂上下文使用Vue响应式数据，读取当前fullscreen/spinning等值，不缓存挂载快照。

普通加载文案使用colorText；全屏白字增加colorBgSpotlight背景，styles.description仍可覆盖。原生控件前景不再由共享reset强制继承，见 [原生控件颜色迁移](native-control-colors.md)。这些共享修复不代表Spin全部公开接口审计完成。

ConfigProvider 的 `RenderEmptyHandler` 从 `unknown` 收窄为实际可渲染的 `VNodeChild`。返回任意业务对象会报类型错误；请显式创建 VNode、返回文本或空内容，不要用断言绕过。

Spin 当前 Provider 配置和原生 attrs 不再缓存挂载快照，数字 description=0 显示在文案区。本轮只验收 List 关联路径及共享回归，不代表 Spin 所有 API 已完成全局审计。

35 个旧 React 机械 DOM 用例原样保留，各用例精确差异登记在 `list-reference-diffs.json`；没有修改共享归一化规则或覆盖历史基线。可见行为以当前 API、复现测试和浏览器证据为准。
