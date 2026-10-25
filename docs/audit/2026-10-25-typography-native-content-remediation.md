# Typography 当前默认槽与编辑名称（2026-10-25）

真实五入口14条修前12失败/2已有通过，无未处理异常，日志 `/tmp/apollo-typography-native-slots-red.log`。Text/Title/Paragraph/Link 将默认槽缓存于computed，父render先读取值再传纯值闭包时正文停留旧值；CSS ellipsis的setup watch会经tooltip/childrenText在render前求槽并告警。Typography容器和槽内直接读取ref原已正常，保留为对照。条件槽icon-only、复制回退、编辑初值和富内容文字同步均有独立失败；富输入节点、草稿和焦点原本保持，未牺牲这些行为。

Base公开层在render调用当前槽并归一为节点数据，私有BaseContent消费当前节点和同一响应式公开props对象。内部状态变化不重新创建量测数组，父内容更新传递新数组；computed/watch/事件不再调用用户槽。保留Element层级、CSS、公开props、semantic props字段和nativeElement暴露，不引入兼容分支或渲染期响应式版本号。没有变更有返回值的复制业务函数或配置渲染字段。本批不是整组件重新验收。

追加原生aria-label独立复现1失败/14未选（`/tmp/apollo-typography-edit-label-red.log`）：普通根已有名称，进入textarea后丢失。利用既有Editable.ariaLabel显式转发，覆盖编辑中更新/移除、textarea身份/草稿/焦点；最终15条局部通过。真实editable Demo保留四例并增加条件默认槽交互，不增加Demo数量。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 失败复现/局部 | 初始14条12失败/2对照通过；编辑名称独立1失败；最终15条通过 |
| Typography/Input/Tooltip 四层 | 28文件635条通过，保留旧SSR DOM断言和JS二分测量桩；保留既有jsdom canvas/pseudo-style提示 |
| 类型 | 12文件118条无错误，最终全仓严格lint:types与UI严格声明通过 |
| UI/L7 | 声明+69份CSS生成；11项/0 FAIL/PENDING，保留既有unbuild提示 |
| 生产Chrome | Chrome150.0.7871.125：五入口当前闭包、CSS省略、JS窄Paragraph更新/裁剪/展开/收起与量测节点清零/两帧稳定、富输入身份/草稿/焦点、真实条件模板与编辑初值通过；真实剪贴板验证四入口和编辑后默认复制，零Vue/page错误 |
| dist消费者 | 实际发布声明检查五入口模板、条件槽、复制/编辑/省略配置及nativeElement refs通过，无源码alias、未发布测试声明 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |
| Registry / inventory / tooling | Registry19项、vue-native24 fixed/0 open，520行清单/19具体字段记录校验通过；8条tooling、Biome5源码文件及diff通过；本批默认槽不冒充新增内容prop字段 |
| Apollo visual | 24张missing-approved-baseline，退出1；未生成或接受 |

只读复核确认内部状态不会反向重建公开层的量测数据，semantic props不混入内部参数，转发与卸载使用Vue原生组件生命周期。未运行全仓verify:full/覆盖率，未推送或打标签。其他配置、富内容模板扩展、交互和全库F11继续复审。


```sh
pnpm exec vitest run --project unit packages/ui/src/typography/__tests__/native-slots.test.ts --maxWorkers=1
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/typography packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/typography packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/typography-slots-types.mjs
node tests/browser/typography-slots.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component typography
```
