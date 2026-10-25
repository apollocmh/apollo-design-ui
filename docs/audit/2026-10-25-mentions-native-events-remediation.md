# Mentions 原生事件与 blur 清理（2026-10-25）

首批6条修前全部失败，10条未处理异常；日志 `/tmp/apollo-mentions-native-events-red.log`。focus/blur/input/clear/pressEnter/popupScroll/resize 把监听器数组当函数调用，模板keydown/keyup被私有绑定覆盖，卸载仍保留blur定时器。不是“模板所有事件不能用”，单函数部分路径原本正常。

修复公开事件为typed emits，内部仅接收转发函数，不再手调公开attrs或声明旧Function props。onXxx仍是标准Vue注册。真实事件及resize/clear载荷保持；blur清理在重排、重新聚焦和卸载执行，内部无事件焦点协调不伪造FocusEvent。保留非候选态pressEnter判据。

修复后首批5通过/1失败，继续发现clear外层根focused类漏传。新增普通单函数监听器回归仍失败，排除数组因素；日志 `/tmp/apollo-mentions-native-events-focus-red.log` 为2失败/5通过。首次整组回归另拦截到重复disabled类（505通过/1失败），原因是将所有mentions状态类再转给BaseInput。改为只显式传递缺失的focused状态，保留BaseInput既有disabled处理；没有修改快照或允许差异。未加DOM或修改静态CSS。

新增真实模板精确FocusEvent/KeyboardEvent推断、公开$emit正反例、生产包浏览器夹具及实际发布声明消费者。普通键事件、修饰符、真实textarea事件、监听器数组/替换/once、clear、scroll、resize、非候选态Enter、包装focus状态和卸载均有行为覆盖。候选状态机key/which与其他内容槽另行复审。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 新回归 | 首批6修前失败/10异常，追加focused独立复现；最终7通过 |
| Mentions/Input/Tooltip 四层 | 最终32文件506条通过；裸/clear/Form反馈原有8条另补focused断言后通过，保留jsdom提示 |
| 类型 | 12文件72条无错误，全仓严格检查通过；focused私有转发调整后UI严格声明构建通过 |
| UI/L7 | 最终声明+69份CSS生成，11项/0 FAIL/PENDING；保留既有unbuild提示 |
| 发布消费者 | 实际dist声明消费通过，含精确FocusEvent/KeyboardEvent模板和核心语义事件、样式及popup scope |
| 生产Chrome | Chrome150.0.7871.125，原生事件/修饰符/当前监听器数组/once、clear/pressEnter/scroll/resize和包装focus通过；核心事件及样式脚本也通过，零Vue/page错误 |
| Registry / inventory / tooling / Biome | Registry19项、vue-native24 fixed/0 open、519行清单校验、8条tooling及Biome9文件通过 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |
| Apollo visual | 缺24张approved baseline，退出1；未生成或接受 |

未升级历史completed或视觉维度，未运行全仓verify:full/覆盖率；未推送、打标签或接受视觉基线。


```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project unit packages/ui/src/mentions/__tests__/native-bindings.test.ts --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/mentions packages/ui/src/input --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-native-events.mjs
node tests/browser/mentions-events.mjs
node tests/browser/mentions-bindings.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component mentions
```
