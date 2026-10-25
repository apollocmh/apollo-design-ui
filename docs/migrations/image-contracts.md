# Image 完整契约整改：开发版集中迁移

适用当前未发布的 `0.0.0` 开发版。完整盘点与统一验收见 [Image 整改单元](../audit/2026-10-25-image-contract-audit.md)。以下为本次集中方案；各项实现/验证状态和提交记录以该清单为准，本文存在不表示已验收完成。

没有兼容层或弃用期。已有有效的 VNode 数据、嵌套进度 renderer、afterOpenChange 业务回调、监听器名和模型名保持；不再次迁移已有有效用法。

## 配置职责与类型

- `preview.mask` 使用布尔值或 `{ blur, className, style }` 遮罩配置。原先类型允许的 VNode 内容没有对应实现，移除该错误声明；缩略图封面内容使用单图 `preview.cover`，大图区域内容使用原生 `#previewImage`，遮罩外观使用 mask 配置或 `classNames.popup.mask/styles.popup.mask`。
- `preview.cover` 保留 VNode/0/数组/空值与 `{ placement, coverNode }` 数据；修复 null 崩溃和位置对象字符串化，不增加同义 renderer 或插槽通道。
- `GroupPreviewConfig` 不再冒充完整单图配置：移除 Group 从未消费的 `src/cover`。组内资源使用 `items` 或子 Image 的 `preview.src`；封面在子 Image 配置。
- Group 的 `classNames/styles` 明确为包装根和 `popup`；图片、封面和占位样式放在子 Image 或 `ConfigProvider.components.image`。自定义预览图片也可在 `#previewImage` 中为 `originNode` 绑定 Vue style。以前 Group 的图片/封面/占位字段并未生效。
- `rootClassName/maskClassName` 的有效数据别名不新增回退层；推荐目标明确为 `classNames.popup.root` / `classNames.popup.mask`，消除重复 root class 和两入口差异。
- 从类型移除已明示删除、传入被忽略的 `forceRender/destroyOnClose`，不增加新的生命周期模拟开关。需要整个视图重建时使用 Vue 的条件挂载/键值；默认打开/关闭行为以公开模型及当前实现契约为准。
- 保留 `Image`、`ImagePreviewGroup`、`Image.PreviewGroup` 与安装名；静态子组件从 any 修为精确类型，原来依靠 any 传入无效 props/slots 的调用将正确报错。

## 缩放与资源数据

`scaleStep` 默认仍为文档承诺的 `0.5`，统一放大/滚轮放大/双击的因子为 `1 + scaleStep`，缩小使用逆因子。此前工具栏和滚轮硬编码 0.1、双击额外加 0.1，导致该配置不能控制对应操作；这是修复错误实现，不保留旧比例分支。例如默认单次放大由旧实现的 1.1 倍变为 1.5 倍，显式 step=0.25 时为 1.25 倍，反向操作可回到原比例（边界夹取除外）。关闭/reset 的比例 1 和当前 min/max 边界语义保持。

注册数据与显式 items 明确携带原生图像属性、fallback 和尺寸，两种分组资源路径与单图保持一致。fallback 生效时不再让原 srcSet 候选覆盖兜底资源；换源后恢复当前候选数据。状态由真实 img 事件和 Vue ref 驱动，无 DOM 的服务端不构造浏览器 Image。

省略或留空 alt 时，img 使用空 alt，触发器和预览保留默认可访问操作名称；非空 alt 及有效原生名称覆盖仍使用调用者内容。没有新增声明为必填的数据字段。

## 状态与样式边界

Group 移除 current 控制后接续最近同步值；无控态列表缩减安全选择仍有效项，不回声外部数据赋值。没有可展示项时不打开空预览，保留模型含义；条件恢复按当前模型处理。禁用 Group 不再留下无法操作的子按钮语义。

主题使用源组件的响应式上下文，跨 Portal 仍得到同一 alias/component Token；原生 style 优先级保留，未向全局写入 Image 专用补丁。容器与所属文档的焦点/拖动监听必须正确，不能用默认 body 场景替代跨容器验证。共享层修改须补其使用者回归；最终证据和未验证项统一记在整改单元清单中。

Image全部7个Token现在由源Vue主题上下文消费；Group切换按钮从原先由图标和padding凑出的42px改为公开派生值40px，并支持imagePreviewSwitchSize覆盖，CSS变量为 `--apollo-image-preview-switch-size`。preview.zIndex优先于popup根style，后者优先于派生层级与组件变量。

ConfigProvider的主题作用域用原生Teleport保持同一份插槽子树：theme晚出现、移除和恢复不会重新挂载子组件；未给theme时没有额外包装元素，只保留Vue内部锚点。SSR首帧内联渲染，客户端水合后进入display:contents作用域，保留原节点与编辑状态。局部CSS变量前缀替换会清理旧前缀。相关测试使用真实Teleport验证身份，VTU内建stub不作为节点身份的最终判据；没有删除原来的前缀/Provider回归断言。

Portal副作用现在使用实际目标的所属文档/窗口，iframe之间不再共享Escape栈或误锁外层页面；ShadowRoot锁其所属body，inline跟随源锚点。原生DOM搬迁也迁移锁与监听，覆盖式滚动条不再给body写入多余的100%宽度；子控件已preventDefault的Escape保留原生取消语义。Portal及独立滚动锁/Escape composable不改公开签名，isBodyOverflowing增加可选Document/null参数供所属文档测量，省略时保留当前document默认值。这是共享层行为修复；Image自身锁定的接入、ShadowRoot焦点与动效仍按统一清单继续验收。
