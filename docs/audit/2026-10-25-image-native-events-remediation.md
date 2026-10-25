# Image 原生事件与属性（2026-10-25）

最小7条正式回归修前6失败/1已有通过，日志 `/tmp/apollo-image-native-events-red.log`：keydown在两预览模式被覆盖，preview=false抹掉显式role/tabindex/name，preview=true抹掉显式名称，click数组抛错并警告，error.once落错DOM。普通click.once原本正常。

Image改typed emits(click/error/keydown/update:open)，移除两项Function运行时prop，原img发error，正常根/Progress各自只通知一次click/keydown。保留可预览根button/0和内部打开后click通知顺序；显式名称优先alt，关闭预览时原生根属性保留。keydown先通知，尊重preventDefault后决定内置Enter/Space。定位动画原点使用真正Element类型收窄，去掉两个HTMLElement目标断言。

扩展20条已通过，含真实Vue模板stop/prevent/once、当前数组监听器、业务打开→click监听顺序、ARIA动态增删、三种占位的事件隔离/跨根once及移除后无潜在预览、原img错误、富节点草稿与焦点。类型正负例对MouseEvent/Event/KeyboardEvent/boolean做精确检查，已从2条局部验证继续扩大门禁。

公开Props中的onXxx字段表达标准Vue监听器，不保留手动函数prop兼容路径。业务preview配置回调留在其职责；迁移见 [记录](../migrations/image-native-events.md)。

## 仍开放的状态冲突

原API文档称支持v-model:open，但Image公开props没有open且实现从preview.open读取，与公开状态承诺矛盾。顶层模型真实SFC已有10条8失败/2已有通过、两条精确open缺失模板诊断，保存在 `/tmp/apollo-image-open-model-repro/`；defaultOpen、Group受控初值/请求和prevOpen也有独立CSR证据。此批只修DOM事件并声明已有通知，不能通过改文案声称模型状态契约完成；后续须独立兑现Vue公共状态契约。

此缺口随后由 [原生模型批次](2026-10-25-image-open-model-remediation.md) 直接迁移兑现，旧状态配置移除；本报告仍保留Native事件批次的原验证范围。

## 检查

- Image/ConfigProvider运行回归18文件259条通过；Image类型6文件12条通过，无类型错误。根严格检查在真实Demo更新后再次通过。
- UI声明及69CSS构建、发布消费端复制真实Demo/browser fixture/精确类型fixture的vue-tsc通过；无源码alias/测试声明发布。L7复用本次产物11项0FAIL/0PENDING。
- Chrome150.0.7871.125首次运行通过：两normal模式监听器数组/current/once/同原Event ID、预览先于click、ARIA与默认语义、三种占位事件隔离/跨根once、真实SFC stop/prevent取消键盘动作、真实Demo与富节点/草稿/焦点。零Vue/console/page错误，日志 `/tmp/apollo-image-native-events-browser.log`。
- 文档build/test/typecheck/content全部通过：84路由、999Demo、14文件157测试和72组件内容检查；Registry19项/内容清单/tooling8条通过，改动代码Biome及git diff检查通过。
- 视觉检查仍缺9张Apollo批准基线。未升级历史completed或视觉维度。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=1
pnpm run lint:types
pnpm exec vitest run --project types packages/ui/src/image --maxWorkers=1
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-native-events.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```
