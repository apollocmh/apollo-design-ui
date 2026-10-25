# Typography 全局配置当前值（2026-10-25）

32条真实公开入口修前25失败/7已有通过，无未处理异常，日志 `/tmp/apollo-typography-provider-red.log`。五入口className/style/classNames/styles逐字段整体替换全部失败，语义函数替换、晚加载、移除/优先级回退及富输入更新同样过期。五入口初始CSR/SSR、原对象深字段修改和旧函数直接读ref已有通过，保留为对照。

全局helper已经返回live Proxy，本组件setup解构把字符串和旧配置对象/函数捕获。只改合并层：保留config对象，在computed/getter内读取当前className/style/classNames/styles和prefix函数；原先contextClassNamesObject改computed。维持class/style合并顺序、语义函数props参数和组件/原生覆盖。没有重写Provider、深watch、补偿刷新或兼容适配。32条局部全通过。

原semantic Demo所有例子保留，追加局部ConfigProvider对象/函数/移除交互；函数捕获当前factory普通值，避免直接读ref掩盖旧引用问题。实际浏览器夹具另外覆盖嵌套mutation对照、操作区/按钮/textarea、原生和本地优先级，以及稳定输入与编辑草稿/焦点。Demo数量不变，无公开API破坏。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 局部复现 | 修前25失败/7已有通过；修后32条全通过，无未处理异常 |
| Typography/ConfigProvider四层 | 15文件427条通过，保留既有canvas环境提示及SSR/交互/ARIA/主题断言 |
| 类型 | 最终4文件92条无错误；最终全仓lint:types及UI严格声明通过 |
| UI/L7 | 声明+69份CSS生成，11项/0 FAIL/PENDING；保留既有unbuild提示 |
| dist消费者 | 实际发布声明的provider/semantic Demo、原生StyleValue、条件槽、复制/编辑/ref模板通过，无源码alias、未发布测试声明 |
| 生产Chrome | Chrome150.0.7871.125：五入口+编辑/富输入/local-only共八根，对象/函数替换及移除、解析prefix、当前root/actions/buttons/textarea类/样式、native/local优先级、身份/草稿/焦点、nested mutation对照与实际Demo通过，零Vue/page错误 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |
| Registry / inventory / tooling / Biome | Registry19项、vue-native24 fixed/0 open；520行/19字段清单、8条tooling、Biome5源码文件及diff通过 |
| Apollo visual | 24张missing-approved-baseline，退出1；未生成或接受 |

类型检查初次拦截了示例map缺通用index签名与测试递归StyleValue展开；改用公开ConfigProviderProps的map类型及类型化工厂的新对象构造，测试只替换的native样式值用shallowRef，保留深字段mutation对照。没有加any/强制断言或降低诊断。只读复核确认getter与语义函数调用层次、方向/prefix解析和原优先级保持，新增computed只读取当前配置，无状态写入或循环依赖。

其他组件的动态配置、完整F11及视觉继续复审，未据此宣称整个组件重新验收。未运行全仓verify:full/覆盖率，未推送或打标签。


```sh
pnpm exec vitest run --project unit packages/ui/src/typography/__tests__/provider-reactivity.test.ts --maxWorkers=1
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/typography packages/ui/src/config-provider --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/typography packages/ui/src/config-provider --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/browser/typography-provider.mjs
node tests/consumer/typography-slots-types.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component typography
```
