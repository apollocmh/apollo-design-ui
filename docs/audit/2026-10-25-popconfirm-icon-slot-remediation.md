# F11 · Popconfirm 原生图标槽（2026-10-25）

修前基线为7bb9c916：公开icon数据只能在模板外构造VNode，Popconfirm / PurePanel / Overlay均未消费原生#icon。六条回归修前全失败（`/tmp/apollo-popconfirm-icon-red.log`），当前六条通过：两入口的当前/空/移除槽、VNode数据/默认/false恢复，正文输入节点/值/焦点与SSR内容/空包裹。

在PopconfirmSlots加入无参数VNodeChild图标槽，两层包装按当前槽函数转发，Overlay在render求值一次。slot存在即优先；空数组、Comment/Fragment等空内容不渲染图标span，也不回退默认或数据图标。默认图标统一由Overlay产生，移除上层重复创建；已有VNode/string/false数据保留，业务回调与语义icon样式不变。正文带稳定key，图标切换不重建输入。

将既有icon示例改为原生QuestionCircleOutlined模板，包含可切换/更新/清空、false数据静态预览与输入保持；Demo仍999。双语API声明五个内容槽及图标数据类型。实际Vue正例夹具和VNodeChild类型断言覆盖两公开入口；发布消费者通过独立node_modules链接ui/icons/theme及Vue，以真实package exports验证四个模板Demo和原生style，不用source alias。

清单只按具体运行证据将前批Tooltip.title、Popover.title/content、Popconfirm.title/description五字段及本批icon关联报告。新增icon协议行计入内部，verified从12至18、review从210至204；这些是字段调查状态，不是组件验收或剩余缺陷数。内部Overlay字段不升级。

## 检查结果

| 检查 | 实际结果 |
| --- | --- |
| 新增回归 | 六条修前全失败、修后全通过 |
| 四层运行 | 29文件390条通过，保留既有jsdom canvas提示 |
| 类型项目 / 全仓严格类型 | 8文件24条通过、0 source errors；全仓严格检查通过 |
| UI / L7 / 发布消费端 | UI声明+69份CSS生成；UI L7 11项/0 FAIL/PENDING；六入口/图标原生槽、四模板Demo、五入口style及函数负例的独立package exports消费端通过 |
| 生产Chrome | Chrome150.0.7871.125通过当前/空/移除图标、默认与false恢复、输入身份和值；前批六入口内容/Promise及五入口style脚本通过，零Vue/page错误 |
| docs build/test/typecheck/content:check | 四项通过：84路由/999Demo、14文件157条、72组件内容校验，保留既有chunk警告 |
| Registry / inventory / tooling / Biome / diff | Registry19项及vue-native24 fixed/0 open、517行清单校验、8条tooling通过；Biome8文件及diff通过；18字段报告路径均存在 |
| Apollo visual | **未通过：Popconfirm9张missing-approved-baseline**，退出1；未生成或接受基线 |

无旧内容函数兼容层或弃用期；本批是新增原生内容入口，不删除图标数据prop。未运行全仓verify:full/覆盖率，不宣称F11全库或新视觉验收；其他attrs、响应性、内容扩展与发布门禁继续开放。未推送或打标签。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm packages/ui/src/steps --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/overlay-content-types.mjs
node tests/browser/overlay-content.mjs
node tests/browser/overlay-attrs.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component popconfirm
```
