# Mentions 原生空内容与回退（2026-10-25）

首批9条修前5失败/4通过，另有1未处理异常，日志 `/tmp/apollo-mentions-empty-red.log`。证明原生notFoundContent槽缺失、已文档化的components.mentions.notFoundContent配置未被读取、false被h的直接children参数字符串化，以及响应式VNode数组触发DropdownMenu递归更新。数字0、单个VNode及SSR/隐藏popup守卫原已正常，未将静态线索等同于运行缺陷。

新增无参数 `MentionsSlots.notFoundContent`，沿公开包装、RcMentions、InternalMentions、KeywordTrigger到DropdownMenu传当前函数，仅在实际空菜单render求值。slot存在（包括空返回）优先于数据prop、组件配置、renderEmpty及默认内容。保留所有VNodeChild数据；回退值用children数组按Vue规则归一，移除一处as never，避免false字符串和原位归一化响应式数组。

首批修后9通过，追加“slot存在时不得提前调用renderEmpty”的独立复现1失败/9通过，日志 `/tmp/apollo-mentions-empty-fallback-red.log`；公开render按当前slot存在性短路回退计算，当时10条局部通过。正常/clear两种形态覆盖当前、空、移除、节点保持、loading/已有选项惰性、ConfigProvider回退、布尔/数字/VNode/数组及SSR/隐藏浮层。没有新增函数prop、兼容层或移除数据API。

复核候选label的同源路径后，追加3条真实Mentions回归得到2失败/11通过及1递归异常（`/tmp/apollo-mentions-option-data-red.log`）：false候选显示文字、响应式label数组递归；0原本正常。该路径同样用children数组归一，另移除一处as never，并断言原数组字符串不被renderer改写、候选单次选择。没有新增option槽或改业务payload。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 分批可失败复现 | 9条5失败/4已有通过；急切回退追加1失败/9通过；候选数据追加2失败/11通过；最终13通过 |
| Mentions/Input/Tooltip 四层 | 34文件525条通过，保留既有jsdom canvas/pseudo-style提示；async补可访问名并移除其旧label豁免 |
| 类型 | 14文件74条无错误；最终全仓lint:types通过，严格UI声明通过；初次nullable children/递归类型诊断已修正，无新增强制断言 |
| UI/L7 | 声明及69份CSS生成；11项/0 FAIL/PENDING，保留既有unbuild提示 |
| 发布消费者 | 实际dist声明和原生EmptySlot/异步Demo模板通过，含无效slot/函数内容prop负例；无源码alias、未发布测试声明 |
| Chrome | Chrome150.0.7871.125：真实async Demo当前/空/移除/prop回退、span/editor身份与值/焦点、异步候选单次选择和clear通过；既有popup与标准键盘脚本也通过，零Vue/page错误 |
| Registry / inventory / tooling / Biome | Registry19项、vue-native24 fixed/0 open；520行含19个具体字段证据，19条报告路径存在；8条tooling、Biome12源码文件及diff通过 |
| docs build/test/typecheck/content:check | 最终全通过：84路由/999Demo、14文件157条、72组件；复核包装元素措辞后已重新生成，保留已有chunk提示 |
| Apollo visual | 24张missing-approved-baseline，退出1，未生成或接受 |

类型最初指出nullable VNodeChild不能直接传h第三参，children数组同时修正类型和运行语义；测试只替换含VNode选项数组，改用shallowRef避免不必要的深层类型展开。一次Biome扫描误纳入构建临时声明，限定真实源码路径后12文件通过，未修改或格式化产物。

只读复核独立验证Vue renderer原位归一直接响应式children数组会导致102次渲染/递归，嵌套数组经Fragment slice后一次渲染且数据不变；本库回归另验证两条实际路径。增加的是Vue规范注释锚点，无额外包装元素。option模板用法评估、完整IME和全库F11继续复审；历史completed/视觉维度不升级。未运行全仓verify:full/覆盖率，未推送或打标签。


```sh
pnpm exec vitest run --project unit packages/ui/src/mentions/__tests__/empty-slot.test.ts --maxWorkers=1
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/mentions packages/ui/src/input --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-empty.mjs
node tests/browser/mentions-popup.mjs
node tests/browser/mentions-keyboard.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component mentions
```
