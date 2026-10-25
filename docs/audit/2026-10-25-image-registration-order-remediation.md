# Image 子图更新保持注册顺序（2026-10-25）

PreviewGroup使用子Image时按注册顺序显示图片。更新第一张的src或alt会先注销再注册，将其移到Map末尾；current和计数仍为0/第一张，预览却显示第二张。两图与三图公开交互均可复现，三图顺序变为Second→Third→First。

隔离草稿6条4失败/2通过，严格源码类型检查通过。正式公开入口用原生Vue模型与实际缩略图点击打开，保留当前预览img/缩略图身份、current/计数、无多余模型请求和完整后续导航断言；修前6条4失败/2通过，日志 `/tmp/apollo-image-registration-order-formal-red.log`。

只删除registerData更新前的unregister调用。同id注册原本就是保持Map位置的upsert，卸载仍调用最新disposer；不改registry、模型或导航。正式局部6条全部通过，日志 `/tmp/apollo-image-registration-order-formal-green.log`；同id upsert及正常追加/卸载是原已通过的对照。

## 检查

局部命令：`pnpm exec vitest run --project unit packages/ui/src/image/__tests__/registration-order.test.ts --maxWorkers=1`。Image/ConfigProvider四层完整21文件307条通过，没有排除文件：`pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=2`，日志 `/tmp/apollo-image-registration-order-runtime.log`。Biome及diff检查通过。

Registry19项、清单重新生成/check通过，分类/裁决数不变。后续共享焦点补修门禁已包含本次Image源码：a11y/Image/ConfigProvider/Modal35文件588条、类型14文件146条、根strict及a11y→UI顺序生产构建通过，发布消费端和两包L7通过，见 [焦点报告](2026-10-25-image-preview-focus-remediation.md#追加修复门禁)。注册顺序的精确更新场景由本文件6条公开集成测试覆盖，未宣称增加独立浏览器注册更新场景。此修复兑现现有注册顺序契约，无新公开API或兼容通道；不替代其他扩展与Apollo视觉验收。
