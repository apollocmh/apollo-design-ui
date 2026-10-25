# Image / Group 预览焦点整改（2026-10-25）

公开预览声明为模态dialog，但打开后焦点仍在缩略图，实际键盘Esc无法到达弹层；手动聚焦弹层后Esc原已正常。关闭后焦点落到body，真实Tab也可从末个工具按钮移出。默认图标已有名称，自定义aria-hidden装饰图标则使关闭/前后切换三个按钮失名。

修前源码隔离Chrome审计完成25项观察：8项通过、17项失败，无Vue/page错误；结果与ARIA快照在 `/tmp/apollo-image-preview-focus-audit/`。正式真实Portal/CSSMotion单测首批8条5失败/3通过，扩展13条10失败/3通过，见 `/tmp/apollo-image-preview-focus-unit-red.log` 和 `/tmp/apollo-image-preview-focus-unit-extended.log`。没有模拟焦点、几何尺寸或transitionend来制造通过。

预览现在保存打开前的外部焦点，在真实根晚挂载时入焦，复用useLockFocus约束外部focusin，并在本地keydown补齐真实浏览器Tab边界。子内容preventDefault优先。关闭完成时先归还焦点再通知afterOpenChange，父级拒绝关闭不提前归还；过期leave回调不能抢走已重开弹层焦点。

初批整个预览卸载也按Vue scope清理顺序先释放焦点锁、再归还、最后丢弃保存目标。按钮各自声明type=button与稳定名称，保留默认及装饰图标对照。初批未改共享焦点原语；后续真实多层缺陷的原语补修见下节，公开状态API未改。

## 浏览器追加复现

单层收口后，生产Chrome回归又确认三处边界：Group键盘切至末张，原聚焦的Next按钮变disabled，浏览器直接失焦到body且不发focusin；两个打开的预览在共同父级卸载时，外层先归还的焦点被尚未释放的内层锁拉回，最终落到body；外层先卸载、内层随后Esc关闭，已移除的外层按钮也不能恢复外部触发器。三条正式生产失败日志分别为 `/tmp/apollo-image-preview-focus-browser-red.log`、`/tmp/apollo-image-preview-focus-browser-stacked-red.log`、`/tmp/apollo-image-preview-focus-browser-parent-first-red.log`。多层源码Chrome独立证据为 `/tmp/apollo-image-preview-focus-audit/browser-review/` 及相邻 `browser-review-parent-first/`，零Vue/page错误。

导航失焦用Vue更新前记录本层是否拥有焦点、更新后仅修复本层丢失来处理，避免无条件因current变化抢焦点。多层恢复在共享useFocusRestore内复制最近归属容器的返回链，以WeakMap按document隔离，恢复/销毁移除登记；有效restore消费保存后，必要时仅在Vue本轮清理后active仍为body且没有新save时补一次，不抢用户或新层焦点。

基础原语原13条全部保留，追加9条后原实现6失败/16通过，修后22全部通过，日志 `/tmp/apollo-focus-return-chain-red.log`、`/tmp/apollo-focus-return-chain-green.log`。覆盖两种多层卸载、首目标移除、最近归属层、链复制、一次延迟及用户改焦点/新层开启/登记释放保护；真实focusin事件仅用来复现已在Chrome确认的锁重定向，没有伪造focus方法或几何尺寸。当前契约同步到 [a11y说明](../foundation/a11y-contract.md#351-apollo-多层焦点返回2026-10-25)，无新公开handle动作或组件props。

## 检查

- 局部13条通过：Image/Group真实键盘开启、当前activeElement的Esc、按钮关闭归还、受控拒绝、条件defaultOpen整体卸载及触发器移除后的监听清理。
- 根严格vue-tsc通过；Image/ConfigProvider四层20文件301条通过，运行命令 `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --exclude '**/registration-order.test.ts' --maxWorkers=2`。排除文件属于并行复现的独立注册顺序缺陷，未计入本批通过数，后续单独整改；没有跳过焦点或既有断言。
- UI生产构建通过，含公开声明与69份CSS。日志分别为 `/tmp/apollo-image-preview-focus-strict.log`、`/tmp/apollo-image-preview-focus-runtime.log`、`/tmp/apollo-image-preview-focus-build.log`。
- Image/ConfigProvider类型10文件52条通过，无类型错误；见 `/tmp/apollo-image-preview-focus-types.log`。
- Registry19项通过；内容清单重新生成后check通过，513行的分类/裁决数量不变。发布消费端与L7复用本次产物11项0FAIL/0PENDING；最终扩展fixture需再次验证。
- 文档84路由/999Demo构建、14文件157条测试、typecheck与content:check均通过，日志 `/tmp/apollo-image-preview-focus-docs.log`。追加基础焦点原语修复后的生产门禁另记。
- `node tests/visual/apollo.mjs --check --component image`实际exit1：缺9张Apollo批准基线，日志 `/tmp/apollo-image-preview-focus-visual.log`。本批焦点行为不替代视觉验收，也不关闭其他预览配置扩展。

## 追加修复门禁

- a11y/Image/ConfigProvider/Modal四层35文件588条通过；根严格vue-tsc通过；对应类型14文件146条通过，无类型错误。命令使用 `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/a11y packages/ui/src/image packages/ui/src/config-provider packages/ui/src/modal --maxWorkers=2` 及同范围types，日志 `/tmp/apollo-focus-return-chain-{runtime,strict,types}.log`。
- a11y→UI顺序生产构建通过，公开声明与69CSS完整；最终firstShown版fixture经发布消费端严格vue-tsc通过，无源码alias。a11y与UI两套L7各11项0FAIL/0PENDING（a11y其中5项n/a），见 `/tmp/apollo-focus-return-chain-{build,consumer-l7}.log`。
- Chrome150.0.7871.125默认完整脚本通过：Image/Group原生Enter自动入焦、全局Esc及按钮关闭归还、实际Tab/ShiftTab边界/禁用跳过、外部锁、受控拒绝、lazy defaultOpen、单层整体卸载、默认/装饰图标名称，以及禁用Next后持焦、两种多层卸载精确返回external。零Vue/console/page错误，见 `/tmp/apollo-image-preview-focus-browser-green.log`；没有使用只取红证据的partial选项冒充完整通过。
- 新helper下另6条quick reopen/leave卸载/更换opener时序复验通过，见 `/tmp/apollo-image-preview-focus-audit/review.after-return-chain.log`。两种多层source Chrome独立复验也通过，原red快照保留于对应目录 `result.red.json`。
- 本次产物的文档84路由/999Demo构建、14文件157条测试、typecheck与content:check全部通过；Registry/foundation/内容清单门禁通过，见 `/tmp/apollo-focus-return-chain-{docs,metadata}.log`。不升级历史验收维度。
