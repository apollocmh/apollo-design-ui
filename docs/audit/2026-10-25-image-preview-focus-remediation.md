# Image / Group 预览焦点整改（2026-10-25）

公开预览声明为模态dialog，但打开后焦点仍在缩略图，实际键盘Esc无法到达弹层；手动聚焦弹层后Esc原已正常。关闭后焦点落到body，真实Tab也可从末个工具按钮移出。默认图标已有名称，自定义aria-hidden装饰图标则使关闭/前后切换三个按钮失名。

修前源码隔离Chrome审计完成25项观察：8项通过、17项失败，无Vue/page错误；结果与ARIA快照在 `/tmp/apollo-image-preview-focus-audit/`。正式真实Portal/CSSMotion单测首批8条5失败/3通过，扩展13条10失败/3通过，见 `/tmp/apollo-image-preview-focus-unit-red.log` 和 `/tmp/apollo-image-preview-focus-unit-extended.log`。没有模拟焦点、几何尺寸或transitionend来制造通过。

预览现在保存打开前的外部焦点，在真实根晚挂载时入焦，复用useLockFocus约束外部focusin，并在本地keydown补齐真实浏览器Tab边界。子内容preventDefault优先。关闭完成时先归还焦点再通知afterOpenChange，父级拒绝关闭不提前归还；过期leave回调不能抢走已重开弹层焦点。

整个预览卸载也按Vue scope清理顺序先释放焦点锁、再归还、最后丢弃保存目标。按钮各自声明type=button与稳定名称，保留默认及装饰图标对照。未改共享焦点工具或公开状态API。

## 检查

- 局部13条通过：Image/Group真实键盘开启、当前activeElement的Esc、按钮关闭归还、受控拒绝、条件defaultOpen整体卸载及触发器移除后的监听清理。
- 根严格vue-tsc通过；Image/ConfigProvider四层20文件301条通过，运行命令 `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --exclude '**/registration-order.test.ts' --maxWorkers=2`。排除文件属于并行复现的独立注册顺序缺陷，未计入本批通过数，后续单独整改；没有跳过焦点或既有断言。
- UI生产构建通过，含公开声明与69份CSS。日志分别为 `/tmp/apollo-image-preview-focus-strict.log`、`/tmp/apollo-image-preview-focus-runtime.log`、`/tmp/apollo-image-preview-focus-build.log`。
- Image/ConfigProvider类型8文件18条通过，无类型错误；见 `/tmp/apollo-image-preview-focus-types.log`。
- Registry19项通过；内容清单重新生成后check通过，513行的分类/裁决数量不变。生产浏览器、发布消费端及文档门禁在本阶段补齐后记录。
- Apollo视觉批准基线仍缺9张；本批焦点行为不替代视觉验收，也不关闭其他预览配置扩展。
